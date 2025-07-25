import React, { createContext, useContext, useState } from "react";
import { useTranslation } from "../../contexts/TranslationContext";

interface RadioContextType {
  value?: string;
  onChange?: (value: string) => void;
  name?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "filled" | "outlined";
}

const RadioContext = createContext<RadioContextType | undefined>(undefined);

interface RadioGroupProps {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "filled" | "outlined";
  disabled?: boolean;
  required?: boolean;
  className?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  direction?: "horizontal" | "vertical";
  children: React.ReactNode;
}

interface RadioProps {
  value: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "filled" | "outlined";
  className?: string;
  id?: string;
  children?: React.ReactNode;
  description?: string;
  icon?: React.ReactNode;
  color?: "primary" | "secondary" | "success" | "warning" | "error";
}

const RadioCircle: React.FC<{
  checked: boolean;
  size: "sm" | "md" | "lg";
  disabled: boolean;
  color: "primary" | "secondary" | "success" | "warning" | "error";
  variant: "default" | "filled" | "outlined";
}> = ({ checked, size, disabled, color, variant }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const innerSizeClasses = {
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
  };

  const colorClasses = {
    primary: checked ? "border-blue-500 bg-blue-50" : "border-gray-300",
    secondary: checked ? "border-gray-500 bg-gray-50" : "border-gray-300",
    success: checked ? "border-green-500 bg-green-50" : "border-gray-300",
    warning: checked ? "border-yellow-500 bg-yellow-50" : "border-gray-300",
    error: checked ? "border-red-500 bg-red-50" : "border-gray-300",
  };

  const innerColorClasses = {
    primary: "bg-blue-500",
    secondary: "bg-gray-500",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    error: "bg-red-500",
  };

  const variantClasses = {
    default: "border-2",
    filled: checked ? "border-2" : "border-2 bg-gray-100",
    outlined: "border-2",
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${colorClasses[color]}
        ${variantClasses[variant]}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        rounded-full flex items-center justify-center
        transition-all duration-200
        ${!disabled && !checked ? "hover:border-gray-400" : ""}
        ${!disabled && checked ? "hover:shadow-sm" : ""}
      `}
    >
      {checked && (
        <div
          className={`
            ${innerSizeClasses[size]}
            ${innerColorClasses[color]}
            rounded-full
            transition-all duration-200
            ${disabled ? "opacity-50" : ""}
          `}
        />
      )}
    </div>
  );
};

export const Radio: React.FC<RadioProps> = ({
  value,
  disabled: propDisabled = false,
  size: propSize = "md",
  variant: propVariant = "default",
  className = "",
  id,
  children,
  description,
  icon,
  color = "primary",
}) => {
  const { t } = useTranslation();
  const context = useContext(RadioContext);

  if (!context) {
    throw new Error("Radio component must be used within a RadioGroup");
  }

  const {
    value: groupValue,
    onChange,
    name,
    disabled: groupDisabled,
    size: groupSize,
    variant: groupVariant,
  } = context;

  const finalSize = propSize || groupSize || "md";
  const finalVariant = propVariant || groupVariant || "default";
  const finalDisabled = propDisabled || groupDisabled || false;
  const checked = groupValue === value;

  const labelSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const handleChange = () => {
    if (!finalDisabled && onChange) {
      onChange(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleChange();
    }
  };

  return (
    <div className={`flex items-start space-x-3 ${className}`}>
      <div
        className="flex items-center"
        onClick={handleChange}
        onKeyDown={handleKeyDown}
        role="radio"
        aria-checked={checked}
        aria-disabled={finalDisabled}
        tabIndex={finalDisabled ? -1 : 0}
      >
        <input
          type="radio"
          id={id}
          name={name}
          value={value}
          checked={checked}
          onChange={handleChange}
          disabled={finalDisabled}
          className="sr-only"
        />

        <RadioCircle
          checked={checked}
          size={finalSize}
          disabled={finalDisabled}
          color={color}
          variant={finalVariant}
        />
      </div>

      {(children || icon) && (
        <div className="flex-1">
          <label
            htmlFor={id}
            className={`
              ${labelSizeClasses[finalSize]}
              ${
                finalDisabled
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 cursor-pointer"
              }
              font-medium flex items-center
            `}
            onClick={handleChange}
          >
            {icon && <span className="mr-2">{icon}</span>}
            {children}
          </label>

          {description && (
            <p
              className={`
              text-sm text-gray-500 mt-1
              ${finalDisabled ? "text-gray-400" : ""}
            `}
            >
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export const RadioGroup: React.FC<RadioGroupProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  size = "md",
  variant = "default",
  disabled = false,
  required = false,
  className = "",
  name,
  value: controlledValue,
  defaultValue,
  onChange,
  direction = "vertical",
  children,
}) => {
  const { t } = useTranslation();
  const [internalValue, setInternalValue] = useState(defaultValue || "");

  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;

  const handleChange = (newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  const contextValue: RadioContextType = {
    value: currentValue,
    onChange: handleChange,
    name,
    disabled,
    size,
    variant,
  };

  return (
    <RadioContext.Provider value={contextValue}>
      <div className={`${fullWidth ? "w-full" : ""} ${className}`}>
        {label && (
          <fieldset>
            <legend
              className={`block text-sm font-medium text-gray-700 mb-2 ${
                required
                  ? "after:content-['*'] after:text-red-500 after:ml-1"
                  : ""
              }`}
            >
              {label}
            </legend>

            <div
              className={`
                ${
                  direction === "horizontal"
                    ? "flex flex-wrap gap-6"
                    : "space-y-3"
                }
                ${error ? "border-red-500" : ""}
              `}
              role="radiogroup"
              aria-labelledby={label ? `${name}-label` : undefined}
              aria-required={required}
              aria-invalid={error ? "true" : "false"}
            >
              {children}
            </div>
          </fieldset>
        )}

        {!label && (
          <div
            className={`
              ${
                direction === "horizontal"
                  ? "flex flex-wrap gap-6"
                  : "space-y-3"
              }
              ${error ? "border-red-500" : ""}
            `}
            role="radiogroup"
            aria-required={required}
            aria-invalid={error ? "true" : "false"}
          >
            {children}
          </div>
        )}

        {error && (
          <p className="mt-1 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-600">{helperText}</p>
        )}
      </div>
    </RadioContext.Provider>
  );
};

export default { Radio, RadioGroup };
