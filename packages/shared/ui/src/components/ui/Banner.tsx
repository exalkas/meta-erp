import React from "react";
import {
  X,
  CheckCircle,
  AlertCircle,
  Info,
  XCircle,
  ChevronRight,
} from "lucide-react";

export interface BannerProps {
  title?: string;
  message: string;
  type?: "info" | "success" | "warning" | "error" | "announcement";
  position?: "top" | "bottom";
  showIcon?: boolean;
  showCloseButton?: boolean;
  onClose?: () => void;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  linkText?: string;
  linkHref?: string;
  onLinkClick?: () => void;
  sticky?: boolean;
  fullWidth?: boolean;
}

export const Banner: React.FC<BannerProps> = ({
  title,
  message,
  type = "info",
  position = "top",
  showIcon = true,
  showCloseButton = true,
  onClose,
  onClick,
  className = "",
  icon,
  actions,
  linkText,
  linkHref,
  onLinkClick,
  sticky = false,
  fullWidth = true,
}) => {
  const getIcon = () => {
    if (icon) return icon;
    if (!showIcon) return null;

    const iconClasses = "w-5 h-5 flex-shrink-0";
    switch (type) {
      case "success":
        return <CheckCircle className={`${iconClasses} text-white`} />;
      case "warning":
        return <AlertCircle className={`${iconClasses} text-white`} />;
      case "error":
        return <XCircle className={`${iconClasses} text-white`} />;
      case "announcement":
        return <Info className={`${iconClasses} text-white`} />;
      default:
        return <Info className={`${iconClasses} text-white`} />;
    }
  };

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return "bg-green-600 border-green-700 text-white";
      case "warning":
        return "bg-amber-600 border-amber-700 text-white";
      case "error":
        return "bg-red-600 border-red-700 text-white";
      case "announcement":
        return "bg-[#0066CC] border-[#0052A3] text-white";
      default:
        return "bg-blue-600 border-blue-700 text-white";
    }
  };

  const getPositionStyles = () => {
    const baseStyles = sticky ? "sticky" : "relative";
    const positionClass = position === "top" ? "top-0" : "bottom-0";
    const widthClass = fullWidth ? "w-full" : "max-w-7xl mx-auto";

    return `${baseStyles} ${positionClass} ${widthClass} z-40`;
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    if (onLinkClick) {
      e.preventDefault();
      onLinkClick();
    }
  };

  const handleBannerClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      className={`${getPositionStyles()} ${getTypeStyles()} border-b ${className}`}
      role="banner"
      aria-live="polite"
    >
      <div className="px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div
            className={`flex items-center space-x-3 flex-1 ${
              onClick ? "cursor-pointer" : ""
            }`}
            onClick={handleBannerClick}
          >
            {getIcon()}

            <div className="flex-1 min-w-0">
              {title && <div className="text-sm font-medium mb-1">{title}</div>}
              <div className="text-sm opacity-90 leading-relaxed">
                {message}
              </div>
            </div>

            {(linkText || linkHref) && (
              <a
                href={linkHref}
                onClick={handleLinkClick}
                className="flex items-center space-x-1 text-sm font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-current rounded px-2 py-1"
              >
                <span>{linkText || "Learn more"}</span>
                <ChevronRight size={16} />
              </a>
            )}
          </div>

          <div className="flex items-center space-x-2 ml-4">
            {actions}

            {showCloseButton && onClose && (
              <button
                onClick={onClose}
                className="flex-shrink-0 p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-current"
                aria-label="Close banner"
              >
                <X size={16} className="text-white" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banner;
