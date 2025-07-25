import React from "react";
import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?:
    | "primary"
    | "destructive"
    | "success"
    | "outline"
    | "secondary"
    | "ghost";
  type?: "info" | "warning" | "error" | "success";
  icon?: React.ReactNode;
  showIcon?: boolean;
  isLoading?: boolean;
  preventClose?: boolean;
  className?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "primary",
  type = "info",
  icon,
  showIcon = true,
  isLoading = false,
  preventClose = false,
  className = "",
}) => {
  const handleConfirm = () => {
    onConfirm();
    if (!preventClose) {
      onClose();
    }
  };

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

  const getConfirmVariant = () => {
    if (confirmVariant !== "primary") return confirmVariant;

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
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

        <div className="flex justify-end space-x-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="min-w-[80px]"
          >
            {cancelText}
          </Button>
          <Button
            variant={getConfirmVariant()}
            onClick={handleConfirm}
            disabled={isLoading}
            loading={isLoading}
            className="min-w-[80px]"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
