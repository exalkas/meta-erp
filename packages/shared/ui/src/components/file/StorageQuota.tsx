"use client";

import { useState } from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Tabs } from "../ui/Tabs";
import {
  HardDrive,
  Folder,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Code,
  Trash2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  PieChart,
  Settings,
  Upload,
  Download,
  Zap,
  Clock,
  User,
  Building,
  Crown,
  Shield,
  CheckCircle,
  XCircle,
  Info,
  ExternalLink,
  RefreshCw,
  Plus,
  Minus,
  Users,
} from "lucide-react";

// Simple utility function for className concatenation
const cn = (...classes: (string | undefined | null | boolean)[]) => {
  return classes.filter(Boolean).join(" ");
};

export interface StorageUsage {
  total: number;
  used: number;
  available: number;
  usedPercentage: number;
  breakdown: {
    type: string;
    label: string;
    size: number;
    count: number;
    percentage: number;
    icon: React.ReactNode;
    color: string;
  }[];
}

export interface UserQuota {
  userId: string;
  userName: string;
  email: string;
  userType: "admin" | "user" | "guest";
  allocation: number;
  used: number;
  usedPercentage: number;
  lastActivity: Date;
  isActive: boolean;
  overageAmount?: number;
  warningLevel?: "none" | "low" | "medium" | "high" | "critical";
}

export interface StorageHistory {
  date: Date;
  used: number;
  total: number;
  change: number;
  changeType: "increase" | "decrease";
  events: {
    type: "upload" | "delete" | "cleanup" | "quota_change";
    description: string;
    size: number;
    timestamp: Date;
  }[];
}

export interface StoragePlan {
  id: string;
  name: string;
  storage: number;
  price: number;
  currency: string;
  interval: "monthly" | "yearly";
  features: string[];
  isCurrentPlan: boolean;
  isRecommended?: boolean;
  maxUsers?: number;
  maxFileSize?: number;
  advancedFeatures?: string[];
}

interface StorageQuotaProps {
  usage: StorageUsage;
  userQuotas?: UserQuota[];
  history?: StorageHistory[];
  plans?: StoragePlan[];
  currentPlan?: StoragePlan;
  canManageQuotas?: boolean;
  canViewAnalytics?: boolean;
  canUpgradePlan?: boolean;
  onCleanup?: () => void;
  onUpdateUserQuota?: (userId: string, newQuota: number) => void;
  onUpgradePlan?: (planId: string) => void;
  onDownloadReport?: (type: "usage" | "history" | "users") => void;
  loading?: boolean;
  error?: string;
  className?: string;
}

const formatFileSize = (bytes: number) => {
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("el-GR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getWarningColor = (level: string) => {
  switch (level) {
    case "critical":
      return "text-red-600 bg-red-50";
    case "high":
      return "text-orange-600 bg-orange-50";
    case "medium":
      return "text-yellow-600 bg-yellow-50";
    case "low":
      return "text-blue-600 bg-blue-50";
    default:
      return "text-green-600 bg-green-50";
  }
};

const getProgressColor = (percentage: number) => {
  if (percentage >= 90) return "bg-red-500";
  if (percentage >= 75) return "bg-orange-500";
  if (percentage >= 50) return "bg-yellow-500";
  return "bg-green-500";
};

const defaultPlans: StoragePlan[] = [
  {
    id: "basic",
    name: "Basic",
    storage: 10 * 1024 * 1024 * 1024, // 10GB
    price: 9.99,
    currency: "EUR",
    interval: "monthly",
    features: ["10GB Storage", "5 Users", "Basic Support"],
    isCurrentPlan: true,
    maxUsers: 5,
    maxFileSize: 100 * 1024 * 1024, // 100MB
  },
  {
    id: "professional",
    name: "Professional",
    storage: 100 * 1024 * 1024 * 1024, // 100GB
    price: 29.99,
    currency: "EUR",
    interval: "monthly",
    features: [
      "100GB Storage",
      "25 Users",
      "Priority Support",
      "Advanced Analytics",
    ],
    isCurrentPlan: false,
    isRecommended: true,
    maxUsers: 25,
    maxFileSize: 1 * 1024 * 1024 * 1024, // 1GB
    advancedFeatures: ["Version History", "Advanced Sharing", "API Access"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    storage: 1024 * 1024 * 1024 * 1024, // 1TB
    price: 99.99,
    currency: "EUR",
    interval: "monthly",
    features: [
      "1TB Storage",
      "Unlimited Users",
      "24/7 Support",
      "Custom Integrations",
    ],
    isCurrentPlan: false,
    maxUsers: -1, // Unlimited
    maxFileSize: 10 * 1024 * 1024 * 1024, // 10GB
    advancedFeatures: [
      "SSO",
      "Advanced Security",
      "Custom Branding",
      "Dedicated Support",
    ],
  },
];

interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  content: React.ReactNode;
}

export const StorageQuota = ({
  usage,
  userQuotas = [],
  history = [],
  plans = defaultPlans,
  currentPlan,
  canManageQuotas = false,
  canViewAnalytics = false,
  canUpgradePlan = false,
  onCleanup,
  onUpdateUserQuota,
  onUpgradePlan,
  onDownloadReport,
  loading = false,
  error,
  className,
}: StorageQuotaProps) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("overview");
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const [editingQuota, setEditingQuota] = useState<string | null>(null);
  const [newQuotaValue, setNewQuotaValue] = useState<number>(0);

  const handleUpdateQuota = (userId: string) => {
    if (onUpdateUserQuota && newQuotaValue > 0) {
      onUpdateUserQuota(userId, newQuotaValue);
      setEditingQuota(null);
      setNewQuotaValue(0);
    }
  };

  const handleUpgradePlan = () => {
    if (onUpgradePlan && selectedPlan) {
      onUpgradePlan(selectedPlan);
      setShowUpgradeDialog(false);
    }
  };

  const sortedUsers = [...userQuotas].sort(
    (a, b) => b.usedPercentage - a.usedPercentage
  );
  const criticalUsers = userQuotas.filter((u) => u.warningLevel === "critical");
  const averageUsage =
    userQuotas.length > 0
      ? userQuotas.reduce((sum, u) => sum + u.usedPercentage, 0) /
        userQuotas.length
      : 0;

  const recentHistory = history.slice(-30); // Last 30 days
  const usageGrowth =
    recentHistory.length > 1
      ? ((recentHistory[recentHistory.length - 1].used -
          recentHistory[0].used) /
          recentHistory[0].used) *
        100
      : 0;

  const overviewTabContent = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Plan */}
        {currentPlan && (
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="h-5 w-5 text-yellow-600" />
                <h3 className="text-lg font-semibold">
                  {t("storage.currentPlan")}
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{currentPlan.name}</span>
                  <Badge variant="outline">
                    {currentPlan.price}€/{currentPlan.interval}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  <div>
                    {formatFileSize(currentPlan.storage)} {t("storage.storage")}
                  </div>
                  <div>
                    {currentPlan.maxUsers === -1
                      ? t("storage.unlimitedUsers")
                      : `${currentPlan.maxUsers} ${t("storage.users")}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canUpgradePlan && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowUpgradeDialog(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {t("storage.upgrade")}
                    </Button>
                  )}
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    {t("storage.manageBilling")}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5" />
              <h3 className="text-lg font-semibold">
                {t("storage.quickActions")}
              </h3>
            </div>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowCleanupDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t("storage.cleanupFiles")}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => onDownloadReport?.("usage")}
              >
                <Download className="h-4 w-4 mr-2" />
                {t("storage.downloadReport")}
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <RefreshCw className="h-4 w-4 mr-2" />
                {t("storage.refreshData")}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  const breakdownTabContent = (
    <div className="space-y-4">
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="h-5 w-5" />
            <h3 className="text-lg font-semibold">
              {t("storage.storageBreakdown")}
            </h3>
          </div>
          <div className="space-y-4">
            {usage.breakdown.map((item) => (
              <div
                key={item.type}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-4 w-4 rounded-full`}
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatFileSize(item.size)}</div>
                  <div className="text-sm text-gray-500">
                    {item.count} {t("storage.files")} •{" "}
                    {item.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );

  const usersTabContent = canManageQuotas ? (
    <div className="space-y-4">
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <h3 className="text-lg font-semibold">
                {t("storage.userQuotas")}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {t("storage.averageUsage")}: {averageUsage.toFixed(1)}%
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownloadReport?.("users")}
              >
                <Download className="h-4 w-4 mr-1" />
                {t("storage.export")}
              </Button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-3">
              {sortedUsers.map((user) => (
                <div
                  key={user.userId}
                  className={cn(
                    "flex items-center justify-between p-3 border rounded-lg",
                    user.warningLevel === "critical" &&
                      "border-red-200 bg-red-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">{user.userName}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-medium">
                        {formatFileSize(user.used)} /{" "}
                        {formatFileSize(user.allocation)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.usedPercentage.toFixed(1)}% {t("storage.used")}
                      </div>
                    </div>
                    <div className="w-20">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={cn(
                            "h-2 rounded-full",
                            getProgressColor(user.usedPercentage)
                          )}
                          style={{
                            width: `${Math.min(user.usedPercentage, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingQuota(user.userId);
                        setNewQuotaValue(user.allocation);
                      }}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  ) : null;

  const analyticsTabContent = canViewAnalytics ? (
    <div className="space-y-4">
      <Card>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5" />
            <h3 className="text-lg font-semibold">
              {t("storage.usageAnalytics")}
            </h3>
          </div>
          <div className="h-64 flex items-center justify-center text-gray-500">
            {t("storage.analyticsPlaceholder")}
          </div>
        </div>
      </Card>
    </div>
  ) : null;

  const tabItems: TabItem[] = [
    {
      id: "overview",
      label: t("storage.overview"),
      content: overviewTabContent,
    },
    {
      id: "breakdown",
      label: t("storage.breakdown"),
      content: breakdownTabContent,
    },
    ...(canManageQuotas
      ? [
          {
            id: "users",
            label: t("storage.users"),
            badge: criticalUsers.length > 0 ? criticalUsers.length : undefined,
            content: usersTabContent,
          },
        ]
      : []),
    ...(canViewAnalytics
      ? [
          {
            id: "analytics",
            label: t("storage.analytics"),
            content: analyticsTabContent,
          },
        ]
      : []),
  ];

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {t("storage.totalUsage")}
                </p>
                <p className="text-2xl font-bold">
                  {formatFileSize(usage.used)}
                </p>
                <p className="text-sm text-gray-500">
                  {t("storage.of")} {formatFileSize(usage.total)}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <HardDrive className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={cn(
                    "h-2 rounded-full",
                    getProgressColor(usage.usedPercentage)
                  )}
                  style={{ width: `${Math.min(usage.usedPercentage, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {usage.usedPercentage.toFixed(1)}% {t("storage.used")}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {t("storage.available")}
                </p>
                <p className="text-2xl font-bold">
                  {formatFileSize(usage.available)}
                </p>
                <p className="text-sm text-gray-500">
                  {((usage.available / usage.total) * 100).toFixed(1)}%{" "}
                  {t("storage.remaining")}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t("storage.growth")}</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  {usageGrowth > 0 ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  )}
                  {Math.abs(usageGrowth).toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500">
                  {t("storage.last30Days")}
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Warning Banner */}
      {usage.usedPercentage > 80 && (
        <Card className="border-orange-200 bg-orange-50">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div className="flex-1">
                <p className="font-medium text-orange-800">
                  {t("storage.warningTitle")}
                </p>
                <p className="text-sm text-orange-700">
                  {t("storage.warningMessage", {
                    variables: { percentage: usage.usedPercentage.toFixed(1) },
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCleanupDialog(true)}
                  className="border-orange-200 text-orange-700 hover:bg-orange-100"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {t("storage.cleanup")}
                </Button>
                {canUpgradePlan && (
                  <Button
                    size="sm"
                    onClick={() => setShowUpgradeDialog(true)}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {t("storage.upgrade")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Main Content */}
      <Tabs activeTab={activeTab} onTabChange={setActiveTab} items={tabItems} />

      {/* Upgrade Dialog */}
      {showUpgradeDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {t("storage.upgradePlan")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={cn(
                      "cursor-pointer transition-colors p-6",
                      plan.isRecommended && "border-blue-500 bg-blue-50",
                      selectedPlan === plan.id && "ring-2 ring-blue-500"
                    )}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    <div className="text-center">
                      <h3 className="font-bold text-lg">{plan.name}</h3>
                      {plan.isRecommended && (
                        <Badge className="mt-1 mb-2">
                          {t("storage.recommended")}
                        </Badge>
                      )}
                      <div className="text-3xl font-bold text-blue-600">
                        {plan.price}€
                      </div>
                      <div className="text-sm text-gray-500 mb-4">
                        per {plan.interval}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="font-medium">
                          {formatFileSize(plan.storage)} {t("storage.storage")}
                        </div>
                        <div>
                          {plan.maxUsers === -1
                            ? t("storage.unlimitedUsers")
                            : `${plan.maxUsers} ${t("storage.users")}`}
                        </div>
                        <div>
                          {formatFileSize(plan.maxFileSize || 0)}{" "}
                          {t("storage.maxFileSize")}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowUpgradeDialog(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={handleUpgradePlan}
                  disabled={!selectedPlan || selectedPlan === currentPlan?.id}
                >
                  {t("storage.upgrade")}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
