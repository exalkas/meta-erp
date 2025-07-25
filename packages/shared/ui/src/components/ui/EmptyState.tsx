"use client";

import React from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import {
  Package,
  Search,
  Users,
  FileText,
  Plus,
  RefreshCw,
  AlertCircle,
  Inbox,
} from "lucide-react";

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "outline";
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  illustration?: React.ReactNode;
  actions?: EmptyStateAction[];
  size?: "sm" | "md" | "lg";
  className?: string;
  variant?: "default" | "error" | "search" | "loading";
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  illustration,
  actions = [],
  size = "md",
  className = "",
  variant = "default",
}) => {
  const { t } = useTranslation();

  const getDefaultIcon = () => {
    switch (variant) {
      case "error":
        return <AlertCircle className="w-12 h-12 text-red-400" />;
      case "search":
        return <Search className="w-12 h-12 text-gray-400" />;
      case "loading":
        return <RefreshCw className="w-12 h-12 text-gray-400 animate-spin" />;
      default:
        return <Inbox className="w-12 h-12 text-gray-400" />;
    }
  };

  const getDefaultTitle = () => {
    switch (variant) {
      case "error":
        return t("emptyState.error.title");
      case "search":
        return t("emptyState.search.title");
      case "loading":
        return t("emptyState.loading.title");
      default:
        return t("emptyState.default.title");
    }
  };

  const getDefaultDescription = () => {
    switch (variant) {
      case "error":
        return t("emptyState.error.description");
      case "search":
        return t("emptyState.search.description");
      case "loading":
        return t("emptyState.loading.description");
      default:
        return t("emptyState.default.description");
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return {
          container: "py-6",
          icon: "w-8 h-8",
          title: "text-sm",
          description: "text-xs",
          spacing: "space-y-2",
        };
      case "md":
        return {
          container: "py-12",
          icon: "w-12 h-12",
          title: "text-lg",
          description: "text-sm",
          spacing: "space-y-4",
        };
      case "lg":
        return {
          container: "py-16",
          icon: "w-16 h-16",
          title: "text-xl",
          description: "text-base",
          spacing: "space-y-6",
        };
      default:
        return {
          container: "py-12",
          icon: "w-12 h-12",
          title: "text-lg",
          description: "text-sm",
          spacing: "space-y-4",
        };
    }
  };

  const getButtonVariantClasses = (variant: EmptyStateAction["variant"]) => {
    switch (variant) {
      case "primary":
        return "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500";
      case "secondary":
        return "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500";
      case "outline":
        return "bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500";
      default:
        return "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500";
    }
  };

  const sizeClasses = getSizeClasses();
  const displayTitle = title || getDefaultTitle();
  const displayDescription = description || getDefaultDescription();
  const displayIcon = icon || illustration || getDefaultIcon();

  return (
    <div
      className={`
      text-center
      ${sizeClasses.container}
      ${className}
    `}
    >
      <div className={`flex flex-col items-center ${sizeClasses.spacing}`}>
        {/* Icon/Illustration */}
        <div className="flex-shrink-0">
          {React.isValidElement(displayIcon)
            ? React.cloneElement(displayIcon as React.ReactElement, {
                className: `${sizeClasses.icon} ${
                  (displayIcon as React.ReactElement).props.className || ""
                }`,
              })
            : displayIcon}
        </div>

        {/* Text Content */}
        <div className="text-center space-y-2">
          <h3
            className={`font-semibold text-gray-900 dark:text-white ${sizeClasses.title}`}
          >
            {displayTitle}
          </h3>
          {displayDescription && (
            <p
              className={`text-gray-500 dark:text-gray-400 max-w-md ${sizeClasses.description}`}
            >
              {displayDescription}
            </p>
          )}
        </div>

        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                disabled={action.disabled}
                className={`
                  inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md
                  focus:outline-none focus:ring-2 focus:ring-offset-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors duration-200
                  ${getButtonVariantClasses(action.variant)}
                `}
              >
                {action.icon && (
                  <div className="w-4 h-4 mr-2">{action.icon}</div>
                )}
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Pre-built empty state variations
export const NoDataEmptyState: React.FC<Omit<EmptyStateProps, "icon">> = (
  props
) => (
  <EmptyState
    icon={<Package className="w-12 h-12 text-gray-400" />}
    {...props}
  />
);

export const SearchEmptyState: React.FC<
  Omit<EmptyStateProps, "icon" | "variant">
> = (props) => <EmptyState variant="search" {...props} />;

export const ErrorEmptyState: React.FC<
  Omit<EmptyStateProps, "icon" | "variant">
> = (props) => <EmptyState variant="error" {...props} />;

export const LoadingEmptyState: React.FC<
  Omit<EmptyStateProps, "icon" | "variant">
> = (props) => <EmptyState variant="loading" {...props} />;

export const NoUsersEmptyState: React.FC<Omit<EmptyStateProps, "icon">> = (
  props
) => (
  <EmptyState icon={<Users className="w-12 h-12 text-gray-400" />} {...props} />
);

export const NoFilesEmptyState: React.FC<Omit<EmptyStateProps, "icon">> = (
  props
) => (
  <EmptyState
    icon={<FileText className="w-12 h-12 text-gray-400" />}
    {...props}
  />
);

export default EmptyState;
