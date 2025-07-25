import React from "react";

export interface FlexProps {
  children: React.ReactNode;
  direction?: "row" | "row-reverse" | "col" | "col-reverse";
  wrap?: "wrap" | "nowrap" | "wrap-reverse";
  justify?: "start" | "end" | "center" | "between" | "around" | "evenly";
  align?: "start" | "end" | "center" | "stretch" | "baseline";
  gap?: number | string;
  gapX?: number | string;
  gapY?: number | string;
  flex?: string | number;
  grow?: boolean | number;
  shrink?: boolean | number;
  basis?: string | number;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export const Flex: React.FC<FlexProps> = ({
  children,
  direction = "row",
  wrap = "nowrap",
  justify = "start",
  align = "stretch",
  gap,
  gapX,
  gapY,
  flex,
  grow,
  shrink,
  basis,
  className = "",
  as: Component = "div",
}) => {
  const getDirectionClass = () => {
    switch (direction) {
      case "row-reverse":
        return "flex-row-reverse";
      case "col":
        return "flex-col";
      case "col-reverse":
        return "flex-col-reverse";
      default:
        return "flex-row";
    }
  };

  const getWrapClass = () => {
    switch (wrap) {
      case "wrap":
        return "flex-wrap";
      case "wrap-reverse":
        return "flex-wrap-reverse";
      default:
        return "flex-nowrap";
    }
  };

  const getJustifyClass = () => {
    switch (justify) {
      case "end":
        return "justify-end";
      case "center":
        return "justify-center";
      case "between":
        return "justify-between";
      case "around":
        return "justify-around";
      case "evenly":
        return "justify-evenly";
      default:
        return "justify-start";
    }
  };

  const getAlignClass = () => {
    switch (align) {
      case "start":
        return "items-start";
      case "end":
        return "items-end";
      case "center":
        return "items-center";
      case "baseline":
        return "items-baseline";
      default:
        return "items-stretch";
    }
  };

  const getGapClass = () => {
    const classes = [];

    if (gap !== undefined) {
      if (typeof gap === "number") {
        classes.push(`gap-${gap}`);
      } else {
        classes.push(`gap-[${gap}]`);
      }
    } else {
      if (gapX !== undefined) {
        if (typeof gapX === "number") {
          classes.push(`gap-x-${gapX}`);
        } else {
          classes.push(`gap-x-[${gapX}]`);
        }
      }
      if (gapY !== undefined) {
        if (typeof gapY === "number") {
          classes.push(`gap-y-${gapY}`);
        } else {
          classes.push(`gap-y-[${gapY}]`);
        }
      }
    }

    return classes.join(" ");
  };

  const getFlexClass = () => {
    const classes = [];

    if (flex !== undefined) {
      if (typeof flex === "number") {
        classes.push(`flex-${flex}`);
      } else {
        classes.push(`flex-[${flex}]`);
      }
    } else {
      if (grow !== undefined) {
        if (typeof grow === "boolean") {
          classes.push(grow ? "flex-grow" : "flex-grow-0");
        } else {
          classes.push(`flex-grow-${grow}`);
        }
      }
      if (shrink !== undefined) {
        if (typeof shrink === "boolean") {
          classes.push(shrink ? "flex-shrink" : "flex-shrink-0");
        } else {
          classes.push(`flex-shrink-${shrink}`);
        }
      }
      if (basis !== undefined) {
        if (typeof basis === "number") {
          classes.push(`flex-basis-${basis}`);
        } else {
          classes.push(`flex-basis-[${basis}]`);
        }
      }
    }

    return classes.join(" ");
  };

  const flexClasses = [
    "flex",
    getDirectionClass(),
    getWrapClass(),
    getJustifyClass(),
    getAlignClass(),
    getGapClass(),
    getFlexClass(),
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <Component className={flexClasses}>{children}</Component>;
};

// Helper components for common patterns
export const FlexRow: React.FC<Omit<FlexProps, "direction">> = (props) => (
  <Flex {...props} direction="row" />
);

export const FlexCol: React.FC<Omit<FlexProps, "direction">> = (props) => (
  <Flex {...props} direction="col" />
);

export const FlexCenter: React.FC<Omit<FlexProps, "justify" | "align">> = (
  props
) => <Flex {...props} justify="center" align="center" />;

export const FlexBetween: React.FC<Omit<FlexProps, "justify" | "align">> = (
  props
) => <Flex {...props} justify="between" align="center" />;

export const FlexWrap: React.FC<Omit<FlexProps, "wrap">> = (props) => (
  <Flex {...props} wrap="wrap" />
);

export default Flex;
