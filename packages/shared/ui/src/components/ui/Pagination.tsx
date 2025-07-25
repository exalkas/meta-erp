import React, { useState, useCallback, useMemo } from "react";
import { useTranslation } from "../../contexts/TranslationContext";

interface PaginationProps {
  current?: number;
  total: number;
  pageSize?: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?:
    | boolean
    | ((total: number, range: [number, number]) => React.ReactNode);
  onChange?: (page: number, pageSize: number) => void;
  onShowSizeChange?: (current: number, size: number) => void;
  pageSizeOptions?: string[];
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  hideOnSinglePage?: boolean;
  showPrevNextJumpers?: boolean;
  showLessItems?: boolean;
  responsive?: boolean;
  className?: string;
  itemClassName?: string;
  activeClassName?: string;
  disabledClassName?: string;
  simple?: boolean;
  position?: "left" | "center" | "right";
  showFirstLast?: boolean;
  maxPageButtons?: number;
  ellipsisText?: string;
  prevText?: string;
  nextText?: string;
  firstText?: string;
  lastText?: string;
  jumpPrevText?: string;
  jumpNextText?: string;
  showTotalText?: string;
  itemRender?: (
    page: number,
    type:
      | "page"
      | "prev"
      | "next"
      | "jump-prev"
      | "jump-next"
      | "first"
      | "last",
    originalElement: React.ReactNode
  ) => React.ReactNode;
}

const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d="M15 19l-7-7 7-7"
    />
  </svg>
);

const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d="M9 5l7 7-7 7"
    />
  </svg>
);

const DoubleChevronLeftIcon: React.FC<{ className?: string }> = ({
  className,
}) => (
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
      d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
    />
  </svg>
);

const DoubleChevronRightIcon: React.FC<{ className?: string }> = ({
  className,
}) => (
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
      d="M13 5l7 7-7 7M5 5l7 7-7 7"
    />
  </svg>
);

const EllipsisIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
    />
  </svg>
);

export const Pagination: React.FC<PaginationProps> = ({
  current = 1,
  total,
  pageSize = 10,
  showSizeChanger = false,
  showQuickJumper = false,
  showTotal = false,
  onChange,
  onShowSizeChange,
  pageSizeOptions = ["10", "20", "50", "100"],
  size = "md",
  disabled = false,
  hideOnSinglePage = false,
  showPrevNextJumpers = false,
  showLessItems = false,
  responsive = true,
  className = "",
  itemClassName = "",
  activeClassName = "",
  disabledClassName = "",
  simple = false,
  position = "center",
  showFirstLast = false,
  maxPageButtons = 7,
  ellipsisText = "...",
  prevText,
  nextText,
  firstText,
  lastText,
  jumpPrevText,
  jumpNextText,
  showTotalText,
  itemRender,
}) => {
  const { t } = useTranslation();
  const [jumpPage, setJumpPage] = useState("");

  const totalPages = Math.ceil(total / pageSize);
  const startRecord = (current - 1) * pageSize + 1;
  const endRecord = Math.min(current * pageSize, total);

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-2 text-sm",
    lg: "px-4 py-3 text-base",
  };

  const positionClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  };

  // Don't render if there's only one page and hideOnSinglePage is true
  if (hideOnSinglePage && totalPages <= 1) {
    return null;
  }

  const handlePageChange = useCallback(
    (page: number) => {
      if (page !== current && page >= 1 && page <= totalPages && !disabled) {
        onChange?.(page, pageSize);
      }
    },
    [current, totalPages, pageSize, disabled, onChange]
  );

  const handleSizeChange = useCallback(
    (newSize: number) => {
      if (newSize !== pageSize && !disabled) {
        const newPage = Math.min(current, Math.ceil(total / newSize));
        onShowSizeChange?.(newPage, newSize);
        onChange?.(newPage, newSize);
      }
    },
    [current, total, pageSize, disabled, onShowSizeChange, onChange]
  );

  const handleJumpToPage = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        const page = parseInt(jumpPage);
        if (page >= 1 && page <= totalPages) {
          handlePageChange(page);
          setJumpPage("");
        }
      }
    },
    [jumpPage, totalPages, handlePageChange]
  );

  const generatePageNumbers = useCallback(() => {
    const pages: (number | string)[] = [];

    if (totalPages <= maxPageButtons) {
      // Show all pages if total pages is less than max buttons
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Complex pagination logic
      const halfMax = Math.floor(maxPageButtons / 2);

      if (current <= halfMax + 1) {
        // Current page is near the beginning
        for (let i = 1; i <= maxPageButtons - 2; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (current >= totalPages - halfMax) {
        // Current page is near the end
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - maxPageButtons + 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Current page is in the middle
        pages.push(1);
        pages.push("...");
        for (let i = current - halfMax + 1; i <= current + halfMax - 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  }, [current, totalPages, maxPageButtons]);

  const renderPageButton = useCallback(
    (page: number | string, key: string) => {
      const isActive = page === current;
      const isDisabled = disabled || typeof page === "string";
      const isEllipsis = typeof page === "string";

      let content: React.ReactNode;
      let onClick: (() => void) | undefined;

      if (isEllipsis) {
        content = ellipsisText;
      } else {
        content = page;
        onClick = () => handlePageChange(page as number);
      }

      const defaultButton = (
        <button
          key={key}
          type="button"
          onClick={onClick}
          disabled={isDisabled}
          className={`
          ${sizeClasses[size]}
          ${itemClassName}
          ${
            isActive
              ? `bg-blue-600 text-white ${activeClassName}`
              : "bg-white text-gray-700 hover:bg-gray-50"
          }
          ${
            isDisabled
              ? `cursor-not-allowed opacity-50 ${disabledClassName}`
              : "cursor-pointer"
          }
          ${isEllipsis ? "cursor-default" : ""}
          border border-gray-300 transition-colors duration-200
          ${responsive ? "hidden sm:inline-flex" : "inline-flex"}
          items-center justify-center
        `}
        >
          {content}
        </button>
      );

      if (itemRender && !isEllipsis) {
        return itemRender(page as number, "page", defaultButton);
      }

      return defaultButton;
    },
    [
      current,
      disabled,
      size,
      itemClassName,
      activeClassName,
      disabledClassName,
      ellipsisText,
      responsive,
      handlePageChange,
      itemRender,
      sizeClasses,
    ]
  );

  const renderNavButton = useCallback(
    (
      type: "prev" | "next" | "first" | "last",
      page: number,
      icon: React.ReactNode,
      text: string
    ) => {
      const isDisabled =
        disabled ||
        (type === "prev" && current === 1) ||
        (type === "next" && current === totalPages) ||
        (type === "first" && current === 1) ||
        (type === "last" && current === totalPages);

      const defaultButton = (
        <button
          type="button"
          onClick={() => !isDisabled && handlePageChange(page)}
          disabled={isDisabled}
          className={`
          ${sizeClasses[size]}
          ${itemClassName}
          ${
            isDisabled
              ? `cursor-not-allowed opacity-50 ${disabledClassName}`
              : "cursor-pointer hover:bg-gray-50"
          }
          bg-white text-gray-700 border border-gray-300 transition-colors duration-200
          inline-flex items-center justify-center space-x-1
        `}
        >
          {icon}
          {!showLessItems && <span>{text}</span>}
        </button>
      );

      if (itemRender) {
        return itemRender(page, type, defaultButton);
      }

      return defaultButton;
    },
    [
      current,
      totalPages,
      disabled,
      size,
      itemClassName,
      disabledClassName,
      showLessItems,
      handlePageChange,
      itemRender,
      sizeClasses,
    ]
  );

  const pageNumbers = useMemo(
    () => generatePageNumbers(),
    [generatePageNumbers]
  );

  if (simple) {
    return (
      <div
        className={`flex items-center space-x-2 ${positionClasses[position]} ${className}`}
      >
        {renderNavButton(
          "prev",
          current - 1,
          <ChevronLeftIcon className="w-4 h-4" />,
          prevText || t("previous")
        )}

        <div className="flex items-center space-x-2">
          <input
            type="number"
            min="1"
            max={totalPages}
            value={current}
            onChange={(e) => {
              const page = parseInt(e.target.value);
              if (page >= 1 && page <= totalPages) {
                handlePageChange(page);
              }
            }}
            className={`${sizeClasses[size]} w-16 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            disabled={disabled}
          />
          <span className="text-sm text-gray-500">/ {totalPages}</span>
        </div>

        {renderNavButton(
          "next",
          current + 1,
          <ChevronRightIcon className="w-4 h-4" />,
          nextText || t("next")
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main pagination */}
      <div
        className={`flex items-center space-x-1 ${positionClasses[position]}`}
      >
        {showFirstLast && (
          <>
            {renderNavButton(
              "first",
              1,
              <DoubleChevronLeftIcon className="w-4 h-4" />,
              firstText || t("first")
            )}
            {showPrevNextJumpers &&
              renderNavButton(
                "prev",
                Math.max(1, current - 5),
                <EllipsisIcon className="w-4 h-4" />,
                jumpPrevText || t("jump_prev")
              )}
          </>
        )}

        {renderNavButton(
          "prev",
          current - 1,
          <ChevronLeftIcon className="w-4 h-4" />,
          prevText || t("previous")
        )}

        <div className="flex items-center space-x-1">
          {pageNumbers.map((page, index) =>
            renderPageButton(page, `page-${index}`)
          )}
        </div>

        {renderNavButton(
          "next",
          current + 1,
          <ChevronRightIcon className="w-4 h-4" />,
          nextText || t("next")
        )}

        {showFirstLast && (
          <>
            {showPrevNextJumpers &&
              renderNavButton(
                "next",
                Math.min(totalPages, current + 5),
                <EllipsisIcon className="w-4 h-4" />,
                jumpNextText || t("jump_next")
              )}
            {renderNavButton(
              "last",
              totalPages,
              <DoubleChevronRightIcon className="w-4 h-4" />,
              lastText || t("last")
            )}
          </>
        )}
      </div>

      {/* Additional controls */}
      {(showSizeChanger || showQuickJumper || showTotal) && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            {showSizeChanger && (
              <div className="flex items-center space-x-2">
                <span>{t("show")}</span>
                <select
                  value={pageSize}
                  onChange={(e) => handleSizeChange(parseInt(e.target.value))}
                  disabled={disabled}
                  className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {pageSizeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <span>{t("items_per_page")}</span>
              </div>
            )}

            {showQuickJumper && (
              <div className="flex items-center space-x-2">
                <span>{t("go_to_page")}</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={jumpPage}
                  onChange={(e) => setJumpPage(e.target.value)}
                  onKeyDown={handleJumpToPage}
                  className="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={disabled}
                  placeholder={current.toString()}
                />
              </div>
            )}
          </div>

          {showTotal && (
            <div>
              {typeof showTotal === "function" ? (
                showTotal(total, [startRecord, endRecord])
              ) : (
                <span>
                  {showTotalText ||
                    t("showing_records", {
                      start: startRecord,
                      end: endRecord,
                      total,
                    })}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Pagination;
