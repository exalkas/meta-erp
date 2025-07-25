import React, { forwardRef, useState } from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import { FORM_FIELD_TYPES } from "../../utils/constants";
import {
  greekValidationRules,
  ValidationResult,
} from "../../utils/greekValidation";
import { Eye, EyeOff } from "lucide-react";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  variant?: "default" | "filled" | "outlined";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  clearable?: boolean;
  onClear?: () => void;
  validation?: "afm" | "phone" | "email" | "iban" | "postalCode";
  validateOnBlur?: boolean;
  showValidationIcon?: boolean;
}

export interface PasswordInputProps extends Omit<InputProps, "type"> {
  showPasswordToggle?: boolean;
  strength?: boolean;
}

const baseClasses =
  "w-full px-3 py-2 border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed";

const variantClasses = {
  default: "border-gray-300 bg-white",
  filled: "border-gray-300 bg-gray-50",
  outlined: "border-2 border-gray-300 bg-white",
};

const sizeClasses = {
  sm: "text-sm px-2 py-1",
  md: "text-base px-3 py-2",
  lg: "text-lg px-4 py-3",
};

const errorClasses = "border-red-500 focus:ring-red-500 focus:border-red-500";
const successClasses =
  "border-green-500 focus:ring-green-500 focus:border-green-500";

const ValidationIcon: React.FC<{ type: "success" | "error" | "loading" }> = ({
  type,
}) => {
  if (type === "loading") {
    return (
      <svg
        className="animate-spin w-5 h-5 text-gray-400"
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
  }

  if (type === "success") {
    return (
      <svg
        className="w-5 h-5 text-green-500"
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
    );
  }

  return (
    <svg
      className="w-5 h-5 text-red-500"
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
  );
};

const ClearButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
  >
    <svg
      className="w-4 h-4"
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
  </button>
);

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = true,
      variant = "default",
      size = "md",
      loading = false,
      clearable = false,
      onClear,
      validation,
      validateOnBlur = true,
      showValidationIcon = true,
      className = "",
      onChange,
      onBlur,
      value,
      ...props
    },
    ref
  ) => {
    const { t } = useTranslation();
    const [internalError, setInternalError] = useState<string>("");
    const [validationState, setValidationState] = useState<
      "idle" | "success" | "error" | "loading"
    >("idle");

    const displayError = error || internalError;
    const hasError = !!displayError;
    const hasSuccess = validationState === "success" && !hasError;

    const validateValue = (inputValue: string) => {
      if (!validation || !inputValue) {
        setValidationState("idle");
        setInternalError("");
        return;
      }

      setValidationState("loading");

      let result: ValidationResult;
      switch (validation) {
        case "afm":
          result = greekValidationRules.afm(inputValue);
          break;
        case "phone":
          result = greekValidationRules.phone(inputValue);
          break;
        case "email":
          result = greekValidationRules.email(inputValue);
          break;
        case "iban":
          result = greekValidationRules.iban(inputValue);
          break;
        case "postalCode":
          result = greekValidationRules.postalCode(inputValue);
          break;
        default:
          result = { isValid: true };
      }

      setTimeout(() => {
        if (result.isValid) {
          setValidationState("success");
          setInternalError("");
        } else {
          setValidationState("error");
          setInternalError(result.error ? t(result.error) : "");
        }
      }, 300);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e);
      if (validation && validateOnBlur) {
        setValidationState("idle");
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      onBlur?.(e);
      if (validation && validateOnBlur) {
        validateValue(e.target.value);
      }
    };

    const handleClear = () => {
      onClear?.();
      setValidationState("idle");
      setInternalError("");
    };

    const inputClasses = [
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      hasError ? errorClasses : "",
      hasSuccess ? successClasses : "",
      leftIcon ? "pl-10" : "",
      // rightIcon || clearable || showValidationIcon ? "pr-10" : "",
      rightIcon || clearable || showValidationIcon ? "pr-12" : "",
      fullWidth ? "w-full" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    const showClearButton = clearable && value && !loading;
    const showRightIcon =
      rightIcon || (showValidationIcon && validationState !== "idle");

    return (
      <div className={fullWidth ? "w-full" : ""}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            className={inputClasses}
            onChange={handleChange}
            onBlur={handleBlur}
            value={value}
            {...props}
          />

          {showClearButton && <ClearButton onClick={handleClear} />}

          {showRightIcon && !showClearButton && (
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {rightIcon || (
                <ValidationIcon
                  type={
                    validationState === "loading"
                      ? "loading"
                      : hasError
                      ? "error"
                      : "success"
                  }
                />
              )}
            </span>
          )}
        </div>

        {(displayError || helperText) && (
          <div className="mt-1 text-sm">
            {displayError ? (
              <span className="text-red-600">{displayError}</span>
            ) : (
              <span className="text-gray-500">{helperText}</span>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ showPasswordToggle = true, strength = false, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [isClient, setIsClient] = useState(false);
    const { t } = useTranslation();

    // Fix hydration error by ensuring icons only render on client
    React.useEffect(() => {
      setIsClient(true);
    }, []);

    const togglePassword = () => setShowPassword(!showPassword);

    const calculateStrength = (password: string): number => {
      let score = 0;
      if (password.length >= 8) score += 1;
      if (/[a-z]/.test(password)) score += 1;
      if (/[A-Z]/.test(password)) score += 1;
      if (/\d/.test(password)) score += 1;
      if (/[^A-Za-z\d]/.test(password)) score += 1;
      return score;
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (strength) {
        setPasswordStrength(calculateStrength(e.target.value));
      }
      props.onChange?.(e);
    };

    const strengthColors = [
      "bg-red-500",
      "bg-orange-500",
      "bg-yellow-500",
      "bg-blue-500",
      "bg-green-500",
    ];
    const strengthLabels = ["very_weak", "weak", "fair", "good", "strong"];

    const toggleIcon = isClient ? (
      showPassword ? (
        <EyeOff className="w-5 h-5" style={{ color: "#6b7280" }} />
      ) : (
        <Eye className="w-5 h-5" style={{ color: "#6b7280" }} />
      )
    ) : (
      <div className="w-5 h-5" style={{ color: "#6b7280" }} />
    );

    return (
      <>
        <Input
          ref={ref}
          type={showPassword ? "text" : "password"}
          rightIcon={
            showPasswordToggle ? (
              <span
                onClick={togglePassword}
                className="cursor-pointer hover:text-gray-800 transition-colors"
                style={{
                  color: "#6b7280",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#374151")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#6b7280")}
              >
                {toggleIcon}
              </span>
            ) : undefined
          }
          showValidationIcon={false}
          onChange={handlePasswordChange}
          {...props}
        />

        {strength && props.value && (
          <div className="mt-2">
            <div className="flex space-x-1 mb-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded ${
                    i < passwordStrength
                      ? strengthColors[passwordStrength - 1]
                      : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <div className="text-xs text-gray-500">
              {t("password_strength")}:{" "}
              {t(strengthLabels[passwordStrength - 1] || "very_weak")}
            </div>
          </div>
        )}
      </>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export default Input;
