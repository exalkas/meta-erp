import React from "react";

export interface DividerProps {
  orientation?: "horizontal" | "vertical";
  variant?: "solid" | "dashed" | "dotted" | "double";
  size?: "thin" | "medium" | "thick";
  color?:
    | "gray"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "error"
    | "custom";
  customColor?: string;
  label?: string;
  labelPosition?: "left" | "center" | "right";
  spacing?: "none" | "sm" | "md" | "lg" | "xl";
  className?: string;
  labelClassName?: string;
  length?: string;
  inset?: boolean;
  fadeEdges?: boolean;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = "horizontal",
  variant = "solid",
  size = "thin",
  color = "gray",
  customColor,
  label,
  labelPosition = "center",
  spacing = "md",
  className = "",
  labelClassName = "",
  length,
  inset = false,
  fadeEdges = false,
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case "dashed":
        return "border-dashed";
      case "dotted":
        return "border-dotted";
      case "double":
        return "border-double";
      default:
        return "border-solid";
    }
  };

  const getSizeClass = () => {
    if (orientation === "horizontal") {
      switch (size) {
        case "medium":
          return "border-t-2";
        case "thick":
          return "border-t-4";
        default:
          return "border-t";
      }
    } else {
      switch (size) {
        case "medium":
          return "border-l-2";
        case "thick":
          return "border-l-4";
        default:
          return "border-l";
      }
    }
  };

  const getColorClass = () => {
    if (color === "custom" && customColor) {
      return `border-[${customColor}]`;
    }

    switch (color) {
      case "primary":
        return "border-[#0066CC]";
      case "secondary":
        return "border-gray-500";
      case "success":
        return "border-green-500";
      case "warning":
        return "border-amber-500";
      case "error":
        return "border-red-500";
      default:
        return "border-gray-300";
    }
  };

  const getSpacingClass = () => {
    if (orientation === "horizontal") {
      switch (spacing) {
        case "none":
          return "";
        case "sm":
          return "my-2";
        case "lg":
          return "my-8";
        case "xl":
          return "my-12";
        default:
          return "my-4";
      }
    } else {
      switch (spacing) {
        case "none":
          return "";
        case "sm":
          return "mx-2";
        case "lg":
          return "mx-8";
        case "xl":
          return "mx-12";
        default:
          return "mx-4";
      }
    }
  };

  const getLengthClass = () => {
    if (length) {
      return orientation === "horizontal" ? `w-[${length}]` : `h-[${length}]`;
    }
    return orientation === "horizontal" ? "w-full" : "h-full";
  };

  const getInsetClass = () => {
    if (!inset) return "";
    return orientation === "horizontal" ? "mx-4" : "my-4";
  };

  const getFadeClass = () => {
    if (!fadeEdges) return "";
    return orientation === "horizontal"
      ? "bg-gradient-to-r from-transparent via-current to-transparent"
      : "bg-gradient-to-b from-transparent via-current to-transparent";
  };

  const renderHorizontalDivider = () => {
    if (!label) {
      return (
        <div
          className={`
            ${getVariantClass()}
            ${getSizeClass()}
            ${getColorClass()}
            ${getSpacingClass()}
            ${getLengthClass()}
            ${getInsetClass()}
            ${getFadeClass()}
            ${className}
          `}
        />
      );
    }

    const labelPositionClass = {
      left: "justify-start",
      center: "justify-center",
      right: "justify-end",
    }[labelPosition];

    return (
      <div
        className={`relative flex items-center ${getSpacingClass()} ${getLengthClass()} ${getInsetClass()} ${className}`}
      >
        <div
          className={`flex-1 ${labelPosition === "left" ? "max-w-[20%]" : ""}`}
        >
          {(labelPosition === "center" || labelPosition === "right") && (
            <div
              className={`
                ${getVariantClass()}
                ${getSizeClass()}
                ${getColorClass()}
                ${getFadeClass()}
                w-full
              `}
            />
          )}
        </div>

        <div className={`px-4 ${labelClassName}`}>
          <span className="text-sm text-gray-600 bg-white px-2">{label}</span>
        </div>

        <div
          className={`flex-1 ${labelPosition === "right" ? "max-w-[20%]" : ""}`}
        >
          {(labelPosition === "center" || labelPosition === "left") && (
            <div
              className={`
                ${getVariantClass()}
                ${getSizeClass()}
                ${getColorClass()}
                ${getFadeClass()}
                w-full
              `}
            />
          )}
        </div>
      </div>
    );
  };

  const renderVerticalDivider = () => {
    if (!label) {
      return (
        <div
          className={`
            ${getVariantClass()}
            ${getSizeClass()}
            ${getColorClass()}
            ${getSpacingClass()}
            ${getLengthClass()}
            ${getInsetClass()}
            ${getFadeClass()}
            ${className}
          `}
        />
      );
    }

    return (
      <div
        className={`relative flex flex-col items-center ${getSpacingClass()} ${getLengthClass()} ${getInsetClass()} ${className}`}
      >
        <div
          className={`flex-1 ${labelPosition === "left" ? "max-h-[20%]" : ""}`}
        >
          {(labelPosition === "center" || labelPosition === "right") && (
            <div
              className={`
                ${getVariantClass()}
                ${getSizeClass()}
                ${getColorClass()}
                ${getFadeClass()}
                h-full
              `}
            />
          )}
        </div>

        <div className={`py-4 ${labelClassName}`}>
          <span className="text-sm text-gray-600 bg-white px-2 whitespace-nowrap">
            {label}
          </span>
        </div>

        <div
          className={`flex-1 ${labelPosition === "right" ? "max-h-[20%]" : ""}`}
        >
          {(labelPosition === "center" || labelPosition === "left") && (
            <div
              className={`
                ${getVariantClass()}
                ${getSizeClass()}
                ${getColorClass()}
                ${getFadeClass()}
                h-full
              `}
            />
          )}
        </div>
      </div>
    );
  };

  return orientation === "horizontal"
    ? renderHorizontalDivider()
    : renderVerticalDivider();
};

// Helper components for common patterns
export const HorizontalDivider: React.FC<Omit<DividerProps, "orientation">> = (
  props
) => <Divider {...props} orientation="horizontal" />;

export const VerticalDivider: React.FC<Omit<DividerProps, "orientation">> = (
  props
) => <Divider {...props} orientation="vertical" />;

export const SectionDivider: React.FC<
  Omit<DividerProps, "spacing" | "size">
> = (props) => <Divider {...props} spacing="lg" size="medium" />;

export const InlineDivider: React.FC<
  Omit<DividerProps, "spacing" | "orientation">
> = (props) => <Divider {...props} spacing="none" orientation="vertical" />;

export default Divider;
