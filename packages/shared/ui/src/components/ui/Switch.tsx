import React, { useState } from "react";
import { useTranslation } from "../../contexts/TranslationContext";

interface SwitchProps {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "filled" | "outlined";
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  onCheckedChange?: (checked: boolean) => void; // Alias for modern API compatibility
  loading?: boolean;
  icon?: React.ReactNode;
  checkedIcon?: React.ReactNode;
  uncheckedIcon?: React.ReactNode;
  color?: "primary" | "secondary" | "success" | "warning" | "error";
  labelPosition?: "left" | "right";
  description?: string;
  onLabel?: string;
  offLabel?: string;
  showLabels?: boolean;
}

const LoadingSpinner: React.FC<{ size: "sm" | "md" | "lg" }> = ({ size }) => {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <svg
      className={`animate-spin ${sizeClasses[size]} text-current`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

const SwitchTrack: React.FC<{
  checked: boolean;
  disabled: boolean;
  loading: boolean;
  size: "sm" | "md" | "lg";
  color: "primary" | "secondary" | "success" | "warning" | "error";
  variant: "default" | "filled" | "outlined";
}> = ({ checked, disabled, loading, size, color, variant }) => {
  const sizeClasses = {
    sm: "w-8 h-5",
    md: "w-10 h-6",
    lg: "w-12 h-7",
  };

  const colorClasses = {
    primary: checked ? "bg-blue-500" : "bg-gray-200",
    secondary: checked ? "bg-gray-500" : "bg-gray-200",
    success: checked ? "bg-green-500" : "bg-gray-200",
    warning: checked ? "bg-yellow-500" : "bg-gray-200",
    error: checked ? "bg-red-500" : "bg-gray-200",
  };

  const variantClasses = {
    default: "",
    filled: checked ? "shadow-inner" : "bg-gray-100",
    outlined: `border-2 ${checked ? "border-current" : "border-gray-300"}`,
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${colorClasses[color]}
        ${variantClasses[variant]}
        ${disabled ? "opacity-50" : ""}
        ${loading ? "opacity-75" : ""}
        rounded-full relative
        transition-all duration-200 ease-in-out
        ${!disabled && !loading ? "cursor-pointer" : "cursor-not-allowed"}
        ${!disabled && !loading && !checked ? "hover:bg-gray-300" : ""}
        ${!disabled && !loading && checked ? "hover:shadow-md" : ""}
      `}
    />
  );
};

const SwitchThumb: React.FC<{
  checked: boolean;
  disabled: boolean;
  loading: boolean;
  size: "sm" | "md" | "lg";
  color: "primary" | "secondary" | "success" | "warning" | "error";
  variant: "default" | "filled" | "outlined";
  icon?: React.ReactNode;
  checkedIcon?: React.ReactNode;
  uncheckedIcon?: React.ReactNode;
}> = ({
  checked,
  disabled,
  loading,
  size,
  color,
  variant,
  icon,
  checkedIcon,
  uncheckedIcon,
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const positionClasses = {
    sm: checked ? "translate-x-3" : "translate-x-0",
    md: checked ? "translate-x-4" : "translate-x-0",
    lg: checked ? "translate-x-5" : "translate-x-0",
  };

  const shadowClasses = {
    default: "shadow-sm",
    filled: "shadow-md",
    outlined: "shadow-sm border border-gray-300",
  };

  const getCurrentIcon = () => {
    if (loading) return <LoadingSpinner size={size} />;
    if (checked && checkedIcon) return checkedIcon;
    if (!checked && uncheckedIcon) return uncheckedIcon;
    if (icon) return icon;
    return null;
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${positionClasses[size]}
        ${shadowClasses[variant]}
        ${disabled ? "opacity-50" : ""}
        bg-white rounded-full
        absolute top-0.5 left-0.5
        transition-all duration-200 ease-in-out
        flex items-center justify-center
        ${!disabled && !loading ? "hover:shadow-md" : ""}
      `}
    >
      {getCurrentIcon()}
    </div>
  );
};

export const Switch: React.FC<SwitchProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  size = "md",
  variant = "default",
  disabled = false,
  required = false,
  className = "",
  id,
  checked: controlledChecked,
  defaultChecked = false,
  onChange,
  onCheckedChange,
  loading = false,
  icon,
  checkedIcon,
  uncheckedIcon,
  color = "primary",
  labelPosition = "right",
  description,
  onLabel,
  offLabel,
  showLabels = false,
}) => {
  const { t } = useTranslation();
  const [internalChecked, setInternalChecked] = useState(defaultChecked);

  const isControlled = controlledChecked !== undefined;
  const currentChecked = isControlled ? controlledChecked : internalChecked;

  const labelSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const handleChange = () => {
    if (disabled || loading) return;

    const newChecked = !currentChecked;

    if (!isControlled) {
      setInternalChecked(newChecked);
    }

    onChange?.(newChecked);
    onCheckedChange?.(newChecked); // Support modern API
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleChange();
    }
  };

  const switchElement = (
    <div
      className={`relative inline-block ${
        disabled || loading ? "cursor-not-allowed" : "cursor-pointer"
      }`}
      onClick={handleChange}
      onKeyDown={handleKeyDown}
      role="switch"
      aria-checked={currentChecked}
      aria-disabled={disabled || loading}
      tabIndex={disabled || loading ? -1 : 0}
    >
      <input
        type="checkbox"
        id={id}
        checked={currentChecked}
        onChange={handleChange}
        disabled={disabled || loading}
        className="sr-only"
      />

      <SwitchTrack
        checked={currentChecked}
        disabled={disabled}
        loading={loading}
        size={size}
        color={color}
        variant={variant}
      />

      <SwitchThumb
        checked={currentChecked}
        disabled={disabled}
        loading={loading}
        size={size}
        color={color}
        variant={variant}
        icon={icon}
        checkedIcon={checkedIcon}
        uncheckedIcon={uncheckedIcon}
      />
    </div>
  );

  const labelElement = (
    <div className="flex flex-col">
      {label && (
        <label
          htmlFor={id}
          className={`
            ${labelSizeClasses[size]}
            ${
              disabled || loading
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-700 cursor-pointer"
            }
            font-medium
            ${
              required
                ? "after:content-['*'] after:text-red-500 after:ml-1"
                : ""
            }
          `}
          onClick={handleChange}
        >
          {label}
        </label>
      )}

      {description && (
        <p
          className={`
          text-sm text-gray-500 mt-1
          ${disabled || loading ? "text-gray-400" : ""}
        `}
        >
          {description}
        </p>
      )}
    </div>
  );

  const statusLabel = showLabels && (
    <span
      className={`
      text-xs text-gray-500 ml-2
      ${disabled || loading ? "text-gray-400" : ""}
    `}
    >
      {currentChecked ? onLabel || t("on") : offLabel || t("off")}
    </span>
  );

  return (
    <div className={`${fullWidth ? "w-full" : ""} ${className}`}>
      <div
        className={`
        flex items-center
        ${labelPosition === "left" ? "flex-row-reverse" : ""}
        ${label ? "space-x-3" : ""}
      `}
      >
        {labelPosition === "left" && labelElement}

        <div className="flex items-center">
          {switchElement}
          {statusLabel}
        </div>

        {labelPosition === "right" && labelElement}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-600">{helperText}</p>
      )}
    </div>
  );
};

export default Switch;
