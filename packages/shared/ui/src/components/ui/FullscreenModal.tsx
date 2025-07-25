import React, { useEffect } from "react";
import { X, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "./Button";

export interface FullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  showMinimizeButton?: boolean;
  closeOnEscape?: boolean;
  preventClose?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  zIndex?: number;
  headerActions?: React.ReactNode;
  onMinimize?: () => void;
  isMinimized?: boolean;
}

export const FullscreenModal: React.FC<FullscreenModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
  showMinimizeButton = false,
  closeOnEscape = true,
  preventClose = false,
  className = "",
  headerClassName = "",
  contentClassName = "",
  zIndex = 1000,
  headerActions,
  onMinimize,
  isMinimized = false,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape && !preventClose) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      if (isOpen) {
        document.body.style.overflow = "";
      }
    };
  }, [isOpen, closeOnEscape, preventClose, onClose]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (!preventClose) {
      onClose();
    }
  };

  const handleMinimize = () => {
    if (onMinimize) {
      onMinimize();
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-white ${className} ${
        isMinimized ? "bottom-auto h-12" : ""
      }`}
      style={{ zIndex }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "fullscreen-modal-title" : undefined}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 ${headerClassName}`}
      >
        <div className="flex items-center space-x-4">
          {title && (
            <h2
              id="fullscreen-modal-title"
              className="text-xl font-semibold text-gray-900"
            >
              {title}
            </h2>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {headerActions}

          {showMinimizeButton && onMinimize && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMinimize}
              className="p-2"
              aria-label={isMinimized ? "Maximize" : "Minimize"}
            >
              {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </Button>
          )}

          {showCloseButton && !preventClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="p-2"
              aria-label="Close"
            >
              <X size={16} />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div
          className={`flex-1 overflow-y-auto h-[calc(100vh-4rem)] ${contentClassName}`}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default FullscreenModal;
