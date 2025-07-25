import React from "react";
import { useTranslation } from "../../contexts/TranslationContext";

// InfoCard Component
export interface InfoCardProps {
  title?: string;
  subtitle?: string;
  description?: string;
  icon?: React.ReactNode;
  image?: string;
  imageAlt?: string;
  badge?: React.ReactNode;
  children?: React.ReactNode;
  variant?: "default" | "bordered" | "elevated" | "flat";
  size?: "sm" | "md" | "lg";
  orientation?: "horizontal" | "vertical";
  className?: string;
  onClick?: () => void;
  href?: string;
}

const infoCardVariants = {
  default: "bg-white border border-gray-200 rounded-lg shadow-sm",
  bordered: "bg-white border-2 border-gray-300 rounded-lg",
  elevated: "bg-white border border-gray-200 rounded-lg shadow-lg",
  flat: "bg-gray-50 rounded-lg",
};

const infoCardSizes = {
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  subtitle,
  description,
  icon,
  image,
  imageAlt,
  badge,
  children,
  variant = "default",
  size = "md",
  orientation = "vertical",
  className = "",
  onClick,
  href,
}) => {
  const { t } = useTranslation();

  const cardClasses = [
    infoCardVariants[variant],
    infoCardSizes[size],
    "transition-all duration-200",
    onClick || href ? "cursor-pointer hover:shadow-md" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <div className={cardClasses} onClick={onClick}>
      <div
        className={`flex ${
          orientation === "horizontal" ? "flex-row space-x-4" : "flex-col"
        }`}
      >
        {(icon || image) && (
          <div
            className={`flex-shrink-0 ${
              orientation === "vertical" ? "mb-3" : ""
            }`}
          >
            {image ? (
              <img
                src={image}
                alt={imageAlt || ""}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                {icon}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {title && (
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
              )}
              {description && (
                <p className="text-sm text-gray-700 mt-2 line-clamp-3">
                  {description}
                </p>
              )}
            </div>
            {badge && <div className="ml-2 flex-shrink-0">{badge}</div>}
          </div>
          {children && <div className="mt-4">{children}</div>}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    );
  }

  return content;
};

// StatsCard Component
export interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label?: string;
    direction: "up" | "down" | "neutral";
  };
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  className?: string;
  onClick?: () => void;
}

const statsCardVariants = {
  default: "bg-white border border-gray-200",
  primary: "bg-blue-50 border border-blue-200",
  success: "bg-green-50 border border-green-200",
  warning: "bg-yellow-50 border border-yellow-200",
  danger: "bg-red-50 border border-red-200",
};

const statsCardSizes = {
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

const TrendIcon: React.FC<{ direction: "up" | "down" | "neutral" }> = ({
  direction,
}) => {
  const icons = {
    up: (
      <svg
        className="w-4 h-4 text-green-500"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z"
          clipRule="evenodd"
        />
      </svg>
    ),
    down: (
      <svg
        className="w-4 h-4 text-red-500"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 112 0v11.586l2.293-2.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
    ),
    neutral: (
      <svg
        className="w-4 h-4 text-gray-500"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
          clipRule="evenodd"
        />
      </svg>
    ),
  };

  return icons[direction];
};

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = "default",
  size = "md",
  loading = false,
  className = "",
  onClick,
}) => {
  const { t } = useTranslation();

  const cardClasses = [
    statsCardVariants[variant],
    statsCardSizes[size],
    "rounded-lg transition-all duration-200",
    onClick ? "cursor-pointer hover:shadow-md" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const formatValue = (val: string | number) => {
    if (typeof val === "number") {
      return val.toLocaleString();
    }
    return val;
  };

  if (loading) {
    return (
      <div className={cardClasses}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cardClasses} onClick={onClick}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatValue(value)}
          </p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center mt-2">
              <TrendIcon direction={trend.direction} />
              <span
                className={`text-sm font-medium ml-1 ${
                  trend.direction === "up"
                    ? "text-green-600"
                    : trend.direction === "down"
                    ? "text-red-600"
                    : "text-gray-600"
                }`}
              >
                {trend.value}%
              </span>
              {trend.label && (
                <span className="text-xs text-gray-500 ml-1">
                  {trend.label}
                </span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 ml-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ActionCard Component
export interface ActionCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  image?: string;
  imageAlt?: string;
  actions: Array<{
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "outline" | "ghost";
    disabled?: boolean;
    loading?: boolean;
    icon?: React.ReactNode;
  }>;
  variant?: "default" | "bordered" | "elevated";
  size?: "sm" | "md" | "lg";
  orientation?: "horizontal" | "vertical";
  className?: string;
  disabled?: boolean;
}

const actionCardVariants = {
  default: "bg-white border border-gray-200 rounded-lg shadow-sm",
  bordered: "bg-white border-2 border-gray-300 rounded-lg",
  elevated: "bg-white border border-gray-200 rounded-lg shadow-lg",
};

const actionCardSizes = {
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

const ActionButton: React.FC<{
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}> = ({
  label,
  onClick,
  variant = "primary",
  disabled = false,
  loading = false,
  icon,
}) => {
  const buttonVariants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500",
    outline:
      "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500",
    ghost: "text-gray-700 hover:bg-gray-100 focus:ring-blue-500",
  };

  const buttonClasses = [
    "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
    buttonVariants[variant],
    disabled || loading ? "opacity-50 cursor-not-allowed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={buttonClasses}
    >
      {loading ? (
        <svg
          className="w-4 h-4 mr-2 animate-spin"
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
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {label}
    </button>
  );
};

export const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  icon,
  image,
  imageAlt,
  actions,
  variant = "default",
  size = "md",
  orientation = "vertical",
  className = "",
  disabled = false,
}) => {
  const { t } = useTranslation();

  const cardClasses = [
    actionCardVariants[variant],
    actionCardSizes[size],
    "transition-all duration-200",
    disabled ? "opacity-50 cursor-not-allowed" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardClasses}>
      <div
        className={`flex ${
          orientation === "horizontal"
            ? "flex-row items-center space-x-4"
            : "flex-col"
        }`}
      >
        {(icon || image) && (
          <div
            className={`flex-shrink-0 ${
              orientation === "vertical" ? "mb-3" : ""
            }`}
          >
            {image ? (
              <img
                src={image}
                alt={imageAlt || ""}
                className="w-12 h-12 rounded-lg object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                {icon}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600 mb-4">{description}</p>
          )}

          <div className="flex flex-wrap gap-2">
            {actions.map((action, index) => (
              <ActionButton
                key={index}
                label={action.label}
                onClick={action.onClick}
                variant={action.variant}
                disabled={disabled || action.disabled}
                loading={action.loading}
                icon={action.icon}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default { InfoCard, StatsCard, ActionCard };
