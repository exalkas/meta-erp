import React, { forwardRef, useState, useRef, useEffect } from "react";
import { useTranslation } from "../../contexts/TranslationContext";

export interface TimePickerProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "size" | "value"
  > {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  variant?: "default" | "filled" | "outlined";
  size?: "sm" | "md" | "lg";
  clearable?: boolean;
  placeholder?: string;
  value?: string; // Format: "HH:mm"
  onChange?: (time: string | null) => void;
  onClear?: () => void;
  format?: "12h" | "24h";
  step?: number; // Minutes step
  minTime?: string;
  maxTime?: string;
  disabledTimes?: string[];
  showSeconds?: boolean;
  showNowButton?: boolean;
  showClearButton?: boolean;
  timeClassName?: string;
}

const baseClasses =
  "w-full px-3 py-2 border rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed";

const variantClasses = {
  default: "border-gray-300 bg-white",
  filled: "border-gray-300 bg-gray-50",
  outlined: "border-2 border-gray-300 bg-white",
};

const sizeClasses = {
  sm: "text-sm px-2 py-1",
  md: "text-base px-3 py-2",
  lg: "text-lg px-4 py-3",
};

const errorClasses = "border-red-500 focus:ring-red-500 focus:border-red-500";

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const ChevronUpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 15l7-7 7 7"
    />
  </svg>
);

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

const TimeSpinner: React.FC<{
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
  format?: (value: number) => string;
}> = ({ value, onChange, min, max, step = 1, label, format }) => {
  const increment = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  const decrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  const displayValue = format
    ? format(value)
    : value.toString().padStart(2, "0");

  return (
    <div className="flex flex-col items-center space-y-1">
      <button
        type="button"
        onClick={increment}
        className="p-1 hover:bg-gray-100 rounded"
      >
        <ChevronUpIcon className="w-4 h-4" />
      </button>

      <input
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        className="w-16 text-center border rounded px-2 py-1 text-sm"
        aria-label={label}
      />

      <button
        type="button"
        onClick={decrement}
        className="p-1 hover:bg-gray-100 rounded"
      >
        <ChevronDownIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

const TimePicker: React.FC<{
  value?: string;
  onChange: (time: string) => void;
  format?: "12h" | "24h";
  step?: number;
  showSeconds?: boolean;
  showNowButton?: boolean;
  showClearButton?: boolean;
  onClear?: () => void;
  className?: string;
}> = ({
  value,
  onChange,
  format = "24h",
  step = 1,
  showSeconds = false,
  showNowButton = true,
  showClearButton = true,
  onClear,
  className = "",
}) => {
  const { t } = useTranslation();

  const parseTime = (timeStr: string) => {
    const [hours, minutes, seconds] = timeStr.split(":").map(Number);
    return {
      hours: hours || 0,
      minutes: minutes || 0,
      seconds: seconds || 0,
    };
  };

  const formatTime = (hours: number, minutes: number, seconds: number) => {
    const h = hours.toString().padStart(2, "0");
    const m = minutes.toString().padStart(2, "0");
    const s = seconds.toString().padStart(2, "0");
    return showSeconds ? `${h}:${m}:${s}` : `${h}:${m}`;
  };

  const currentTime = value
    ? parseTime(value)
    : { hours: 0, minutes: 0, seconds: 0 };

  const handleHourChange = (hours: number) => {
    const newTime = formatTime(hours, currentTime.minutes, currentTime.seconds);
    onChange(newTime);
  };

  const handleMinuteChange = (minutes: number) => {
    const newTime = formatTime(currentTime.hours, minutes, currentTime.seconds);
    onChange(newTime);
  };

  const handleSecondChange = (seconds: number) => {
    const newTime = formatTime(currentTime.hours, currentTime.minutes, seconds);
    onChange(newTime);
  };

  const handleNow = () => {
    const now = new Date();
    const timeStr = formatTime(
      now.getHours(),
      now.getMinutes(),
      now.getSeconds()
    );
    onChange(timeStr);
  };

  const formatHour = (hour: number) => {
    if (format === "12h") {
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return displayHour.toString().padStart(2, "0");
    }
    return hour.toString().padStart(2, "0");
  };

  const getAmPm = (hour: number) => {
    return hour >= 12 ? "PM" : "AM";
  };

  const handleAmPmChange = (isPm: boolean) => {
    const newHour = isPm ? currentTime.hours + 12 : currentTime.hours - 12;
    const clampedHour = Math.max(0, Math.min(23, newHour));
    handleHourChange(clampedHour);
  };

  const maxHour = format === "12h" ? 12 : 23;
  const minHour = format === "12h" ? 1 : 0;

  return (
    <div
      className={`bg-white border border-gray-300 rounded-md shadow-lg p-4 ${className}`}
    >
      <div className="flex items-center justify-center space-x-4">
        {/* Hours */}
        <TimeSpinner
          value={
            format === "12h"
              ? currentTime.hours === 0
                ? 12
                : currentTime.hours > 12
                ? currentTime.hours - 12
                : currentTime.hours
              : currentTime.hours
          }
          onChange={handleHourChange}
          min={minHour}
          max={maxHour}
          label={t("hours")}
          format={formatHour}
        />

        <div className="text-xl font-semibold">:</div>

        {/* Minutes */}
        <TimeSpinner
          value={currentTime.minutes}
          onChange={handleMinuteChange}
          min={0}
          max={59}
          step={step}
          label={t("minutes")}
        />

        {showSeconds && (
          <>
            <div className="text-xl font-semibold">:</div>
            <TimeSpinner
              value={currentTime.seconds}
              onChange={handleSecondChange}
              min={0}
              max={59}
              label={t("seconds")}
            />
          </>
        )}

        {format === "12h" && (
          <div className="flex flex-col space-y-1">
            <button
              type="button"
              onClick={() => handleAmPmChange(false)}
              className={`px-2 py-1 text-sm rounded ${
                currentTime.hours < 12
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              AM
            </button>
            <button
              type="button"
              onClick={() => handleAmPmChange(true)}
              className={`px-2 py-1 text-sm rounded ${
                currentTime.hours >= 12
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              PM
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-4 mt-4 border-t">
        <div className="flex space-x-2">
          {showNowButton && (
            <button
              onClick={handleNow}
              className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
            >
              {t("now")}
            </button>
          )}
          {showClearButton && (
            <button
              onClick={onClear}
              className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
            >
              {t("clear")}
            </button>
          )}
        </div>

        <div className="text-xs text-gray-500">
          {value || t("no_time_selected")}
        </div>
      </div>
    </div>
  );
};

export const TimePickerComponent = forwardRef<HTMLDivElement, TimePickerProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      variant = "default",
      size = "md",
      clearable = false,
      placeholder,
      value,
      onChange,
      onClear,
      format = "24h",
      step = 1,
      minTime,
      maxTime,
      disabledTimes,
      showSeconds = false,
      showNowButton = true,
      showClearButton = true,
      timeClassName = "",
      disabled,
      className = "",
      ...props
    },
    ref
  ) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const formatDisplayTime = (timeStr: string) => {
      if (!timeStr) return "";

      const [hours, minutes, seconds] = timeStr.split(":").map(Number);

      if (format === "12h") {
        const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        const ampm = hours >= 12 ? "PM" : "AM";
        const formattedTime = showSeconds
          ? `${displayHour.toString().padStart(2, "0")}:${minutes
              .toString()
              .padStart(2, "0")}:${seconds.toString().padStart(2, "0")} ${ampm}`
          : `${displayHour.toString().padStart(2, "0")}:${minutes
              .toString()
              .padStart(2, "0")} ${ampm}`;
        return formattedTime;
      }

      return showSeconds
        ? `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        : `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}`;
    };

    const handleTimeChange = (time: string) => {
      onChange?.(time);
    };

    const handleClear = () => {
      onChange?.(null);
      onClear?.();
      setIsOpen(false);
    };

    const handleInputClick = () => {
      if (disabled) return;
      setIsOpen(!isOpen);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case "Enter":
          e.preventDefault();
          setIsOpen(!isOpen);
          break;
        case "Escape":
          setIsOpen(false);
          break;
        case "Tab":
          setIsOpen(false);
          break;
      }
    };

    // Close time picker when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          ref &&
          "current" in ref &&
          ref.current &&
          !ref.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, [ref]);

    const inputClasses = [
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      error ? errorClasses : "",
      fullWidth ? "w-full" : "",
      "cursor-pointer",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={fullWidth ? "w-full" : ""}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <div className="relative" ref={ref}>
          <div
            className={inputClasses}
            onClick={handleInputClick}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="button"
            aria-label={label}
            aria-expanded={isOpen}
            aria-haspopup="dialog"
          >
            <div className="flex items-center justify-between">
              <span className={value ? "text-gray-900" : "text-gray-500"}>
                {value
                  ? formatDisplayTime(value)
                  : placeholder || t("select_time")}
              </span>
              <div className="flex items-center space-x-1">
                {clearable && value && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClear();
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                )}
                <ClockIcon className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          {isOpen && (
            <div className="absolute z-50 mt-1">
              <TimePicker
                value={value}
                onChange={handleTimeChange}
                format={format}
                step={step}
                showSeconds={showSeconds}
                showNowButton={showNowButton}
                showClearButton={showClearButton}
                onClear={handleClear}
                className={timeClassName}
              />
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

TimePickerComponent.displayName = "TimePicker";

export default TimePickerComponent;
