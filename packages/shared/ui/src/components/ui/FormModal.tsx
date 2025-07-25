import React from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

export interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  title: string;
  children: React.ReactNode;
  submitText?: string;
  cancelText?: string;
  submitVariant?:
    | "primary"
    | "destructive"
    | "success"
    | "outline"
    | "secondary"
    | "ghost";
  size?: "sm" | "md" | "lg" | "xl" | "full";
  isLoading?: boolean;
  isSubmitDisabled?: boolean;
  preventClose?: boolean;
  className?: string;
  formClassName?: string;
  footerClassName?: string;
  showFooter?: boolean;
  customFooter?: React.ReactNode;
  formId?: string;
}

export const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  children,
  submitText = "Submit",
  cancelText = "Cancel",
  submitVariant = "primary",
  size = "md",
  isLoading = false,
  isSubmitDisabled = false,
  preventClose = false,
  className = "",
  formClassName = "",
  footerClassName = "",
  showFooter = true,
  customFooter,
  formId,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  const defaultFooter = (
    <div
      className={`flex justify-end space-x-3 p-4 border-t border-gray-200 bg-gray-50 ${footerClassName}`}
    >
      <Button
        variant="outline"
        onClick={onClose}
        disabled={isLoading}
        className="min-w-[80px]"
      >
        {cancelText}
      </Button>
      <Button
        type="submit"
        variant={submitVariant}
        disabled={isSubmitDisabled || isLoading}
        loading={isLoading}
        className="min-w-[80px]"
        form={formId}
      >
        {submitText}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      className={className}
      preventClose={preventClose || isLoading}
      showCloseButton={!preventClose && !isLoading}
    >
      <form
        onSubmit={handleSubmit}
        className={`flex flex-col ${formClassName}`}
        id={formId}
      >
        <div className="flex-1 p-6">{children}</div>

        {showFooter && (customFooter || defaultFooter)}
      </form>
    </Modal>
  );
};

export default FormModal;
