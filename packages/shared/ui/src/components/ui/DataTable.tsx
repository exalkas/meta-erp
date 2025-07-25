import React, { useState, useMemo, useCallback } from "react";
import { useTranslation } from "../../contexts/TranslationContext";

interface DataTableColumn<T = any> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  width?: number | string;
  minWidth?: number;
  maxWidth?: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  filterable?: boolean;
  fixed?: "left" | "right";
  hidden?: boolean;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  filterDropdown?: React.ReactNode;
  filterIcon?: React.ReactNode;
  sorter?: boolean | ((a: T, b: T) => number);
  defaultSortOrder?: "asc" | "desc";
  ellipsis?: boolean;
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
}

interface DataTableProps<T = any> {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "filled" | "outlined";
  bordered?: boolean;
  striped?: boolean;
  hover?: boolean;
  className?: string;
  rowClassName?: string | ((record: T, index: number) => string);
  headerClassName?: string;
  cellClassName?: string;
  emptyText?: string;
  empty?: React.ReactNode;
  scroll?: {
    x?: number | string;
    y?: number | string;
  };
  sticky?: boolean;
  rowKey?: string | ((record: T) => string);
  rowSelection?: {
    type?: "checkbox" | "radio";
    selectedRowKeys?: string[];
    onChange?: (selectedRowKeys: string[], selectedRows: T[]) => void;
    onSelect?: (record: T, selected: boolean, selectedRows: T[]) => void;
    onSelectAll?: (
      selected: boolean,
      selectedRows: T[],
      changeRows: T[]
    ) => void;
    getCheckboxProps?: (record: T) => {
      disabled?: boolean;
      [key: string]: any;
    };
    hideSelectAll?: boolean;
    preserveSelectedRowKeys?: boolean;
    fixed?: boolean;
  };
  expandable?: {
    expandedRowKeys?: string[];
    onExpand?: (expanded: boolean, record: T) => void;
    onExpandedRowsChange?: (expandedRowKeys: string[]) => void;
    expandedRowRender?: (record: T, index: number) => React.ReactNode;
    expandIcon?: (props: {
      expanded: boolean;
      onExpand: () => void;
    }) => React.ReactNode;
    expandRowByClick?: boolean;
    indentSize?: number;
  };
  pagination?: {
    current?: number;
    pageSize?: number;
    total?: number;
    showSizeChanger?: boolean;
    showQuickJumper?: boolean;
    showTotal?: (total: number, range: [number, number]) => React.ReactNode;
    onChange?: (page: number, pageSize: number) => void;
    onShowSizeChange?: (current: number, size: number) => void;
    pageSizeOptions?: string[];
    position?: "top" | "bottom" | "both";
    size?: "sm" | "md";
    hideOnSinglePage?: boolean;
  };
  sortable?: boolean;
  defaultSortOrder?: {
    column: string;
    order: "asc" | "desc";
  };
  onSort?: (column: string, order: "asc" | "desc") => void;
  filterable?: boolean;
  filters?: Record<string, any>;
  onFilter?: (filters: Record<string, any>) => void;
  searchable?: boolean;
  searchValue?: string;
  onSearch?: (value: string) => void;
  onRow?: (
    record: T,
    index: number
  ) => React.HTMLAttributes<HTMLTableRowElement>;
  onHeaderRow?: (
    column: DataTableColumn<T>[],
    index: number
  ) => React.HTMLAttributes<HTMLTableRowElement>;
  showHeader?: boolean;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  summary?: (data: T[]) => React.ReactNode;
  components?: {
    table?: React.ComponentType<any>;
    header?: {
      wrapper?: React.ComponentType<any>;
      row?: React.ComponentType<any>;
      cell?: React.ComponentType<any>;
    };
    body?: {
      wrapper?: React.ComponentType<any>;
      row?: React.ComponentType<any>;
      cell?: React.ComponentType<any>;
    };
  };
}

const SortIcon: React.FC<{
  direction?: "asc" | "desc";
  className?: string;
}> = ({ direction, className }) => {
  if (direction === "asc") {
    return (
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
  }
  if (direction === "desc") {
    return (
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
  }
  return (
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
        d="M8 9l4-4 4 4m0 6l-4 4-4-4"
      />
    </svg>
  );
};

const FilterIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
    />
  </svg>
);

const ExpandIcon: React.FC<{
  expanded: boolean;
  onExpand: () => void;
  className?: string;
}> = ({ expanded, onExpand, className }) => (
  <button
    onClick={onExpand}
    className={`${className} focus:outline-none focus:ring-2 focus:ring-blue-500 rounded`}
  >
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d={expanded ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"}
      />
    </svg>
  </button>
);

const LoadingRow: React.FC<{
  columnCount: number;
  size: "sm" | "md" | "lg";
}> = ({ columnCount, size }) => {
  const sizeClasses = {
    sm: "py-2 px-3",
    md: "py-3 px-4",
    lg: "py-4 px-5",
  };

  return (
    <tr className="animate-pulse">
      {Array.from({ length: columnCount }).map((_, index) => (
        <td
          key={index}
          className={`${sizeClasses[size]} border-b border-gray-200`}
        >
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
};

export const DataTable = <T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  size = "md",
  variant = "default",
  bordered = false,
  striped = false,
  hover = false,
  className = "",
  rowClassName = "",
  headerClassName = "",
  cellClassName = "",
  emptyText,
  empty,
  scroll,
  sticky = false,
  rowKey = "id",
  rowSelection,
  expandable,
  pagination,
  sortable = true,
  defaultSortOrder,
  onSort,
  filterable = false,
  filters = {},
  onFilter,
  searchable = false,
  searchValue = "",
  onSearch,
  onRow,
  onHeaderRow,
  showHeader = true,
  title,
  footer,
  summary,
  components,
}: DataTableProps<T>): JSX.Element => {
  const { t } = useTranslation();

  const [sortColumn, setSortColumn] = useState<string>(
    defaultSortOrder?.column || ""
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    defaultSortOrder?.order || "asc"
  );
  const [expandedRows, setExpandedRows] = useState<string[]>(
    expandable?.expandedRowKeys || []
  );
  const [selectedRows, setSelectedRows] = useState<string[]>(
    rowSelection?.selectedRowKeys || []
  );
  const [currentFilters, setCurrentFilters] =
    useState<Record<string, any>>(filters);

  const sizeClasses = {
    sm: "py-2 px-3 text-sm",
    md: "py-3 px-4 text-base",
    lg: "py-4 px-5 text-lg",
  };

  const variantClasses = {
    default: "bg-white",
    filled: "bg-gray-50",
    outlined: "border border-gray-200",
  };

  const getRowKey = useCallback(
    (record: T, index: number): string => {
      if (typeof rowKey === "function") {
        return rowKey(record);
      }
      return record[rowKey] || index.toString();
    },
    [rowKey]
  );

  const handleSort = useCallback(
    (column: string) => {
      if (!sortable) return;

      const newOrder =
        sortColumn === column && sortOrder === "asc" ? "desc" : "asc";
      setSortColumn(column);
      setSortOrder(newOrder);
      onSort?.(column, newOrder);
    },
    [sortColumn, sortOrder, sortable, onSort]
  );

  const handleExpand = useCallback(
    (record: T, expanded: boolean) => {
      const key = getRowKey(record, 0);
      const newExpandedRows = expanded
        ? [...expandedRows, key]
        : expandedRows.filter((k) => k !== key);

      setExpandedRows(newExpandedRows);
      expandable?.onExpand?.(expanded, record);
      expandable?.onExpandedRowsChange?.(newExpandedRows);
    },
    [expandedRows, expandable, getRowKey]
  );

  const handleSelectRow = useCallback(
    (record: T, selected: boolean) => {
      const key = getRowKey(record, 0);
      const newSelectedRows = selected
        ? [...selectedRows, key]
        : selectedRows.filter((k) => k !== key);

      setSelectedRows(newSelectedRows);
      const selectedRecords = data.filter((item) =>
        newSelectedRows.includes(getRowKey(item, 0))
      );

      rowSelection?.onChange?.(newSelectedRows, selectedRecords);
      rowSelection?.onSelect?.(record, selected, selectedRecords);
    },
    [selectedRows, data, rowSelection, getRowKey]
  );

  const handleSelectAll = useCallback(
    (selected: boolean) => {
      const allKeys = data.map((item, index) => getRowKey(item, index));
      const newSelectedRows = selected ? allKeys : [];

      setSelectedRows(newSelectedRows);
      const selectedRecords = selected ? data : [];

      rowSelection?.onChange?.(newSelectedRows, selectedRecords);
      rowSelection?.onSelectAll?.(selected, selectedRecords, data);
    },
    [data, rowSelection, getRowKey]
  );

  const sortedData = useMemo(() => {
    if (!sortable || !sortColumn) return data;

    const column = columns.find((col) => col.key === sortColumn);
    if (!column) return data;

    const sorted = [...data].sort((a, b) => {
      if (typeof column.sorter === "function") {
        return column.sorter(a, b);
      }

      const aValue = column.dataIndex ? a[column.dataIndex] : a[column.key];
      const bValue = column.dataIndex ? b[column.dataIndex] : b[column.key];

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [data, sortable, sortColumn, sortOrder, columns]);

  const filteredData = useMemo(() => {
    if (!filterable || Object.keys(currentFilters).length === 0)
      return sortedData;

    return sortedData.filter((record) => {
      return Object.entries(currentFilters).every(([key, value]) => {
        if (!value) return true;
        const recordValue = record[key];

        if (typeof value === "string") {
          return recordValue
            ?.toString()
            .toLowerCase()
            .includes(value.toLowerCase());
        }

        return recordValue === value;
      });
    });
  }, [sortedData, filterable, currentFilters]);

  const searchedData = useMemo(() => {
    if (!searchable || !searchValue) return filteredData;

    return filteredData.filter((record) => {
      return Object.values(record).some((value) =>
        value?.toString().toLowerCase().includes(searchValue.toLowerCase())
      );
    });
  }, [filteredData, searchable, searchValue]);

  const renderCell = useCallback(
    (column: DataTableColumn<T>, record: T, index: number, value: any) => {
      if (column.render) {
        return column.render(value, record, index);
      }

      if (column.ellipsis && typeof value === "string") {
        return (
          <div className="truncate" title={value}>
            {value}
          </div>
        );
      }

      return value;
    },
    []
  );

  const renderHeader = () => {
    if (!showHeader) return null;

    return (
      <thead className={`${headerClassName} bg-gray-50`}>
        <tr {...(onHeaderRow ? onHeaderRow(columns, 0) : {})}>
          {rowSelection && (
            <th
              className={`${sizeClasses[size]} font-medium text-gray-900 text-left`}
            >
              {!rowSelection.hideSelectAll &&
                rowSelection.type === "checkbox" && (
                  <input
                    type="checkbox"
                    checked={
                      selectedRows.length === data.length && data.length > 0
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                )}
            </th>
          )}

          {expandable && (
            <th
              className={`${sizeClasses[size]} font-medium text-gray-900 text-left`}
            />
          )}

          {columns
            .filter((col) => !col.hidden)
            .map((column) => (
              <th
                key={column.key}
                className={`
                ${sizeClasses[size]}
                ${
                  column.align === "center"
                    ? "text-center"
                    : column.align === "right"
                    ? "text-right"
                    : "text-left"
                }
                ${column.headerClassName || ""}
                font-medium text-gray-900
                ${
                  column.sortable !== false && sortable
                    ? "cursor-pointer hover:bg-gray-100"
                    : ""
                }
              `}
                style={{
                  width: column.width,
                  minWidth: column.minWidth,
                  maxWidth: column.maxWidth,
                }}
                onClick={() =>
                  column.sortable !== false && handleSort(column.key)
                }
              >
                <div className="flex items-center space-x-2">
                  <span>{column.title}</span>
                  {column.sortable !== false && sortable && (
                    <SortIcon
                      direction={
                        sortColumn === column.key ? sortOrder : undefined
                      }
                      className="w-4 h-4 text-gray-400"
                    />
                  )}
                  {column.filterable && (
                    <FilterIcon className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </th>
            ))}
        </tr>
      </thead>
    );
  };

  const renderBody = () => {
    if (loading) {
      return (
        <tbody>
          {Array.from({ length: 5 }).map((_, index) => (
            <LoadingRow
              key={index}
              columnCount={
                columns.length + (rowSelection ? 1 : 0) + (expandable ? 1 : 0)
              }
              size={size}
            />
          ))}
        </tbody>
      );
    }

    if (searchedData.length === 0) {
      return (
        <tbody>
          <tr>
            <td
              colSpan={
                columns.length + (rowSelection ? 1 : 0) + (expandable ? 1 : 0)
              }
              className={`${sizeClasses[size]} text-center text-gray-500`}
            >
              {empty || (
                <div className="py-8">
                  <p>{emptyText || t("no_data_available")}</p>
                </div>
              )}
            </td>
          </tr>
        </tbody>
      );
    }

    return (
      <tbody>
        {searchedData.map((record, index) => {
          const key = getRowKey(record, index);
          const isExpanded = expandedRows.includes(key);
          const isSelected = selectedRows.includes(key);
          const checkboxProps = rowSelection?.getCheckboxProps?.(record) || {};

          const rowProps = onRow ? onRow(record, index) : {};
          const rowClassNameResult =
            typeof rowClassName === "function"
              ? rowClassName(record, index)
              : rowClassName;

          return (
            <React.Fragment key={key}>
              <tr
                {...rowProps}
                className={`
                  ${striped && index % 2 === 1 ? "bg-gray-50" : ""}
                  ${hover ? "hover:bg-gray-50" : ""}
                  ${isSelected ? "bg-blue-50" : ""}
                  ${rowClassNameResult}
                  transition-colors duration-200
                `}
              >
                {rowSelection && (
                  <td className={`${sizeClasses[size]} ${cellClassName}`}>
                    <input
                      type={rowSelection.type || "checkbox"}
                      checked={isSelected}
                      onChange={(e) =>
                        handleSelectRow(record, e.target.checked)
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      {...checkboxProps}
                    />
                  </td>
                )}

                {expandable && (
                  <td className={`${sizeClasses[size]} ${cellClassName}`}>
                    {expandable.expandIcon ? (
                      expandable.expandIcon({
                        expanded: isExpanded,
                        onExpand: () => handleExpand(record, !isExpanded),
                      })
                    ) : (
                      <ExpandIcon
                        expanded={isExpanded}
                        onExpand={() => handleExpand(record, !isExpanded)}
                        className="text-gray-400 hover:text-gray-600"
                      />
                    )}
                  </td>
                )}

                {columns
                  .filter((col) => !col.hidden)
                  .map((column) => {
                    const value = column.dataIndex
                      ? record[column.dataIndex]
                      : record[column.key];

                    return (
                      <td
                        key={column.key}
                        className={`
                        ${sizeClasses[size]}
                        ${
                          column.align === "center"
                            ? "text-center"
                            : column.align === "right"
                            ? "text-right"
                            : "text-left"
                        }
                        ${column.cellClassName || cellClassName}
                        ${bordered ? "border-r border-gray-200" : ""}
                        border-b border-gray-200
                      `}
                        style={{
                          width: column.width,
                          minWidth: column.minWidth,
                          maxWidth: column.maxWidth,
                        }}
                      >
                        {renderCell(column, record, index, value)}
                      </td>
                    );
                  })}
              </tr>

              {expandable && isExpanded && expandable.expandedRowRender && (
                <tr>
                  <td
                    colSpan={columns.length + (rowSelection ? 1 : 0) + 1}
                    className={`${sizeClasses[size]} ${cellClassName} bg-gray-50`}
                  >
                    {expandable.expandedRowRender(record, index)}
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        })}
      </tbody>
    );
  };

  return (
    <div className={`${className}`}>
      {title && <div className="mb-4">{title}</div>}

      <div
        className={`
          ${variantClasses[variant]}
          ${bordered ? "border border-gray-200" : ""}
          rounded-lg overflow-hidden
        `}
      >
        <div
          className={`
            ${scroll?.x ? "overflow-x-auto" : ""}
            ${scroll?.y ? "overflow-y-auto" : ""}
          `}
          style={{
            maxHeight: scroll?.y,
            minWidth: scroll?.x,
          }}
        >
          <table className={`w-full table-auto ${sticky ? "sticky" : ""}`}>
            {renderHeader()}
            {renderBody()}
          </table>
        </div>
      </div>

      {summary && <div className="mt-4">{summary(searchedData)}</div>}

      {footer && <div className="mt-4">{footer}</div>}
    </div>
  );
};

export default DataTable;
