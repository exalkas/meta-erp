import React from "react";

export interface SpacerProps {
  size?: number | string;
  direction?: "horizontal" | "vertical" | "both";
  grow?: boolean;
  shrink?: boolean;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export const Spacer: React.FC<SpacerProps> = ({
  size,
  direction = "both",
  grow = false,
  shrink = false,
  className = "",
  as: Component = "div",
}) => {
  const getSizeClass = () => {
    if (size === undefined) return "";

    const sizeValue = typeof size === "number" ? `${size}px` : size;

    switch (direction) {
      case "horizontal":
        return `w-[${sizeValue}]`;
      case "vertical":
        return `h-[${sizeValue}]`;
      case "both":
        return `w-[${sizeValue}] h-[${sizeValue}]`;
      default:
        return "";
    }
  };

  const getFlexClass = () => {
    const classes = [];

    if (grow) {
      classes.push("flex-grow");
    }

    if (shrink) {
      classes.push("flex-shrink");
    }

    if (!grow && !shrink) {
      classes.push("flex-shrink-0");
    }

    return classes.join(" ");
  };

  const getDefaultSizeClass = () => {
    if (size !== undefined) return "";

    // Default sizes when no size is specified
    switch (direction) {
      case "horizontal":
        return "w-4";
      case "vertical":
        return "h-4";
      case "both":
        return "w-4 h-4";
      default:
        return "";
    }
  };

  const spacerClasses = [
    getSizeClass(),
    getDefaultSizeClass(),
    getFlexClass(),
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <Component className={spacerClasses} />;
};

// Helper components for common patterns
export const HorizontalSpacer: React.FC<Omit<SpacerProps, "direction">> = (
  props
) => <Spacer {...props} direction="horizontal" />;

export const VerticalSpacer: React.FC<Omit<SpacerProps, "direction">> = (
  props
) => <Spacer {...props} direction="vertical" />;

export const FlexSpacer: React.FC<Omit<SpacerProps, "grow" | "shrink">> = (
  props
) => <Spacer {...props} grow shrink />;

export const FixedSpacer: React.FC<Omit<SpacerProps, "grow" | "shrink">> = (
  props
) => <Spacer {...props} grow={false} shrink={false} />;

// Predefined spacing sizes
export const SpacerXS: React.FC<Omit<SpacerProps, "size">> = (props) => (
  <Spacer {...props} size="0.25rem" />
);

export const SpacerSM: React.FC<Omit<SpacerProps, "size">> = (props) => (
  <Spacer {...props} size="0.5rem" />
);

export const SpacerMD: React.FC<Omit<SpacerProps, "size">> = (props) => (
  <Spacer {...props} size="1rem" />
);

export const SpacerLG: React.FC<Omit<SpacerProps, "size">> = (props) => (
  <Spacer {...props} size="1.5rem" />
);

export const SpacerXL: React.FC<Omit<SpacerProps, "size">> = (props) => (
  <Spacer {...props} size="2rem" />
);

export const Spacer2XL: React.FC<Omit<SpacerProps, "size">> = (props) => (
  <Spacer {...props} size="3rem" />
);

export const Spacer3XL: React.FC<Omit<SpacerProps, "size">> = (props) => (
  <Spacer {...props} size="4rem" />
);

export default Spacer;
