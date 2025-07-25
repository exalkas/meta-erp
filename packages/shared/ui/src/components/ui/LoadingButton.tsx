import React from "react";
import { Button, ButtonProps } from "./Button";
import { useTranslation } from "../../contexts/TranslationContext";

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
  spinner?: React.ReactNode;
  children: React.ReactNode;
}

const LoadingSpinner: React.FC<{ size?: "xs" | "sm" | "md" | "lg" | "xl" }> = ({
  size = "md",
}) => {
  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
    xl: "w-6 h-6",
  };

  return (
    <svg
      className={`animate-spin ${sizeClasses[size]}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
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
};

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  loadingText,
  spinner,
  children,
  disabled,
  className = "",
  size = "md",
  ...props
}) => {
  const { t } = useTranslation();
  const defaultSpinner = <LoadingSpinner size={size} />;
  const currentSpinner = spinner || defaultSpinner;

  return (
    <Button
      disabled={disabled || loading}
      className={`relative ${loading ? "cursor-not-allowed" : ""} ${className}`}
      size={size}
      {...props}
    >
      {loading && (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {currentSpinner}
        </span>
      )}
      <span
        className={`inline-flex items-center gap-2 ${
          loading ? "opacity-0" : ""
        }`}
      >
        {loading ? loadingText || children : children}
      </span>
    </Button>
  );
};

export default LoadingButton;
