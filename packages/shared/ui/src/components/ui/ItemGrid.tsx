/**
 * Generic ItemGrid Component - Metadata-Driven
 * Universal grid/list display for any entity type
 */

import React, { useState } from "react";
import { Card, CardContent } from "./Card";
import { Button } from "./Button";
import {
  Grid,
  List,
  LayoutGrid,
  Search,
  SortAsc,
  SortDesc,
} from "lucide-react";

export interface GridItem {
  id: string;
  [key: string]: any; // Flexible item structure
}

export interface ItemAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  onClick: (item: GridItem) => void;
}

interface ItemGridProps {
  // Data
  items: GridItem[];
  loading?: boolean;
  error?: string;

  // Item Rendering
  itemComponent: string; // Component type to render each item
  itemProps?: Record<string, any>; // Additional props for item component

  // Layout
  layout?: "grid" | "list" | "compact";
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  responsive?: boolean;
  gap?: "sm" | "md" | "lg";

  // Selection
  enableSelection?: boolean;
  selectedItems?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;

  // Sorting
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortChange?: (sortBy: string, order: "asc" | "desc") => void;
  sortableFields?: Array<{ key: string; label: string }>;

  // Filtering
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchFields?: string[]; // Fields to search in

  // Actions
  actions?: ItemAction[];
  onItemClick?: (item: GridItem) => void;
  onItemDoubleClick?: (item: GridItem) => void;

  // Pagination
  showPagination?: boolean;
  pageSize?: number;
  currentPage?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;

  // Display Options
  showViewToggle?: boolean;
  showSort?: boolean;
  showSearch?: boolean;
  emptyStateMessage?: string;
  loadingMessage?: string;

  // Styling
  className?: string;
  itemClassName?: string;
}

export const ItemGrid: React.FC<ItemGridProps> = ({
  items,
  loading = false,
  error,
  itemComponent,
  itemProps = {},
  layout = "grid",
  columns = 3,
  responsive = true,
  gap = "md",
  enableSelection = false,
  selectedItems = [],
  onSelectionChange,
  sortBy,
  sortOrder = "asc",
  onSortChange,
  sortableFields = [],
  searchQuery = "",
  onSearchChange,
  searchFields = [],
  actions = [],
  onItemClick,
  onItemDoubleClick,
  showPagination = false,
  pageSize = 12,
  currentPage = 1,
  totalItems,
  onPageChange,
  showViewToggle = false,
  showSort = false,
  showSearch = false,
  emptyStateMessage = "No items found",
  loadingMessage = "Loading items...",
  className = "",
  itemClassName = "",
}) => {
  const [localLayout, setLocalLayout] = useState(layout);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // Filter items based on search query
  const filteredItems = React.useMemo(() => {
    if (!localSearchQuery || searchFields.length === 0) return items;

    const query = localSearchQuery.toLowerCase();
    return items.filter((item) =>
      searchFields.some((field) =>
        String(item[field] || "")
          .toLowerCase()
          .includes(query)
      )
    );
  }, [items, localSearchQuery, searchFields]);

  // Sort items
  const sortedItems = React.useMemo(() => {
    if (!sortBy) return filteredItems;

    return [...filteredItems].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (aValue === bValue) return 0;

      let comparison = 0;
      if (aValue > bValue) comparison = 1;
      if (aValue < bValue) comparison = -1;

      return sortOrder === "desc" ? -comparison : comparison;
    });
  }, [filteredItems, sortBy, sortOrder]);

  // Paginate items
  const paginatedItems = React.useMemo(() => {
    if (!showPagination) return sortedItems;

    const startIndex = (currentPage - 1) * pageSize;
    return sortedItems.slice(startIndex, startIndex + pageSize);
  }, [sortedItems, currentPage, pageSize, showPagination]);

  const handleSearchChange = (query: string) => {
    setLocalSearchQuery(query);
    onSearchChange?.(query);
  };

  const handleSortChange = (field: string) => {
    const newOrder = sortBy === field && sortOrder === "asc" ? "desc" : "asc";
    onSortChange?.(field, newOrder);
  };

  const handleItemClick = (item: GridItem, event: React.MouseEvent) => {
    if (enableSelection && event.ctrlKey) {
      // Multi-select with Ctrl+click
      const newSelection = selectedItems.includes(item.id)
        ? selectedItems.filter((id) => id !== item.id)
        : [...selectedItems, item.id];
      onSelectionChange?.(newSelection);
    } else {
      onItemClick?.(item);
    }
  };

  const handleSelectAll = () => {
    const allIds = paginatedItems.map((item) => item.id);
    const newSelection = selectedItems.length === allIds.length ? [] : allIds;
    onSelectionChange?.(newSelection);
  };

  const getGridClasses = () => {
    const gapClasses = {
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6",
    };

    let baseClasses = `${gapClasses[gap]}`;

    if (localLayout === "list") {
      return `${baseClasses} space-y-4`;
    }

    if (localLayout === "compact") {
      return `${baseClasses} grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6`;
    }

    // Grid layout
    if (responsive) {
      switch (columns) {
        case 1:
          return `${baseClasses} grid grid-cols-1`;
        case 2:
          return `${baseClasses} grid grid-cols-1 md:grid-cols-2`;
        case 3:
          return `${baseClasses} grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`;
        case 4:
          return `${baseClasses} grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4`;
        case 5:
          return `${baseClasses} grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5`;
        case 6:
          return `${baseClasses} grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6`;
        default:
          return `${baseClasses} grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`;
      }
    }

    return `${baseClasses} grid grid-cols-${columns}`;
  };

  const renderControls = () => {
    if (!showViewToggle && !showSort && !showSearch) return null;

    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex gap-4 flex-1">
              {/* Search */}
              {showSearch && (
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={localSearchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              {/* Sort */}
              {showSort && sortableFields.length > 0 && (
                <div className="flex gap-2">
                  <select
                    value={sortBy || ""}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Sort by...</option>
                    {sortableFields.map((field) => (
                      <option key={field.key} value={field.key}>
                        {field.label}
                      </option>
                    ))}
                  </select>

                  {sortBy && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onSortChange?.(
                          sortBy,
                          sortOrder === "asc" ? "desc" : "asc"
                        )
                      }
                    >
                      {sortOrder === "asc" ? (
                        <SortAsc className="h-4 w-4" />
                      ) : (
                        <SortDesc className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {/* Selection controls */}
              {enableSelection && paginatedItems.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {selectedItems.length === paginatedItems.length
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              )}

              {/* View toggle */}
              {showViewToggle && (
                <div className="flex border border-gray-300 rounded-md overflow-hidden">
                  <Button
                    variant={localLayout === "grid" ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setLocalLayout("grid")}
                    className="rounded-none"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={localLayout === "list" ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setLocalLayout("list")}
                    className="rounded-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={localLayout === "compact" ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setLocalLayout("compact")}
                    className="rounded-none"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderPagination = () => {
    if (!showPagination || !totalItems) return null;

    const totalPages = Math.ceil(totalItems / pageSize);
    if (totalPages <= 1) return null;

    return (
      <Card className="mt-6">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, totalItems)} of {totalItems}{" "}
              items
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => onPageChange?.(currentPage - 1)}
              >
                Previous
              </Button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "primary" : "outline"}
                    size="sm"
                    onClick={() => onPageChange?.(page)}
                  >
                    {page}
                  </Button>
                );
              })}

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange?.(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className={className}>
        {renderControls()}
        <div className={getGridClasses()}>
          {Array.from({ length: pageSize }).map((_, i) => (
            <Card key={i} className={itemClassName}>
              <CardContent className="p-4">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={`${className} border-red-200 bg-red-50`}>
        <CardContent className="p-8 text-center">
          <p className="text-red-800 font-medium">Error loading items</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (paginatedItems.length === 0) {
    return (
      <div className={className}>
        {renderControls()}
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <LayoutGrid className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-gray-500 text-lg">{emptyStateMessage}</p>
            {localSearchQuery && (
              <p className="text-gray-400 text-sm mt-2">
                Try adjusting your search criteria
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      {renderControls()}

      <div className={getGridClasses()}>
        {paginatedItems.map((item) => (
          <div
            key={item.id}
            className={`${itemClassName} ${
              enableSelection && selectedItems.includes(item.id)
                ? "ring-2 ring-blue-500"
                : ""
            } ${onItemClick ? "cursor-pointer" : ""}`}
            onClick={(e) => handleItemClick(item, e)}
            onDoubleClick={() => onItemDoubleClick?.(item)}
          >
            {/* In a real implementation, this would dynamically render the component */}
            {/* specified in itemComponent using your component registry */}
            <Card className="h-full">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="font-medium">{item.id}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Component: <code>{itemComponent}</code>
                  </p>
                  <div className="text-xs text-gray-400 mt-2">
                    This would render the actual item component dynamically
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {renderPagination()}
    </div>
  );
};

export default ItemGrid;
