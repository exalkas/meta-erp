import React from "react";
import { useTranslation } from "../../contexts/TranslationContext";

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  children?: React.ReactNode;
  spacing?: "sm" | "md" | "lg";
  layout?: "vertical" | "horizontal";
}

export interface FormFieldProps {
  name: string;
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
  layout?: "vertical" | "horizontal";
}

export interface FormMessageProps {
  type?: "error" | "success" | "warning" | "info";
  message?: string;
  children?: React.ReactNode;
}

export interface FormSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export interface FormActionsProps {
  align?: "left" | "center" | "right";
  spacing?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const spacingClasses = {
  sm: "space-y-3",
  md: "space-y-4",
  lg: "space-y-6",
};

const alignClasses = {
  left: "justify-start",
  center: "justify-center",
  right: "justify-end",
};

const actionSpacingClasses = {
  sm: "space-x-2",
  md: "space-x-3",
  lg: "space-x-4",
};

export const Form: React.FC<FormProps> = ({
  onSubmit,
  children,
  spacing = "md",
  layout = "vertical",
  className = "",
  ...props
}) => {
  const classes = [spacingClasses[spacing], className]
    .filter(Boolean)
    .join(" ");

  return (
    <form onSubmit={onSubmit} className={classes} {...props}>
      {children}
    </form>
  );
};

export const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  required = false,
  error,
  helperText,
  children,
  layout = "vertical",
}) => {
  const { t } = useTranslation();

  const isHorizontal = layout === "horizontal";

  return (
    <div className={isHorizontal ? "flex items-start space-x-4" : "space-y-1"}>
      {label && (
        <label
          htmlFor={name}
          className={`
            block text-sm font-medium text-gray-700
            ${isHorizontal ? "w-1/4 pt-2" : "mb-1"}
          `}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className={isHorizontal ? "flex-1" : ""}>
        {children}

        {(error || helperText) && (
          <div className="mt-1 text-sm">
            {error ? (
              <span className="text-red-600">{error}</span>
            ) : (
              <span className="text-gray-500">{helperText}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const FormMessage: React.FC<FormMessageProps> = ({
  type = "info",
  message,
  children,
}) => {
  const typeClasses = {
    error: "bg-red-50 border-red-200 text-red-800",
    success: "bg-green-50 border-green-200 text-green-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  const iconClasses = {
    error: "text-red-400",
    success: "text-green-400",
    warning: "text-yellow-400",
    info: "text-blue-400",
  };

  const icons = {
    error: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    ),
    success: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
    ),
    warning: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.76 0L3.054 16.5c-.77.833.192 2.5 1.732 2.5z"
        />
      </svg>
    ),
    info: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  };

  const content = children || message;

  if (!content) return null;

  return (
    <div
      className={`
      rounded-md border p-4 flex items-start space-x-3
      ${typeClasses[type]}
    `}
    >
      <div className={`flex-shrink-0 ${iconClasses[type]}`}>{icons[type]}</div>
      <div className="text-sm">{content}</div>
    </div>
  );
};

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  collapsible = false,
  defaultExpanded = true,
}) => {
  const [expanded, setExpanded] = React.useState(defaultExpanded);

  const toggleExpanded = () => {
    if (collapsible) {
      setExpanded(!expanded);
    }
  };

  return (
    <div className="border-b border-gray-200 pb-6">
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h3
              className={`
                text-lg font-medium text-gray-900 mb-2
                ${collapsible ? "cursor-pointer flex items-center" : ""}
              `}
              onClick={toggleExpanded}
            >
              {title}
              {collapsible && (
                <svg
                  className={`w-5 h-5 ml-2 transform transition-transform ${
                    expanded ? "rotate-90" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
            </h3>
          )}
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </div>
      )}

      {(!collapsible || expanded) && (
        <div className="space-y-4">{children}</div>
      )}
    </div>
  );
};

export const FormActions: React.FC<FormActionsProps> = ({
  align = "right",
  spacing = "md",
  children,
}) => {
  const classes = [
    "flex items-center",
    alignClasses[align],
    actionSpacingClasses[spacing],
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classes}>{children}</div>;
};

// Error boundary for forms
export const FormErrorBoundary: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [hasError, setHasError] = React.useState(false);
  const { t } = useTranslation();

  React.useEffect(() => {
    setHasError(false);
  }, [children]);

  const handleError = React.useCallback(() => {
    setHasError(true);
  }, []);

  if (hasError) {
    return <FormMessage type="error">{t("form_error_boundary")}</FormMessage>;
  }

  return <>{children}</>;
};

export default Form;
