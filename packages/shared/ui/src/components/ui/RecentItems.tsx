/**
 * RecentItems Component - Generic Recent Items Display
 *
 * A metadata-driven component that can display recent items from any entity type.
 * Works with legal matters, projects, tickets, orders, etc.
 */

import React from "react";
import { Card } from "./Card";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { renderIcon } from "../../utils/iconMapper";
import { useTranslation } from "../../contexts/TranslationContext";

export interface RecentItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  status?: string;
  statusVariant?: "primary" | "secondary" | "success" | "warning" | "error";
  date?: string;
  assignee?: string;
  href?: string;
  badge?: {
    text: string;
    variant?: "primary" | "secondary" | "success" | "warning" | "error";
  };
  metadata?: Record<string, any>;
}

export interface RecentItemsProps {
  /** Component title */
  title?: string;
  /** Title translation key */
  titleKey?: string;
  /** Items to display */
  items?: RecentItem[];
  /** Maximum number of items to display */
  maxItems?: number;
  /** Grid column span for layout */
  colspan?: number;
  /** Show AI insights badge */
  showAiInsights?: boolean;
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
  /** Item click handler */
  onItemClick?: (item: RecentItem) => void;
  /** Custom item renderer */
  renderItem?: (item: RecentItem) => React.ReactNode;
  /** Empty state message */
  emptyMessage?: string;
  /** Custom className */
  className?: string;
}

export const RecentItems: React.FC<RecentItemsProps> = ({
  title,
  titleKey,
  items = [],
  maxItems = 5,
  colspan = 2,
  showAiInsights = false,
  verticalMode,
  legalMode = false,
  loading = false,
  error,
  showViewAll = true,
  onViewAll,
  onItemClick,
  renderItem,
  emptyMessage,
  className = "",
}) => {
  const { t } = useTranslation();

  // Determine actual vertical mode
  const actualVerticalMode = legalMode ? "legal" : verticalMode;

  // Get display title
  const displayTitle = titleKey
    ? t(titleKey)
    : title || t("common.recent_items");

  // Limit items to maxItems
  const displayItems = items.slice(0, maxItems);

  // Handle item click
  const handleItemClick = (item: RecentItem) => {
    if (onItemClick) {
      onItemClick(item);
    } else if (item.href) {
      window.location.href = item.href;
    }
  };

  // Default item renderer
  const defaultRenderItem = (item: RecentItem) => (
    <div
      key={item.id}
      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => handleItemClick(item)}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-sm text-gray-900 truncate">
          {item.title}
        </h4>
        {item.status && (
          <Badge variant={item.statusVariant || "secondary"} size="sm">
            {item.status}
          </Badge>
        )}
      </div>

      {item.subtitle && (
        <p className="text-xs text-gray-600 mb-1">{item.subtitle}</p>
      )}

      {item.description && (
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">
          {item.description}
        </p>
      )}

      <div className="flex justify-between items-center text-xs text-gray-400">
        {item.date && <span>{item.date}</span>}
        {item.assignee && <span>{item.assignee}</span>}
      </div>

      {item.badge && (
        <div className="mt-2">
          <Badge variant={item.badge.variant || "primary"} size="sm">
            {item.badge.text}
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
            {showAiInsights && (
              <Badge variant="primary" size="sm">
                {t("common.ai_insights")}
              </Badge>
            )}
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
            {showAiInsights && (
              <Badge variant="primary" size="sm">
                {t("common.ai_insights")}
              </Badge>
            )}
            {actualVerticalMode === "legal" && (
              <Badge variant="secondary" size="sm">
                {t("legal.mode")}
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        {displayItems.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              {renderIcon("FileText", "h-8 w-8")}
            </div>
            <p className="text-sm text-gray-500">
              {emptyMessage || t("common.no_recent_items")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayItems.map((item) =>
              renderItem ? renderItem(item) : defaultRenderItem(item)
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
              {t("common.view_all")}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default RecentItems;
