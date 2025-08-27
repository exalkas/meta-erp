interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "primary" | "secondary" | "white";
  className?: string;
  fullScreen?: boolean;
  message?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

const variantClasses = {
  primary: "text-blue-600",
  secondary: "text-gray-600",
  white: "text-white",
};

export default function LoadingSpinner({
  size = "md",
  variant = "primary",
  className = "",
  fullScreen = false,
  message,
}: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={`
        animate-spin rounded-full border-2 border-current border-t-transparent
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `.trim()}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        <div className="text-center">
          <div
            className={`inline-block ${sizeClasses.xl} ${variantClasses[variant]}`}
          >
            <div className="animate-spin rounded-full border-2 border-current border-t-transparent h-full w-full" />
          </div>
          {message && <p className="mt-4 text-sm text-gray-600">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {spinner}
      {message && <span className="text-sm text-gray-600">{message}</span>}
    </div>
  );
}
