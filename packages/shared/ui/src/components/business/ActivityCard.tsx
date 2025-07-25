"use client";

import React from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import {
  Calendar,
  Clock,
  User,
  Building,
  Phone,
  Mail,
  MessageCircle,
  FileText,
  CheckCircle,
  AlertTriangle,
  Star,
  MapPin,
  Edit,
  MoreHorizontal,
  Users,
  Target,
  TrendingUp,
  Video,
  Coffee,
  Briefcase,
} from "lucide-react";

export interface ActivityData {
  id: string;
  title: string;
  description?: string;
  type:
    | "call"
    | "email"
    | "meeting"
    | "task"
    | "note"
    | "appointment"
    | "follow_up"
    | "presentation";
  status: "pending" | "in_progress" | "completed" | "cancelled" | "overdue";
  priority: "low" | "medium" | "high" | "urgent";
  scheduledDate?: Date;
  completedDate?: Date;
  duration?: number; // minutes
  location?: string;
  virtual?: boolean;
  participants?: Array<{
    id: string;
    name: string;
    role?: string;
    avatar?: string;
    type: "internal" | "customer" | "vendor" | "partner";
  }>;
  relatedTo?: {
    type: "customer" | "lead" | "opportunity" | "project" | "invoice";
    id: string;
    name: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    avatar?: string;
  };
  outcome?: string;
  nextSteps?: string[];
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  tags?: string[];
  createdBy?: {
    id: string;
    name: string;
  };
  createdDate: Date;
}

export interface ActivityCardProps {
  activity: ActivityData;
  variant?: "default" | "compact" | "timeline";
  showParticipants?: boolean;
  showOutcome?: boolean;
  className?: string;
  onClick?: () => void;
  onEdit?: () => void;
  onComplete?: () => void;
  onReschedule?: () => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  variant = "default",
  showParticipants = true,
  showOutcome = true,
  className = "",
  onClick,
  onEdit,
  onComplete,
  onReschedule,
}) => {
  const { t } = useTranslation();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "call":
        return <Phone className="w-4 h-4" />;
      case "email":
        return <Mail className="w-4 h-4" />;
      case "meeting":
        return <Users className="w-4 h-4" />;
      case "task":
        return <CheckCircle className="w-4 h-4" />;
      case "note":
        return <FileText className="w-4 h-4" />;
      case "appointment":
        return <Calendar className="w-4 h-4" />;
      case "follow_up":
        return <TrendingUp className="w-4 h-4" />;
      case "presentation":
        return <Video className="w-4 h-4" />;
      default:
        return <Briefcase className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "call":
        return "bg-green-100 text-green-800";
      case "email":
        return "bg-blue-100 text-blue-800";
      case "meeting":
        return "bg-purple-100 text-purple-800";
      case "task":
        return "bg-orange-100 text-orange-800";
      case "note":
        return "bg-gray-100 text-gray-800";
      case "appointment":
        return "bg-indigo-100 text-indigo-800";
      case "follow_up":
        return "bg-yellow-100 text-yellow-800";
      case "presentation":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat("el-GR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const isOverdue = () => {
    if (
      !activity.scheduledDate ||
      activity.status === "completed" ||
      activity.status === "cancelled"
    ) {
      return false;
    }
    return new Date() > activity.scheduledDate;
  };

  const isCompact = variant === "compact";
  const isTimeline = variant === "timeline";

  if (isTimeline) {
    return (
      <div className={`flex space-x-3 ${className}`}>
        <div className="flex-shrink-0 w-8 h-8 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center">
          {getTypeIcon(activity.type)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{activity.title}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {activity.description}
                </p>

                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  {activity.scheduledDate && (
                    <span>{formatDateTime(activity.scheduledDate)}</span>
                  )}
                  {activity.assignedTo && (
                    <span>{activity.assignedTo.name}</span>
                  )}
                </div>
              </div>

              <span
                className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                  activity.status
                )}`}
              >
                {t(`activityCard.status.${activity.status}`)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200
        ${onClick ? "cursor-pointer" : ""}
        ${isOverdue() ? "ring-2 ring-red-200" : ""}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg ${getTypeColor(activity.type)}`}>
              {getTypeIcon(activity.type)}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900">{activity.title}</h3>
              {activity.description && !isCompact && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {activity.description}
                </p>
              )}

              <div className="flex items-center space-x-2 mt-2">
                <span
                  className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    activity.status
                  )}`}
                >
                  {t(`activityCard.status.${activity.status}`)}
                </span>

                <span
                  className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
                    activity.priority
                  )}`}
                >
                  {t(`activityCard.priority.${activity.priority}`)}
                </span>

                {isOverdue() && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {t("activityCard.overdue")}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-1 text-gray-400 hover:text-blue-600 rounded"
                title={t("activityCard.actions.edit")}
              >
                <Edit className="w-4 h-4" />
              </button>
            )}

            <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="p-4 space-y-3">
        {/* Schedule & Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {activity.scheduledDate && (
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{formatDateTime(activity.scheduledDate)}</span>
              {activity.duration && (
                <span className="text-gray-500">
                  ({formatDuration(activity.duration)})
                </span>
              )}
            </div>
          )}

          {activity.location && (
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{activity.location}</span>
              {activity.virtual && (
                <span className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  {t("activityCard.virtual")}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Related Entity */}
        {activity.relatedTo && (
          <div className="flex items-center space-x-2 text-sm">
            <Target className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">
              {t("activityCard.relatedTo")}:
            </span>
            <span className="font-medium">{activity.relatedTo.name}</span>
            <span
              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                activity.relatedTo.type === "customer"
                  ? "bg-green-100 text-green-800"
                  : activity.relatedTo.type === "lead"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {t(`activityCard.relatedType.${activity.relatedTo.type}`)}
            </span>
          </div>
        )}

        {/* Assigned To */}
        {activity.assignedTo && (
          <div className="flex items-center space-x-2 text-sm">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">
              {t("activityCard.assignedTo")}:
            </span>
            <span className="font-medium">{activity.assignedTo.name}</span>
          </div>
        )}

        {/* Participants */}
        {showParticipants &&
          activity.participants &&
          activity.participants.length > 0 &&
          !isCompact && (
            <div>
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                <Users className="w-4 h-4" />
                <span>
                  {t("activityCard.participants")} (
                  {activity.participants.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {activity.participants.slice(0, 3).map((participant, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-1 bg-gray-50 rounded-full px-2 py-1"
                  >
                    <span className="text-xs">{participant.name}</span>
                    <span
                      className={`text-xs px-1 rounded ${
                        participant.type === "customer"
                          ? "bg-green-100 text-green-800"
                          : participant.type === "internal"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {participant.type}
                    </span>
                  </div>
                ))}
                {activity.participants.length > 3 && (
                  <span className="text-xs text-gray-500 px-2 py-1">
                    +{activity.participants.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

        {/* Outcome */}
        {showOutcome && activity.outcome && activity.status === "completed" && (
          <div className="p-3 bg-green-50 rounded-lg">
            <h4 className="text-sm font-medium text-green-900 mb-1">
              {t("activityCard.outcome")}
            </h4>
            <p className="text-sm text-green-800">{activity.outcome}</p>
          </div>
        )}

        {/* Next Steps */}
        {activity.nextSteps && activity.nextSteps.length > 0 && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              {t("activityCard.nextSteps")}
            </h4>
            <ul className="space-y-1">
              {activity.nextSteps.map((step, index) => (
                <li
                  key={index}
                  className="flex items-start space-x-2 text-sm text-blue-800"
                >
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {t("activityCard.createdBy")} {activity.createdBy?.name} •{" "}
            {formatDateTime(activity.createdDate)}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {onComplete &&
              activity.status !== "completed" &&
              activity.status !== "cancelled" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onComplete();
                  }}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  {t("activityCard.actions.complete")}
                </button>
              )}

            {onReschedule &&
              activity.scheduledDate &&
              activity.status === "pending" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReschedule();
                  }}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  {t("activityCard.actions.reschedule")}
                </button>
              )}
          </div>
        </div>

        {/* Tags */}
        {activity.tags && activity.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {activity.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityCard;
