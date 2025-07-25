import React from "react";
import { useTranslation } from "../../contexts/TranslationContext";

interface SimpleTableColumn<T = any> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  width?: number | string;
  align?: "left" | "center" | "right";
  render?: (value: any, record: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  cellClassName?: string;
}

interface SimpleTableProps<T = any> {
  columns: SimpleTableColumn<T>[];
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
  rowKey?: string | ((record: T) => string);
  onRowClick?: (record: T, index: number) => void;
  onRowDoubleClick?: (record: T, index: number) => void;
  showHeader?: boolean;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  caption?: React.ReactNode;
  maxHeight?: number;
  stickyHeader?: boolean;
}

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

export const SimpleTable = <T extends Record<string, any>>({
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
  rowKey = "id",
  onRowClick,
  onRowDoubleClick,
  showHeader = true,
  title,
  footer,
  caption,
  maxHeight,
  stickyHeader = false,
}: SimpleTableProps<T>): JSX.Element => {
  const { t } = useTranslation();

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

  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === "function") {
      return rowKey(record);
    }
    return record[rowKey] || index.toString();
  };

  const renderCell = (
    column: SimpleTableColumn<T>,
    record: T,
    index: number,
    value: any
  ) => {
    if (column.render) {
      return column.render(value, record, index);
    }

    return value;
  };

  const handleRowClick = (record: T, index: number) => {
    onRowClick?.(record, index);
  };

  const handleRowDoubleClick = (record: T, index: number) => {
    onRowDoubleClick?.(record, index);
  };

  const renderHeader = () => {
    if (!showHeader) return null;

    return (
      <thead
        className={`
          ${headerClassName} 
          ${stickyHeader ? "sticky top-0 z-10" : ""} 
          bg-gray-50
        `}
      >
        <tr>
          {columns.map((column) => (
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
                ${bordered ? "border-r border-gray-200" : ""}
                border-b border-gray-200
              `}
              style={{
                width: column.width,
              }}
            >
              {column.title}
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
            <LoadingRow key={index} columnCount={columns.length} size={size} />
          ))}
        </tbody>
      );
    }

    if (data.length === 0) {
      return (
        <tbody>
          <tr>
            <td
              colSpan={columns.length}
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
        {data.map((record, index) => {
          const key = getRowKey(record, index);
          const rowClassNameResult =
            typeof rowClassName === "function"
              ? rowClassName(record, index)
              : rowClassName;

          return (
            <tr
              key={key}
              className={`
                ${striped && index % 2 === 1 ? "bg-gray-50" : ""}
                ${hover ? "hover:bg-gray-50" : ""}
                ${onRowClick || onRowDoubleClick ? "cursor-pointer" : ""}
                ${rowClassNameResult}
                transition-colors duration-200
              `}
              onClick={() => handleRowClick(record, index)}
              onDoubleClick={() => handleRowDoubleClick(record, index)}
            >
              {columns.map((column) => {
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
                    }}
                  >
                    {renderCell(column, record, index, value)}
                  </td>
                );
              })}
            </tr>
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
            ${maxHeight ? "overflow-y-auto" : ""}
            overflow-x-auto
          `}
          style={{
            maxHeight: maxHeight ? `${maxHeight}px` : undefined,
          }}
        >
          <table className="w-full table-auto">
            {caption && (
              <caption className="text-sm text-gray-500 mb-2">
                {caption}
              </caption>
            )}
            {renderHeader()}
            {renderBody()}
          </table>
        </div>
      </div>

      {footer && <div className="mt-4">{footer}</div>}
    </div>
  );
};

export default SimpleTable;
