"use client";

import React from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import { X } from "lucide-react";

export interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "error"
    | "info"
    | "outline";
  size?: "sm" | "md" | "lg";
  shape?: "rounded" | "pill" | "square";
  dot?: boolean;
  icon?: React.ReactNode;
  removable?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
  disabled?: boolean;
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "md",
  shape = "rounded",
  dot = false,
  icon,
  removable = false,
  onClick,
  onRemove,
  className = "",
  disabled = false,
  pulse = false,
}) => {
  const { t } = useTranslation();

  const getVariantClasses = () => {
    switch (variant) {
      case "primary":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "secondary":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "success":
        return "bg-green-100 text-green-800 border-green-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "error":
        return "bg-red-100 text-red-800 border-red-200";
      case "info":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "outline":
        return "bg-transparent text-gray-600 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "px-2 py-0.5 text-xs";
      case "md":
        return "px-2.5 py-1 text-sm";
      case "lg":
        return "px-3 py-1.5 text-base";
      default:
        return "px-2.5 py-1 text-sm";
    }
  };

  const getShapeClasses = () => {
    switch (shape) {
      case "pill":
        return "rounded-full";
      case "square":
        return "rounded-none";
      case "rounded":
      default:
        return "rounded-md";
    }
  };

  const getDotClasses = () => {
    if (!dot) return "";

    switch (size) {
      case "sm":
        return "w-2 h-2";
      case "md":
        return "w-2.5 h-2.5";
      case "lg":
        return "w-3 h-3";
      default:
        return "w-2.5 h-2.5";
    }
  };

  const getDotColor = () => {
    switch (variant) {
      case "primary":
        return "bg-blue-500";
      case "secondary":
        return "bg-gray-500";
      case "success":
        return "bg-green-500";
      case "warning":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      case "info":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const baseClasses = `
    inline-flex items-center font-medium border
    ${getVariantClasses()}
    ${getSizeClasses()}
    ${getShapeClasses()}
    ${
      onClick && !disabled
        ? "cursor-pointer hover:opacity-80 transition-opacity"
        : ""
    }
    ${disabled ? "opacity-50 cursor-not-allowed" : ""}
    ${pulse ? "animate-pulse" : ""}
  `;

  const content = (
    <>
      {dot && (
        <div
          className={`${getDotClasses()} ${getDotColor()} rounded-full mr-1.5`}
        />
      )}
      {icon && !dot && (
        <div className="w-4 h-4 mr-1.5 flex-shrink-0">{icon}</div>
      )}
      <span className="truncate">{children}</span>
      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="ml-1.5 text-current hover:text-opacity-70 transition-colors"
          aria-label={t("badge.remove")}
          disabled={disabled}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </>
  );

  if (onClick && !disabled) {
    return (
      <button
        onClick={onClick}
        className={`${baseClasses} ${className}`}
        disabled={disabled}
      >
        {content}
      </button>
    );
  }

  return <span className={`${baseClasses} ${className}`}>{content}</span>;
};

export default Badge;
