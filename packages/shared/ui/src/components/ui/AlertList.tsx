/**
 * AlertList Component - Generic Alert/Deadline Display
 *
 * A metadata-driven component that can display alerts, deadlines, reminders, etc.
 * Works with legal deadlines, project milestones, maintenance alerts, etc.
 */

import React from "react";
import { Card } from "./Card";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { renderIcon } from "../../utils/iconMapper";
import { useTranslation } from "../../contexts/TranslationContext";

export interface AlertItem {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  urgency?: "low" | "medium" | "high" | "critical";
  status?: string;
  category?: string;
  assignee?: string;
  href?: string;
  badge?: {
    text: string;
    variant?: "primary" | "secondary" | "success" | "warning" | "error";
  };
  metadata?: Record<string, any>;
}

export interface AlertListProps {
  /** Component title */
  title?: string;
  /** Title translation key */
  titleKey?: string;
  /** Alert items to display */
  items?: AlertItem[];
  /** Maximum number of items to display */
  maxItems?: number;
  /** Grid column span for layout */
  colspan?: number;
  /** Show urgent alerts first */
  showUrgentFirst?: boolean;
  /** Vertical-specific mode (legal, medical, etc.) */
  verticalMode?: string;
  /** Legal mode - alias for verticalMode: "legal" */
  legalMode?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string;
  /** Show "View All" button */
  showViewAll?: boolean;
  /** View All button action */
  onViewAll?: () => void;
  /** Alert click handler */
  onAlertClick?: (alert: AlertItem) => void;
  /** Alert dismiss handler */
  onAlertDismiss?: (alert: AlertItem) => void;
  /** Custom alert renderer */
  renderAlert?: (alert: AlertItem) => React.ReactNode;
  /** Empty state message */
  emptyMessage?: string;
  /** Custom className */
  className?: string;
}

export const AlertList: React.FC<AlertListProps> = ({
  title,
  titleKey,
  items = [],
  maxItems = 6,
  colspan = 1,
  showUrgentFirst = true,
  verticalMode,
  legalMode = false,
  loading = false,
  error,
  showViewAll = true,
  onViewAll,
  onAlertClick,
  onAlertDismiss,
  renderAlert,
  emptyMessage,
  className = "",
}) => {
  const { t } = useTranslation();

  // Determine actual vertical mode
  const actualVerticalMode = legalMode ? "legal" : verticalMode;

  // Get display title
  const displayTitle = titleKey ? t(titleKey) : title || t("common.alerts");

  // Sort and limit items
  let displayItems = [...items];

  if (showUrgentFirst) {
    const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    displayItems.sort((a, b) => {
      const aUrgency = urgencyOrder[a.urgency || "low"];
      const bUrgency = urgencyOrder[b.urgency || "low"];
      return bUrgency - aUrgency;
    });
  }

  displayItems = displayItems.slice(0, maxItems);

  // Get urgency styling
  const getUrgencyClasses = (urgency?: string) => {
    switch (urgency) {
      case "critical":
        return "border-l-4 border-l-red-500 bg-red-50";
      case "high":
        return "border-l-4 border-l-orange-500 bg-orange-50";
      case "medium":
        return "border-l-4 border-l-yellow-500 bg-yellow-50";
      case "low":
        return "border-l-4 border-l-blue-500 bg-blue-50";
      default:
        return "border-l-4 border-l-gray-300 bg-gray-50";
    }
  };

  const getUrgencyIcon = (urgency?: string) => {
    switch (urgency) {
      case "critical":
        return "AlertTriangle";
      case "high":
        return "Clock";
      case "medium":
        return "Calendar";
      case "low":
        return "Info";
      default:
        return "Bell";
    }
  };

  const getUrgencyBadgeVariant = (urgency?: string) => {
    switch (urgency) {
      case "critical":
        return "error" as const;
      case "high":
        return "warning" as const;
      case "medium":
        return "warning" as const;
      case "low":
        return "secondary" as const;
      default:
        return "secondary" as const;
    }
  };

  // Handle alert click
  const handleAlertClick = (alert: AlertItem) => {
    if (onAlertClick) {
      onAlertClick(alert);
    } else if (alert.href) {
      window.location.href = alert.href;
    }
  };

  // Default alert renderer
  const defaultRenderAlert = (alert: AlertItem) => (
    <div
      key={alert.id}
      className={`p-3 rounded-lg hover:shadow-sm cursor-pointer transition-all ${getUrgencyClasses(alert.urgency)}`}
      onClick={() => handleAlertClick(alert)}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-2">
          <div className="text-gray-600">
            {renderIcon(getUrgencyIcon(alert.urgency), "h-4 w-4")}
          </div>
          <h4 className="font-medium text-sm text-gray-900 truncate flex-1">
            {alert.title}
          </h4>
        </div>
        <div className="flex items-center space-x-2">
          {alert.urgency && (
            <Badge variant={getUrgencyBadgeVariant(alert.urgency)} size="sm">
              {t(`common.urgency.${alert.urgency}`)}
            </Badge>
          )}
          {onAlertDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onAlertDismiss(alert);
              }}
              className="h-6 w-6 p-0"
            >
              {renderIcon("X", "h-3 w-3")}
            </Button>
          )}
        </div>
      </div>

      {alert.description && (
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
          {alert.description}
        </p>
      )}

      <div className="flex justify-between items-center text-xs text-gray-500">
        <div className="flex items-center space-x-2">
          {alert.dueDate && (
            <span className="flex items-center space-x-1">
              {renderIcon("Calendar", "h-3 w-3")}
              <span>{alert.dueDate}</span>
            </span>
          )}
          {alert.category && (
            <Badge variant="secondary" size="sm">
              {alert.category}
            </Badge>
          )}
        </div>
        {alert.assignee && (
          <span className="flex items-center space-x-1">
            {renderIcon("User", "h-3 w-3")}
            <span>{alert.assignee}</span>
          </span>
        )}
      </div>

      {alert.badge && (
        <div className="mt-2">
          <Badge variant={alert.badge.variant || "primary"} size="sm">
            {alert.badge.text}
          </Badge>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <Card className={`${className} ${colspan ? `col-span-${colspan}` : ""}`}>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{displayTitle}</h3>
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`${className} ${colspan ? `col-span-${colspan}` : ""}`}>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{displayTitle}</h3>
          </div>
          <div className="text-center py-4">
            <div className="text-red-500 mb-2">
              {renderIcon("AlertCircle", "h-6 w-6")}
            </div>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`${className} ${colspan ? `col-span-${colspan}` : ""}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{displayTitle}</h3>
          <div className="flex items-center space-x-2">
            {actualVerticalMode === "legal" && (
              <Badge variant="secondary" size="sm">
                {t("legal.statute_limitations")}
              </Badge>
            )}
            {displayItems.some((item) => item.urgency === "critical") && (
              <Badge variant="error" size="sm">
                {t("common.critical_alerts")}
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        {displayItems.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-green-400 mb-2">
              {renderIcon("CheckCircle", "h-8 w-8")}
            </div>
            <p className="text-sm text-gray-500">
              {emptyMessage || t("common.no_alerts")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayItems.map((alert) =>
              renderAlert ? renderAlert(alert) : defaultRenderAlert(alert)
            )}
          </div>
        )}

        {/* Footer */}
        {showViewAll && displayItems.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewAll}
              className="w-full"
            >
              {t("common.view_all_alerts")}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AlertList;
