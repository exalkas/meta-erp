"use client";

import React from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Star,
  Copy,
  ExternalLink,
  Calendar,
  MapPin,
  User,
  Building,
  Mail,
  Phone,
  Globe,
  Tag,
  Briefcase,
  Package,
  FileText,
  DollarSign,
  TrendingUp,
  Users,
  Clock,
} from "lucide-react";

export interface EntityField {
  key: string;
  label: string;
  value: any;
  type:
    | "text"
    | "number"
    | "date"
    | "currency"
    | "email"
    | "phone"
    | "url"
    | "status"
    | "tag"
    | "avatar"
    | "progress";
  format?: string;
  icon?: React.ReactNode;
  color?: string;
  clickable?: boolean;
  onClick?: () => void;
}

export interface EntityAction {
  key: string;
  label: string;
  icon?: React.ReactNode;
  color?:
    | "default"
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger";
  onClick: () => void;
  disabled?: boolean;
}

export interface EntityData {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  avatar?: string;
  status?: {
    label: string;
    color: string;
    icon?: React.ReactNode;
  };
  badges?: Array<{
    label: string;
    color: string;
    icon?: React.ReactNode;
  }>;
  fields: EntityField[];
  metrics?: Array<{
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    color?: string;
    trend?: "up" | "down" | "neutral";
  }>;
  tags?: string[];
  lastModified?: Date;
  featured?: boolean;
}

export interface EntityCardProps {
  entity: EntityData;
  variant?: "default" | "compact" | "detailed" | "list";
  layout?: "vertical" | "horizontal";
  actions?: EntityAction[];
  showMetrics?: boolean;
  showFields?: boolean;
  className?: string;
  onClick?: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
}

export const EntityCard: React.FC<EntityCardProps> = ({
  entity,
  variant = "default",
  layout = "vertical",
  actions = [],
  showMetrics = true,
  showFields = true,
  className = "",
  onClick,
  onFavorite,
  isFavorite = false,
}) => {
  const { t } = useTranslation();

  const getFieldIcon = (type: string, icon?: React.ReactNode) => {
    if (icon) return icon;

    switch (type) {
      case "email":
        return <Mail className="w-4 h-4" />;
      case "phone":
        return <Phone className="w-4 h-4" />;
      case "url":
        return <Globe className="w-4 h-4" />;
      case "date":
        return <Calendar className="w-4 h-4" />;
      case "currency":
        return <DollarSign className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatFieldValue = (field: EntityField) => {
    const { value, type, format } = field;

    if (value === null || value === undefined) return "—";

    switch (type) {
      case "date":
        return new Date(value).toLocaleDateString("el-GR");
      case "currency":
        return new Intl.NumberFormat("el-GR", {
          style: "currency",
          currency: format || "EUR",
        }).format(value);
      case "number":
        return new Intl.NumberFormat("el-GR").format(value);
      case "progress":
        return `${value}%`;
      default:
        return String(value);
    }
  };

  const renderFieldValue = (field: EntityField) => {
    const { type, value, color, clickable, onClick } = field;
    const formattedValue = formatFieldValue(field);

    if (type === "avatar") {
      return (
        <img
          src={value}
          alt={field.label}
          className="w-6 h-6 rounded-full object-cover"
        />
      );
    }

    if (type === "status") {
      return (
        <span
          className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
            color || "bg-gray-100 text-gray-800"
          }`}
        >
          {field.icon}
          <span className={field.icon ? "ml-1" : ""}>{formattedValue}</span>
        </span>
      );
    }

    if (type === "tag") {
      return (
        <span
          className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
            color || "bg-blue-100 text-blue-800"
          }`}
        >
          {formattedValue}
        </span>
      );
    }

    if (type === "progress") {
      return (
        <div className="flex items-center space-x-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${color || "bg-blue-600"}`}
              style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
            />
          </div>
          <span className="text-xs text-gray-600">{formattedValue}</span>
        </div>
      );
    }

    const Component = clickable ? "button" : "span";
    return (
      <Component
        onClick={clickable ? onClick : undefined}
        className={`${
          clickable
            ? "text-blue-600 hover:text-blue-800 cursor-pointer"
            : "text-gray-900"
        } ${
          type === "email" || type === "phone" || type === "url"
            ? "break-all"
            : ""
        }`}
      >
        {formattedValue}
      </Component>
    );
  };

  const getActionButtonColor = (color?: string) => {
    switch (color) {
      case "primary":
        return "bg-blue-600 text-white hover:bg-blue-700";
      case "secondary":
        return "bg-gray-600 text-white hover:bg-gray-700";
      case "success":
        return "bg-green-600 text-white hover:bg-green-700";
      case "warning":
        return "bg-yellow-600 text-white hover:bg-yellow-700";
      case "danger":
        return "bg-red-600 text-white hover:bg-red-700";
      default:
        return "bg-gray-100 text-gray-700 hover:bg-gray-200";
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "down":
        return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
      default:
        return null;
    }
  };

  const isCompact = variant === "compact";
  const isDetailed = variant === "detailed";
  const isList = variant === "list";
  const isHorizontal = layout === "horizontal" || isList;

  return (
    <div
      className={`
        bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200 group
        ${onClick ? "cursor-pointer" : ""}
        ${isList ? "flex items-center" : ""}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Header */}
      <div
        className={`p-4 ${
          !isCompact && !isList ? "border-b border-gray-200" : ""
        } ${isList ? "flex-1" : ""}`}
      >
        <div
          className={`flex items-start ${
            isHorizontal ? "space-x-4" : "justify-between"
          }`}
        >
          {/* Avatar & Info */}
          <div
            className={`flex items-start space-x-3 ${
              isHorizontal ? "flex-1" : ""
            }`}
          >
            {entity.avatar && (
              <img
                src={entity.avatar}
                alt={entity.title}
                className={`${
                  isCompact ? "w-8 h-8" : "w-12 h-12"
                } rounded-full object-cover flex-shrink-0`}
              />
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3
                  className={`font-semibold text-gray-900 truncate ${
                    isCompact ? "text-sm" : "text-base"
                  }`}
                >
                  {entity.title}
                </h3>

                {entity.featured && (
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                )}

                {onFavorite && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onFavorite();
                    }}
                    className={`p-1 rounded transition-colors ${
                      isFavorite
                        ? "text-red-500"
                        : "text-gray-400 hover:text-red-500"
                    }`}
                  >
                    <Star
                      className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`}
                    />
                  </button>
                )}
              </div>

              {entity.subtitle && (
                <p className="text-sm text-gray-600 truncate">
                  {entity.subtitle}
                </p>
              )}

              {entity.description && !isCompact && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {entity.description}
                </p>
              )}

              {/* Status & Badges */}
              <div className="flex items-center space-x-2 mt-2">
                {entity.status && (
                  <span
                    className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${entity.status.color}`}
                  >
                    {entity.status.icon}
                    <span className={entity.status.icon ? "ml-1" : ""}>
                      {entity.status.label}
                    </span>
                  </span>
                )}

                {entity.badges &&
                  entity.badges.map((badge, index) => (
                    <span
                      key={index}
                      className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}
                    >
                      {badge.icon}
                      <span className={badge.icon ? "ml-1" : ""}>
                        {badge.label}
                      </span>
                    </span>
                  ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          {!isHorizontal && (
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle view
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                title={t("entityCard.actions.view")}
              >
                <Eye className="w-4 h-4" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle edit
                }}
                className="p-1 text-gray-400 hover:text-blue-600 rounded"
                title={t("entityCard.actions.edit")}
              >
                <Edit className="w-4 h-4" />
              </button>

              <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fields */}
      {showFields &&
        entity.fields &&
        entity.fields.length > 0 &&
        !isCompact &&
        !isList && (
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {entity.fields
                .slice(0, isDetailed ? entity.fields.length : 6)
                .map((field) => (
                  <div key={field.key} className="flex items-center space-x-2">
                    <div className="text-gray-400 flex-shrink-0">
                      {getFieldIcon(field.type, field.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500">{field.label}</div>
                      <div className="text-sm">{renderFieldValue(field)}</div>
                    </div>
                  </div>
                ))}
            </div>

            {!isDetailed && entity.fields.length > 6 && (
              <div className="mt-3 text-center">
                <button className="text-xs text-blue-600 hover:text-blue-800">
                  {t("entityCard.showMore")} ({entity.fields.length - 6})
                </button>
              </div>
            )}
          </div>
        )}

      {/* Metrics */}
      {showMetrics &&
        entity.metrics &&
        entity.metrics.length > 0 &&
        !isCompact &&
        !isList && (
          <div className="p-4 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {entity.metrics.map((metric, index) => (
                <div key={index} className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    {metric.icon && (
                      <div
                        className={
                          metric.color
                            ? `text-${metric.color}-600`
                            : "text-gray-600"
                        }
                      >
                        {metric.icon}
                      </div>
                    )}
                    {getTrendIcon(metric.trend)}
                  </div>
                  <div
                    className={`text-lg font-semibold ${
                      metric.color
                        ? `text-${metric.color}-600`
                        : "text-gray-900"
                    }`}
                  >
                    {metric.value}
                  </div>
                  <div className="text-xs text-gray-500">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Footer */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            {entity.lastModified && (
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>
                  {new Date(entity.lastModified).toLocaleDateString("el-GR")}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {actions && actions.length > 0 && (
            <div className="flex space-x-2">
              {actions.slice(0, 3).map((action) => (
                <button
                  key={action.key}
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick();
                  }}
                  disabled={action.disabled}
                  className={`
                    px-3 py-1 text-xs rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center space-x-1
                    ${getActionButtonColor(action.color)}
                  `}
                >
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              ))}

              {actions.length > 3 && (
                <button className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
                  +{actions.length - 3}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tags */}
        {entity.tags && entity.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {entity.tags.slice(0, 5).map((tag, index) => (
              <span
                key={index}
                className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
              >
                {tag}
              </span>
            ))}
            {entity.tags.length > 5 && (
              <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                +{entity.tags.length - 5}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EntityCard;
