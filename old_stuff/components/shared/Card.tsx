import React from "react";

interface CardProps {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "bordered" | "interactive";
  padding?: "none" | "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  href?: string;
}

export default function Card({
  children,
  variant = "default",
  padding = "md",
  className = "",
  onClick,
  href,
}: CardProps) {
  // Base styles
  const baseStyles = "bg-white rounded-lg";

  // Variant styles
  const variantStyles = {
    default: "shadow-sm border border-gray-200",
    elevated: "shadow-md",
    bordered: "border border-gray-300",
    interactive:
      "shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer",
  };

  // Padding styles
  const paddingStyles = {
    none: "",
    sm: "p-3",
    md: "p-6",
    lg: "p-8",
  };

  // Combined styles
  const combinedStyles = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${paddingStyles[padding]}
    ${className}
  `
    .replace(/\s+/g, " ")
    .trim();

  // If href is provided, render as a link-like div
  if (href) {
    return (
      <div
        className={combinedStyles}
        onClick={() => {
          if (onClick) onClick();
          if (href) window.location.href = href;
        }}
      >
        {children}
      </div>
    );
  }

  // If onClick is provided, render as clickable div
  if (onClick) {
    return (
      <div className={combinedStyles} onClick={onClick}>
        {children}
      </div>
    );
  }

  // Render as simple div
  return <div className={combinedStyles}>{children}</div>;
}
