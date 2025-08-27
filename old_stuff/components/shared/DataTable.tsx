"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

// Types for table configuration
export interface Column<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (item: T, value: any) => React.ReactNode;
  className?: string;
  width?: string;
}

export interface ActionButton<T> {
  type: "view" | "edit" | "delete" | "custom";
  label?: string;
  icon?: React.ComponentType<{ className?: string }>;
  href?: (item: T) => string;
  onClick?: (item: T) => void;
  className?: string;
  show?: (item: T) => boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: ActionButton<T>[];
  loading?: boolean;
  emptyState?: {
    title: string;
    description: string;
    action?: {
      label: string;
      href: string;
    };
  };
  searchable?: boolean;
  searchPlaceholder?: string;
  initialSort?: {
    key: keyof T | string;
    direction: "asc" | "desc";
  };
  pagination?: {
    pageSize: number;
    showTotal?: boolean;
  };
  className?: string;
}

export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  actions = [],
  loading = false,
  emptyState,
  searchable = true,
  searchPlaceholder = "Search...",
  initialSort,
  pagination = { pageSize: 10, showTotal: true },
  className = "",
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | string;
    direction: "asc" | "desc";
  } | null>(initialSort || null);
  const [currentPage, setCurrentPage] = useState(1);

  // Helper function to get nested values
  const getNestedValue = (obj: any, path: string) => {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  };

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;

    const lowercaseSearchTerm = searchTerm.toLowerCase();
    return data.filter((item) =>
      columns.some((column) => {
        const value = getNestedValue(item, column.key as string);
        return value?.toString().toLowerCase().includes(lowercaseSearchTerm);
      })
    );
  }, [data, searchTerm, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = getNestedValue(a, sortConfig.key as string);
      const bValue = getNestedValue(b, sortConfig.key as string);

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pagination.pageSize;
    return sortedData.slice(startIndex, startIndex + pagination.pageSize);
  }, [sortedData, currentPage, pagination.pageSize]);

  const totalPages = Math.ceil(sortedData.length / pagination.pageSize);

  // Handle sorting
  const handleSort = (key: keyof T | string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Render sort icon
  const renderSortIcon = (columnKey: keyof T | string) => {
    if (sortConfig?.key !== columnKey) {
      return (
        <ChevronUpIcon className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100" />
      );
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUpIcon className="h-4 w-4 text-gray-600" />
    ) : (
      <ChevronDownIcon className="h-4 w-4 text-gray-600" />
    );
  };

  // Render action buttons
  const renderActions = (item: T) => {
    const visibleActions = actions.filter(
      (action) => !action.show || action.show(item)
    );

    if (visibleActions.length === 0) return null;

    return (
      <div className="flex gap-2">
        {visibleActions.map((action, index) => {
          const defaultIcons = {
            view: EyeIcon,
            edit: PencilIcon,
            delete: TrashIcon,
          };

          const Icon =
            action.icon ||
            defaultIcons[action.type as keyof typeof defaultIcons];
          const defaultClasses = {
            view: "text-gray-600 hover:text-gray-800",
            edit: "text-blue-600 hover:text-blue-800",
            delete: "text-red-600 hover:text-red-800",
            custom: "text-gray-600 hover:text-gray-800",
          };

          const className = action.className || defaultClasses[action.type];

          if (action.href) {
            return (
              <Link
                key={index}
                href={action.href(item)}
                className={className}
                title={action.label}
              >
                {Icon && <Icon className="h-4 w-4" />}
              </Link>
            );
          }

          return (
            <button
              key={index}
              onClick={() => action.onClick?.(item)}
              className={className}
              title={action.label}
            >
              {Icon && <Icon className="h-4 w-4" />}
            </button>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow ${className}`}>
        <div className="animate-pulse">
          {/* Search bar skeleton */}
          {searchable && (
            <div className="p-4 border-b border-gray-200">
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          )}
          {/* Table skeleton */}
          <div className="overflow-hidden">
            <div className="h-12 bg-gray-100"></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 border-t border-gray-200">
                <div className="px-6 py-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      {/* Search */}
      {searchable && (
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="block w-full pl-3 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? "cursor-pointer select-none group" : ""
                  } ${column.className || ""}`}
                  style={{ width: column.width }}
                  onClick={
                    column.sortable ? () => handleSort(column.key) : undefined
                  }
                >
                  <div className="flex items-center gap-2">
                    <span>{column.label}</span>
                    {column.sortable && renderSortIcon(column.key)}
                  </div>
                </th>
              ))}
              {actions.length > 0 && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((item, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map((column) => {
                  const value = getNestedValue(item, column.key as string);
                  return (
                    <td
                      key={String(column.key)}
                      className={`px-6 py-4 whitespace-nowrap text-sm ${
                        column.className || ""
                      }`}
                    >
                      {column.render ? column.render(item, value) : value}
                    </td>
                  );
                })}
                {actions.length > 0 && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {renderActions(item)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty State */}
        {paginatedData.length === 0 && !loading && (
          <div className="text-center py-12">
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {emptyState?.title || "No data found"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {emptyState?.description ||
                "No results match your search criteria."}
            </p>
            {emptyState?.action && (
              <div className="mt-6">
                <Link
                  href={emptyState.action.href}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  {emptyState.action.label}
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            {pagination.showTotal && (
              <div>
                <p className="text-sm text-gray-700">
                  Showing{" "}
                  <span className="font-medium">
                    {(currentPage - 1) * pagination.pageSize + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {Math.min(
                      currentPage * pagination.pageSize,
                      sortedData.length
                    )}
                  </span>{" "}
                  of <span className="font-medium">{sortedData.length}</span>{" "}
                  results
                </p>
              </div>
            )}
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === currentPage
                            ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return (
                      <span
                        key={page}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                      >
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
