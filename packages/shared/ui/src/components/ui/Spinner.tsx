/**
 * Unified Spinner Component
 *
 * Provides consistent loading spinners across the entire application.
 * Supports different sizes, full-screen mode, and custom messages.
 */

import React from "react";

export interface SpinnerProps {
  /** Size of the spinner */
  size?: "sm" | "md" | "lg" | "xl";
  /** Optional loading message */
  message?: string;
  /** Whether to render in full-screen mode */
  fullScreen?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Spinner color variant */
  variant?: "primary" | "secondary" | "white";
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

const variantClasses = {
  primary: "border-primary",
  secondary: "border-secondary",
  white: "border-white",
};

/**
 * Spinner component for loading states
 */
export const Spinner: React.FC<SpinnerProps> = ({
  size = "md",
  message,
  fullScreen = false,
  className = "",
  variant = "primary",
}) => {
  const spinnerClasses = `animate-spin rounded-full border-b-2 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

  if (fullScreen) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className={`${spinnerClasses} mx-auto`}></div>
        {message && (
          <p className="text-muted-foreground text-sm mt-4 text-center max-w-md">
            {message}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center">
      <div className={spinnerClasses}></div>
      {message && (
        <span className="ml-3 text-muted-foreground text-sm">{message}</span>
      )}
    </div>
  );
};

/**
 * Inline spinner for buttons and small spaces
 */
export const InlineSpinner: React.FC<Omit<SpinnerProps, "fullScreen">> = (
  props
) => <Spinner {...props} fullScreen={false} />;

/**
 * Full-screen spinner for page loading
 */
export const FullScreenSpinner: React.FC<Omit<SpinnerProps, "fullScreen">> = (
  props
) => <Spinner {...props} fullScreen={true} />;

export default Spinner;
