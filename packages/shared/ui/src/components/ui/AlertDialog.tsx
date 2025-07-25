import React from "react";
import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";

export interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  buttonText?: string;
  type?: "info" | "warning" | "error" | "success";
  icon?: React.ReactNode;
  showIcon?: boolean;
  preventClose?: boolean;
  className?: string;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  onClose,
  title,
  message,
  buttonText = "OK",
  type = "info",
  icon,
  showIcon = true,
  preventClose = false,
  className = "",
  autoClose = false,
  autoCloseDelay = 3000,
}) => {
  React.useEffect(() => {
    if (autoClose && isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoClose, isOpen, onClose, autoCloseDelay]);

  const getIcon = () => {
    if (icon) return icon;
    if (!showIcon) return null;

    const iconClasses = "w-6 h-6";
    switch (type) {
      case "warning":
        return <AlertCircle className={`${iconClasses} text-amber-500`} />;
      case "error":
        return <XCircle className={`${iconClasses} text-red-500`} />;
      case "success":
        return <CheckCircle className={`${iconClasses} text-green-500`} />;
      default:
        return <Info className={`${iconClasses} text-blue-500`} />;
    }
  };

  const getButtonVariant = () => {
    switch (type) {
      case "error":
        return "destructive";
      case "success":
        return "success";
      case "warning":
        return "primary";
      default:
        return "primary";
    }
  };

  const getTitle = () => {
    if (title) return title;

    switch (type) {
      case "warning":
        return "Warning";
      case "error":
        return "Error";
      case "success":
        return "Success";
      default:
        return "Information";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      size="sm"
      className={className}
      preventClose={preventClose}
      showCloseButton={!preventClose}
    >
      <div className="p-6">
        <div className="flex items-start space-x-4">
          {getIcon()}
          <div className="flex-1">
            <p className="text-gray-900 text-sm leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Button
            variant={getButtonVariant()}
            onClick={onClose}
            className="min-w-[80px]"
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AlertDialog;
