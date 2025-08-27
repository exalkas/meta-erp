import React from "react";
import Link from "next/link";

interface ButtonProps {
  children?: React.ReactNode;
  variant?:
    | "primary"
    | "secondary"
    | "danger"
    | "success"
    | "warning"
    | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  iconPosition?: "left" | "right";
  href?: string;
  external?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  className?: string;
  iconOnly?: boolean; // For icon-only buttons with better styling
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  icon: Icon,
  iconPosition = "left",
  href,
  external = false,
  type = "button",
  onClick,
  className = "",
  iconOnly = false,
}: ButtonProps) {
  // Base styles
  const baseStyles = `
    inline-flex items-center justify-center font-medium rounded-md
    transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? "w-full" : ""}
  `;

  // Size styles
  const sizeStyles = {
    sm: iconOnly ? "p-2 text-sm" : "px-3 py-2 text-sm",
    md: iconOnly ? "p-2 text-sm" : "px-4 py-2 text-sm",
    lg: iconOnly ? "p-3 text-base" : "px-6 py-3 text-base",
  };

  // Variant styles
  const variantStyles = {
    primary: `
      bg-blue-600 text-white border border-transparent
      hover:bg-blue-700 focus:ring-blue-500
      disabled:bg-blue-300
    `,
    secondary: `
      bg-white text-gray-700 border border-gray-300
      hover:bg-gray-50 focus:ring-blue-500
      disabled:bg-gray-100
    `,
    danger: `
      bg-red-600 text-white border border-transparent
      hover:bg-red-700 focus:ring-red-500
      disabled:bg-red-300
    `,
    success: `
      bg-green-600 text-white border border-transparent
      hover:bg-green-700 focus:ring-green-500
      disabled:bg-green-300
    `,
    warning: `
      bg-yellow-500 text-white border border-transparent
      hover:bg-yellow-600 focus:ring-yellow-500
      disabled:bg-yellow-300
    `,
    ghost: `
      bg-transparent text-gray-600 border border-transparent
      hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500
      disabled:text-gray-400
    `,
  };

  // Icon styles
  const iconStyles = {
    sm: "h-4 w-4",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  // Loading spinner
  const LoadingSpinner = () => (
    <svg
      className={`animate-spin ${iconStyles[size]} ${
        !iconOnly && !children ? "" : iconPosition === "right" ? "ml-2" : "mr-2"
      }`}
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
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );

  // Combined styles
  const combinedStyles = `
    ${baseStyles}
    ${sizeStyles[size]}
    ${variantStyles[variant]}
    ${className}
  `
    .replace(/\s+/g, " ")
    .trim();

  // Button content
  const content = (
    <>
      {loading && <LoadingSpinner />}
      {!loading && Icon && iconPosition === "left" && (
        <Icon
          className={`${iconStyles[size]} ${
            children && !iconOnly ? "mr-2" : ""
          }`}
        />
      )}
      {children}
      {!loading && Icon && iconPosition === "right" && (
        <Icon
          className={`${iconStyles[size]} ${
            children && !iconOnly ? "ml-2" : ""
          }`}
        />
      )}
    </>
  );

  // If href is provided, render as Link or anchor
  if (href) {
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={combinedStyles}
        >
          {content}
        </a>
      );
    }

    return (
      <Link href={href} className={combinedStyles}>
        {content}
      </Link>
    );
  }

  // Render as button
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={combinedStyles}
    >
      {content}
    </button>
  );
}
