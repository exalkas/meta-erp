import React, { forwardRef, useState, useRef, useEffect } from "react";
import { useTranslation } from "../../contexts/TranslationContext";

export interface DatePickerProps
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
  value?: Date;
  onChange?: (date: Date | null) => void;
  onClear?: () => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  disabledDays?: number[]; // 0-6 (Sunday-Saturday)
  showWeekNumbers?: boolean;
  firstDayOfWeek?: 0 | 1; // 0: Sunday, 1: Monday
  locale?: "en" | "el";
  dateFormat?: string;
  showTodayButton?: boolean;
  showClearButton?: boolean;
  calendarClassName?: string;
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

const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d="M15 19l-7-7 7-7"
    />
  </svg>
);

const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d="M9 5l7 7-7 7"
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

const months = {
  en: [
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
  ],
  el: [
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
  ],
};

const weekdays = {
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  el: ["Κυρ", "Δευ", "Τρι", "Τετ", "Πεμ", "Παρ", "Σαβ"],
};

const Calendar: React.FC<{
  currentDate: Date;
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  disabledDays?: number[];
  showWeekNumbers?: boolean;
  firstDayOfWeek?: 0 | 1;
  locale?: "en" | "el";
  showTodayButton?: boolean;
  showClearButton?: boolean;
  onClear?: () => void;
  className?: string;
}> = ({
  currentDate,
  selectedDate,
  onDateSelect,
  onMonthChange,
  minDate,
  maxDate,
  disabledDates = [],
  disabledDays = [],
  showWeekNumbers = false,
  firstDayOfWeek = 1,
  locale = "en",
  showTodayButton = true,
  showClearButton = true,
  onClear,
  className = "",
}) => {
  const { t } = useTranslation();
  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    if (disabledDays.includes(date.getDay())) return true;
    return disabledDates.some(
      (disabledDate) => disabledDate.toDateString() === date.toDateString()
    );
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    return firstDayOfWeek === 0 ? firstDay : (firstDay + 6) % 7;
  };

  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear =
      (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const goToPreviousMonth = () => {
    const prevMonth = new Date(year, month - 1, 1);
    onMonthChange(prevMonth);
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(year, month + 1, 1);
    onMonthChange(nextMonth);
  };

  const goToToday = () => {
    onDateSelect(today);
  };

  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Previous month's trailing days
    const prevMonth = new Date(year, month - 1, 1);
    const daysInPrevMonth = getDaysInMonth(
      prevMonth.getFullYear(),
      prevMonth.getMonth()
    );

    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, daysInPrevMonth - i);
      days.push(
        <button
          key={`prev-${daysInPrevMonth - i}`}
          onClick={() => onDateSelect(date)}
          disabled={isDateDisabled(date)}
          className="w-8 h-8 text-xs text-gray-400 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {daysInPrevMonth - i}
        </button>
      );
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const disabled = isDateDisabled(date);
      const today = isToday(date);
      const selected = isSelected(date);

      days.push(
        <button
          key={day}
          onClick={() => onDateSelect(date)}
          disabled={disabled}
          className={`w-8 h-8 text-sm rounded-md transition-colors ${
            selected
              ? "bg-blue-600 text-white"
              : today
              ? "bg-blue-100 text-blue-600 font-semibold"
              : "text-gray-900 hover:bg-gray-100"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {day}
        </button>
      );
    }

    // Next month's leading days
    const remainingCells = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingCells; day++) {
      const date = new Date(year, month + 1, day);
      days.push(
        <button
          key={`next-${day}`}
          onClick={() => onDateSelect(date)}
          disabled={isDateDisabled(date)}
          className="w-8 h-8 text-xs text-gray-400 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const renderWeekNumbers = () => {
    const weekNumbers = [];
    const firstDayOfMonth = new Date(year, month, 1);

    for (let week = 0; week < 6; week++) {
      const weekStart = new Date(
        firstDayOfMonth.getTime() + week * 7 * 24 * 60 * 60 * 1000
      );
      const weekNumber = getWeekNumber(weekStart);
      weekNumbers.push(
        <div
          key={`week-${week}`}
          className="w-8 h-8 text-xs text-gray-500 flex items-center justify-center"
        >
          {weekNumber}
        </div>
      );
    }

    return weekNumbers;
  };

  const orderedWeekdays =
    firstDayOfWeek === 0
      ? weekdays[locale]
      : [...weekdays[locale].slice(1), weekdays[locale][0]];

  return (
    <div
      className={`bg-white border border-gray-300 rounded-md shadow-lg p-4 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          className="p-1 hover:bg-gray-100 rounded-md"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold text-gray-900">
          {months[locale][month]} {year}
        </h2>

        <button
          onClick={goToNextMonth}
          className="p-1 hover:bg-gray-100 rounded-md"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {showWeekNumbers && <div className="w-8 h-8"></div>}
        {orderedWeekdays.map((day) => (
          <div
            key={day}
            className="w-8 h-8 text-xs font-medium text-gray-500 flex items-center justify-center"
          >
            {day}
          </div>
        ))}

        {showWeekNumbers && (
          <div className="flex flex-col gap-1">{renderWeekNumbers()}</div>
        )}

        <div
          className={`grid grid-cols-7 gap-1 ${
            showWeekNumbers ? "col-span-7" : ""
          }`}
        >
          {renderCalendarGrid()}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-2 border-t">
        <div className="flex space-x-2">
          {showTodayButton && (
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
            >
              {t("today")}
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
          {selectedDate
            ? selectedDate.toLocaleDateString(locale)
            : t("no_date_selected")}
        </div>
      </div>
    </div>
  );
};

export const DatePicker = forwardRef<HTMLDivElement, DatePickerProps>(
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
      minDate,
      maxDate,
      disabledDates,
      disabledDays,
      showWeekNumbers = false,
      firstDayOfWeek = 1,
      locale = "en",
      dateFormat = "MM/dd/yyyy",
      showTodayButton = true,
      showClearButton = true,
      calendarClassName = "",
      disabled,
      className = "",
      ...props
    },
    ref
  ) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [currentDate, setCurrentDate] = useState(value || new Date());
    const inputRef = useRef<HTMLInputElement>(null);

    const formatDate = (date: Date) => {
      return date.toLocaleDateString(locale, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    };

    const handleDateSelect = (date: Date) => {
      onChange?.(date);
      setIsOpen(false);
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

    // Close calendar when clicking outside
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

    // Update currentDate when value changes
    useEffect(() => {
      if (value) {
        setCurrentDate(value);
      }
    }, [value]);

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
                {value ? formatDate(value) : placeholder || t("select_date")}
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
                <CalendarIcon className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          {isOpen && (
            <div className="absolute z-50 mt-1">
              <Calendar
                currentDate={currentDate}
                selectedDate={value}
                onDateSelect={handleDateSelect}
                onMonthChange={setCurrentDate}
                minDate={minDate}
                maxDate={maxDate}
                disabledDates={disabledDates}
                disabledDays={disabledDays}
                showWeekNumbers={showWeekNumbers}
                firstDayOfWeek={firstDayOfWeek}
                locale={locale}
                showTodayButton={showTodayButton}
                showClearButton={showClearButton}
                onClear={handleClear}
                className={calendarClassName}
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

DatePicker.displayName = "DatePicker";

export default DatePicker;
