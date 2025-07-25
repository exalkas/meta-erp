import React from "react";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Container size */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** Center the container */
  centered?: boolean;
  /** Add padding */
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  /** Add margin */
  margin?: "none" | "sm" | "md" | "lg" | "xl";
  /** Background variant */
  background?: "none" | "white" | "gray" | "blue";
  /** Shadow level */
  shadow?: "none" | "sm" | "md" | "lg" | "xl";
  /** Border radius */
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  /** Children content */
  children?: React.ReactNode;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
  full: "max-w-full",
};

const paddingClasses = {
  none: "",
  sm: "p-2",
  md: "p-4",
  lg: "p-6",
  xl: "p-8",
};

const marginClasses = {
  none: "",
  sm: "m-2",
  md: "m-4",
  lg: "m-6",
  xl: "m-8",
};

const backgroundClasses = {
  none: "",
  white: "bg-white",
  gray: "bg-gray-50",
  blue: "bg-blue-50",
};

const shadowClasses = {
  none: "",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-xl",
};

const roundedClasses = {
  none: "",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  full: "rounded-full",
};

export const Container: React.FC<ContainerProps> = ({
  size = "lg",
  centered = true,
  padding = "md",
  margin = "none",
  background = "none",
  shadow = "none",
  rounded = "none",
  children,
  className = "",
  ...props
}) => {
  const classes = [
    sizeClasses[size],
    centered ? "mx-auto" : "",
    paddingClasses[padding],
    marginClasses[margin],
    backgroundClasses[background],
    shadowClasses[shadow],
    roundedClasses[rounded],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

// Specialized container variants
export const PageContainer: React.FC<
  Omit<ContainerProps, "size" | "padding">
> = (props) => <Container size="xl" padding="lg" {...props} />;

export const CardContainer: React.FC<
  Omit<ContainerProps, "background" | "shadow" | "rounded">
> = (props) => (
  <Container background="white" shadow="md" rounded="lg" {...props} />
);

export const SectionContainer: React.FC<
  Omit<ContainerProps, "padding" | "margin">
> = (props) => <Container padding="lg" margin="md" {...props} />;

export default Container;
