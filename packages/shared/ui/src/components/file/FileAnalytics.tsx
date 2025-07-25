"use client";

import { useState, useMemo } from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Select } from "../ui/Select";
import { Tabs } from "../ui/Tabs";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Files,
  Download,
  Upload,
  Eye,
  Share2,
  Calendar,
  Clock,
  HardDrive,
  Activity,
  Target,
  Zap,
  AlertCircle,
  CheckCircle,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Code,
  Folder,
  User,
  Globe,
  Star,
  RefreshCw,
  Filter,
  ExternalLink,
  Settings,
  Info,
} from "lucide-react";

// Simple utility function for className concatenation
const cn = (...classes: (string | undefined | null | boolean)[]) => {
  return classes.filter(Boolean).join(" ");
};

export interface FileMetrics {
  totalFiles: number;
  totalSize: number;
  totalDownloads: number;
  totalViews: number;
  totalShares: number;
  activeUsers: number;
  growth: {
    files: number;
    size: number;
    downloads: number;
    views: number;
    shares: number;
    users: number;
  };
}

export interface FileTypeAnalytics {
  type: string;
  label: string;
  count: number;
  size: number;
  percentage: number;
  downloads: number;
  views: number;
  shares: number;
  avgFileSize: number;
  icon: React.ReactNode;
  color: string;
  trend: "up" | "down" | "stable";
  trendPercentage: number;
}

export interface UserActivity {
  userId: string;
  userName: string;
  email: string;
  avatar?: string;
  filesCreated: number;
  filesModified: number;
  filesDeleted: number;
  downloads: number;
  uploads: number;
  views: number;
  shares: number;
  storageUsed: number;
  lastActive: Date;
  activityScore: number;
}

export interface TimeSeriesData {
  date: Date;
  files: number;
  size: number;
  downloads: number;
  views: number;
  shares: number;
  users: number;
  activity: number;
}

export interface PopularFile {
  id: string;
  name: string;
  type: string;
  size: number;
  downloads: number;
  views: number;
  shares: number;
  owner: string;
  created: Date;
  modified: Date;
  score: number;
  icon: React.ReactNode;
  thumbnail?: string;
}

interface FileAnalyticsProps {
  metrics: FileMetrics;
  fileTypes: FileTypeAnalytics[];
  userActivity: UserActivity[];
  timeSeriesData: TimeSeriesData[];
  popularFiles: PopularFile[];
  dateRange: [Date, Date];
  onDateRangeChange: (range: [Date, Date]) => void;
  onExport?: (type: "metrics" | "activity" | "files" | "trends") => void;
  onRefresh?: () => void;
  loading?: boolean;
  error?: string;
  showUserActivity?: boolean;
  showTrends?: boolean;
  showPopularFiles?: boolean;
  compact?: boolean;
  className?: string;
}

const formatFileSize = (bytes: number) => {
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("el-GR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

const getFileTypeIcon = (type: string) => {
  switch (type) {
    case "document":
      return <FileText className="h-4 w-4" />;
    case "image":
      return <Image className="h-4 w-4" />;
    case "video":
      return <Video className="h-4 w-4" />;
    case "audio":
      return <Music className="h-4 w-4" />;
    case "archive":
      return <Archive className="h-4 w-4" />;
    case "code":
      return <Code className="h-4 w-4" />;
    case "folder":
      return <Folder className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getTrendIcon = (trend: "up" | "down" | "stable", percentage: number) => {
  if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (trend === "down")
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Activity className="h-4 w-4 text-gray-500" />;
};

const getActivityLevel = (score: number) => {
  if (score >= 80)
    return { level: "high", color: "bg-green-500", label: "High" };
  if (score >= 60)
    return { level: "medium", color: "bg-yellow-500", label: "Medium" };
  if (score >= 40)
    return { level: "low", color: "bg-orange-500", label: "Low" };
  return { level: "inactive", color: "bg-gray-500", label: "Inactive" };
};

interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  content: React.ReactNode;
}

export const FileAnalytics = ({
  metrics,
  fileTypes,
  userActivity,
  timeSeriesData,
  popularFiles,
  dateRange,
  onDateRangeChange,
  onExport,
  onRefresh,
  loading = false,
  error,
  showUserActivity = true,
  showTrends = true,
  showPopularFiles = true,
  compact = false,
  className,
}: FileAnalyticsProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPeriod, setSelectedPeriod] = useState("7d");
  const [selectedMetric, setSelectedMetric] = useState("files");

  const totalActivity = useMemo(() => {
    return userActivity.reduce((sum, user) => sum + user.activityScore, 0);
  }, [userActivity]);

  const topUsers = useMemo(() => {
    return [...userActivity]
      .sort((a, b) => b.activityScore - a.activityScore)
      .slice(0, 10);
  }, [userActivity]);

  const mostActiveFileTypes = useMemo(() => {
    return [...fileTypes]
      .sort((a, b) => b.downloads + b.views - (a.downloads + a.views))
      .slice(0, 5);
  }, [fileTypes]);

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    const now = new Date();
    const start = new Date();

    switch (period) {
      case "24h":
        start.setHours(now.getHours() - 24);
        break;
      case "7d":
        start.setDate(now.getDate() - 7);
        break;
      case "30d":
        start.setDate(now.getDate() - 30);
        break;
      case "90d":
        start.setDate(now.getDate() - 90);
        break;
      case "1y":
        start.setFullYear(now.getFullYear() - 1);
        break;
      default:
        start.setDate(now.getDate() - 7);
    }

    onDateRangeChange([start, now]);
  };

  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <div className="p-8">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-red-800 mb-2">
                {t("analytics.errorTitle")}
              </h3>
              <p className="text-red-600 mb-4">{error}</p>
              <Button variant="outline" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                {t("analytics.retry")}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const overviewTabContent = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart Placeholder */}
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5" />
              <h3 className="text-lg font-semibold">
                {t("analytics.activityTrends")}
              </h3>
            </div>
            <div className="h-64 flex items-center justify-center text-gray-500">
              {t("analytics.chartPlaceholder")}
            </div>
          </div>
        </Card>

        {/* Top File Types */}
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="h-5 w-5" />
              <h3 className="text-lg font-semibold">
                {t("analytics.topFileTypes")}
              </h3>
            </div>
            <div className="space-y-3">
              {mostActiveFileTypes.map((type) => (
                <div
                  key={type.type}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    {type.icon}
                    <span className="font-medium">{type.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {type.downloads + type.views}{" "}
                      {t("analytics.interactions")}
                    </span>
                    {getTrendIcon(type.trend, type.trendPercentage)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  const typesTabContent = (
    <div className="space-y-4">
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5" />
            <h3 className="text-lg font-semibold">
              {t("analytics.fileTypeAnalytics")}
            </h3>
          </div>
          <div className="space-y-4">
            {fileTypes.map((type) => (
              <div key={type.type} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {type.icon}
                    <span className="font-medium">{type.label}</span>
                    <Badge variant="outline">
                      {type.count} {t("analytics.files")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(type.trend, type.trendPercentage)}
                    <span
                      className={cn(
                        "text-sm",
                        type.trend === "up" ? "text-green-600" : "text-red-600"
                      )}
                    >
                      {type.trendPercentage}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">{t("analytics.totalSize")}</p>
                    <p className="font-medium">{formatFileSize(type.size)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">{t("analytics.downloads")}</p>
                    <p className="font-medium">
                      {formatNumber(type.downloads)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">{t("analytics.views")}</p>
                    <p className="font-medium">{formatNumber(type.views)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">{t("analytics.avgSize")}</p>
                    <p className="font-medium">
                      {formatFileSize(type.avgFileSize)}
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>{t("analytics.storageUsage")}</span>
                    <span>{type.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${Math.min(type.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );

  const usersTabContent = showUserActivity ? (
    <div className="space-y-4">
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <h3 className="text-lg font-semibold">
                {t("analytics.userActivity")}
              </h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport?.("activity")}
            >
              <Download className="h-4 w-4 mr-2" />
              {t("analytics.exportActivity")}
            </Button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-3">
              {topUsers.map((user) => {
                const activity = getActivityLevel(user.activityScore);
                return (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium">{user.userName}</div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <div className="font-medium">
                          {user.downloads + user.views} {t("analytics.actions")}
                        </div>
                        <div className="text-gray-500">
                          {formatFileSize(user.storageUsed)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={cn("h-2 w-2 rounded-full", activity.color)}
                        />
                        <span className="text-sm">{activity.label}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
    </div>
  ) : null;

  const popularTabContent = showPopularFiles ? (
    <div className="space-y-4">
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Star className="h-5 w-5" />
            <h3 className="text-lg font-semibold">
              {t("analytics.popularFiles")}
            </h3>
          </div>
          <div className="space-y-3">
            {popularFiles.map((file, index) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex items-center gap-2">
                    {file.icon}
                    <div>
                      <div className="font-medium">{file.name}</div>
                      <div className="text-sm text-gray-500">
                        {formatFileSize(file.size)} • {t("analytics.by")}{" "}
                        {file.owner}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {formatNumber(file.views)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    {formatNumber(file.downloads)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Share2 className="h-3 w-3" />
                    {formatNumber(file.shares)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  ) : null;

  const tabItems: TabItem[] = [
    {
      id: "overview",
      label: t("analytics.overview"),
      content: overviewTabContent,
    },
    {
      id: "types",
      label: t("analytics.fileTypes"),
      content: typesTabContent,
    },
    ...(showUserActivity
      ? [
          {
            id: "users",
            label: t("analytics.users"),
            content: usersTabContent,
          },
        ]
      : []),
    ...(showPopularFiles
      ? [
          {
            id: "popular",
            label: t("analytics.popular"),
            content: popularTabContent,
          },
        ]
      : []),
  ];

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t("analytics.title")}</h2>
          <p className="text-gray-600">
            {formatDate(dateRange[0])} - {formatDate(dateRange[1])}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => handlePeriodChange(e.target.value)}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="24h">{t("analytics.last24Hours")}</option>
            <option value="7d">{t("analytics.last7Days")}</option>
            <option value="30d">{t("analytics.last30Days")}</option>
            <option value="90d">{t("analytics.last90Days")}</option>
            <option value="1y">{t("analytics.lastYear")}</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-2", loading && "animate-spin")}
            />
            {t("analytics.refresh")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport?.("metrics")}
          >
            <Download className="h-4 w-4 mr-2" />
            {t("analytics.export")}
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {t("analytics.totalFiles")}
                </p>
                <p className="text-2xl font-bold">
                  {formatNumber(metrics.totalFiles)}
                </p>
                <div className="flex items-center gap-1 text-sm">
                  {getTrendIcon(
                    metrics.growth.files > 0 ? "up" : "down",
                    metrics.growth.files
                  )}
                  <span
                    className={cn(
                      metrics.growth.files > 0
                        ? "text-green-600"
                        : "text-red-600"
                    )}
                  >
                    {Math.abs(metrics.growth.files)}%
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Files className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {t("analytics.totalSize")}
                </p>
                <p className="text-2xl font-bold">
                  {formatFileSize(metrics.totalSize)}
                </p>
                <div className="flex items-center gap-1 text-sm">
                  {getTrendIcon(
                    metrics.growth.size > 0 ? "up" : "down",
                    metrics.growth.size
                  )}
                  <span
                    className={cn(
                      metrics.growth.size > 0
                        ? "text-green-600"
                        : "text-red-600"
                    )}
                  >
                    {Math.abs(metrics.growth.size)}%
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <HardDrive className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {t("analytics.totalDownloads")}
                </p>
                <p className="text-2xl font-bold">
                  {formatNumber(metrics.totalDownloads)}
                </p>
                <div className="flex items-center gap-1 text-sm">
                  {getTrendIcon(
                    metrics.growth.downloads > 0 ? "up" : "down",
                    metrics.growth.downloads
                  )}
                  <span
                    className={cn(
                      metrics.growth.downloads > 0
                        ? "text-green-600"
                        : "text-red-600"
                    )}
                  >
                    {Math.abs(metrics.growth.downloads)}%
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Download className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {t("analytics.activeUsers")}
                </p>
                <p className="text-2xl font-bold">
                  {formatNumber(metrics.activeUsers)}
                </p>
                <div className="flex items-center gap-1 text-sm">
                  {getTrendIcon(
                    metrics.growth.users > 0 ? "up" : "down",
                    metrics.growth.users
                  )}
                  <span
                    className={cn(
                      metrics.growth.users > 0
                        ? "text-green-600"
                        : "text-red-600"
                    )}
                  >
                    {Math.abs(metrics.growth.users)}%
                  </span>
                </div>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs activeTab={activeTab} onTabChange={setActiveTab} items={tabItems} />
    </div>
  );
};
