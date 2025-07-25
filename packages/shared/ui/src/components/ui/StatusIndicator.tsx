import React from "react";
import {
  CheckCircle,
  AlertCircle,
  Info,
  XCircle,
  Clock,
  Loader2,
  Circle,
  Minus,
  Pause,
  Play,
} from "lucide-react";

export interface StatusIndicatorProps {
  status:
    | "success"
    | "warning"
    | "error"
    | "info"
    | "pending"
    | "loading"
    | "neutral"
    | "inactive"
    | "paused"
    | "active";
  size?: "sm" | "md" | "lg";
  variant?: "dot" | "icon" | "text" | "badge";
  label?: string;
  showLabel?: boolean;
  customIcon?: React.ReactNode;
  className?: string;
  animate?: boolean;
  onClick?: () => void;
  tooltip?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = "md",
  variant = "dot",
  label,
  showLabel = true,
  customIcon,
  className = "",
  animate = false,
  onClick,
  tooltip,
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return {
          dot: "w-2 h-2",
          icon: "w-3 h-3",
          text: "text-xs",
          badge: "px-2 py-1 text-xs",
        };
      case "lg":
        return {
          dot: "w-4 h-4",
          icon: "w-5 h-5",
          text: "text-base",
          badge: "px-3 py-2 text-sm",
        };
      default: // md
        return {
          dot: "w-3 h-3",
          icon: "w-4 h-4",
          text: "text-sm",
          badge: "px-2.5 py-1.5 text-xs",
        };
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case "success":
        return {
          color: "bg-green-500",
          textColor: "text-green-700",
          badgeColor: "bg-green-100 text-green-800 border-green-200",
          icon: CheckCircle,
          label: label || "Success",
        };
      case "warning":
        return {
          color: "bg-amber-500",
          textColor: "text-amber-700",
          badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
          icon: AlertCircle,
          label: label || "Warning",
        };
      case "error":
        return {
          color: "bg-red-500",
          textColor: "text-red-700",
          badgeColor: "bg-red-100 text-red-800 border-red-200",
          icon: XCircle,
          label: label || "Error",
        };
      case "info":
        return {
          color: "bg-blue-500",
          textColor: "text-blue-700",
          badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
          icon: Info,
          label: label || "Info",
        };
      case "pending":
        return {
          color: "bg-amber-400",
          textColor: "text-amber-600",
          badgeColor: "bg-amber-100 text-amber-700 border-amber-200",
          icon: Clock,
          label: label || "Pending",
        };
      case "loading":
        return {
          color: "bg-blue-400",
          textColor: "text-blue-600",
          badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
          icon: Loader2,
          label: label || "Loading",
        };
      case "neutral":
        return {
          color: "bg-gray-400",
          textColor: "text-gray-600",
          badgeColor: "bg-gray-100 text-gray-700 border-gray-200",
          icon: Minus,
          label: label || "Neutral",
        };
      case "inactive":
        return {
          color: "bg-gray-300",
          textColor: "text-gray-500",
          badgeColor: "bg-gray-100 text-gray-600 border-gray-200",
          icon: Circle,
          label: label || "Inactive",
        };
      case "paused":
        return {
          color: "bg-yellow-500",
          textColor: "text-yellow-700",
          badgeColor: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: Pause,
          label: label || "Paused",
        };
      case "active":
        return {
          color: "bg-green-400",
          textColor: "text-green-600",
          badgeColor: "bg-green-100 text-green-700 border-green-200",
          icon: Play,
          label: label || "Active",
        };
      default:
        return {
          color: "bg-gray-400",
          textColor: "text-gray-600",
          badgeColor: "bg-gray-100 text-gray-700 border-gray-200",
          icon: Circle,
          label: label || "Unknown",
        };
    }
  };

  const sizeClasses = getSizeClasses();
  const statusConfig = getStatusConfig();
  const IconComponent = customIcon || statusConfig.icon;

  const getAnimationClasses = () => {
    if (!animate) return "";

    switch (status) {
      case "loading":
        return "animate-spin";
      case "pending":
        return "animate-pulse";
      case "active":
        return "animate-pulse";
      default:
        return "";
    }
  };

  const renderDot = () => (
    <div
      className={`rounded-full ${statusConfig.color} ${
        sizeClasses.dot
      } ${getAnimationClasses()} ${className}`}
      title={tooltip || statusConfig.label}
    />
  );

  const renderIcon = () => {
    const IconElement = IconComponent as React.ComponentType<any>;
    return (
      <IconElement
        className={`${statusConfig.textColor} ${
          sizeClasses.icon
        } ${getAnimationClasses()} ${className}`}
        title={tooltip || statusConfig.label}
      />
    );
  };

  const renderText = () => (
    <span
      className={`font-medium ${statusConfig.textColor} ${sizeClasses.text} ${className}`}
      title={tooltip}
    >
      {statusConfig.label}
    </span>
  );

  const renderBadge = () => (
    <span
      className={`inline-flex items-center space-x-1 rounded-full border font-medium ${statusConfig.badgeColor} ${sizeClasses.badge} ${className}`}
      title={tooltip}
    >
      {variant === "badge" && customIcon ? (
        <span className={`${sizeClasses.icon} ${getAnimationClasses()}`}>
          {customIcon}
        </span>
      ) : (
        <div
          className={`rounded-full ${statusConfig.color} ${
            sizeClasses.dot
          } ${getAnimationClasses()}`}
        />
      )}
      {showLabel && <span>{statusConfig.label}</span>}
    </span>
  );

  const content = (() => {
    switch (variant) {
      case "icon":
        return renderIcon();
      case "text":
        return renderText();
      case "badge":
        return renderBadge();
      default: // dot
        return renderDot();
    }
  })();

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:ring-offset-2 rounded-full ${
          variant === "badge" ? "focus:ring-offset-0" : ""
        }`}
        title={tooltip || statusConfig.label}
      >
        {content}
      </button>
    );
  }

  return (
    <div className="inline-flex items-center space-x-2">
      {content}
      {showLabel && variant !== "text" && variant !== "badge" && (
        <span
          className={`${statusConfig.textColor} ${sizeClasses.text} ${className}`}
        >
          {statusConfig.label}
        </span>
      )}
    </div>
  );
};

export default StatusIndicator;
