import React from "react";
import { X, CheckCircle, AlertCircle, Info, XCircle } from "lucide-react";

export interface AlertProps {
  title?: string;
  message?: string;
  children?: React.ReactNode;
  type?: "info" | "success" | "warning" | "error";
  variant?: "filled" | "outlined" | "subtle";
  showIcon?: boolean;
  showCloseButton?: boolean;
  onClose?: () => void;
  className?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  title,
  message,
  children,
  type = "info",
  variant = "filled",
  showIcon = true,
  showCloseButton = false,
  onClose,
  className = "",
  icon,
  actions,
}) => {
  const getIcon = () => {
    if (icon) return icon;
    if (!showIcon) return null;

    const iconClasses = "w-5 h-5 flex-shrink-0";
    switch (type) {
      case "success":
        return <CheckCircle className={`${iconClasses} text-green-600 mr-2`} />;
      case "warning":
        return <AlertCircle className={`${iconClasses} text-amber-600 mr-2`} />;
      case "error":
        return <XCircle className={`${iconClasses} text-red-600 mr-2`} />;
      default:
        return <Info className={`${iconClasses} text-blue-600 mr-2`} />;
    }
  };

  const getVariantStyles = () => {
    const baseStyles = "rounded-lg border";

    switch (variant) {
      case "filled":
        switch (type) {
          case "success":
            return `${baseStyles} bg-green-50 border-green-200 text-green-800`;
          case "warning":
            return `${baseStyles} bg-amber-50 border-amber-200 text-amber-800`;
          case "error":
            return `${baseStyles} bg-red-50 border-red-200 text-red-800 !text-red-800`;
          default:
            return `${baseStyles} bg-blue-50 border-blue-200 text-blue-800`;
        }
      case "outlined":
        switch (type) {
          case "success":
            return `${baseStyles} bg-white border-green-300 text-green-800`;
          case "warning":
            return `${baseStyles} bg-white border-amber-300 text-amber-800`;
          case "error":
            return `${baseStyles} bg-white border-red-300 text-red-800`;
          default:
            return `${baseStyles} bg-white border-blue-300 text-blue-800`;
        }
      case "subtle":
        switch (type) {
          case "success":
            return `${baseStyles} bg-green-25 border-green-100 text-green-700`;
          case "warning":
            return `${baseStyles} bg-amber-25 border-amber-100 text-amber-700`;
          case "error":
            return `${baseStyles} bg-red-25 border-red-100 text-red-700`;
          default:
            return `${baseStyles} bg-blue-25 border-blue-100 text-blue-700`;
        }
      default:
        return `${baseStyles} bg-gray-50 border-gray-200 text-gray-800`;
    }
  };

  const content = children || message;

  return (
    <div
      className={`${getVariantStyles()} ${className}`}
      role="alert"
      aria-live="polite"
      style={{
        color: type === "error" ? "#dc2626 !important" : undefined,
        backgroundColor: type === "error" ? "#fef2f2" : undefined,
      }}
    >
      <div className="p-4">
        <div className="flex items-start space-x-3">
          {getIcon()}

          <div className="flex-1 min-w-0">
            {title && (
              <div
                className="text-sm font-medium mb-1"
                style={{ color: type === "error" ? "#dc2626" : undefined }}
              >
                {title}
              </div>
            )}
            {content && (
              <div
                className="text-sm opacity-90 leading-relaxed"
                style={{ color: type === "error" ? "#dc2626" : undefined }}
              >
                {content}
              </div>
            )}

            {actions && <div className="mt-3">{actions}</div>}
          </div>

          {showCloseButton && onClose && (
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:ring-offset-2"
              aria-label="Close alert"
            >
              <X size={16} className="opacity-60" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Alert;
