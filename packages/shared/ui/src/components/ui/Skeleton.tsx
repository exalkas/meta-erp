import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "rectangular" | "circular" | "rounded";
  width?: string | number;
  height?: string | number;
  animation?: "pulse" | "wave" | "none";
  lines?: number;
  children?: React.ReactNode;
}

const baseClasses = "bg-gray-200 dark:bg-gray-700";

const variantClasses = {
  text: "rounded",
  rectangular: "",
  circular: "rounded-full",
  rounded: "rounded-lg",
};

const animationClasses = {
  pulse: "animate-pulse",
  wave: "animate-pulse", // Could be enhanced with custom wave animation
  none: "",
};

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = "rectangular",
  width,
  height,
  animation = "pulse",
  lines = 1,
  className = "",
  children,
  style,
  ...props
}) => {
  const classes = [
    baseClasses,
    variantClasses[variant],
    animationClasses[animation],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const inlineStyle = {
    width,
    height,
    ...style,
  };

  // If children are provided, wrap them in skeleton styling
  if (children) {
    return (
      <div className={classes} style={inlineStyle} {...props}>
        {children}
      </div>
    );
  }

  // For text variant with multiple lines
  if (variant === "text" && lines > 1) {
    return (
      <div className="space-y-2" {...props}>
        {Array.from({ length: lines }, (_, index) => (
          <div
            key={index}
            className={classes}
            style={{
              ...inlineStyle,
              width: index === lines - 1 ? "75%" : "100%",
              height: height || "1rem",
            }}
          />
        ))}
      </div>
    );
  }

  // Single skeleton element
  return (
    <div
      className={classes}
      style={{
        ...inlineStyle,
        height: height || (variant === "text" ? "1rem" : "2rem"),
      }}
      {...props}
    />
  );
};

// Predefined skeleton components for common use cases
export const SkeletonText: React.FC<Omit<SkeletonProps, "variant">> = (
  props
) => <Skeleton variant="text" {...props} />;

export const SkeletonCircle: React.FC<Omit<SkeletonProps, "variant">> = (
  props
) => <Skeleton variant="circular" {...props} />;

export const SkeletonRectangle: React.FC<Omit<SkeletonProps, "variant">> = (
  props
) => <Skeleton variant="rectangular" {...props} />;

export const SkeletonRounded: React.FC<Omit<SkeletonProps, "variant">> = (
  props
) => <Skeleton variant="rounded" {...props} />;

// Complex skeleton layouts
export const SkeletonCard: React.FC<{
  showAvatar?: boolean;
  showActions?: boolean;
}> = ({ showAvatar = false, showActions = false }) => (
  <div className="border border-gray-200 rounded-lg p-4 space-y-4">
    {/* Header */}
    <div className="flex items-center space-x-3">
      {showAvatar && <SkeletonCircle width="40px" height="40px" />}
      <div className="flex-1 space-y-2">
        <SkeletonText width="60%" height="1rem" />
        <SkeletonText width="40%" height="0.875rem" />
      </div>
      {showActions && <SkeletonRectangle width="80px" height="32px" />}
    </div>

    {/* Content */}
    <div className="space-y-2">
      <SkeletonText lines={3} />
    </div>

    {/* Footer */}
    <div className="flex justify-between items-center">
      <SkeletonText width="100px" height="0.875rem" />
      <SkeletonRectangle width="60px" height="28px" />
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => (
  <div className="space-y-2">
    {/* Header */}
    <div className="flex space-x-4 border-b border-gray-200 pb-2">
      {Array.from({ length: columns }, (_, index) => (
        <div key={index} className="flex-1">
          <SkeletonText height="1rem" />
        </div>
      ))}
    </div>

    {/* Rows */}
    {Array.from({ length: rows }, (_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4 py-2">
        {Array.from({ length: columns }, (_, colIndex) => (
          <div key={colIndex} className="flex-1">
            <SkeletonText height="0.875rem" />
          </div>
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonList: React.FC<{
  items?: number;
  showAvatar?: boolean;
}> = ({ items = 5, showAvatar = false }) => (
  <div className="space-y-3">
    {Array.from({ length: items }, (_, index) => (
      <div key={index} className="flex items-center space-x-3">
        {showAvatar && <SkeletonCircle width="32px" height="32px" />}
        <div className="flex-1 space-y-1">
          <SkeletonText width="80%" height="1rem" />
          <SkeletonText width="60%" height="0.875rem" />
        </div>
      </div>
    ))}
  </div>
);

export default Skeleton;
