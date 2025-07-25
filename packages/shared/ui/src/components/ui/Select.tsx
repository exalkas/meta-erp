import React, { forwardRef, useState, useRef, useEffect } from "react";
import { useTranslation } from "../../contexts/TranslationContext";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  group?: string;
}

export interface SelectProps
  extends Omit<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    "size" | "onChange"
  > {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  variant?: "default" | "filled" | "outlined";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  clearable?: boolean;
  searchable?: boolean;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  onClear?: () => void;
  renderOption?: (option: SelectOption) => React.ReactNode;
  createOption?: (inputValue: string) => SelectOption;
  noOptionsMessage?: string;
  loadingMessage?: string;
  maxHeight?: number;
  showSearchIcon?: boolean;
  groupBy?: (option: SelectOption) => string;
}

const baseClasses =
  "w-full px-3 py-2 border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed";

const variantClasses = {
  default: "border-gray-300 bg-white",
  filled: "border-gray-300 bg-gray-50",
  outlined: "border-2 border-gray-300 bg-white",
};

const sizeClasses = {
  sm: "text-sm px-2 py-1",
  md: "text-base px-3 py-2",
  lg: "text-lg px-4 py-3",
};

const errorClasses = "border-red-500 focus:ring-red-500 focus:border-red-500";

const LoadingSpinner: React.FC<{ size?: "sm" | "md" | "lg" }> = ({
  size = "md",
}) => {
  const spinnerSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <svg
      className={`animate-spin ${spinnerSizes[size]}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
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
};

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
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
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

export const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      variant = "default",
      size = "md",
      loading = false,
      clearable = false,
      searchable = false,
      placeholder,
      options,
      value,
      onChange,
      onClear,
      renderOption,
      createOption,
      noOptionsMessage,
      loadingMessage,
      maxHeight = 200,
      showSearchIcon = true,
      groupBy,
      disabled,
      className = "",
      ...props
    },
    ref
  ) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const selectedOption = options.find((option) => option.value === value);

    const filteredOptions = searchable
      ? options.filter((option) =>
          option.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : options;

    const groupedOptions = groupBy
      ? filteredOptions.reduce(
          (groups, option) => {
            const group = groupBy(option);
            if (!groups[group]) {
              groups[group] = [];
            }
            groups[group].push(option);
            return groups;
          },
          {} as Record<string, SelectOption[]>
        )
      : null;

    const handleToggle = () => {
      if (disabled || loading) return;
      setIsOpen(!isOpen);
      if (!isOpen && searchable) {
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    };

    const handleSelect = (option: SelectOption) => {
      if (option.disabled) return;
      onChange?.(option.value);
      setIsOpen(false);
      setSearchTerm("");
      setHighlightedIndex(-1);
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onClear?.();
      setIsOpen(false);
      setSearchTerm("");
      setHighlightedIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled || loading) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            setHighlightedIndex((prev) =>
              prev < filteredOptions.length - 1 ? prev + 1 : 0
            );
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          if (isOpen) {
            setHighlightedIndex((prev) =>
              prev > 0 ? prev - 1 : filteredOptions.length - 1
            );
          }
          break;
        case "Enter":
          e.preventDefault();
          if (isOpen && highlightedIndex >= 0) {
            handleSelect(filteredOptions[highlightedIndex]);
          } else if (!isOpen) {
            setIsOpen(true);
          }
          break;
        case "Escape":
          setIsOpen(false);
          setSearchTerm("");
          setHighlightedIndex(-1);
          break;
        case "Tab":
          setIsOpen(false);
          break;
      }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
      setHighlightedIndex(-1);
    };

    const handleCreateOption = () => {
      if (createOption && searchTerm) {
        const newOption = createOption(searchTerm);
        handleSelect(newOption);
      }
    };

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          ref &&
          "current" in ref &&
          ref.current &&
          !ref.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, [ref]);

    const selectClasses = [
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      error ? errorClasses : "",
      fullWidth ? "w-full" : "",
      "cursor-pointer",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const dropdownClasses = [
      "absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg",
      isOpen ? "block" : "hidden",
    ]
      .filter(Boolean)
      .join(" ");

    const renderOptionContent = (option: SelectOption) => {
      if (renderOption) {
        return renderOption(option);
      }

      return (
        <div className="flex items-center space-x-2">
          {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
          <span className="truncate">{option.label}</span>
        </div>
      );
    };

    const renderGroupedOptions = () => {
      if (!groupedOptions) {
        return filteredOptions.map((option, index) => (
          <li
            key={option.value}
            className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
              highlightedIndex === index ? "bg-gray-100" : ""
            } ${option.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => handleSelect(option)}
          >
            {renderOptionContent(option)}
          </li>
        ));
      }

      return Object.entries(groupedOptions).map(([group, groupOptions]) => (
        <div key={group}>
          <div className="px-3 py-2 text-sm font-medium text-gray-500 bg-gray-50 border-b">
            {group}
          </div>
          {groupOptions.map((option, index) => (
            <li
              key={option.value}
              className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                highlightedIndex === index ? "bg-gray-100" : ""
              } ${option.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => handleSelect(option)}
            >
              {renderOptionContent(option)}
            </li>
          ))}
        </div>
      ));
    };

    return (
      <div className={fullWidth ? "w-full" : ""}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div className="relative" ref={ref}>
          <div
            className={selectClasses}
            onClick={handleToggle}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-label={label}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                {searchable && isOpen ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder={placeholder || t("search")}
                    className="flex-1 outline-none bg-transparent"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="truncate">
                    {selectedOption?.label || placeholder || t("select_option")}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1">
                {loading && <LoadingSpinner size={size} />}
                {clearable && value && !loading && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <ClearIcon className="w-4 h-4" />
                  </button>
                )}
                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          <div className={dropdownClasses}>
            {searchable && showSearchIcon && !isOpen && (
              <div className="px-3 py-2 border-b">
                <div className="flex items-center space-x-2">
                  <SearchIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">{t("search")}</span>
                </div>
              </div>
            )}

            <ul
              ref={listRef}
              className="max-h-60 overflow-auto"
              style={{ maxHeight }}
              role="listbox"
            >
              {loading ? (
                <li className="px-3 py-2 text-center text-gray-500">
                  <LoadingSpinner size={size} />
                  <span className="ml-2">{loadingMessage || t("loading")}</span>
                </li>
              ) : filteredOptions.length === 0 ? (
                <li className="px-3 py-2 text-center text-gray-500">
                  {noOptionsMessage || t("no_options")}
                  {createOption && searchTerm && (
                    <button
                      onClick={handleCreateOption}
                      className="block w-full text-left px-3 py-2 text-blue-600 hover:bg-gray-100"
                    >
                      {t("create_option")}: "{searchTerm}"
                    </button>
                  )}
                </li>
              ) : (
                renderGroupedOptions()
              )}
            </ul>
          </div>
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

// Modern compound component API for our CRM components
export interface SelectTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  children: React.ReactNode;
}

export const SelectTrigger = forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses.default} flex items-center justify-between ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

// Enhanced Select component with modern API
export interface ModernSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const ModernSelect: React.FC<ModernSelectProps> = ({
  value,
  onValueChange,
  children,
  className = "",
}) => {
  return (
    <div className={`relative ${className}`} data-value={value}>
      {children}
    </div>
  );
};

SelectTrigger.displayName = "SelectTrigger";

export interface SelectValueProps {
  placeholder?: string;
  className?: string;
}

export const SelectValue: React.FC<SelectValueProps> = ({
  placeholder = "Select an option...",
  className = "",
}) => {
  return <span className={`text-gray-500 ${className}`}>{placeholder}</span>;
};

export interface SelectContentProps {
  className?: string;
  children: React.ReactNode;
}

export const SelectContent: React.FC<SelectContentProps> = ({
  className = "",
  children,
}) => {
  return (
    <div
      className={`absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto ${className}`}
    >
      {children}
    </div>
  );
};

export interface SelectItemProps {
  value: string;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export const SelectItem: React.FC<SelectItemProps> = ({
  value,
  className = "",
  children,
  disabled = false,
}) => {
  return (
    <div
      className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
      data-value={value}
    >
      {children}
    </div>
  );
};

export default Select;
