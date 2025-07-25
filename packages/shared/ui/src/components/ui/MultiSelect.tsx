import React, { forwardRef, useState, useRef, useEffect } from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import { SelectOption } from "./Select";

export interface MultiSelectProps
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
  value?: string[];
  onChange?: (value: string[]) => void;
  onClear?: () => void;
  renderOption?: (option: SelectOption) => React.ReactNode;
  renderTag?: (option: SelectOption) => React.ReactNode;
  createOption?: (inputValue: string) => SelectOption;
  noOptionsMessage?: string;
  loadingMessage?: string;
  maxHeight?: number;
  showSearchIcon?: boolean;
  groupBy?: (option: SelectOption) => string;
  maxTags?: number;
  showSelectAll?: boolean;
  tagLimit?: number;
  closeOnSelect?: boolean;
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

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
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

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d="M5 13l4 4L19 7"
    />
  </svg>
);

const Tag: React.FC<{
  option: SelectOption;
  onRemove: (value: string) => void;
  size?: "sm" | "md" | "lg";
  renderTag?: (option: SelectOption) => React.ReactNode;
}> = ({ option, onRemove, size = "md", renderTag }) => {
  const tagSizes = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1",
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(option.value);
  };

  return (
    <span
      className={`inline-flex items-center bg-blue-100 text-blue-800 rounded-full ${tagSizes[size]} mr-1 mb-1`}
    >
      {renderTag ? (
        renderTag(option)
      ) : (
        <>
          {option.icon && <span className="mr-1">{option.icon}</span>}
          <span>{option.label}</span>
        </>
      )}
      <button
        type="button"
        onClick={handleRemove}
        className="ml-1 text-blue-600 hover:text-blue-800"
      >
        <XIcon className="w-3 h-3" />
      </button>
    </span>
  );
};

export const MultiSelect = forwardRef<HTMLDivElement, MultiSelectProps>(
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
      value = [],
      onChange,
      onClear,
      renderOption,
      renderTag,
      createOption,
      noOptionsMessage,
      loadingMessage,
      maxHeight = 200,
      showSearchIcon = true,
      groupBy,
      maxTags,
      showSelectAll = false,
      tagLimit = 3,
      closeOnSelect = false,
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

    const selectedOptions = options.filter((option) =>
      value.includes(option.value)
    );

    const availableOptions = options.filter(
      (option) => !value.includes(option.value)
    );

    const filteredOptions = searchable
      ? availableOptions.filter((option) =>
          option.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : availableOptions;

    const groupedOptions = groupBy
      ? filteredOptions.reduce((groups, option) => {
          const group = groupBy(option);
          if (!groups[group]) {
            groups[group] = [];
          }
          groups[group].push(option);
          return groups;
        }, {} as Record<string, SelectOption[]>)
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

      const newValue = [...value, option.value];

      if (maxTags && newValue.length > maxTags) {
        return;
      }

      onChange?.(newValue);
      setSearchTerm("");
      setHighlightedIndex(-1);

      if (closeOnSelect) {
        setIsOpen(false);
      }
    };

    const handleRemove = (optionValue: string) => {
      const newValue = value.filter((v) => v !== optionValue);
      onChange?.(newValue);
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onClear?.();
      setIsOpen(false);
      setSearchTerm("");
      setHighlightedIndex(-1);
    };

    const handleSelectAll = () => {
      if (filteredOptions.length === 0) return;

      const newValues = filteredOptions
        .filter((option) => !option.disabled)
        .map((option) => option.value);

      const allValues = [...value, ...newValues];
      const limitedValues = maxTags ? allValues.slice(0, maxTags) : allValues;

      onChange?.(limitedValues);
      setSearchTerm("");
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
        case "Backspace":
          if (searchTerm === "" && value.length > 0) {
            handleRemove(value[value.length - 1]);
          }
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
      "cursor-pointer min-h-[2.5rem]",
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

      const isSelected = value.includes(option.value);

      return (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {option.icon && (
              <span className="flex-shrink-0">{option.icon}</span>
            )}
            <span className="truncate">{option.label}</span>
          </div>
          {isSelected && <CheckIcon className="w-4 h-4 text-blue-600" />}
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

    const displayTags = selectedOptions.slice(0, tagLimit);
    const remainingCount = selectedOptions.length - tagLimit;

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
              <div className="flex items-center flex-wrap flex-1 min-w-0 gap-1">
                {displayTags.map((option) => (
                  <Tag
                    key={option.value}
                    option={option}
                    onRemove={handleRemove}
                    size={size}
                    renderTag={renderTag}
                  />
                ))}
                {remainingCount > 0 && (
                  <span className="text-sm text-gray-500 px-2 py-1">
                    +{remainingCount} {t("more")}
                  </span>
                )}
                {searchable && isOpen ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder={
                      selectedOptions.length === 0
                        ? placeholder || t("search")
                        : t("search")
                    }
                    className="flex-1 outline-none bg-transparent min-w-[100px]"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  selectedOptions.length === 0 && (
                    <span className="text-gray-500">
                      {placeholder || t("select_options")}
                    </span>
                  )
                )}
              </div>
              <div className="flex items-center space-x-1">
                {loading && <LoadingSpinner size={size} />}
                {clearable && value.length > 0 && !loading && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                )}
                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          <div className={dropdownClasses}>
            {showSelectAll && filteredOptions.length > 0 && (
              <div className="px-3 py-2 border-b">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {t("select_all")}
                </button>
              </div>
            )}

            <ul
              ref={listRef}
              className="max-h-60 overflow-auto"
              style={{ maxHeight }}
              role="listbox"
              aria-multiselectable="true"
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

MultiSelect.displayName = "MultiSelect";

export default MultiSelect;
