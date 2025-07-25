import React, { useState, useCallback } from "react";
import { useTranslation } from "../../contexts/TranslationContext";

interface QuickFilterOption {
  id: string;
  label: string;
  value: any;
  icon?: React.ReactNode;
  color?: "primary" | "secondary" | "success" | "warning" | "error";
  badge?: number | string;
  disabled?: boolean;
  tooltip?: string;
  group?: string;
}

interface QuickFilterProps {
  options: QuickFilterOption[];
  selectedFilters?: string[];
  defaultSelected?: string[];
  onChange?: (
    selectedFilters: string[],
    selectedOptions: QuickFilterOption[]
  ) => void;
  onFilterChange?: (
    filterId: string,
    option: QuickFilterOption,
    selected: boolean
  ) => void;
  multiSelect?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "filled" | "outlined";
  color?: "primary" | "secondary" | "success" | "warning" | "error";
  spacing?: "none" | "sm" | "md" | "lg";
  direction?: "horizontal" | "vertical";
  wrap?: boolean;
  className?: string;
  optionClassName?: string;
  label?: string;
  description?: string;
  clearable?: boolean;
  clearText?: string;
  allText?: string;
  showAll?: boolean;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  groupBy?: boolean;
  renderOption?: (
    option: QuickFilterOption,
    selected: boolean
  ) => React.ReactNode;
  renderGroup?: (
    group: string,
    options: QuickFilterOption[]
  ) => React.ReactNode;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
  maxVisible?: number;
  showMore?: boolean;
  showMoreText?: string;
  showLessText?: string;
}

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

const ChevronUpIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d="M5 15l7-7 7 7"
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

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d="M5 13l4 4L19 7"
    />
  </svg>
);

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

export const QuickFilter: React.FC<QuickFilterProps> = ({
  options,
  selectedFilters: controlledSelectedFilters,
  defaultSelected = [],
  onChange,
  onFilterChange,
  multiSelect = true,
  size = "md",
  variant = "default",
  color = "primary",
  spacing = "md",
  direction = "horizontal",
  wrap = true,
  className = "",
  optionClassName = "",
  label,
  description,
  clearable = true,
  clearText,
  allText,
  showAll = false,
  disabled = false,
  loading = false,
  fullWidth = false,
  groupBy = false,
  renderOption,
  renderGroup,
  searchable = false,
  searchPlaceholder,
  emptyText,
  maxVisible,
  showMore = false,
  showMoreText,
  showLessText,
}) => {
  const { t } = useTranslation();

  const [internalSelectedFilters, setInternalSelectedFilters] =
    useState<string[]>(defaultSelected);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllOptions, setShowAllOptions] = useState(false);

  const isControlled = controlledSelectedFilters !== undefined;
  const selectedFilters = isControlled
    ? controlledSelectedFilters
    : internalSelectedFilters;

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-3 text-base",
  };

  const spacingClasses = {
    none: "gap-0",
    sm: "gap-1",
    md: "gap-2",
    lg: "gap-3",
  };

  const colorClasses = {
    primary: {
      active: "bg-blue-100 text-blue-700 border-blue-300",
      inactive: "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
    },
    secondary: {
      active: "bg-gray-100 text-gray-700 border-gray-300",
      inactive: "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
    },
    success: {
      active: "bg-green-100 text-green-700 border-green-300",
      inactive: "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
    },
    warning: {
      active: "bg-yellow-100 text-yellow-700 border-yellow-300",
      inactive: "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
    },
    error: {
      active: "bg-red-100 text-red-700 border-red-300",
      inactive: "bg-white text-gray-700 border-gray-300 hover:bg-gray-50",
    },
  };

  const variantClasses = {
    default: "border",
    filled: "border-0 shadow-sm",
    outlined: "border-2",
  };

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options;

    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        option.value
          .toString()
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  // Group options by category
  const groupedOptions = React.useMemo(() => {
    if (!groupBy) return { "": filteredOptions };

    return filteredOptions.reduce((groups, option) => {
      const group = option.group || "";
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(option);
      return groups;
    }, {} as Record<string, QuickFilterOption[]>);
  }, [filteredOptions, groupBy]);

  // Handle visible options based on maxVisible
  const visibleOptions = React.useMemo(() => {
    if (!maxVisible || showAllOptions) {
      return filteredOptions;
    }

    return filteredOptions.slice(0, maxVisible);
  }, [filteredOptions, maxVisible, showAllOptions]);

  const handleFilterToggle = useCallback(
    (option: QuickFilterOption) => {
      if (disabled || loading || option.disabled) return;

      const isSelected = selectedFilters.includes(option.id);
      let newSelectedFilters: string[];

      if (multiSelect) {
        newSelectedFilters = isSelected
          ? selectedFilters.filter((id) => id !== option.id)
          : [...selectedFilters, option.id];
      } else {
        newSelectedFilters = isSelected ? [] : [option.id];
      }

      if (!isControlled) {
        setInternalSelectedFilters(newSelectedFilters);
      }

      const selectedOptions = options.filter((opt) =>
        newSelectedFilters.includes(opt.id)
      );
      onChange?.(newSelectedFilters, selectedOptions);
      onFilterChange?.(option.id, option, !isSelected);
    },
    [
      disabled,
      loading,
      multiSelect,
      selectedFilters,
      options,
      isControlled,
      onChange,
      onFilterChange,
    ]
  );

  const handleClear = useCallback(() => {
    if (disabled || loading) return;

    if (!isControlled) {
      setInternalSelectedFilters([]);
    }

    onChange?.([], []);
  }, [disabled, loading, isControlled, onChange]);

  const handleSelectAll = useCallback(() => {
    if (disabled || loading) return;

    const allFilterIds = options
      .filter((option) => !option.disabled)
      .map((option) => option.id);

    if (!isControlled) {
      setInternalSelectedFilters(allFilterIds);
    }

    const selectedOptions = options.filter((opt) =>
      allFilterIds.includes(opt.id)
    );
    onChange?.(allFilterIds, selectedOptions);
  }, [disabled, loading, options, isControlled, onChange]);

  const handleShowMore = useCallback(() => {
    setShowAllOptions(!showAllOptions);
  }, [showAllOptions]);

  const getOptionColor = useCallback(
    (option: QuickFilterOption) => {
      return option.color || color;
    },
    [color]
  );

  const renderFilterOption = useCallback(
    (option: QuickFilterOption) => {
      const isSelected = selectedFilters.includes(option.id);
      const optionColor = getOptionColor(option);

      if (renderOption) {
        return renderOption(option, isSelected);
      }

      return (
        <button
          key={option.id}
          type="button"
          onClick={() => handleFilterToggle(option)}
          disabled={disabled || loading || option.disabled}
          className={`
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${
            isSelected
              ? colorClasses[optionColor].active
              : colorClasses[optionColor].inactive
          }
          ${
            option.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          }
          ${optionClassName}
          rounded-full inline-flex items-center space-x-2
          transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500
          ${disabled || loading ? "opacity-50 cursor-not-allowed" : ""}
        `}
          title={option.tooltip}
        >
          {option.icon && <span className="flex-shrink-0">{option.icon}</span>}

          <span className="flex-1">{option.label}</span>

          {option.badge !== undefined && (
            <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-gray-200 text-gray-700">
              {option.badge}
            </span>
          )}

          {isSelected && <CheckIcon className="w-3 h-3 flex-shrink-0" />}
        </button>
      );
    },
    [
      selectedFilters,
      size,
      variant,
      disabled,
      loading,
      optionClassName,
      handleFilterToggle,
      getOptionColor,
      renderOption,
      colorClasses,
      sizeClasses,
      variantClasses,
    ]
  );

  const renderGroupedOptions = useCallback(() => {
    if (!groupBy) {
      return visibleOptions.map((option) => renderFilterOption(option));
    }

    return Object.entries(groupedOptions).map(([group, groupOptions]) => {
      if (renderGroup) {
        return renderGroup(group, groupOptions);
      }

      return (
        <div key={group} className="space-y-2">
          {group && (
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {group}
            </div>
          )}
          <div
            className={`
            flex ${direction === "vertical" ? "flex-col" : "flex-row"}
            ${wrap ? "flex-wrap" : ""}
            ${spacingClasses[spacing]}
          `}
          >
            {groupOptions.map((option) => renderFilterOption(option))}
          </div>
        </div>
      );
    });
  }, [
    groupBy,
    visibleOptions,
    groupedOptions,
    renderGroup,
    renderFilterOption,
    direction,
    wrap,
    spacingClasses,
    spacing,
  ]);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div
          className={`
          flex ${direction === "vertical" ? "flex-col" : "flex-row"}
          ${wrap ? "flex-wrap" : ""}
          ${spacingClasses[spacing]}
        `}
        >
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-8 bg-gray-200 rounded-full w-20" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`${fullWidth ? "w-full" : ""} ${className}`}>
      {label && (
        <div className="mb-2">
          <div className="text-sm font-medium text-gray-700">{label}</div>
          {description && (
            <div className="text-xs text-gray-500 mt-1">{description}</div>
          )}
        </div>
      )}

      {searchable && (
        <div className="mb-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <SearchIcon className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder || t("search_filters")}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}

      {(clearable || showAll) && selectedFilters.length > 0 && (
        <div className="mb-3 flex items-center space-x-2">
          {clearable && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center space-x-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              disabled={disabled || loading}
            >
              <ClearIcon className="w-3 h-3" />
              <span>{clearText || t("clear_all")}</span>
            </button>
          )}

          {showAll && (
            <button
              type="button"
              onClick={handleSelectAll}
              className="inline-flex items-center space-x-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              disabled={disabled || loading}
            >
              <CheckIcon className="w-3 h-3" />
              <span>{allText || t("select_all")}</span>
            </button>
          )}
        </div>
      )}

      <div
        className={`
        flex ${direction === "vertical" ? "flex-col" : "flex-row"}
        ${wrap ? "flex-wrap" : ""}
        ${spacingClasses[spacing]}
      `}
      >
        {filteredOptions.length === 0 ? (
          <div className="text-sm text-gray-500 py-2">
            {emptyText || t("no_filters_found")}
          </div>
        ) : (
          renderGroupedOptions()
        )}
      </div>

      {showMore && maxVisible && filteredOptions.length > maxVisible && (
        <div className="mt-3">
          <button
            type="button"
            onClick={handleShowMore}
            className="inline-flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            disabled={disabled || loading}
          >
            <span>
              {showAllOptions
                ? showLessText || t("show_less")
                : showMoreText ||
                  t("show_more", {
                    count: filteredOptions.length - maxVisible,
                  })}
            </span>
            {showAllOptions ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default QuickFilter;
