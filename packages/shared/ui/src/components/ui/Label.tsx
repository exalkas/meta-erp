"use client";

import React from "react";

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "floating";
  className?: string;
  children: React.ReactNode;
}

export const Label: React.FC<LabelProps> = ({
  required = false,
  disabled = false,
  size = "md",
  variant = "default",
  className = "",
  children,
  ...props
}) => {
  const baseClasses = "block font-medium text-gray-700 dark:text-gray-300";

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const variantClasses = {
    default: "",
    floating:
      "absolute left-3 top-2 transition-all duration-200 pointer-events-none",
  };

  const stateClasses = {
    disabled: "opacity-50 cursor-not-allowed",
    enabled: "",
  };

  const classes = [
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    disabled ? stateClasses.disabled : stateClasses.enabled,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <label className={classes} {...props}>
      {children}
      {required && (
        <span className="text-red-500 ml-1" aria-label="required">
          *
        </span>
      )}
    </label>
  );
};
