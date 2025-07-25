/**
 * Metadata-Driven Data Table Component
 *
 * Renders data tables from ListViewDefinition metadata with:
 * - Dynamic column configuration
 * - Advanced filtering and search
 * - Sorting and pagination
 * - Bulk actions and row actions
 * - Export functionality
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { DataTable } from "../ui/DataTable";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Badge } from "../ui/Badge";
import { SearchInput } from "../ui/SearchInput";
import { QuickFilter } from "../ui/QuickFilter";
import { useTranslation } from "react-i18next";

export interface ListViewDefinition {
  id: string;
  view_name: string;
  display_label: string;
  description?: string;
  entity_id: string;

  // Column configuration
  columns: ColumnDefinition[];

  // Default behavior
  default_sort_field?: string;
  default_sort_order: "ASC" | "DESC";
  default_page_size: number;

  // Filter configuration
  quick_filters?: QuickFilter[];
  advanced_filters?: AdvancedFilterConfig;

  // Search configuration
  search_enabled: boolean;
  search_fields?: string[];
  global_search: boolean;

  // Pagination configuration
  pagination_enabled: boolean;
  page_size_options: number[];
  show_total_count: boolean;

  // Export and bulk actions
  export_enabled: boolean;
  export_formats: string[];
  bulk_actions?: BulkAction[];

  // UI configuration
  row_actions?: RowAction[];
  toolbar_actions?: ToolbarAction[];
  show_row_numbers: boolean;
  striped_rows: boolean;

  // Access control
  access_roles: string[];
  is_public: boolean;
}

export interface ColumnDefinition {
  field: string;
  label: string;
  data_type: string;
  sortable: boolean;
  filterable: boolean;
  searchable: boolean;
  width?: number;
  min_width?: number;
  max_width?: number;
  align?: "left" | "center" | "right";
  hidden?: boolean;
  format?: string; // For dates, numbers, etc.
  render_component?: string; // Custom component for rendering
}

export interface QuickFilter {
  field: string;
  label: string;
  value: any;
  operator?: string;
  icon?: string;
}

export interface AdvancedFilterConfig {
  enabled: boolean;
  operators: string[];
  date_ranges?: string[];
  numeric_ranges?: boolean;
}

export interface BulkAction {
  id: string;
  label: string;
  icon?: string;
  confirm_message?: string;
  requires_selection: boolean;
}

export interface RowAction {
  id: string;
  label: string;
  icon?: string;
  route?: string;
  action?: string;
  confirm_message?: string;
}

export interface ToolbarAction {
  id: string;
  label: string;
  icon?: string;
  route?: string;
  action?: string;
  button_type?: "primary" | "secondary" | "outline";
}

interface MetadataDataTableProps {
  listViewDefinition: ListViewDefinition;
  data: any[];
  total_count?: number;
  loading?: boolean;
  error?: string;
  tenant_id?: string;

  // Event handlers
  onPageChange?: (page: number, page_size: number) => void;
  onSort?: (field: string, order: "ASC" | "DESC") => void;
  onFilter?: (filters: Record<string, any>) => void;
  onSearch?: (query: string, fields?: string[]) => void;
  onBulkAction?: (action_id: string, selected_rows: any[]) => void;
  onRowAction?: (action_id: string, row: any) => void;
  onToolbarAction?: (action_id: string) => void;
  onExport?: (format: string, filters?: Record<string, any>) => void;

  // UI customization
  className?: string;
  height?: number;
  show_toolbar?: boolean;
  show_filters?: boolean;
}

export const MetadataDataTable: React.FC<MetadataDataTableProps> = ({
  listViewDefinition,
  data,
  total_count = 0,
  loading = false,
  error = null,
  tenant_id,
  onPageChange,
  onSort,
  onFilter,
  onSearch,
  onBulkAction,
  onRowAction,
  onToolbarAction,
  onExport,
  className = "",
  height,
  show_toolbar = true,
  show_filters = true,
}) => {
  const { t } = useTranslation();

  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(
    listViewDefinition.default_page_size
  );
  const [sortField, setSortField] = useState(
    listViewDefinition.default_sort_field || ""
  );
  const [sortOrder, setSortOrder] = useState(
    listViewDefinition.default_sort_order
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Convert metadata columns to DataTable format
  const tableColumns = useMemo(() => {
    return listViewDefinition.columns
      .filter((col) => !col.hidden)
      .map((col) => ({
        key: col.field,
        title: col.label,
        dataIndex: col.field,
        width: col.width,
        minWidth: col.min_width,
        maxWidth: col.max_width,
        align: col.align || "left",
        sortable: col.sortable,
        filterable: col.filterable,
        render: (value: any, record: any) => {
          // Handle different data types and formatting
          if (col.data_type === "date" && value) {
            return new Date(value).toLocaleDateString();
          }
          if (col.data_type === "datetime" && value) {
            return new Date(value).toLocaleString();
          }
          if (col.data_type === "boolean") {
            return value ? "Yes" : "No";
          }
          if (col.data_type === "currency" && value) {
            return new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(value);
          }

          // Handle custom render components
          if (col.render_component) {
            // This would be expanded to support custom components
            return <span className="font-medium">{value}</span>;
          }

          return value;
        },
      }));
  }, [listViewDefinition.columns]);

  // Handle pagination changes
  const handlePageChange = useCallback(
    (page: number, size: number) => {
      setCurrentPage(page);
      setPageSize(size);
      onPageChange?.(page, size);
    },
    [onPageChange]
  );

  // Handle sorting changes
  const handleSort = useCallback(
    (field: string, order: "asc" | "desc") => {
      const sortOrder = order.toUpperCase() as "ASC" | "DESC";
      setSortField(field);
      setSortOrder(sortOrder);
      onSort?.(field, sortOrder);
    },
    [onSort]
  );

  // Handle search changes
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      setCurrentPage(1); // Reset to first page on search

      if (listViewDefinition.search_enabled) {
        const searchFields = listViewDefinition.global_search
          ? undefined
          : listViewDefinition.search_fields;
        onSearch?.(query, searchFields);
      }
    },
    [onSearch, listViewDefinition]
  );

  // Handle quick filter clicks
  const handleQuickFilter = useCallback(
    (filter: QuickFilter) => {
      const newFilters = {
        ...activeFilters,
        [filter.field]: filter.value,
      };
      setActiveFilters(newFilters);
      setCurrentPage(1);
      onFilter?.(newFilters);
    },
    [activeFilters, onFilter]
  );

  // Handle advanced filter changes
  const handleAdvancedFilter = useCallback(
    (filters: Record<string, any>) => {
      setActiveFilters(filters);
      setCurrentPage(1);
      onFilter?.(filters);
    },
    [onFilter]
  );

  // Handle bulk action execution
  const handleBulkAction = useCallback(
    (actionId: string) => {
      const selectedData = data.filter((_, index) =>
        selectedRows.includes(index.toString())
      );
      onBulkAction?.(actionId, selectedData);
      setSelectedRows([]); // Clear selection after action
    },
    [data, selectedRows, onBulkAction]
  );

  // Handle row action execution
  const handleRowAction = useCallback(
    (actionId: string, rowData: any) => {
      onRowAction?.(actionId, rowData);
    },
    [onRowAction]
  );

  // Handle export action
  const handleExport = useCallback(
    (format: string) => {
      onExport?.(format, activeFilters);
    },
    [onExport, activeFilters]
  );

  // Configure row selection for bulk actions
  const rowSelection = listViewDefinition.bulk_actions?.length
    ? {
        selectedRowKeys: selectedRows,
        onChange: (keys: string[]) => setSelectedRows(keys),
      }
    : undefined;

  // Configure row actions
  const configureRowActions = useCallback(
    (record: any) => {
      if (!listViewDefinition.row_actions?.length) return {};

      return {
        onClick: () => {
          // Default action (first action) on row click
          const defaultAction = listViewDefinition.row_actions?.[0];
          if (defaultAction) {
            handleRowAction(defaultAction.id, record);
          }
        },
      };
    },
    [listViewDefinition.row_actions, handleRowAction]
  );

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-medium mb-2">Error Loading Data</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Toolbar */}
      {show_toolbar && (
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold">
              {listViewDefinition.display_label}
            </h2>
            {listViewDefinition.description && (
              <span className="text-sm text-gray-600">
                {listViewDefinition.description}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Toolbar Actions */}
            {listViewDefinition.toolbar_actions?.map((action) => (
              <Button
                key={action.id}
                variant={action.button_type || "outline"}
                onClick={() => onToolbarAction?.(action.id)}
              >
                {action.label}
              </Button>
            ))}

            {/* Export Button */}
            {listViewDefinition.export_enabled && (
              <Select
                placeholder="Export"
                options={listViewDefinition.export_formats.map((format) => ({
                  label: format.toUpperCase(),
                  value: format,
                }))}
                onChange={(format) => handleExport(format)}
              />
            )}
          </div>
        </div>
      )}

      {/* Search and Filters */}
      {show_filters && (
        <div className="space-y-3">
          {/* Search */}
          {listViewDefinition.search_enabled && (
            <div className="flex items-center space-x-4">
              <SearchInput
                placeholder={`Search ${listViewDefinition.display_label.toLowerCase()}...`}
                value={searchQuery}
                onChange={handleSearch}
                className="flex-1"
              />

              {listViewDefinition.advanced_filters?.enabled && (
                <Button
                  variant="outline"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                  Advanced Filters
                </Button>
              )}
            </div>
          )}

          {/* Quick Filters */}
          {listViewDefinition.quick_filters?.length && (
            <div className="flex flex-wrap gap-2">
              {listViewDefinition.quick_filters.map((filter) => (
                <Badge
                  key={`${filter.field}-${filter.value}`}
                  variant={
                    activeFilters[filter.field] === filter.value
                      ? "default"
                      : "outline"
                  }
                  className="cursor-pointer"
                  onClick={() => handleQuickFilter(filter)}
                >
                  {filter.label}
                </Badge>
              ))}
            </div>
          )}

          {/* Active Filters Display */}
          {Object.keys(activeFilters).length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Active filters:</span>
              {Object.entries(activeFilters).map(([field, value]) => (
                <Badge
                  key={field}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => {
                    const newFilters = { ...activeFilters };
                    delete newFilters[field];
                    setActiveFilters(newFilters);
                    onFilter?.(newFilters);
                  }}
                >
                  {field}: {value} ×
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bulk Actions */}
      {selectedRows.length > 0 && listViewDefinition.bulk_actions?.length && (
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <span className="text-sm text-blue-700">
            {selectedRows.length} {selectedRows.length === 1 ? "item" : "items"}{" "}
            selected
          </span>
          <div className="flex space-x-2">
            {listViewDefinition.bulk_actions.map((action) => (
              <Button
                key={action.id}
                size="sm"
                variant="outline"
                onClick={() => handleBulkAction(action.id)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={tableColumns}
        data={data}
        loading={loading}
        sortable={true}
        defaultSortOrder={{
          column: sortField,
          order: sortOrder.toLowerCase() as "asc" | "desc",
        }}
        onSort={handleSort}
        rowSelection={rowSelection}
        onRow={configureRowActions}
        pagination={
          listViewDefinition.pagination_enabled
            ? {
                current: currentPage,
                pageSize: pageSize,
                total: total_count,
                showSizeChanger: true,
                pageSizeOptions:
                  listViewDefinition.page_size_options.map(String),
                showTotal: listViewDefinition.show_total_count,
                onChange: handlePageChange,
              }
            : undefined
        }
        striped={listViewDefinition.striped_rows}
        scroll={height ? { y: height } : undefined}
        className="bg-white rounded-lg border"
      />
    </div>
  );
};

export default MetadataDataTable;
