/**
 * Generic Pagination Component - Metadata-Driven
 * Universal pagination for any paginated data
 */

import React from "react";
import { Button } from "./Button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface PaginationProps {
  // Data
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;

  // Behavior
  onPageChange: (page: number) => void;
  showInfo?: boolean;
  showSizeSelector?: boolean;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;

  // Display
  maxVisiblePages?: number;
  showFirstLast?: boolean;
  size?: "sm" | "md" | "lg";

  // Labels
  previousLabel?: string;
  nextLabel?: string;
  firstLabel?: string;
  lastLabel?: string;

  // Styling
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 10,
  onPageChange,
  showInfo = true,
  showSizeSelector = false,
  pageSizeOptions = [10, 25, 50, 100],
  onPageSizeChange,
  maxVisiblePages = 7,
  showFirstLast = true,
  size = "md",
  previousLabel = "Previous",
  nextLabel = "Next",
  firstLabel = "First",
  lastLabel = "Last",
  className = "",
}) => {
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  // Calculate visible page numbers
  const getVisiblePages = (): (number | "ellipsis")[] => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | "ellipsis")[] = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);

    if (currentPage <= halfVisible + 1) {
      // Show pages from start
      for (let i = 1; i <= maxVisiblePages - 2; i++) {
        pages.push(i);
      }
      pages.push("ellipsis");
      pages.push(totalPages);
    } else if (currentPage >= totalPages - halfVisible) {
      // Show pages from end
      pages.push(1);
      pages.push("ellipsis");
      for (let i = totalPages - maxVisiblePages + 3; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current
      pages.push(1);
      pages.push("ellipsis");

      const start = currentPage - Math.floor((maxVisiblePages - 4) / 2);
      const end = start + maxVisiblePages - 5;

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      pages.push("ellipsis");
      pages.push(totalPages);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "text-xs";
      case "lg":
        return "text-lg";
      default:
        return "text-sm";
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case "sm":
        return "sm" as const;
      case "lg":
        return "lg" as const;
      default:
        return "sm" as const;
    }
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div
      className={`flex flex-col sm:flex-row gap-4 justify-between items-center ${className}`}
    >
      {/* Info */}
      {showInfo && totalItems && (
        <div className={`text-gray-600 ${getSizeClasses()}`}>
          Showing {(currentPage - 1) * pageSize + 1} to{" "}
          {Math.min(currentPage * pageSize, totalItems)} of{" "}
          {totalItems.toLocaleString()} results
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        {showFirstLast && !isFirstPage && (
          <Button
            variant="outline"
            size={getButtonSize()}
            onClick={() => handlePageChange(1)}
            className="hidden sm:flex"
          >
            {firstLabel}
          </Button>
        )}

        {/* Previous Page */}
        <Button
          variant="outline"
          size={getButtonSize()}
          disabled={isFirstPage}
          onClick={() => handlePageChange(currentPage - 1)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">{previousLabel}</span>
        </Button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {visiblePages.map((page, index) => {
            if (page === "ellipsis") {
              return (
                <div key={`ellipsis-${index}`} className="px-2">
                  <MoreHorizontal className="h-4 w-4 text-gray-400" />
                </div>
              );
            }

            return (
              <Button
                key={page}
                variant={currentPage === page ? "primary" : "outline"}
                size={getButtonSize()}
                onClick={() => handlePageChange(page)}
                className="min-w-[40px]"
              >
                {page}
              </Button>
            );
          })}
        </div>

        {/* Next Page */}
        <Button
          variant="outline"
          size={getButtonSize()}
          disabled={isLastPage}
          onClick={() => handlePageChange(currentPage + 1)}
        >
          <span className="hidden sm:inline">{nextLabel}</span>
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>

        {/* Last Page */}
        {showFirstLast && !isLastPage && (
          <Button
            variant="outline"
            size={getButtonSize()}
            onClick={() => handlePageChange(totalPages)}
            className="hidden sm:flex"
          >
            {lastLabel}
          </Button>
        )}
      </div>

      {/* Page Size Selector */}
      {showSizeSelector && onPageSizeChange && (
        <div className="flex items-center gap-2">
          <span className={`text-gray-600 ${getSizeClasses()}`}>Show:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className={`border border-gray-300 rounded-md px-2 py-1 ${getSizeClasses()} focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <span className={`text-gray-600 ${getSizeClasses()}`}>per page</span>
        </div>
      )}
    </div>
  );
};

export default Pagination;
