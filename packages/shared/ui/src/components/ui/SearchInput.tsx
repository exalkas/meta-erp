import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "../../contexts/TranslationContext";

interface SearchSuggestion {
  id: string;
  text: string;
  category?: string;
  description?: string;
  icon?: React.ReactNode;
  data?: any;
}

interface SearchInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  onClear?: () => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "filled" | "outlined";
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  inputClassName?: string;
  id?: string;
  autoComplete?: boolean;
  autoFocus?: boolean;
  clearable?: boolean;
  searchIcon?: boolean;
  suggestions?: SearchSuggestion[];
  showSuggestions?: boolean;
  maxSuggestions?: number;
  minQueryLength?: number;
  highlightQuery?: boolean;
  groupSuggestions?: boolean;
  debounceMs?: number;
  noResultsText?: string;
  loadingText?: string;
  recentSearches?: string[];
  showRecentSearches?: boolean;
  onRecentSearchSelect?: (search: string) => void;
  onRecentSearchClear?: () => void;
  customFilter?: (suggestion: SearchSuggestion, query: string) => boolean;
  renderSuggestion?: (
    suggestion: SearchSuggestion,
    query: string
  ) => React.ReactNode;
  renderNoResults?: () => React.ReactNode;
  shortcuts?: Array<{
    key: string;
    label: string;
    action: () => void;
  }>;
}

const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const ClearIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const LoadingSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const SearchInput: React.FC<SearchInputProps> = ({
  label,
  placeholder,
  value: controlledValue,
  defaultValue = "",
  onChange,
  onSearch,
  onClear,
  onSuggestionSelect,
  size = "md",
  variant = "default",
  fullWidth = false,
  disabled = false,
  loading = false,
  className = "",
  inputClassName = "",
  id,
  autoComplete = false,
  autoFocus = false,
  clearable = true,
  searchIcon = true,
  suggestions = [],
  showSuggestions = true,
  maxSuggestions = 10,
  minQueryLength = 1,
  highlightQuery = true,
  groupSuggestions = false,
  debounceMs = 300,
  noResultsText,
  loadingText,
  recentSearches = [],
  showRecentSearches = false,
  onRecentSearchSelect,
  onRecentSearchClear,
  customFilter,
  renderSuggestion,
  renderNoResults,
  shortcuts = [],
}) => {
  const { t } = useTranslation();
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;
  const debouncedValue = useDebounce(currentValue, debounceMs);

  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3 text-base",
    lg: "px-5 py-4 text-lg",
  };

  const variantClasses = {
    default: "border border-gray-300 bg-white",
    filled: "border-0 bg-gray-100",
    outlined: "border-2 border-gray-300 bg-transparent",
  };

  // Filter suggestions based on query
  const filteredSuggestions = React.useMemo(() => {
    if (!showSuggestions || currentValue.length < minQueryLength) {
      return [];
    }

    const filtered = suggestions.filter((suggestion) => {
      if (customFilter) {
        return customFilter(suggestion, currentValue);
      }
      return suggestion.text.toLowerCase().includes(currentValue.toLowerCase());
    });

    return filtered.slice(0, maxSuggestions);
  }, [
    suggestions,
    currentValue,
    minQueryLength,
    maxSuggestions,
    customFilter,
    showSuggestions,
  ]);

  // Group suggestions by category
  const groupedSuggestions = React.useMemo(() => {
    if (!groupSuggestions) {
      return { "": filteredSuggestions };
    }

    return filteredSuggestions.reduce((groups, suggestion) => {
      const category = suggestion.category || "";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(suggestion);
      return groups;
    }, {} as Record<string, SearchSuggestion[]>);
  }, [filteredSuggestions, groupSuggestions]);

  // Handle search on debounced value change
  useEffect(() => {
    if (debouncedValue !== currentValue) {
      onSearch?.(debouncedValue);
    }
  }, [debouncedValue, onSearch, currentValue]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;

      if (!isControlled) {
        setInternalValue(newValue);
      }

      onChange?.(newValue);
      setShowDropdown(true);
      setSelectedIndex(-1);
    },
    [isControlled, onChange]
  );

  const handleInputFocus = useCallback(() => {
    setIsFocused(true);
    if (showRecentSearches && currentValue.length === 0) {
      setShowDropdown(true);
    } else if (currentValue.length >= minQueryLength) {
      setShowDropdown(true);
    }
  }, [showRecentSearches, currentValue.length, minQueryLength]);

  const handleInputBlur = useCallback(() => {
    setIsFocused(false);
    // Delay hiding dropdown to allow for suggestion clicks
    setTimeout(() => {
      setShowDropdown(false);
      setSelectedIndex(-1);
    }, 200);
  }, []);

  const handleSearch = useCallback(
    (searchValue: string = currentValue) => {
      onSearch?.(searchValue);
      setShowDropdown(false);
      inputRef.current?.blur();
    },
    [currentValue, onSearch]
  );

  const handleClear = useCallback(() => {
    const newValue = "";

    if (!isControlled) {
      setInternalValue(newValue);
    }

    onChange?.(newValue);
    onClear?.();
    setShowDropdown(false);
    inputRef.current?.focus();
  }, [isControlled, onChange, onClear]);

  const handleSuggestionClick = useCallback(
    (suggestion: SearchSuggestion) => {
      const newValue = suggestion.text;

      if (!isControlled) {
        setInternalValue(newValue);
      }

      onChange?.(newValue);
      onSuggestionSelect?.(suggestion);
      setShowDropdown(false);
      inputRef.current?.focus();
    },
    [isControlled, onChange, onSuggestionSelect]
  );

  const handleRecentSearchClick = useCallback(
    (search: string) => {
      const newValue = search;

      if (!isControlled) {
        setInternalValue(newValue);
      }

      onChange?.(newValue);
      onRecentSearchSelect?.(search);
      setShowDropdown(false);
      inputRef.current?.focus();
    },
    [isControlled, onChange, onRecentSearchSelect]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const allSuggestions = filteredSuggestions;
      const totalItems =
        allSuggestions.length +
        (showRecentSearches ? recentSearches.length : 0);

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : prev));
          setShowDropdown(true);
          break;

        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;

        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < allSuggestions.length) {
            handleSuggestionClick(allSuggestions[selectedIndex]);
          } else if (
            selectedIndex >= allSuggestions.length &&
            selectedIndex < totalItems &&
            showRecentSearches
          ) {
            const recentIndex = selectedIndex - allSuggestions.length;
            handleRecentSearchClick(recentSearches[recentIndex]);
          } else {
            handleSearch();
          }
          break;

        case "Escape":
          setShowDropdown(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;

        default:
          // Handle custom shortcuts
          shortcuts.forEach((shortcut) => {
            if (e.key === shortcut.key && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              shortcut.action();
            }
          });
          break;
      }
    },
    [
      filteredSuggestions,
      selectedIndex,
      showRecentSearches,
      recentSearches,
      handleSuggestionClick,
      handleRecentSearchClick,
      handleSearch,
      shortcuts,
    ]
  );

  const highlightText = useCallback(
    (text: string, query: string) => {
      if (!highlightQuery || !query) return text;

      const parts = text.split(new RegExp(`(${query})`, "gi"));
      return parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={index} className="bg-yellow-200 text-black">
            {part}
          </mark>
        ) : (
          part
        )
      );
    },
    [highlightQuery]
  );

  const renderSuggestionItem = useCallback(
    (suggestion: SearchSuggestion, index: number) => {
      const isSelected = selectedIndex === index;

      if (renderSuggestion) {
        return (
          <div
            key={suggestion.id}
            className={`
            px-4 py-2 cursor-pointer
            ${
              isSelected
                ? "bg-blue-50 text-blue-700"
                : "text-gray-700 hover:bg-gray-50"
            }
          `}
            onClick={() => handleSuggestionClick(suggestion)}
          >
            {renderSuggestion(suggestion, currentValue)}
          </div>
        );
      }

      return (
        <div
          key={suggestion.id}
          className={`
          px-4 py-2 cursor-pointer flex items-center space-x-3
          ${
            isSelected
              ? "bg-blue-50 text-blue-700"
              : "text-gray-700 hover:bg-gray-50"
          }
        `}
          onClick={() => handleSuggestionClick(suggestion)}
        >
          {suggestion.icon && (
            <div className="flex-shrink-0">{suggestion.icon}</div>
          )}
          <div className="flex-1">
            <div className="text-sm font-medium">
              {highlightText(suggestion.text, currentValue)}
            </div>
            {suggestion.description && (
              <div className="text-xs text-gray-500">
                {suggestion.description}
              </div>
            )}
          </div>
        </div>
      );
    },
    [
      selectedIndex,
      currentValue,
      renderSuggestion,
      handleSuggestionClick,
      highlightText,
    ]
  );

  const shouldShowDropdown =
    showDropdown &&
    (filteredSuggestions.length > 0 ||
      (showRecentSearches &&
        recentSearches.length > 0 &&
        currentValue.length === 0) ||
      (currentValue.length >= minQueryLength &&
        filteredSuggestions.length === 0));

  return (
    <div className={`relative ${fullWidth ? "w-full" : ""} ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            id={id}
            value={currentValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || t("search")}
            disabled={disabled}
            autoComplete={autoComplete ? "on" : "off"}
            autoFocus={autoFocus}
            className={`
              ${sizeClasses[size]}
              ${variantClasses[variant]}
              ${fullWidth ? "w-full" : ""}
              ${disabled ? "opacity-50 cursor-not-allowed" : ""}
              ${
                isFocused
                  ? "ring-2 ring-blue-500 border-blue-500"
                  : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              }
              ${searchIcon ? "pl-10" : ""}
              ${clearable && currentValue ? "pr-10" : ""}
              ${inputClassName}
              rounded-lg outline-none transition-all duration-200
            `}
          />

          {searchIcon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              {loading ? (
                <LoadingSpinner className="w-5 h-5 text-gray-400" />
              ) : (
                <SearchIcon className="w-5 h-5 text-gray-400" />
              )}
            </div>
          )}

          {clearable && currentValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              disabled={disabled}
            >
              <ClearIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {shouldShowDropdown && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
          >
            {/* Recent searches */}
            {showRecentSearches &&
              currentValue.length === 0 &&
              recentSearches.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                    {t("recent_searches")}
                  </div>
                  {recentSearches.map((search, index) => (
                    <div
                      key={`recent-${index}`}
                      className={`
                      px-4 py-2 cursor-pointer flex items-center space-x-3
                      ${
                        selectedIndex === filteredSuggestions.length + index
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }
                    `}
                      onClick={() => handleRecentSearchClick(search)}
                    >
                      <ClockIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{search}</span>
                    </div>
                  ))}
                </div>
              )}

            {/* Suggestions */}
            {currentValue.length >= minQueryLength && (
              <div>
                {filteredSuggestions.length > 0 ? (
                  groupSuggestions ? (
                    Object.entries(groupedSuggestions).map(
                      ([category, categorySuggestions]) => (
                        <div key={category}>
                          {category && (
                            <div className="px-4 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                              {category}
                            </div>
                          )}
                          {categorySuggestions.map((suggestion, index) => {
                            const globalIndex = filteredSuggestions.findIndex(
                              (s) => s.id === suggestion.id
                            );
                            return renderSuggestionItem(
                              suggestion,
                              globalIndex
                            );
                          })}
                        </div>
                      )
                    )
                  ) : (
                    filteredSuggestions.map((suggestion, index) =>
                      renderSuggestionItem(suggestion, index)
                    )
                  )
                ) : (
                  <div className="px-4 py-8 text-center text-gray-500">
                    {renderNoResults ? (
                      renderNoResults()
                    ) : (
                      <div>
                        <p className="text-sm">
                          {noResultsText || t("no_results_found")}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchInput;
