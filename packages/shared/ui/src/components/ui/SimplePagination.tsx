import React from "react";
import { useTranslation } from "../../contexts/TranslationContext";

interface SimplePaginationProps {
  current?: number;
  total: number;
  pageSize?: number;
  onChange?: (page: number) => void;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  hideOnSinglePage?: boolean;
  className?: string;
  showPageInfo?: boolean;
  showTotal?: boolean;
  position?: "left" | "center" | "right";
  prevText?: string;
  nextText?: string;
  pageInfoText?: string;
  totalText?: string;
  variant?: "default" | "minimal" | "outlined";
  color?: "primary" | "secondary" | "success" | "warning" | "error";
  rounded?: boolean;
  responsive?: boolean;
  loading?: boolean;
  customPrevButton?: React.ReactNode;
  customNextButton?: React.ReactNode;
  onPrevClick?: () => void;
  onNextClick?: () => void;
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

const LoadingSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
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

export const SimplePagination: React.FC<SimplePaginationProps> = ({
  current = 1,
  total,
  pageSize = 10,
  onChange,
  size = "md",
  disabled = false,
  hideOnSinglePage = false,
  className = "",
  showPageInfo = true,
  showTotal = false,
  position = "center",
  prevText,
  nextText,
  pageInfoText,
  totalText,
  variant = "default",
  color = "primary",
  rounded = true,
  responsive = true,
  loading = false,
  customPrevButton,
  customNextButton,
  onPrevClick,
  onNextClick,
}) => {
  const { t } = useTranslation();

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

  const colorClasses = {
    primary: {
      enabled: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
      disabled: "bg-gray-300 text-gray-500 cursor-not-allowed",
    },
    secondary: {
      enabled: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500",
      disabled: "bg-gray-300 text-gray-500 cursor-not-allowed",
    },
    success: {
      enabled:
        "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
      disabled: "bg-gray-300 text-gray-500 cursor-not-allowed",
    },
    warning: {
      enabled:
        "bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500",
      disabled: "bg-gray-300 text-gray-500 cursor-not-allowed",
    },
    error: {
      enabled: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
      disabled: "bg-gray-300 text-gray-500 cursor-not-allowed",
    },
  };

  const variantClasses = {
    default: "border-0 shadow-sm",
    minimal: "border-0 shadow-none",
    outlined: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
  };

  // Don't render if there's only one page and hideOnSinglePage is true
  if (hideOnSinglePage && totalPages <= 1) {
    return null;
  }

  const handlePrevClick = () => {
    if (current > 1 && !disabled && !loading) {
      const newPage = current - 1;
      onChange?.(newPage);
      onPrevClick?.();
    }
  };

  const handleNextClick = () => {
    if (current < totalPages && !disabled && !loading) {
      const newPage = current + 1;
      onChange?.(newPage);
      onNextClick?.();
    }
  };

  const isPrevDisabled = disabled || loading || current === 1;
  const isNextDisabled = disabled || loading || current === totalPages;

  const getButtonClasses = (isDisabled: boolean) => {
    const baseClasses = `
      ${sizeClasses[size]}
      ${rounded ? "rounded-lg" : ""}
      ${variantClasses[variant]}
      inline-flex items-center justify-center space-x-1
      transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50
      ${responsive ? "min-w-0" : ""}
    `;

    if (variant === "outlined") {
      return `${baseClasses} ${
        isDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"
      }`;
    }

    return `${baseClasses} ${
      isDisabled ? colorClasses[color].disabled : colorClasses[color].enabled
    }`;
  };

  const renderPrevButton = () => {
    if (customPrevButton) {
      return (
        <button
          type="button"
          onClick={handlePrevClick}
          disabled={isPrevDisabled}
          className={getButtonClasses(isPrevDisabled)}
        >
          {customPrevButton}
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={handlePrevClick}
        disabled={isPrevDisabled}
        className={getButtonClasses(isPrevDisabled)}
        aria-label={prevText || t("previous")}
      >
        {loading && current > 1 ? (
          <LoadingSpinner className="w-4 h-4" />
        ) : (
          <ChevronLeftIcon className="w-4 h-4" />
        )}
        {!responsive && (
          <span className="hidden sm:inline">{prevText || t("previous")}</span>
        )}
      </button>
    );
  };

  const renderNextButton = () => {
    if (customNextButton) {
      return (
        <button
          type="button"
          onClick={handleNextClick}
          disabled={isNextDisabled}
          className={getButtonClasses(isNextDisabled)}
        >
          {customNextButton}
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={handleNextClick}
        disabled={isNextDisabled}
        className={getButtonClasses(isNextDisabled)}
        aria-label={nextText || t("next")}
      >
        {!responsive && (
          <span className="hidden sm:inline">{nextText || t("next")}</span>
        )}
        {loading && current < totalPages ? (
          <LoadingSpinner className="w-4 h-4" />
        ) : (
          <ChevronRightIcon className="w-4 h-4" />
        )}
      </button>
    );
  };

  const renderPageInfo = () => {
    if (!showPageInfo) return null;

    return (
      <div className="text-sm text-gray-600 px-3 py-2">
        {pageInfoText || `${t("page")} ${current} ${t("of")} ${totalPages}`}
      </div>
    );
  };

  const renderTotalInfo = () => {
    if (!showTotal) return null;

    return (
      <div className="text-sm text-gray-600 px-3 py-2">
        {totalText ||
          `${t("showing")} ${startRecord}-${endRecord} ${t("of")} ${total} ${t(
            "records"
          )}`}
      </div>
    );
  };

  return (
    <div className={`${className}`}>
      <div
        className={`flex items-center space-x-1 ${positionClasses[position]}`}
      >
        {renderPrevButton()}
        {renderPageInfo()}
        {renderNextButton()}
      </div>

      {showTotal && (
        <div className={`mt-2 text-center ${positionClasses[position]}`}>
          {renderTotalInfo()}
        </div>
      )}
    </div>
  );
};

export default SimplePagination;
