/**
 * Generic StatsGrid Component - Metadata-Driven
 * Universal statistics display for any entity type
 */

import React from "react";
import { Card, CardContent } from "./Card";
import {
  Users,
  TrendingUp,
  Star,
  Shield,
  BarChart3,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Package,
  UserCheck,
  Zap,
} from "lucide-react";

// Icon mapping for common stat types
const ICON_MAP = {
  users: Users,
  trending: TrendingUp,
  star: Star,
  shield: Shield,
  chart: BarChart3,
  activity: Activity,
  alert: AlertCircle,
  check: CheckCircle,
  clock: Clock,
  dollar: DollarSign,
  package: Package,
  usercheck: UserCheck,
  zap: Zap,
};

type IconName = keyof typeof ICON_MAP;

export interface StatItem {
  key: string;
  label: string;
  value: number | string;
  icon?: IconName | React.ReactNode;
  color?: "blue" | "green" | "yellow" | "red" | "purple" | "gray";
  trend?: {
    value: number;
    direction: "up" | "down" | "neutral";
    period: string; // e.g., "vs last month"
  };
  description?: string;
  link?: string; // Optional link for drill-down
}

interface StatsGridProps {
  // Data
  stats: StatItem[];
  loading?: boolean;
  error?: string;

  // API Configuration
  apiEndpoint?: string;
  refreshInterval?: number; // Auto-refresh in seconds

  // Layout
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  responsive?: boolean;
  showTrends?: boolean;

  // Styling
  className?: string;
  cardClassName?: string;

  // Callbacks
  onStatClick?: (stat: StatItem) => void;
  onRefresh?: () => void;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  stats,
  loading = false,
  error,
  apiEndpoint,
  refreshInterval,
  columns = 4,
  responsive = true,
  showTrends = true,
  className = "",
  cardClassName = "",
  onStatClick,
  onRefresh,
}) => {
  // Auto-refresh functionality
  React.useEffect(() => {
    if (refreshInterval && onRefresh) {
      const interval = setInterval(onRefresh, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, onRefresh]);

  const getColorClasses = (color: StatItem["color"] = "blue") => {
    switch (color) {
      case "green":
        return "text-green-600 bg-green-100";
      case "yellow":
        return "text-yellow-600 bg-yellow-100";
      case "red":
        return "text-red-600 bg-red-100";
      case "purple":
        return "text-purple-600 bg-purple-100";
      case "gray":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-blue-600 bg-blue-100";
    }
  };

  const getIconColorClasses = (color: StatItem["color"] = "blue") => {
    switch (color) {
      case "green":
        return "text-green-500";
      case "yellow":
        return "text-yellow-500";
      case "red":
        return "text-red-500";
      case "purple":
        return "text-purple-500";
      case "gray":
        return "text-gray-500";
      default:
        return "text-blue-500";
    }
  };

  const getTrendClasses = (direction: "up" | "down" | "neutral") => {
    switch (direction) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getTrendIcon = (direction: "up" | "down" | "neutral") => {
    switch (direction) {
      case "up":
        return "↗";
      case "down":
        return "↘";
      default:
        return "→";
    }
  };

  const renderIcon = (stat: StatItem) => {
    if (React.isValidElement(stat.icon)) {
      return stat.icon;
    }

    if (typeof stat.icon === "string" && stat.icon in ICON_MAP) {
      const IconComponent = ICON_MAP[stat.icon as IconName];
      return <IconComponent className="h-8 w-8" />;
    }

    // Default icon
    return <BarChart3 className="h-8 w-8" />;
  };

  const formatValue = (value: number | string) => {
    if (typeof value === "number") {
      // Format large numbers
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      }
      if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
      }
      return value.toLocaleString();
    }
    return value;
  };

  const handleStatClick = (stat: StatItem) => {
    if (stat.link) {
      window.location.href = stat.link;
    } else if (onStatClick) {
      onStatClick(stat);
    }
  };

  const getGridClasses = () => {
    let baseClasses = "grid gap-4 mb-6";

    if (responsive) {
      switch (columns) {
        case 1:
          return `${baseClasses} grid-cols-1`;
        case 2:
          return `${baseClasses} grid-cols-1 md:grid-cols-2`;
        case 3:
          return `${baseClasses} grid-cols-1 md:grid-cols-2 lg:grid-cols-3`;
        case 4:
          return `${baseClasses} grid-cols-1 md:grid-cols-2 lg:grid-cols-4`;
        case 5:
          return `${baseClasses} grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5`;
        case 6:
          return `${baseClasses} grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6`;
        default:
          return `${baseClasses} grid-cols-1 md:grid-cols-2 lg:grid-cols-4`;
      }
    } else {
      return `${baseClasses} grid-cols-${columns}`;
    }
  };

  if (loading) {
    return (
      <div className={`${getGridClasses()} ${className}`}>
        {Array.from({ length: columns }).map((_, i) => (
          <Card key={i} className={cardClassName}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-12"></div>
              </div>
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className={`${className} border-red-200 bg-red-50`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <p className="font-medium">Error loading statistics</p>
          </div>
          <p className="text-sm text-red-600 mt-1">{error}</p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (stats.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No statistics available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`${getGridClasses()} ${className}`}>
      {stats.map((stat) => (
        <Card
          key={stat.key}
          className={`${cardClassName} ${
            stat.link || onStatClick
              ? "cursor-pointer hover:shadow-md transition-shadow"
              : ""
          }`}
          onClick={() => handleStatClick(stat)}
        >
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatValue(stat.value)}
              </p>

              {stat.description && (
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              )}

              {showTrends && stat.trend && (
                <div
                  className={`flex items-center gap-1 text-xs mt-2 ${getTrendClasses(stat.trend.direction)}`}
                >
                  <span>{getTrendIcon(stat.trend.direction)}</span>
                  <span>{Math.abs(stat.trend.value)}%</span>
                  <span className="text-gray-500">{stat.trend.period}</span>
                </div>
              )}
            </div>

            <div className={`p-2 rounded-lg ${getColorClasses(stat.color)}`}>
              <div className={getIconColorClasses(stat.color)}>
                {renderIcon(stat)}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default StatsGrid;
