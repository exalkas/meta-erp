"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  User,
  Plus,
  Grid,
  List,
  MoreHorizontal,
} from "lucide-react";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  allDay?: boolean;
  type?: "default" | "meeting" | "appointment" | "reminder" | "deadline";
  color?: string;
  location?: string;
  attendees?: Array<{
    name: string;
    email: string;
    status?: "pending" | "accepted" | "declined";
  }>;
  recurring?: {
    type: "daily" | "weekly" | "monthly" | "yearly";
    interval: number;
    endDate?: Date;
  };
  tags?: string[];
}

export interface CalendarViewProps {
  events: CalendarEvent[];
  view?: "month" | "week" | "day";
  currentDate?: Date;
  onDateChange?: (date: Date) => void;
  onViewChange?: (view: "month" | "week" | "day") => void;
  onEventClick?: (event: CalendarEvent) => void;
  onEventCreate?: (date: Date) => void;
  onEventEdit?: (event: CalendarEvent) => void;
  onEventDelete?: (eventId: string) => void;
  className?: string;
  editable?: boolean;
  showWeekNumbers?: boolean;
  firstDayOfWeek?: 0 | 1; // 0 = Sunday, 1 = Monday
  timeFormat?: "12h" | "24h";
  locale?: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  view = "month",
  currentDate = new Date(),
  onDateChange,
  onViewChange,
  onEventClick,
  onEventCreate,
  onEventEdit,
  onEventDelete,
  className = "",
  editable = true,
  showWeekNumbers = false,
  firstDayOfWeek = 1,
  timeFormat = "24h",
  locale = "en-US",
}) => {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Date>(currentDate);
  const [currentView, setCurrentView] = useState<"month" | "week" | "day">(
    view
  );

  const handleDateChange = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      onDateChange?.(date);
    },
    [onDateChange]
  );

  const handleViewChange = useCallback(
    (newView: "month" | "week" | "day") => {
      setCurrentView(newView);
      onViewChange?.(newView);
    },
    [onViewChange]
  );

  const getTypeColor = (type?: string) => {
    switch (type) {
      case "meeting":
        return "bg-blue-500";
      case "appointment":
        return "bg-green-500";
      case "reminder":
        return "bg-yellow-500";
      case "deadline":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatTime = (date: Date, format: "12h" | "24h" = timeFormat) => {
    return date.toLocaleTimeString(locale, {
      hour: "numeric",
      minute: "2-digit",
      hour12: format === "12h",
    });
  };

  const formatDate = (date: Date, options: Intl.DateTimeFormatOptions = {}) => {
    return date.toLocaleDateString(locale, options);
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString(locale, { month: "long", year: "numeric" });
  };

  const getWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(
      startOfWeek.getDate() - ((startOfWeek.getDay() - firstDayOfWeek + 7) % 7)
    );

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }

    return days;
  };

  const getMonthDays = () => {
    const firstDay = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      1
    );
    const lastDay = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      0
    );
    const startCalendar = new Date(firstDay);
    startCalendar.setDate(
      startCalendar.getDate() - ((firstDay.getDay() - firstDayOfWeek + 7) % 7)
    );

    const days = [];
    const current = new Date(startCalendar);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startDate);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const getEventsForTimeSlot = (date: Date, hour: number) => {
    return events.filter((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(date);
      slotEnd.setHours(hour + 1, 0, 0, 0);

      return eventStart < slotEnd && eventEnd > slotStart;
    });
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);

    switch (currentView) {
      case "month":
        newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
        break;
      case "week":
        newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
        break;
      case "day":
        newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
        break;
    }

    handleDateChange(newDate);
  };

  const renderEvent = (event: CalendarEvent, compact: boolean = false) => {
    const eventColor = event.color || getTypeColor(event.type);

    return (
      <div
        key={event.id}
        className={`${
          compact ? "text-xs p-1" : "p-2"
        } rounded mb-1 cursor-pointer transition-all duration-200 hover:opacity-80 ${eventColor} text-white`}
        onClick={(e) => {
          e.stopPropagation();
          onEventClick?.(event);
        }}
      >
        <div className="flex items-center space-x-1">
          {!event.allDay && <Clock className="w-3 h-3 opacity-75" />}
          <span className="font-medium truncate">{event.title}</span>
        </div>
        {!compact && (
          <div className="mt-1 text-xs opacity-75">
            {!event.allDay && formatTime(event.startDate)}
            {event.location && (
              <div className="flex items-center space-x-1">
                <MapPin className="w-3 h-3" />
                <span>{event.location}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderMonthView = () => {
    const monthDays = getMonthDays();
    const weekDays = getWeekDays();

    return (
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {/* Header */}
        {weekDays.map((day, index) => (
          <div
            key={index}
            className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700"
          >
            {day.toLocaleDateString(locale, { weekday: "short" })}
          </div>
        ))}

        {/* Days */}
        {monthDays.map((day, index) => {
          const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
          const isToday = day.toDateString() === new Date().toDateString();
          const dayEvents = getEventsForDate(day);

          return (
            <div
              key={index}
              className={`bg-white p-2 min-h-[120px] cursor-pointer hover:bg-gray-50 ${
                !isCurrentMonth ? "text-gray-400" : ""
              } ${isToday ? "bg-blue-50" : ""}`}
              onClick={() => editable && onEventCreate?.(day)}
            >
              <div
                className={`text-sm font-medium mb-1 ${
                  isToday ? "text-blue-600" : ""
                }`}
              >
                {day.getDate()}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => renderEvent(event, true))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays();
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="flex">
        {/* Time column */}
        <div className="w-20 flex-shrink-0">
          <div className="h-12 border-b border-gray-200"></div>
          {hours.map((hour) => (
            <div
              key={hour}
              className="h-16 border-b border-gray-200 text-xs text-gray-500 p-2"
            >
              {formatTime(new Date(0, 0, 0, hour))}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="flex-1 grid grid-cols-7 gap-px bg-gray-200">
          {weekDays.map((day, dayIndex) => (
            <div key={dayIndex} className="bg-white">
              {/* Day header */}
              <div className="h-12 p-2 border-b border-gray-200 text-center">
                <div className="text-sm font-medium">
                  {day.toLocaleDateString(locale, { weekday: "short" })}
                </div>
                <div
                  className={`text-lg ${
                    day.toDateString() === new Date().toDateString()
                      ? "text-blue-600 font-bold"
                      : ""
                  }`}
                >
                  {day.getDate()}
                </div>
              </div>

              {/* Time slots */}
              {hours.map((hour) => {
                const timeSlotEvents = getEventsForTimeSlot(day, hour);
                return (
                  <div
                    key={hour}
                    className="h-16 border-b border-gray-200 p-1 cursor-pointer hover:bg-gray-50"
                    onClick={() => {
                      const slotDate = new Date(day);
                      slotDate.setHours(hour, 0, 0, 0);
                      editable && onEventCreate?.(slotDate);
                    }}
                  >
                    {timeSlotEvents.map((event) => renderEvent(event, true))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="flex">
        {/* Time column */}
        <div className="w-20 flex-shrink-0">
          <div className="h-16 border-b border-gray-200 p-2 text-center">
            <div className="text-sm font-medium">
              {selectedDate.toLocaleDateString(locale, { weekday: "long" })}
            </div>
            <div
              className={`text-2xl ${
                selectedDate.toDateString() === new Date().toDateString()
                  ? "text-blue-600 font-bold"
                  : ""
              }`}
            >
              {selectedDate.getDate()}
            </div>
          </div>
          {hours.map((hour) => (
            <div
              key={hour}
              className="h-16 border-b border-gray-200 text-xs text-gray-500 p-2"
            >
              {formatTime(new Date(0, 0, 0, hour))}
            </div>
          ))}
        </div>

        {/* Day content */}
        <div className="flex-1 bg-white">
          <div className="h-16 border-b border-gray-200"></div>
          {hours.map((hour) => {
            const timeSlotEvents = getEventsForTimeSlot(selectedDate, hour);
            return (
              <div
                key={hour}
                className="h-16 border-b border-gray-200 p-1 cursor-pointer hover:bg-gray-50"
                onClick={() => {
                  const slotDate = new Date(selectedDate);
                  slotDate.setHours(hour, 0, 0, 0);
                  editable && onEventCreate?.(slotDate);
                }}
              >
                {timeSlotEvents.map((event) => renderEvent(event))}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case "month":
        return renderMonthView();
      case "week":
        return renderWeekView();
      case "day":
        return renderDayView();
      default:
        return renderMonthView();
    }
  };

  return (
    <div className={`calendar-view ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-lg shadow-sm border">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateDate("prev")}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <h2 className="text-xl font-semibold text-gray-900 min-w-[200px]">
            {currentView === "month" && getMonthName(selectedDate)}
            {currentView === "week" &&
              `${t("calendar.week")} ${formatDate(selectedDate, {
                month: "short",
                year: "numeric",
              })}`}
            {currentView === "day" &&
              formatDate(selectedDate, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
          </h2>

          <button
            onClick={() => navigateDate("next")}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {/* View selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(["month", "week", "day"] as const).map((viewType) => (
              <button
                key={viewType}
                onClick={() => handleViewChange(viewType)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  currentView === viewType
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {t(`calendar.${viewType}`)}
              </button>
            ))}
          </div>

          {/* Today button */}
          <button
            onClick={() => handleDateChange(new Date())}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg transition-colors"
          >
            {t("calendar.today")}
          </button>

          {/* Add event button */}
          {editable && (
            <button
              onClick={() => onEventCreate?.(selectedDate)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>{t("calendar.addEvent")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Calendar content */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {renderCurrentView()}
      </div>
    </div>
  );
};

export default CalendarView;
