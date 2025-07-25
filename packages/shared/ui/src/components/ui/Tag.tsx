"use client";

import React from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import { X, Hash } from "lucide-react";

export interface TagProps {
  children: React.ReactNode;
  variant?: "default" | "filled" | "outlined" | "subtle";
  color?:
    | "blue"
    | "green"
    | "yellow"
    | "red"
    | "purple"
    | "pink"
    | "gray"
    | "indigo"
    | "teal";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  prefix?: string;
  removable?: boolean;
  selected?: boolean;
  disabled?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
}

export interface TagGroupProps {
  children: React.ReactNode;
  spacing?: "tight" | "normal" | "loose";
  wrap?: boolean;
  className?: string;
}

export const Tag: React.FC<TagProps> = ({
  children,
  variant = "default",
  color = "blue",
  size = "md",
  icon,
  prefix,
  removable = false,
  selected = false,
  disabled = false,
  clickable = false,
  onClick,
  onRemove,
  className = "",
}) => {
  const { t } = useTranslation();

  const getColorClasses = () => {
    const colors = {
      blue: {
        filled: "bg-blue-500 text-white border-blue-500",
        outlined: "bg-transparent text-blue-600 border-blue-300",
        subtle: "bg-blue-50 text-blue-700 border-blue-200",
        default: "bg-blue-100 text-blue-800 border-blue-200",
      },
      green: {
        filled: "bg-green-500 text-white border-green-500",
        outlined: "bg-transparent text-green-600 border-green-300",
        subtle: "bg-green-50 text-green-700 border-green-200",
        default: "bg-green-100 text-green-800 border-green-200",
      },
      yellow: {
        filled: "bg-yellow-500 text-white border-yellow-500",
        outlined: "bg-transparent text-yellow-600 border-yellow-300",
        subtle: "bg-yellow-50 text-yellow-700 border-yellow-200",
        default: "bg-yellow-100 text-yellow-800 border-yellow-200",
      },
      red: {
        filled: "bg-red-500 text-white border-red-500",
        outlined: "bg-transparent text-red-600 border-red-300",
        subtle: "bg-red-50 text-red-700 border-red-200",
        default: "bg-red-100 text-red-800 border-red-200",
      },
      purple: {
        filled: "bg-purple-500 text-white border-purple-500",
        outlined: "bg-transparent text-purple-600 border-purple-300",
        subtle: "bg-purple-50 text-purple-700 border-purple-200",
        default: "bg-purple-100 text-purple-800 border-purple-200",
      },
      pink: {
        filled: "bg-pink-500 text-white border-pink-500",
        outlined: "bg-transparent text-pink-600 border-pink-300",
        subtle: "bg-pink-50 text-pink-700 border-pink-200",
        default: "bg-pink-100 text-pink-800 border-pink-200",
      },
      gray: {
        filled: "bg-gray-500 text-white border-gray-500",
        outlined: "bg-transparent text-gray-600 border-gray-300",
        subtle: "bg-gray-50 text-gray-700 border-gray-200",
        default: "bg-gray-100 text-gray-800 border-gray-200",
      },
      indigo: {
        filled: "bg-indigo-500 text-white border-indigo-500",
        outlined: "bg-transparent text-indigo-600 border-indigo-300",
        subtle: "bg-indigo-50 text-indigo-700 border-indigo-200",
        default: "bg-indigo-100 text-indigo-800 border-indigo-200",
      },
      teal: {
        filled: "bg-teal-500 text-white border-teal-500",
        outlined: "bg-transparent text-teal-600 border-teal-300",
        subtle: "bg-teal-50 text-teal-700 border-teal-200",
        default: "bg-teal-100 text-teal-800 border-teal-200",
      },
    };

    return colors[color][variant];
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

  const getIconSize = () => {
    switch (size) {
      case "sm":
        return "w-3 h-3";
      case "md":
        return "w-4 h-4";
      case "lg":
        return "w-5 h-5";
      default:
        return "w-4 h-4";
    }
  };

  const baseClasses = `
    inline-flex items-center font-medium border rounded-full
    ${getColorClasses()}
    ${getSizeClasses()}
    ${selected ? "ring-2 ring-offset-1 ring-blue-500" : ""}
    ${disabled ? "opacity-50 cursor-not-allowed" : ""}
    ${
      clickable && !disabled
        ? "cursor-pointer hover:opacity-80 transition-all duration-200"
        : ""
    }
    ${clickable && !disabled ? "hover:shadow-sm" : ""}
  `;

  const content = (
    <>
      {prefix && <span className="mr-1 opacity-75">{prefix}</span>}
      {icon && (
        <div className={`${getIconSize()} mr-1.5 flex-shrink-0`}>{icon}</div>
      )}
      <span className="truncate">{children}</span>
      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="ml-1.5 text-current hover:text-opacity-70 transition-colors rounded-full hover:bg-black hover:bg-opacity-10 p-0.5"
          aria-label={t("tag.remove")}
          disabled={disabled}
        >
          <X className={`${size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"}`} />
        </button>
      )}
    </>
  );

  if (clickable && !disabled) {
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

export const TagGroup: React.FC<TagGroupProps> = ({
  children,
  spacing = "normal",
  wrap = true,
  className = "",
}) => {
  const getSpacingClasses = () => {
    switch (spacing) {
      case "tight":
        return "gap-1";
      case "normal":
        return "gap-2";
      case "loose":
        return "gap-3";
      default:
        return "gap-2";
    }
  };

  return (
    <div
      className={`
      flex items-center
      ${wrap ? "flex-wrap" : ""}
      ${getSpacingClasses()}
      ${className}
    `}
    >
      {children}
    </div>
  );
};

export default Tag;
