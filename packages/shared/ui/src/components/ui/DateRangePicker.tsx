import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "../../contexts/TranslationContext";

interface DateRangePickerProps {
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
  startDate?: Date;
  endDate?: Date;
  minDate?: Date;
  maxDate?: Date;
  onChange?: (startDate: Date | null, endDate: Date | null) => void;
  placeholder?: string;
  format?: string;
  clearable?: boolean;
  showWeekNumbers?: boolean;
  disabledDates?: Date[];
  disabledDays?: number[];
  presets?: Array<{
    label: string;
    value: [Date, Date];
  }>;
  allowSingleDate?: boolean;
  maxRange?: number; // Maximum days between start and end
  minRange?: number; // Minimum days between start and end
}

interface CalendarProps {
  date: Date;
  startDate?: Date;
  endDate?: Date;
  hoverDate?: Date;
  onDateClick: (date: Date) => void;
  onDateHover: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  disabledDays?: number[];
  showWeekNumbers?: boolean;
}

const Calendar: React.FC<CalendarProps> = ({
  date,
  startDate,
  endDate,
  hoverDate,
  onDateClick,
  onDateHover,
  minDate,
  maxDate,
  disabledDates,
  disabledDays,
  showWeekNumbers,
}) => {
  const { t, language } = useTranslation();
  const [currentDate, setCurrentDate] = useState(date);

  const monthNames =
    language === "el"
      ? [
          "Ιανουάριος",
          "Φεβρουάριος",
          "Μάρτιος",
          "Απρίλιος",
          "Μάιος",
          "Ιούνιος",
          "Ιούλιος",
          "Αύγουστος",
          "Σεπτέμβριος",
          "Οκτώβριος",
          "Νοέμβριος",
          "Δεκέμβριος",
        ]
      : [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];

  const dayNames =
    language === "el"
      ? ["Κυ", "Δε", "Τρ", "Τε", "Πε", "Πα", "Σα"]
      : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= totalDays; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const isDateDisabled = (date: Date) => {
    if (!date) return false;

    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;

    if (disabledDays && disabledDays.includes(date.getDay())) return true;

    if (disabledDates) {
      return disabledDates.some(
        (disabledDate) => disabledDate.toDateString() === date.toDateString()
      );
    }

    return false;
  };

  const isDateInRange = (date: Date) => {
    if (!startDate || !endDate) return false;
    return date >= startDate && date <= endDate;
  };

  const isDateInHoverRange = (date: Date) => {
    if (!startDate || !hoverDate || endDate) return false;
    const start = startDate < hoverDate ? startDate : hoverDate;
    const end = startDate < hoverDate ? hoverDate : startDate;
    return date >= start && date <= end;
  };

  const isDateSelected = (date: Date) => {
    if (!startDate && !endDate) return false;
    return (
      (startDate && date.toDateString() === startDate.toDateString()) ||
      (endDate && date.toDateString() === endDate.toDateString())
    );
  };

  const getWeekNumber = (date: Date) => {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const dayOfYear = Math.floor(
      (date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
    );
    return Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
  };

  const days = getDaysInMonth(currentDate);
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return;
    onDateClick(date);
  };

  const handleDateHover = (date: Date) => {
    if (isDateDisabled(date)) return;
    onDateHover(date);
  };

  return (
    <div className="p-4 bg-white border rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label={t("previous_month")}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <h2 className="text-lg font-semibold">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>

        <button
          type="button"
          onClick={goToNextMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label={t("next_month")}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {showWeekNumbers && (
          <div className="text-xs text-gray-500 text-center p-2 font-medium">
            {language === "el" ? "Εβδ" : "Wk"}
          </div>
        )}

        {dayNames.map((day, index) => (
          <div
            key={index}
            className="text-xs text-gray-500 text-center p-2 font-medium"
          >
            {day}
          </div>
        ))}

        {weeks.map((week, weekIndex) => (
          <React.Fragment key={weekIndex}>
            {showWeekNumbers && (
              <div className="text-xs text-gray-500 text-center p-2">
                {week.find((day) => day)
                  ? getWeekNumber(week.find((day) => day)!)
                  : ""}
              </div>
            )}

            {week.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className={`
                  p-2 text-center text-sm cursor-pointer relative
                  ${!day ? "invisible" : ""}
                  ${
                    day && isDateDisabled(day)
                      ? "text-gray-300 cursor-not-allowed"
                      : ""
                  }
                  ${
                    day && isDateSelected(day)
                      ? "bg-blue-600 text-white rounded-full"
                      : ""
                  }
                  ${
                    day && isDateInRange(day) && !isDateSelected(day)
                      ? "bg-blue-100 text-blue-800"
                      : ""
                  }
                  ${
                    day && isDateInHoverRange(day) && !isDateSelected(day)
                      ? "bg-blue-50 text-blue-600"
                      : ""
                  }
                  ${
                    day &&
                    !isDateDisabled(day) &&
                    !isDateSelected(day) &&
                    !isDateInRange(day)
                      ? "hover:bg-gray-100"
                      : ""
                  }
                `}
                onClick={() => day && handleDateClick(day)}
                onMouseEnter={() => day && handleDateHover(day)}
                role="gridcell"
                aria-selected={day ? isDateSelected(day) : false}
                aria-disabled={day ? isDateDisabled(day) : false}
              >
                {day ? day.getDate() : ""}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
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
  startDate,
  endDate,
  minDate,
  maxDate,
  onChange,
  placeholder,
  format = "dd/MM/yyyy",
  clearable = false,
  showWeekNumbers = false,
  disabledDates,
  disabledDays,
  presets,
  allowSingleDate = false,
  maxRange,
  minRange,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [internalStartDate, setInternalStartDate] = useState<Date | null>(
    startDate || null
  );
  const [internalEndDate, setInternalEndDate] = useState<Date | null>(
    endDate || null
  );
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3 text-base",
    lg: "px-5 py-4 text-lg",
  };

  const variantClasses = {
    default: "border border-gray-300 bg-white",
    filled: "border-0 bg-gray-100",
    outlined: "border-2 border-gray-300 bg-transparent",
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const formatDate = (date: Date) => {
    const { language } = useTranslation();
    return date.toLocaleDateString(language === "el" ? "el-GR" : "en-US");
  };

  const getDisplayValue = () => {
    if (internalStartDate && internalEndDate) {
      return `${formatDate(internalStartDate)} - ${formatDate(
        internalEndDate
      )}`;
    }
    if (internalStartDate) {
      return formatDate(internalStartDate);
    }
    return "";
  };

  const handleDateClick = (date: Date) => {
    if (!internalStartDate || (internalStartDate && internalEndDate)) {
      // First click or reset
      setInternalStartDate(date);
      setInternalEndDate(null);
      setHoverDate(null);
    } else {
      // Second click
      if (date < internalStartDate) {
        setInternalStartDate(date);
        setInternalEndDate(internalStartDate);
      } else {
        setInternalEndDate(date);
      }

      if (
        allowSingleDate &&
        date.toDateString() === internalStartDate.toDateString()
      ) {
        setInternalEndDate(null);
      }

      setHoverDate(null);
      setIsOpen(false);
    }
  };

  const handleDateHover = (date: Date) => {
    if (internalStartDate && !internalEndDate) {
      setHoverDate(date);
    }
  };

  const handleClear = () => {
    setInternalStartDate(null);
    setInternalEndDate(null);
    setHoverDate(null);
    onChange?.(null, null);
  };

  const handlePresetClick = (preset: [Date, Date]) => {
    const [start, end] = preset;
    setInternalStartDate(start);
    setInternalEndDate(end);
    onChange?.(start, end);
    setIsOpen(false);
  };

  // Update external state when internal state changes
  useEffect(() => {
    if (internalStartDate && internalEndDate) {
      onChange?.(internalStartDate, internalEndDate);
    }
  }, [internalStartDate, internalEndDate, onChange]);

  return (
    <div
      className={`relative ${fullWidth ? "w-full" : ""} ${className}`}
      ref={containerRef}
    >
      {label && (
        <label
          htmlFor={id}
          className={`block text-sm font-medium text-gray-700 mb-1 ${
            required ? "after:content-['*'] after:text-red-500 after:ml-1" : ""
          }`}
        >
          {label}
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          id={id}
          value={getDisplayValue()}
          placeholder={placeholder || t("select_date_range")}
          className={`
            ${sizeClasses[size]}
            ${variantClasses[variant]}
            ${fullWidth ? "w-full" : ""}
            ${disabled ? "bg-gray-100 cursor-not-allowed" : "cursor-pointer"}
            ${
              error
                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                : "focus:border-blue-500 focus:ring-blue-500"
            }
            rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-colors
            pr-10
          `}
          disabled={disabled}
          readOnly
          onClick={() => !disabled && setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          aria-label={label || t("select_date_range")}
        />

        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg
            className={`w-5 h-5 text-gray-400 ${
              isOpen ? "rotate-180" : ""
            } transition-transform`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>

        {clearable && (internalStartDate || internalEndDate) && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-8 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            aria-label={t("clear")}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 bg-white border rounded-lg shadow-lg">
          <div className="flex">
            {presets && presets.length > 0 && (
              <div className="border-r p-4 min-w-max">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  {t("quick_select")}
                </h3>
                <div className="space-y-1">
                  {presets.map((preset, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handlePresetClick(preset.value)}
                      className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Calendar
              date={currentMonth}
              startDate={internalStartDate || undefined}
              endDate={internalEndDate || undefined}
              hoverDate={hoverDate || undefined}
              onDateClick={handleDateClick}
              onDateHover={handleDateHover}
              minDate={minDate}
              maxDate={maxDate}
              disabledDates={disabledDates}
              disabledDays={disabledDays}
              showWeekNumbers={showWeekNumbers}
            />
          </div>
        </div>
      )}

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

export default DateRangePicker;
