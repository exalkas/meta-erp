import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

export interface DrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  position?: "left" | "right" | "top" | "bottom";
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  preventClose?: boolean;
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
  headerClassName?: string;
  zIndex?: number;
  animationDuration?: number;
  headerActions?: React.ReactNode;
}

export const DrawerModal: React.FC<DrawerModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  position = "right",
  size = "md",
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  preventClose = false,
  className = "",
  overlayClassName = "",
  contentClassName = "",
  headerClassName = "",
  zIndex = 1000,
  animationDuration = 300,
  headerActions,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape && !preventClose) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.body.style.overflow = "hidden";

      setTimeout(() => {
        drawerRef.current?.focus();
      }, 100);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      if (isOpen) {
        document.body.style.overflow = "";
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      }
    };
  }, [isOpen, closeOnEscape, preventClose, onClose]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (!preventClose) {
      onClose();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick && !preventClose) {
      onClose();
    }
  };

  const getSizeClasses = () => {
    const isVertical = position === "top" || position === "bottom";

    if (isVertical) {
      switch (size) {
        case "sm":
          return "h-1/4";
        case "md":
          return "h-1/2";
        case "lg":
          return "h-3/4";
        case "xl":
          return "h-5/6";
        case "full":
          return "h-full";
        default:
          return "h-1/2";
      }
    } else {
      switch (size) {
        case "sm":
          return "w-80";
        case "md":
          return "w-96";
        case "lg":
          return "w-1/2";
        case "xl":
          return "w-2/3";
        case "full":
          return "w-full";
        default:
          return "w-96";
      }
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case "left":
        return "left-0 top-0 h-full";
      case "right":
        return "right-0 top-0 h-full";
      case "top":
        return "top-0 left-0 w-full";
      case "bottom":
        return "bottom-0 left-0 w-full";
      default:
        return "right-0 top-0 h-full";
    }
  };

  const getTransformClasses = () => {
    switch (position) {
      case "left":
        return "translate-x-0";
      case "right":
        return "translate-x-0";
      case "top":
        return "translate-y-0";
      case "bottom":
        return "translate-y-0";
      default:
        return "translate-x-0";
    }
  };

  return (
    <div
      className={`fixed inset-0 ${overlayClassName}`}
      style={{ zIndex }}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "drawer-title" : undefined}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        style={{ animationDuration: `${animationDuration}ms` }}
      />

      {/* Drawer Content */}
      <div
        ref={drawerRef}
        className={`absolute bg-white shadow-2xl transition-transform transform ${getPositionClasses()} ${getSizeClasses()} ${getTransformClasses()} ${contentClassName} ${className}`}
        style={{ animationDuration: `${animationDuration}ms` }}
        tabIndex={-1}
        role="document"
      >
        {/* Header */}
        {(title || showCloseButton || headerActions) && (
          <div
            className={`flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 ${headerClassName}`}
          >
            <div className="flex items-center space-x-4">
              {title && (
                <h2
                  id="drawer-title"
                  className="text-lg font-semibold text-gray-900"
                >
                  {title}
                </h2>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {headerActions}

              {showCloseButton && !preventClose && (
                <button
                  onClick={handleClose}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:ring-offset-2"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div
          className={`flex-1 overflow-y-auto ${
            position === "top" || position === "bottom"
              ? "h-[calc(100%-4rem)]"
              : "h-[calc(100vh-4rem)]"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default DrawerModal;
