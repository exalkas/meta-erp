import React, { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "../../contexts/TranslationContext";

interface SliderProps {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "filled" | "outlined";
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number | number[];
  defaultValue?: number | number[];
  onChange?: (value: number | number[]) => void;
  onChangeCommitted?: (value: number | number[]) => void;
  orientation?: "horizontal" | "vertical";
  color?: "primary" | "secondary" | "success" | "warning" | "error";
  showValue?: boolean;
  showTicks?: boolean;
  marks?: Array<{
    value: number;
    label?: string;
  }>;
  range?: boolean;
  tooltip?: boolean;
  formatValue?: (value: number) => string;
  thumbProps?: {
    "aria-label"?: string;
    "aria-labelledby"?: string;
  };
}

interface SliderThumbProps {
  value: number;
  index: number;
  size: "sm" | "md" | "lg";
  color: "primary" | "secondary" | "success" | "warning" | "error";
  variant: "default" | "filled" | "outlined";
  disabled: boolean;
  dragging: boolean;
  position: number;
  onMouseDown: (e: React.MouseEvent, index: number) => void;
  onTouchStart: (e: React.TouchEvent, index: number) => void;
  tooltip?: boolean;
  formatValue?: (value: number) => string;
  thumbProps?: {
    "aria-label"?: string;
    "aria-labelledby"?: string;
  };
}

const SliderThumb: React.FC<SliderThumbProps> = ({
  value,
  index,
  size,
  color,
  variant,
  disabled,
  dragging,
  position,
  onMouseDown,
  onTouchStart,
  tooltip,
  formatValue,
  thumbProps,
}) => {
  const { t } = useTranslation();
  const [showTooltip, setShowTooltip] = useState(false);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const colorClasses = {
    primary: "bg-blue-500 border-blue-500",
    secondary: "bg-gray-500 border-gray-500",
    success: "bg-green-500 border-green-500",
    warning: "bg-yellow-500 border-yellow-500",
    error: "bg-red-500 border-red-500",
  };

  const variantClasses = {
    default: "border-2 bg-white shadow-sm",
    filled: "border-2 shadow-md",
    outlined: "border-4 bg-white",
  };

  const displayValue = formatValue ? formatValue(value) : value.toString();

  return (
    <div
      className={`
        absolute top-1/2 -translate-y-1/2 -translate-x-1/2
        ${sizeClasses[size]}
        ${colorClasses[color]}
        ${variantClasses[variant]}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-grab"}
        ${dragging ? "cursor-grabbing scale-110" : ""}
        ${!disabled ? "hover:scale-105" : ""}
        rounded-full
        transition-all duration-200
        z-10
      `}
      style={{ left: `${position}%` }}
      onMouseDown={(e) => !disabled && onMouseDown(e, index)}
      onTouchStart={(e) => !disabled && onTouchStart(e, index)}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      role="slider"
      aria-valuenow={value}
      aria-valuetext={displayValue}
      tabIndex={disabled ? -1 : 0}
      {...thumbProps}
    >
      {tooltip && (showTooltip || dragging) && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap">
          {displayValue}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
};

const SliderTrack: React.FC<{
  size: "sm" | "md" | "lg";
  color: "primary" | "secondary" | "success" | "warning" | "error";
  variant: "default" | "filled" | "outlined";
  disabled: boolean;
  range?: boolean;
  value: number | number[];
  min: number;
  max: number;
}> = ({ size, color, variant, disabled, range, value, min, max }) => {
  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const colorClasses = {
    primary: "bg-blue-500",
    secondary: "bg-gray-500",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    error: "bg-red-500",
  };

  const variantClasses = {
    default: "rounded-full",
    filled: "rounded-full shadow-inner",
    outlined: "rounded-full border border-gray-300",
  };

  const getActiveTrackStyle = () => {
    if (Array.isArray(value)) {
      const [start, end] = value;
      const startPercent = ((start - min) / (max - min)) * 100;
      const endPercent = ((end - min) / (max - min)) * 100;
      return {
        left: `${startPercent}%`,
        width: `${endPercent - startPercent}%`,
      };
    } else {
      const percent = ((value - min) / (max - min)) * 100;
      return {
        left: "0%",
        width: `${percent}%`,
      };
    }
  };

  return (
    <div className="relative w-full flex items-center">
      {/* Background track */}
      <div
        className={`
          w-full
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${disabled ? "opacity-50" : ""}
          bg-gray-200
        `}
      />

      {/* Active track */}
      <div
        className={`
          absolute
          ${sizeClasses[size]}
          ${colorClasses[color]}
          ${variantClasses[variant]}
          ${disabled ? "opacity-50" : ""}
          transition-all duration-200
        `}
        style={getActiveTrackStyle()}
      />
    </div>
  );
};

const SliderMarks: React.FC<{
  marks: Array<{ value: number; label?: string }>;
  min: number;
  max: number;
  size: "sm" | "md" | "lg";
  disabled: boolean;
}> = ({ marks, min, max, size, disabled }) => {
  const markSizeClasses = {
    sm: "w-1 h-1",
    md: "w-1.5 h-1.5",
    lg: "w-2 h-2",
  };

  const labelSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className="absolute w-full">
      {marks.map((mark, index) => {
        const position = ((mark.value - min) / (max - min)) * 100;
        return (
          <div
            key={index}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
            style={{ left: `${position}%` }}
          >
            <div
              className={`
                ${markSizeClasses[size]}
                ${disabled ? "opacity-50" : ""}
                bg-gray-400 rounded-full
              `}
            />
            {mark.label && (
              <div
                className={`
                  ${labelSizeClasses[size]}
                  ${disabled ? "text-gray-400" : "text-gray-600"}
                  absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap
                `}
              >
                {mark.label}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export const Slider: React.FC<SliderProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  size = "md",
  variant = "default",
  disabled = false,
  required = false,
  className = "",
  id,
  min = 0,
  max = 100,
  step = 1,
  value: controlledValue,
  range = false,
  defaultValue = range ? [min, max] : min,
  onChange,
  onChangeCommitted,
  orientation = "horizontal",
  color = "primary",
  showValue = false,
  showTicks = false,
  marks = [],
  tooltip = false,
  formatValue,
  thumbProps,
}) => {
  const { t } = useTranslation();
  const [internalValue, setInternalValue] = useState<number | number[]>(
    Array.isArray(defaultValue)
      ? defaultValue
      : range
      ? [min, defaultValue as number]
      : defaultValue
  );
  const [dragging, setDragging] = useState(-1);
  const sliderRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;

  const normalizedValue = Array.isArray(currentValue)
    ? currentValue
    : range
    ? [min, currentValue as number]
    : currentValue;

  const getValueFromPosition = useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return min;

      const rect = sliderRef.current.getBoundingClientRect();
      const percent = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width)
      );
      const rawValue = min + percent * (max - min);

      // Round to nearest step
      const steppedValue = Math.round(rawValue / step) * step;
      return Math.max(min, Math.min(max, steppedValue));
    },
    [min, max, step]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent, index: number) => {
    e.preventDefault();
    setDragging(index);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent, index: number) => {
    e.preventDefault();
    setDragging(index);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (dragging === -1) return;

      const newValue = getValueFromPosition(e.clientX);
      let updatedValue: number | number[];

      if (Array.isArray(normalizedValue)) {
        updatedValue = [...normalizedValue];
        (updatedValue as number[])[dragging] = newValue;

        // Ensure proper order for range sliders
        if (range && updatedValue.length === 2) {
          updatedValue.sort((a, b) => a - b);
        }
      } else {
        updatedValue = newValue;
      }

      if (!isControlled) {
        setInternalValue(updatedValue);
      }

      onChange?.(updatedValue);
    },
    [
      dragging,
      getValueFromPosition,
      normalizedValue,
      range,
      isControlled,
      onChange,
    ]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (dragging === -1) return;

      const touch = e.touches[0];
      const newValue = getValueFromPosition(touch.clientX);
      let updatedValue: number | number[];

      if (Array.isArray(normalizedValue)) {
        updatedValue = [...normalizedValue];
        (updatedValue as number[])[dragging] = newValue;

        if (range && updatedValue.length === 2) {
          updatedValue.sort((a, b) => a - b);
        }
      } else {
        updatedValue = newValue;
      }

      if (!isControlled) {
        setInternalValue(updatedValue);
      }

      onChange?.(updatedValue);
    },
    [
      dragging,
      getValueFromPosition,
      normalizedValue,
      range,
      isControlled,
      onChange,
    ]
  );

  const handleMouseUp = useCallback(() => {
    if (dragging !== -1) {
      setDragging(-1);
      onChangeCommitted?.(currentValue);
    }
  }, [dragging, currentValue, onChangeCommitted]);

  const handleTouchEnd = useCallback(() => {
    if (dragging !== -1) {
      setDragging(-1);
      onChangeCommitted?.(currentValue);
    }
  }, [dragging, currentValue, onChangeCommitted]);

  useEffect(() => {
    if (dragging !== -1) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleTouchEnd);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [
    dragging,
    handleMouseMove,
    handleMouseUp,
    handleTouchMove,
    handleTouchEnd,
  ]);

  const getPosition = (value: number) => {
    return ((value - min) / (max - min)) * 100;
  };

  const renderThumbs = () => {
    if (Array.isArray(normalizedValue)) {
      return normalizedValue.map((value, index) => (
        <SliderThumb
          key={index}
          value={value}
          index={index}
          size={size}
          color={color}
          variant={variant}
          disabled={disabled}
          dragging={dragging === index}
          position={getPosition(value)}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          tooltip={tooltip}
          formatValue={formatValue}
          thumbProps={thumbProps}
        />
      ));
    } else {
      return (
        <SliderThumb
          value={normalizedValue as number}
          index={0}
          size={size}
          color={color}
          variant={variant}
          disabled={disabled}
          dragging={dragging === 0}
          position={getPosition(normalizedValue as number)}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          tooltip={tooltip}
          formatValue={formatValue}
          thumbProps={thumbProps}
        />
      );
    }
  };

  const displayValue = () => {
    if (Array.isArray(normalizedValue)) {
      return normalizedValue
        .map((v) => (formatValue ? formatValue(v) : v))
        .join(" - ");
    } else {
      return formatValue
        ? formatValue(normalizedValue as number)
        : normalizedValue;
    }
  };

  return (
    <div className={`${fullWidth ? "w-full" : ""} ${className}`}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor={id}
            className={`block text-sm font-medium text-gray-700 ${
              required
                ? "after:content-['*'] after:text-red-500 after:ml-1"
                : ""
            }`}
          >
            {label}
          </label>
          {showValue && (
            <span className="text-sm text-gray-500">{displayValue()}</span>
          )}
        </div>
      )}

      <div className="relative py-4">
        <div
          ref={sliderRef}
          className={`
            relative
            ${orientation === "horizontal" ? "w-full h-8" : "h-48 w-8"}
            ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
            flex items-center
          `}
          role="slider"
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={
            Array.isArray(normalizedValue)
              ? normalizedValue[0]
              : normalizedValue
          }
          aria-valuetext={displayValue().toString()}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 0}
        >
          <SliderTrack
            size={size}
            color={color}
            variant={variant}
            disabled={disabled}
            range={range}
            value={normalizedValue}
            min={min}
            max={max}
          />

          {marks.length > 0 && (
            <SliderMarks
              marks={marks}
              min={min}
              max={max}
              size={size}
              disabled={disabled}
            />
          )}

          {renderThumbs()}
        </div>

        {showTicks && (
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{formatValue ? formatValue(min) : min}</span>
            <span>{formatValue ? formatValue(max) : max}</span>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-600">{helperText}</p>
      )}
    </div>
  );
};

export default Slider;
