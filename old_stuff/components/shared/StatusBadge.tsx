interface StatusBadgeProps {
  status: string;
  variant?: "success" | "warning" | "error" | "info" | "neutral";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const statusVariants = {
  success: "bg-green-100 text-green-800 border-green-200",
  warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
  error: "bg-red-100 text-red-800 border-red-200",
  info: "bg-blue-100 text-blue-800 border-blue-200",
  neutral: "bg-gray-100 text-gray-800 border-gray-200",
};

const sizeClasses = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-1 text-sm",
  lg: "px-4 py-2 text-base",
};

// Auto-detect variant based on common status values
const getVariantFromStatus = (status: string): keyof typeof statusVariants => {
  const normalizedStatus = status.toLowerCase();

  if (
    [
      "active",
      "published",
      "completed",
      "success",
      "approved",
      "enabled",
    ].includes(normalizedStatus)
  ) {
    return "success";
  }
  if (["pending", "draft", "warning", "review"].includes(normalizedStatus)) {
    return "warning";
  }
  if (
    ["inactive", "error", "failed", "rejected", "disabled"].includes(
      normalizedStatus
    )
  ) {
    return "error";
  }
  if (["info", "new", "processing"].includes(normalizedStatus)) {
    return "info";
  }
  return "neutral";
};

export default function StatusBadge({
  status,
  variant,
  size = "md",
  className = "",
}: StatusBadgeProps) {
  const finalVariant = variant || getVariantFromStatus(status);

  return (
    <span
      className={`
        inline-flex items-center rounded-full border font-medium
        ${statusVariants[finalVariant]}
        ${sizeClasses[size]}
        ${className}
      `.trim()}
    >
      {status}
    </span>
  );
}
