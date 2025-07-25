import React from "react";

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Direction of the stack */
  direction?: "vertical" | "horizontal";
  /** Spacing between items */
  spacing?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  /** Align items */
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  /** Justify content */
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  /** Wrap items */
  wrap?: boolean;
  /** Divider between items */
  divider?: React.ReactNode;
  /** Children */
  children?: React.ReactNode;
}

const directionClasses = {
  vertical: "flex-col",
  horizontal: "flex-row",
};

const spacingClasses = {
  vertical: {
    none: "space-y-0",
    xs: "space-y-1",
    sm: "space-y-2",
    md: "space-y-4",
    lg: "space-y-6",
    xl: "space-y-8",
    "2xl": "space-y-12",
  },
  horizontal: {
    none: "space-x-0",
    xs: "space-x-1",
    sm: "space-x-2",
    md: "space-x-4",
    lg: "space-x-6",
    xl: "space-x-8",
    "2xl": "space-x-12",
  },
};

const alignClasses = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
};

const justifyClasses = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
};

export const Stack: React.FC<StackProps> = ({
  direction = "vertical",
  spacing = "md",
  align = "stretch",
  justify = "start",
  wrap = false,
  divider,
  children,
  className = "",
  ...props
}) => {
  const classes = [
    "flex",
    directionClasses[direction],
    !divider ? spacingClasses[direction][spacing] : "",
    alignClasses[align],
    justifyClasses[justify],
    wrap ? "flex-wrap" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (divider) {
    const childArray = React.Children.toArray(children);
    const childrenWithDividers = childArray.reduce<React.ReactNode[]>(
      (acc, child, index) => {
        acc.push(child);
        if (index < childArray.length - 1) {
          acc.push(
            <div key={`divider-${index}`} className="flex-shrink-0">
              {divider}
            </div>
          );
        }
        return acc;
      },
      []
    );

    return (
      <div className={classes} {...props}>
        {childrenWithDividers}
      </div>
    );
  }

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

// Vertical Stack (alias for easier use)
export const VStack: React.FC<Omit<StackProps, "direction">> = (props) => (
  <Stack direction="vertical" {...props} />
);

// Horizontal Stack (alias for easier use)
export const HStack: React.FC<Omit<StackProps, "direction">> = (props) => (
  <Stack direction="horizontal" {...props} />
);

// Specialized stack components
export const ButtonGroup: React.FC<
  Omit<StackProps, "direction" | "spacing">
> = (props) => <HStack spacing="sm" {...props} />;

export const FormStack: React.FC<Omit<StackProps, "direction" | "spacing">> = (
  props
) => <VStack spacing="lg" {...props} />;

export const NavStack: React.FC<Omit<StackProps, "direction">> = (props) => (
  <HStack align="center" spacing="md" {...props} />
);

export const ActionStack: React.FC<
  Omit<StackProps, "direction" | "justify">
> = (props) => <HStack justify="end" spacing="sm" {...props} />;

// Divider component for use with Stack
export const StackDivider: React.FC<{
  orientation?: "horizontal" | "vertical";
  className?: string;
}> = ({ orientation = "horizontal", className = "" }) => {
  const dividerClasses = {
    horizontal: "border-t border-gray-200 w-full",
    vertical: "border-l border-gray-200 h-full",
  };

  return <div className={`${dividerClasses[orientation]} ${className}`} />;
};

export default Stack;
