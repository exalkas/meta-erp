import React from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import { COLORS, SIZES } from "../../utils/constants";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "destructive"
    | "success";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export interface LoadingButtonProps extends ButtonProps {
  loading: boolean;
  loadingText?: string;
}

export interface IconButtonProps extends Omit<ButtonProps, "children"> {
  icon: React.ReactNode;
  "aria-label": string;
}

const baseClasses =
  "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

const variantClasses = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
  secondary: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500",
  outline:
    "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500",
  ghost: "text-gray-700 hover:bg-gray-100 focus:ring-blue-500",
  destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
};

const sizeClasses = {
  xs: "text-xs px-2 py-1 rounded",
  sm: "text-sm px-3 py-1.5 rounded",
  md: "text-base px-4 py-2 rounded-md",
  lg: "text-lg px-6 py-3 rounded-md",
  xl: "text-xl px-8 py-4 rounded-lg",
};

const LoadingSpinner: React.FC<{ size?: "xs" | "sm" | "md" | "lg" | "xl" }> = ({
  size = "md",
}) => {
  const spinnerSizes = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-8 h-8",
  };

  return (
    <svg
      className={`animate-spin ${spinnerSizes[size]}`}
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

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  className = "",
  ...props
}) => {
  const { t } = useTranslation();

  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const isDisabled = disabled || loading;

  return (
    <button className={classes} disabled={isDisabled} {...props}>
      <span className="flex items-center justify-center gap-2">
        {loading && <LoadingSpinner size={size} />}
        {!loading && leftIcon && leftIcon}
        {children}
        {!loading && rightIcon && rightIcon}
      </span>
    </button>
  );
};

export const LoadingButton: React.FC<LoadingButtonProps> = (props) => {
  return <Button {...props} />;
};

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  size = "md",
  variant = "ghost",
  className = "",
  ...props
}) => {
  const iconSizes = {
    xs: "w-4 h-4",
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-7 h-7",
    xl: "w-8 h-8",
  };

  const buttonSizes = {
    xs: "p-1 rounded",
    sm: "p-1.5 rounded",
    md: "p-2 rounded-md",
    lg: "p-3 rounded-md",
    xl: "p-4 rounded-lg",
  };

  const classes = [
    baseClasses,
    variantClasses[variant],
    buttonSizes[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} {...props}>
      <span className={iconSizes[size]}>{icon}</span>
    </button>
  );
};

// Export button variants for external use
export const PrimaryButton: React.FC<Omit<ButtonProps, "variant">> = (
  props
) => <Button variant="primary" {...props} />;

export const SecondaryButton: React.FC<Omit<ButtonProps, "variant">> = (
  props
) => <Button variant="secondary" {...props} />;

export const OutlineButton: React.FC<Omit<ButtonProps, "variant">> = (
  props
) => <Button variant="outline" {...props} />;

export const GhostButton: React.FC<Omit<ButtonProps, "variant">> = (props) => (
  <Button variant="ghost" {...props} />
);

export const DestructiveButton: React.FC<Omit<ButtonProps, "variant">> = (
  props
) => <Button variant="destructive" {...props} />;

export const SuccessButton: React.FC<Omit<ButtonProps, "variant">> = (
  props
) => <Button variant="success" {...props} />;

export default Button;
