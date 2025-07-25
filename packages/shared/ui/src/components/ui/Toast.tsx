import React, { useEffect, useRef } from "react";
import { X, CheckCircle, AlertCircle, Info, XCircle } from "lucide-react";

export interface ToastProps {
  id?: string;
  title?: string;
  message: string;
  type?: "info" | "success" | "warning" | "error";
  duration?: number;
  persistent?: boolean;
  showIcon?: boolean;
  showCloseButton?: boolean;
  position?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "top-center"
    | "bottom-center";
  onClose?: (id?: string) => void;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  title,
  message,
  type = "info",
  duration = 5000,
  persistent = false,
  showIcon = true,
  showCloseButton = true,
  position = "top-right",
  onClose,
  onClick,
  className = "",
  icon,
  actions,
}) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const toastRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!persistent && duration > 0) {
      timerRef.current = setTimeout(() => {
        handleClose();
      }, duration);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [duration, persistent]);

  const handleClose = () => {
    if (onClose) {
      onClose(id);
    }
  };

  const handleMouseEnter = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  const handleMouseLeave = () => {
    if (!persistent && duration > 0) {
      timerRef.current = setTimeout(() => {
        handleClose();
      }, duration);
    }
  };

  const getIcon = () => {
    if (icon) return icon;
    if (!showIcon) return null;

    const iconClasses = "w-5 h-5 flex-shrink-0";
    switch (type) {
      case "success":
        return <CheckCircle className={`${iconClasses} text-green-500`} />;
      case "warning":
        return <AlertCircle className={`${iconClasses} text-amber-500`} />;
      case "error":
        return <XCircle className={`${iconClasses} text-red-500`} />;
      default:
        return <Info className={`${iconClasses} text-blue-500`} />;
    }
  };

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      case "warning":
        return "bg-amber-50 border-amber-200 text-amber-800";
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      default:
        return "bg-blue-50 border-blue-200 text-blue-800";
    }
  };

  const getPositionStyles = () => {
    switch (position) {
      case "top-left":
        return "top-4 left-4";
      case "top-right":
        return "top-4 right-4";
      case "bottom-left":
        return "bottom-4 left-4";
      case "bottom-right":
        return "bottom-4 right-4";
      case "top-center":
        return "top-4 left-1/2 transform -translate-x-1/2";
      case "bottom-center":
        return "bottom-4 left-1/2 transform -translate-x-1/2";
      default:
        return "top-4 right-4";
    }
  };

  return (
    <div
      ref={toastRef}
      className={`fixed z-50 max-w-sm w-full bg-white rounded-lg border shadow-lg transition-all duration-300 ease-in-out ${getTypeStyles()} ${getPositionStyles()} ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="p-4">
        <div className="flex items-start space-x-3">
          {getIcon()}

          <div className="flex-1 min-w-0">
            {title && <div className="text-sm font-medium mb-1">{title}</div>}
            <div className="text-sm opacity-90 leading-relaxed">{message}</div>

            {actions && <div className="mt-3">{actions}</div>}
          </div>

          {showCloseButton && (
            <button
              onClick={handleClose}
              className="flex-shrink-0 p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:ring-offset-2"
              aria-label="Close notification"
            >
              <X size={16} className="opacity-60" />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar for auto-dismiss */}
      {!persistent && duration > 0 && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-black bg-opacity-20 rounded-b-lg overflow-hidden">
          <div
            className="h-full bg-current opacity-50 transition-all ease-linear"
            style={{
              width: "0%",
              transitionDuration: `${duration}ms`,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Toast;
