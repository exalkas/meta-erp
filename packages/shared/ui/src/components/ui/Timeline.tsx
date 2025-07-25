"use client";

import React from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import {
  Clock,
  User,
  Calendar,
  MapPin,
  ExternalLink,
  MoreHorizontal,
} from "lucide-react";

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: Date;
  type?: "default" | "success" | "warning" | "error" | "info";
  icon?: React.ReactNode;
  user?: {
    name: string;
    avatar?: string;
  };
  location?: string;
  link?: {
    url: string;
    text: string;
  };
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  tags?: string[];
  color?: string;
}

export interface TimelineProps {
  events: TimelineEvent[];
  variant?: "default" | "compact" | "detailed";
  orientation?: "vertical" | "horizontal";
  showTime?: boolean;
  showUser?: boolean;
  showLocation?: boolean;
  groupByDate?: boolean;
  interactive?: boolean;
  className?: string;
  onEventClick?: (event: TimelineEvent) => void;
  onEventEdit?: (event: TimelineEvent) => void;
  onEventDelete?: (eventId: string) => void;
  emptyMessage?: string;
}

export const Timeline: React.FC<TimelineProps> = ({
  events,
  variant = "default",
  orientation = "vertical",
  showTime = true,
  showUser = true,
  showLocation = true,
  groupByDate = false,
  interactive = false,
  className = "",
  onEventClick,
  onEventEdit,
  onEventDelete,
  emptyMessage,
}) => {
  const { t } = useTranslation();

  const getTypeColor = (type?: string) => {
    switch (type) {
      case "success":
        return "bg-green-500";
      case "warning":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      case "info":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getTypeIconColor = (type?: string) => {
    switch (type) {
      case "success":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "error":
        return "text-red-600";
      case "info":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return t("timeline.now");
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} ${t("timeline.minutesAgo")}`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} ${t("timeline.hoursAgo")}`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)} ${t("timeline.daysAgo")}`;
    return formatDate(date);
  };

  const sortedEvents = [...events].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  const groupedEvents = groupByDate
    ? sortedEvents.reduce((groups, event) => {
        const dateKey = formatDate(event.timestamp);
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(event);
        return groups;
      }, {} as Record<string, TimelineEvent[]>)
    : { "": sortedEvents };

  const renderEvent = (
    event: TimelineEvent,
    index: number,
    isLast: boolean
  ) => {
    const isCompact = variant === "compact";
    const isDetailed = variant === "detailed";

    return (
      <div
        key={event.id}
        className={`relative flex ${
          orientation === "horizontal" ? "flex-col items-center" : "items-start"
        } ${
          interactive
            ? "cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2"
            : ""
        } ${!isLast && orientation === "vertical" ? "pb-6" : ""}`}
        onClick={() => interactive && onEventClick?.(event)}
      >
        {/* Timeline Line */}
        {orientation === "vertical" && !isLast && (
          <div className="absolute left-4 top-6 w-0.5 h-full bg-gray-200 -ml-px" />
        )}
        {orientation === "horizontal" && !isLast && (
          <div className="absolute top-4 left-6 h-0.5 w-full bg-gray-200 -mt-px" />
        )}

        {/* Event Icon */}
        <div
          className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${
            event.color ? `bg-${event.color}-500` : getTypeColor(event.type)
          } ${orientation === "horizontal" ? "mb-4" : "mr-4"}`}
        >
          {event.icon || <Clock className="w-4 h-4 text-white" />}
        </div>

        {/* Event Content */}
        <div
          className={`flex-1 ${
            orientation === "horizontal" ? "text-center" : ""
          }`}
        >
          <div
            className={`bg-white rounded-lg ${
              isDetailed ? "shadow-sm border p-4" : isCompact ? "p-2" : "p-3"
            }`}
          >
            {/* Event Header */}
            <div
              className={`flex items-start ${
                orientation === "horizontal" ? "flex-col" : "justify-between"
              } mb-2`}
            >
              <div className="flex-1">
                <h4
                  className={`font-medium text-gray-900 ${
                    isCompact ? "text-sm" : "text-base"
                  }`}
                >
                  {event.title}
                </h4>

                {showTime && (
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>{formatTime(event.timestamp)}</span>
                    <span className="mx-2">•</span>
                    <span>{formatRelativeTime(event.timestamp)}</span>
                  </div>
                )}
              </div>

              {interactive && (onEventEdit || onEventDelete) && (
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventEdit?.(event);
                    }}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Event Description */}
            {event.description && (
              <p
                className={`text-gray-600 mb-3 ${
                  isCompact ? "text-xs" : "text-sm"
                }`}
              >
                {event.description}
              </p>
            )}

            {/* Event Meta */}
            {(showUser || showLocation) && (
              <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                {showUser && event.user && (
                  <div className="flex items-center space-x-1">
                    <User className="w-3 h-3" />
                    <span>{event.user.name}</span>
                  </div>
                )}
                {showLocation && event.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3" />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>
            )}

            {/* Event Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {event.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Event Link */}
            {event.link && (
              <div className="mb-3">
                <a
                  href={event.link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  {event.link.text}
                </a>
              </div>
            )}

            {/* Event Attachments */}
            {event.attachments && event.attachments.length > 0 && (
              <div className="space-y-1">
                {event.attachments.map((attachment, idx) => (
                  <a
                    key={idx}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs text-gray-600 hover:text-gray-800"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    {attachment.name}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDateGroup = (date: string, events: TimelineEvent[]) => {
    return (
      <div key={date} className="mb-8">
        {date && (
          <div className="flex items-center mb-6">
            <div className="flex-shrink-0 w-24 text-sm font-medium text-gray-900">
              {date}
            </div>
            <div className="flex-1 h-px bg-gray-200 ml-6" />
          </div>
        )}
        <div className={`space-y-6 ${date ? "ml-24" : ""}`}>
          {events.map((event, index) =>
            renderEvent(event, index, index === events.length - 1)
          )}
        </div>
      </div>
    );
  };

  if (events.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500 text-sm">
          {emptyMessage || t("timeline.noEvents")}
        </p>
      </div>
    );
  }

  return (
    <div className={`timeline ${className}`}>
      {groupByDate ? (
        <div className="space-y-8">
          {Object.entries(groupedEvents).map(([date, events]) =>
            renderDateGroup(date, events)
          )}
        </div>
      ) : (
        <div
          className={`${
            orientation === "horizontal"
              ? "flex space-x-8 overflow-x-auto"
              : "space-y-6"
          }`}
        >
          {sortedEvents.map((event, index) =>
            renderEvent(event, index, index === sortedEvents.length - 1)
          )}
        </div>
      )}
    </div>
  );
};

export default Timeline;
