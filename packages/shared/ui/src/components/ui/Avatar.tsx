"use client";

import React, { useState } from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import { User } from "lucide-react";

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  shape?: "circle" | "square";
  status?: "online" | "offline" | "away" | "busy";
  showStatus?: boolean;
  fallback?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  bordered?: boolean;
  loading?: boolean;
}

export interface AvatarGroupProps {
  children: React.ReactNode;
  max?: number;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  spacing?: "tight" | "normal" | "loose";
  className?: string;
  onOverflowClick?: () => void;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name,
  size = "md",
  shape = "circle",
  status,
  showStatus = false,
  fallback,
  className = "",
  onClick,
  bordered = false,
  loading = false,
}) => {
  const { t } = useTranslation();
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const getSizeClasses = () => {
    switch (size) {
      case "xs":
        return "w-6 h-6 text-xs";
      case "sm":
        return "w-8 h-8 text-sm";
      case "md":
        return "w-10 h-10 text-base";
      case "lg":
        return "w-12 h-12 text-lg";
      case "xl":
        return "w-16 h-16 text-xl";
      case "2xl":
        return "w-20 h-20 text-2xl";
      default:
        return "w-10 h-10 text-base";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "offline":
        return "bg-gray-400";
      case "away":
        return "bg-yellow-500";
      case "busy":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusSize = () => {
    switch (size) {
      case "xs":
        return "w-2 h-2";
      case "sm":
        return "w-2.5 h-2.5";
      case "md":
        return "w-3 h-3";
      case "lg":
        return "w-3.5 h-3.5";
      case "xl":
        return "w-4 h-4";
      case "2xl":
        return "w-5 h-5";
      default:
        return "w-3 h-3";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const showImage = src && !imageError;
  const showInitials = name && !showImage;
  const showFallback = !showImage && !showInitials;

  return (
    <div
      className={`
        relative inline-flex items-center justify-center
        ${getSizeClasses()}
        ${shape === "circle" ? "rounded-full" : "rounded-lg"}
        ${bordered ? "ring-2 ring-white ring-offset-1" : ""}
        ${onClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}
        ${loading || imageLoading ? "bg-gray-200 animate-pulse" : ""}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Image */}
      {showImage && (
        <img
          src={src}
          alt={alt || name || t("avatar.defaultAlt")}
          className={`
            w-full h-full object-cover
            ${shape === "circle" ? "rounded-full" : "rounded-lg"}
            ${imageLoading ? "opacity-0" : "opacity-100"}
            transition-opacity duration-200
          `}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      )}

      {/* Initials */}
      {showInitials && !loading && !imageLoading && (
        <span
          className={`
            font-medium text-white select-none
            ${shape === "circle" ? "rounded-full" : "rounded-lg"}
            bg-gradient-to-br from-blue-500 to-blue-600
            flex items-center justify-center w-full h-full
          `}
        >
          {getInitials(name!)}
        </span>
      )}

      {/* Fallback */}
      {showFallback && !loading && !imageLoading && (
        <div
          className={`
            bg-gray-100 text-gray-400 flex items-center justify-center w-full h-full
            ${shape === "circle" ? "rounded-full" : "rounded-lg"}
          `}
        >
          {fallback || <User className="w-1/2 h-1/2" />}
        </div>
      )}

      {/* Status indicator */}
      {showStatus && status && (
        <div
          className={`
            absolute bottom-0 right-0 transform translate-x-1/4 translate-y-1/4
            ${getStatusSize()}
            ${getStatusColor()}
            rounded-full ring-2 ring-white
          `}
          title={t(`avatar.status.${status}`)}
        />
      )}
    </div>
  );
};

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  children,
  max = 5,
  size = "md",
  spacing = "normal",
  className = "",
  onOverflowClick,
}) => {
  const { t } = useTranslation();
  const childrenArray = React.Children.toArray(children);
  const visibleChildren = childrenArray.slice(0, max);
  const overflowCount = childrenArray.length - max;

  const getSpacingClasses = () => {
    switch (spacing) {
      case "tight":
        return "-space-x-1";
      case "normal":
        return "-space-x-2";
      case "loose":
        return "-space-x-3";
      default:
        return "-space-x-2";
    }
  };

  return (
    <div className={`flex items-center ${getSpacingClasses()} ${className}`}>
      {visibleChildren.map((child, index) => (
        <div
          key={index}
          className="relative ring-2 ring-white rounded-full"
          style={{ zIndex: visibleChildren.length - index }}
        >
          {React.cloneElement(child as React.ReactElement, {
            size,
            bordered: false,
          })}
        </div>
      ))}

      {overflowCount > 0 && (
        <div
          className={`
            relative ring-2 ring-white rounded-full
            ${(() => {
              switch (size) {
                case "xs":
                  return "w-6 h-6 text-xs";
                case "sm":
                  return "w-8 h-8 text-sm";
                case "md":
                  return "w-10 h-10 text-base";
                case "lg":
                  return "w-12 h-12 text-lg";
                case "xl":
                  return "w-16 h-16 text-xl";
                case "2xl":
                  return "w-20 h-20 text-2xl";
                default:
                  return "w-10 h-10 text-base";
              }
            })()}
            bg-gray-100 text-gray-600 font-medium
            flex items-center justify-center
            ${
              onOverflowClick
                ? "cursor-pointer hover:bg-gray-200 transition-colors"
                : ""
            }
          `}
          onClick={onOverflowClick}
          role={onOverflowClick ? "button" : undefined}
          tabIndex={onOverflowClick ? 0 : undefined}
          title={t("avatar.moreUsers", { count: overflowCount })}
        >
          +{overflowCount}
        </div>
      )}
    </div>
  );
};

export default Avatar;
