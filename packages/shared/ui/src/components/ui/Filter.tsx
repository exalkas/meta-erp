/**
 * Generic Filter Component - Metadata-Driven
 * Universal search and filtering for any entity type
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "./Card";
import { Button } from "./Button";
import { Input } from "./Input";
import { Badge } from "./Badge";
import { Search, Filter as FilterIcon, X } from "lucide-react";

export interface FilterField {
  key: string;
  label: string;
  type: "search" | "select" | "multiselect" | "daterange" | "number";
  placeholder?: string;
  options?: Array<{ value: string; label: string; count?: number }>;
  apiEndpoint?: string; // For dynamic options
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
  };
}

export interface QuickFilter {
  key: string;
  label: string;
  icon?: React.ReactNode;
  filter: Record<string, any>;
}

export interface FilterState {
  [key: string]: any;
}

interface FilterProps {
  // Configuration
  fields: FilterField[];
  quickFilters?: QuickFilter[];

  // Layout
  layout?: "horizontal" | "vertical" | "sidebar" | "inline";
  showSearch?: boolean;
  showQuickFilters?: boolean;
  showClearAll?: boolean;

  // Callbacks
  onFilterChange: (filters: FilterState) => void;
  onQuickFilter?: (filter: Record<string, any>) => void;
  onClear?: () => void;

  // Styling
  className?: string;
  placeholder?: string;
}

export const Filter: React.FC<FilterProps> = ({
  fields,
  quickFilters = [],
  layout = "horizontal",
  showSearch = true,
  showQuickFilters = true,
  showClearAll = true,
  onFilterChange,
  onQuickFilter,
  onClear,
  className = "",
  placeholder = "Search...",
}) => {
  const [filters, setFilters] = useState<FilterState>({});
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };

    // Remove empty values
    if (
      value === "" ||
      value === null ||
      value === undefined ||
      (Array.isArray(value) && value.length === 0)
    ) {
      delete newFilters[key];
      setActiveFilters((prev) => prev.filter((f) => f !== key));
    } else {
      setActiveFilters((prev) => (prev.includes(key) ? prev : [...prev, key]));
    }

    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleQuickFilter = (quickFilter: QuickFilter) => {
    const newFilters = { ...filters, ...quickFilter.filter };
    setFilters(newFilters);
    onFilterChange(newFilters);
    onQuickFilter?.(quickFilter.filter);
  };

  const handleClearAll = () => {
    setFilters({});
    setActiveFilters([]);
    onFilterChange({});
    onClear?.();
  };

  const renderField = (field: FilterField) => {
    const value = filters[field.key] || "";

    switch (field.type) {
      case "search":
        return (
          <div key={field.key} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={field.placeholder || placeholder}
              value={value}
              onChange={(e) => handleFilterChange(field.key, e.target.value)}
              className="pl-10"
            />
          </div>
        );

      case "select":
        return (
          <div key={field.key} className="min-w-[150px]">
            <select
              value={value}
              onChange={(e) => handleFilterChange(field.key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">
                {field.placeholder || `All ${field.label}`}
              </option>
              {field.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} {option.count ? `(${option.count})` : ""}
                </option>
              ))}
            </select>
          </div>
        );

      case "multiselect":
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div key={field.key} className="flex flex-wrap gap-2">
            <div className="flex flex-wrap gap-1">
              {field.options?.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <Button
                    key={option.value}
                    variant={isSelected ? "primary" : "outline"}
                    size="sm"
                    onClick={() => {
                      const newValues = isSelected
                        ? selectedValues.filter((v) => v !== option.value)
                        : [...selectedValues, option.value];
                      handleFilterChange(field.key, newValues);
                    }}
                    className="text-xs"
                  >
                    {option.label}
                    {option.count && ` (${option.count})`}
                  </Button>
                );
              })}
            </div>
          </div>
        );

      case "number":
        return (
          <div key={field.key} className="min-w-[120px]">
            <Input
              type="number"
              placeholder={field.placeholder || field.label}
              value={value}
              onChange={(e) => handleFilterChange(field.key, e.target.value)}
              min={field.validation?.min}
              max={field.validation?.max}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const renderHorizontalLayout = () => (
    <div className="flex flex-col sm:flex-row gap-4 items-start">
      <div className="flex flex-wrap gap-4 flex-1">
        {fields.map(renderField)}
      </div>
      {(showClearAll || showQuickFilters) && (
        <div className="flex gap-2">
          {showClearAll && activeFilters.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClearAll}>
              <X className="h-3 w-3 mr-1" />
              Clear ({activeFilters.length})
            </Button>
          )}
        </div>
      )}
    </div>
  );

  const renderVerticalLayout = () => (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {field.label}
          </label>
          {renderField(field)}
        </div>
      ))}
      {showClearAll && activeFilters.length > 0 && (
        <Button variant="outline" size="sm" onClick={handleClearAll}>
          <X className="h-3 w-3 mr-1" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  const renderSidebarLayout = () => (
    <div className="space-y-6">
      {/* Search Field */}
      {showSearch && fields.find((f) => f.type === "search") && (
        <Card>
          <CardContent className="p-4">
            {renderField(fields.find((f) => f.type === "search")!)}
          </CardContent>
        </Card>
      )}

      {/* Other Filters */}
      {fields
        .filter((f) => f.type !== "search")
        .map((field) => (
          <Card key={field.key}>
            <CardHeader className="pb-3">
              <h3 className="text-sm font-medium">{field.label}</h3>
            </CardHeader>
            <CardContent className="pt-0">{renderField(field)}</CardContent>
          </Card>
        ))}

      {/* Quick Filters */}
      {showQuickFilters && quickFilters.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <h3 className="text-sm font-medium">Quick Filters</h3>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {quickFilters.map((qf) => (
              <Button
                key={qf.key}
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => handleQuickFilter(qf)}
              >
                {qf.icon && <span className="mr-2">{qf.icon}</span>}
                {qf.label}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Clear All */}
      {showClearAll && activeFilters.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearAll}
          className="w-full"
        >
          <X className="h-3 w-3 mr-1" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  const renderInlineLayout = () => (
    <div className="flex flex-wrap gap-2 items-center">
      {fields.map(renderField)}
      {showClearAll && activeFilters.length > 0 && (
        <Button variant="ghost" size="sm" onClick={handleClearAll}>
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );

  // Active Filter Display
  const renderActiveFilters = () => {
    if (activeFilters.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mt-3">
        {activeFilters.map((filterKey) => {
          const field = fields.find((f) => f.key === filterKey);
          const value = filters[filterKey];
          if (!field || !value) return null;

          const displayValue = Array.isArray(value)
            ? value.join(", ")
            : field.options?.find((opt) => opt.value === value)?.label || value;

          return (
            <Badge
              key={filterKey}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {field.label}: {displayValue}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => handleFilterChange(filterKey, "")}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          );
        })}
      </div>
    );
  };

  const getLayoutComponent = () => {
    switch (layout) {
      case "vertical":
        return renderVerticalLayout();
      case "sidebar":
        return renderSidebarLayout();
      case "inline":
        return renderInlineLayout();
      default:
        return renderHorizontalLayout();
    }
  };

  if (layout === "sidebar") {
    return <div className={className}>{renderSidebarLayout()}</div>;
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <FilterIcon className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters</span>
        </div>

        {getLayoutComponent()}
        {renderActiveFilters()}

        {/* Quick Filters for non-sidebar layouts */}
        {showQuickFilters &&
          quickFilters.length > 0 &&
          (layout === "horizontal" ||
            layout === "vertical" ||
            layout === "inline") && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex flex-wrap gap-2">
                {quickFilters.map((qf) => (
                  <Button
                    key={qf.key}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickFilter(qf)}
                  >
                    {qf.icon && <span className="mr-1">{qf.icon}</span>}
                    {qf.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  );
};

export default Filter;
