import React, { forwardRef } from "react";
import { useTranslation } from "../../contexts/TranslationContext";

// Checkbox Component
export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  description?: string;
  error?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline";
  indeterminate?: boolean;
  labelPosition?: "left" | "right";
  fullWidth?: boolean;
}

const checkboxSizes = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
};

const checkboxVariants = {
  default: "border-gray-300 text-blue-600 focus:ring-blue-500",
  outline: "border-2 border-gray-300 text-blue-600 focus:ring-blue-500",
};

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

const MinusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20 12H4"
    />
  </svg>
);

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      description,
      error,
      size = "md",
      variant = "default",
      indeterminate = false,
      labelPosition = "right",
      fullWidth = false,
      className = "",
      checked,
      ...props
    },
    ref
  ) => {
    const { t } = useTranslation();

    const checkboxClasses = [
      "rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
      checkboxSizes[size],
      checkboxVariants[variant],
      error ? "border-red-500 focus:ring-red-500" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const containerClasses = [
      "flex items-start",
      labelPosition === "left" ? "flex-row-reverse" : "",
      fullWidth ? "w-full" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={containerClasses}>
        <div className="relative">
          <input
            ref={ref}
            type="checkbox"
            className={checkboxClasses}
            checked={checked}
            {...props}
          />
          {checked && !indeterminate && (
            <CheckIcon className="absolute inset-0 w-full h-full text-white pointer-events-none" />
          )}
          {indeterminate && (
            <MinusIcon className="absolute inset-0 w-full h-full text-white pointer-events-none" />
          )}
        </div>
        {(label || description) && (
          <div
            className={`${labelPosition === "left" ? "mr-3" : "ml-3"} flex-1`}
          >
            {label && (
              <label className="block text-sm font-medium text-gray-700 cursor-pointer">
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
        )}
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

// Radio Component
export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  description?: string;
  error?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline";
  labelPosition?: "left" | "right";
  fullWidth?: boolean;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      label,
      description,
      error,
      size = "md",
      variant = "default",
      labelPosition = "right",
      fullWidth = false,
      className = "",
      ...props
    },
    ref
  ) => {
    const radioClasses = [
      "rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
      checkboxSizes[size],
      checkboxVariants[variant],
      error ? "border-red-500 focus:ring-red-500" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const containerClasses = [
      "flex items-start",
      labelPosition === "left" ? "flex-row-reverse" : "",
      fullWidth ? "w-full" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={containerClasses}>
        <input ref={ref} type="radio" className={radioClasses} {...props} />
        {(label || description) && (
          <div
            className={`${labelPosition === "left" ? "mr-3" : "ml-3"} flex-1`}
          >
            {label && (
              <label className="block text-sm font-medium text-gray-700 cursor-pointer">
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
        )}
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Radio.displayName = "Radio";

// RadioGroup Component
export interface RadioGroupProps {
  name: string;
  value?: string;
  onChange?: (value: string) => void;
  options: Array<{
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
  }>;
  orientation?: "horizontal" | "vertical";
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline";
  error?: string;
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  value,
  onChange,
  options,
  orientation = "vertical",
  size = "md",
  variant = "default",
  error,
  className = "",
}) => {
  const containerClasses = [
    orientation === "horizontal" ? "flex flex-wrap gap-4" : "space-y-2",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClasses}>
      {options.map((option) => (
        <Radio
          key={option.value}
          name={name}
          value={option.value}
          checked={value === option.value}
          onChange={(e) => onChange?.(e.target.value)}
          label={option.label}
          description={option.description}
          disabled={option.disabled}
          size={size}
          variant={variant}
          error={error}
        />
      ))}
    </div>
  );
};

// Switch Component
export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  description?: string;
  error?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "warning" | "danger";
  labelPosition?: "left" | "right";
  fullWidth?: boolean;
  loading?: boolean;
}

const switchSizes = {
  sm: {
    track: "w-8 h-4",
    thumb: "w-3 h-3",
    translate: "translate-x-4",
  },
  md: {
    track: "w-11 h-6",
    thumb: "w-5 h-5",
    translate: "translate-x-5",
  },
  lg: {
    track: "w-14 h-8",
    thumb: "w-6 h-6",
    translate: "translate-x-6",
  },
};

const switchVariants = {
  default: {
    track: "bg-gray-200",
    trackChecked: "bg-blue-600",
    thumb: "bg-white",
  },
  success: {
    track: "bg-gray-200",
    trackChecked: "bg-green-600",
    thumb: "bg-white",
  },
  warning: {
    track: "bg-gray-200",
    trackChecked: "bg-yellow-600",
    thumb: "bg-white",
  },
  danger: {
    track: "bg-gray-200",
    trackChecked: "bg-red-600",
    thumb: "bg-white",
  },
};

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      label,
      description,
      error,
      size = "md",
      variant = "default",
      labelPosition = "right",
      fullWidth = false,
      loading = false,
      className = "",
      checked,
      ...props
    },
    ref
  ) => {
    const { t } = useTranslation();

    const trackClasses = [
      "relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
      switchSizes[size].track,
      checked
        ? switchVariants[variant].trackChecked
        : switchVariants[variant].track,
      props.disabled ? "opacity-50 cursor-not-allowed" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const thumbClasses = [
      "pointer-events-none inline-block transform rounded-full shadow ring-0 transition duration-200 ease-in-out",
      switchSizes[size].thumb,
      switchVariants[variant].thumb,
      checked ? switchSizes[size].translate : "translate-x-0",
    ]
      .filter(Boolean)
      .join(" ");

    const containerClasses = [
      "flex items-center",
      labelPosition === "left" ? "flex-row-reverse" : "",
      fullWidth ? "w-full justify-between" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={containerClasses}>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          className={trackClasses}
          onClick={() => {
            if (!props.disabled && !loading) {
              const syntheticEvent = {
                target: { checked: !checked },
              } as React.ChangeEvent<HTMLInputElement>;
              props.onChange?.(syntheticEvent);
            }
          }}
        >
          <span className={thumbClasses}>
            {loading && (
              <svg
                className="absolute inset-0 w-full h-full animate-spin text-gray-400"
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
            )}
          </span>
        </button>
        <input
          ref={ref}
          type="checkbox"
          className="sr-only"
          checked={checked}
          {...props}
        />
        {(label || description) && (
          <div
            className={`${labelPosition === "left" ? "mr-3" : "ml-3"} flex-1`}
          >
            {label && (
              <label className="block text-sm font-medium text-gray-700 cursor-pointer">
                {label}
              </label>
            )}
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
        )}
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Switch.displayName = "Switch";

export default { Checkbox, Radio, RadioGroup, Switch };
