"use client";

import React from "react";

export interface SeparatorProps {
  orientation?: "horizontal" | "vertical";
  size?: "sm" | "md" | "lg";
  variant?: "solid" | "dashed" | "dotted";
  className?: string;
  decorative?: boolean;
}

export const Separator: React.FC<SeparatorProps> = ({
  orientation = "horizontal",
  size = "md",
  variant = "solid",
  className = "",
  decorative = true,
}) => {
  const baseClasses = "border-gray-200 dark:border-gray-700";

  const orientationClasses = {
    horizontal: "w-full border-t",
    vertical: "h-full border-l",
  };

  const sizeClasses = {
    horizontal: {
      sm: "border-t",
      md: "border-t-2",
      lg: "border-t-4",
    },
    vertical: {
      sm: "border-l",
      md: "border-l-2",
      lg: "border-l-4",
    },
  };

  const variantClasses = {
    solid: "border-solid",
    dashed: "border-dashed",
    dotted: "border-dotted",
  };

  const classes = [
    baseClasses,
    orientationClasses[orientation],
    sizeClasses[orientation][size],
    variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      role={decorative ? "presentation" : "separator"}
      aria-orientation={orientation}
      data-orientation={orientation}
    />
  );
};
