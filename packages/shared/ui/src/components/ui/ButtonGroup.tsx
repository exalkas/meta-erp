import React from "react";
import { ButtonProps } from "./Button";

export interface ButtonGroupProps {
  children: React.ReactNode;
  orientation?: "horizontal" | "vertical";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "destructive"
    | "success";
  fullWidth?: boolean;
  attached?: boolean;
  className?: string;
}

export interface ButtonGroupItemProps extends ButtonProps {
  isFirst?: boolean;
  isLast?: boolean;
  isMiddle?: boolean;
}

const getButtonGroupClasses = (
  orientation: "horizontal" | "vertical",
  attached: boolean,
  fullWidth: boolean,
  className?: string
) => {
  const baseClasses = attached
    ? "inline-flex"
    : orientation === "horizontal"
    ? "inline-flex space-x-2"
    : "inline-flex flex-col space-y-2";

  const orientationClasses = {
    horizontal: attached ? "flex-row" : "",
    vertical: attached ? "flex-col" : "",
  };

  const widthClasses = fullWidth ? "w-full" : "";

  return [baseClasses, orientationClasses[orientation], widthClasses, className]
    .filter(Boolean)
    .join(" ");
};

const getAttachedButtonClasses = (
  orientation: "horizontal" | "vertical",
  position: "first" | "middle" | "last" | "only"
) => {
  if (orientation === "horizontal") {
    switch (position) {
      case "first":
        return "rounded-l-md rounded-r-none border-r-0";
      case "middle":
        return "rounded-none border-r-0";
      case "last":
        return "rounded-r-md rounded-l-none";
      case "only":
        return "rounded-md";
      default:
        return "";
    }
  } else {
    switch (position) {
      case "first":
        return "rounded-t-md rounded-b-none border-b-0";
      case "middle":
        return "rounded-none border-b-0";
      case "last":
        return "rounded-b-md rounded-t-none";
      case "only":
        return "rounded-md";
      default:
        return "";
    }
  }
};

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  orientation = "horizontal",
  size = "md",
  variant = "primary",
  fullWidth = false,
  attached = false,
  className = "",
}) => {
  const classes = getButtonGroupClasses(
    orientation,
    attached,
    fullWidth,
    className
  );

  const childrenArray = React.Children.toArray(children);
  const childCount = childrenArray.length;

  const enhancedChildren = childrenArray.map((child, index) => {
    if (React.isValidElement(child)) {
      const isFirst = index === 0;
      const isLast = index === childCount - 1;
      const isMiddle = !isFirst && !isLast;
      const isOnly = childCount === 1;

      let position: "first" | "middle" | "last" | "only" = "middle";
      if (isOnly) position = "only";
      else if (isFirst) position = "first";
      else if (isLast) position = "last";

      const additionalProps: Partial<ButtonProps> = {
        size: child.props.size || size,
        variant: child.props.variant || variant,
        fullWidth: attached && fullWidth,
      };

      if (attached) {
        const attachedClasses = getAttachedButtonClasses(orientation, position);
        additionalProps.className = [child.props.className, attachedClasses]
          .filter(Boolean)
          .join(" ");
      } else if (fullWidth) {
        additionalProps.fullWidth = true;
      }

      return React.cloneElement(child, {
        key: index,
        ...additionalProps,
      });
    }
    return child;
  });

  return <div className={classes}>{enhancedChildren}</div>;
};

// Specialized ButtonGroup variants
export const HorizontalButtonGroup: React.FC<
  Omit<ButtonGroupProps, "orientation">
> = (props) => <ButtonGroup orientation="horizontal" {...props} />;

export const VerticalButtonGroup: React.FC<
  Omit<ButtonGroupProps, "orientation">
> = (props) => <ButtonGroup orientation="vertical" {...props} />;

export const AttachedButtonGroup: React.FC<
  Omit<ButtonGroupProps, "attached">
> = (props) => <ButtonGroup attached={true} {...props} />;

export const FullWidthButtonGroup: React.FC<
  Omit<ButtonGroupProps, "fullWidth">
> = (props) => <ButtonGroup fullWidth={true} {...props} />;

export default ButtonGroup;
