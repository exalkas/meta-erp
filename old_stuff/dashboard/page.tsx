"use client";

import React from "react";
import { useTranslation, useAuth } from "@erp/shared-ui";
import { useState, useEffect } from "react";
import {
  fetchDashboardStats,
  fetchRecentActivities,
  fetchQuickActions,
  type DashboardStats,
  type RecentActivity,
  type QuickAction,
} from "@erp/shared-api";
import {
  TrendingUp,
  Users,
  FileText,
  Calendar,
  DollarSign,
  Target,
  Phone,
  Mail,
  Plus,
  ArrowUpRight,
  Activity,
  Building,
  CheckCircle,
  Package,
  BarChart3,
  Settings,
  Zap,
  Clock,
} from "lucide-react";

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user, tokens } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null
  );
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Recent activities state
  const [recentActivitiesData, setRecentActivitiesData] = useState<
    RecentActivity[]
  >([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);

  // Quick actions state
  const [quickActionsData, setQuickActionsData] = useState<QuickAction[]>([]);
  const [actionsLoading, setActionsLoading] = useState(true);
  const [actionsError, setActionsError] = useState<string | null>(null);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch dashboard statistics
  const loadDashboardStats = async () => {
    if (!tokens?.accessToken) {
      setStatsError("Authentication required");
      return;
    }

    try {
      setStatsLoading(true);
      setStatsError(null);

      const stats = await fetchDashboardStats(tokens.accessToken);
      setDashboardStats(stats);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load dashboard statistics";
      setStatsError(errorMessage);
      console.error("Dashboard stats error:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch recent activities
  const loadRecentActivities = async () => {
    if (!tokens?.accessToken) {
      setActivitiesError("Authentication required");
      return;
    }

    try {
      setActivitiesLoading(true);
      setActivitiesError(null);

      const response = await fetchRecentActivities(tokens.accessToken, 5);
      setRecentActivitiesData(response.activities);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load recent activities";
      setActivitiesError(errorMessage);
      console.error("Recent activities error:", error);
    } finally {
      setActivitiesLoading(false);
    }
  };

  // Fetch quick actions
  const loadQuickActions = async () => {
    if (!tokens?.accessToken) {
      setActionsError("Authentication required");
      return;
    }

    try {
      setActionsLoading(true);
      setActionsError(null);

      const response = await fetchQuickActions(tokens.accessToken);
      setQuickActionsData(response.actions);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load quick actions";
      setActionsError(errorMessage);
      console.error("Quick actions error:", error);
    } finally {
      setActionsLoading(false);
    }
  };

  // Load dashboard stats on component mount and when tokens change
  useEffect(() => {
    loadDashboardStats();
    loadRecentActivities();
    loadQuickActions();
  }, [tokens?.accessToken]);

  const formatGreekTime = (date: Date) => {
    return date.toLocaleString("el-GR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper function to format change indicators
  const formatChangeIndicator = (
    value: number | string | undefined
  ): string => {
    const numValue = typeof value === "string" ? parseFloat(value) : value || 0;
    if (numValue === 0) return "0%";
    const sign = numValue >= 0 ? "+" : "";
    return `${sign}${numValue.toFixed(1)}%`;
  };

  // Helper function to determine trend
  const getTrend = (value: number | string | undefined): "up" | "down" => {
    const numValue = typeof value === "string" ? parseFloat(value) : value || 0;
    return numValue >= 0 ? "up" : "down";
  };

  // KPI data from API or fallback to loading state
  const kpis = dashboardStats
    ? [
        {
          title: t("total_customers", { ns: "dashboard" }),
          value: dashboardStats.total_customers.toString(),
          change: formatChangeIndicator(
            dashboardStats.change_indicators.customers
          ),
          trend: getTrend(dashboardStats.change_indicators.customers),
          icon: Users,
          color: "blue",
        },
        {
          title: t("monthly_invoices", { ns: "dashboard" }),
          value: dashboardStats.monthly_invoices.toString(),
          change: formatChangeIndicator(
            dashboardStats.change_indicators.invoices
          ),
          trend: getTrend(dashboardStats.change_indicators.invoices),
          icon: FileText,
          color: "green",
        },
        {
          title: t("monthly_revenue", { ns: "dashboard" }),
          value: dashboardStats.monthly_revenue_formatted,
          change: formatChangeIndicator(
            dashboardStats.change_indicators.revenue
          ),
          trend: getTrend(dashboardStats.change_indicators.revenue),
          icon: TrendingUp,
          color: "purple",
        },
        {
          title: t("active_opportunities", { ns: "dashboard" }),
          value: dashboardStats.active_opportunities.toString(),
          change: formatChangeIndicator(
            dashboardStats.change_indicators.opportunities
          ),
          trend: getTrend(dashboardStats.change_indicators.opportunities),
          icon: Target,
          color: "orange",
        },
      ]
    : [
        // Loading state placeholders
        {
          title: t("total_customers", { ns: "dashboard" }),
          value: statsLoading
            ? "..."
            : statsError
            ? t("stats_unavailable", { ns: "dashboard" })
            : "0",
          change: "+0%",
          trend: "up",
          icon: Users,
          color: "blue",
        },
        {
          title: t("monthly_invoices", { ns: "dashboard" }),
          value: statsLoading
            ? "..."
            : statsError
            ? t("stats_unavailable", { ns: "dashboard" })
            : "0",
          change: "+0%",
          trend: "up",
          icon: FileText,
          color: "green",
        },
        {
          title: t("monthly_revenue", { ns: "dashboard" }),
          value: statsLoading
            ? "..."
            : statsError
            ? t("stats_unavailable", { ns: "dashboard" })
            : "€0",
          change: "+0%",
          trend: "up",
          icon: TrendingUp,
          color: "purple",
        },
        {
          title: t("active_opportunities", { ns: "dashboard" }),
          value: statsLoading
            ? "..."
            : statsError
            ? t("stats_unavailable", { ns: "dashboard" })
            : "0",
          change: "+0%",
          trend: "up",
          icon: Target,
          color: "orange",
        },
      ];

  // Map icon strings to actual icon components
  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      FileText,
      Users,
      Building,
      Phone,
      Target,
      Mail,
      Calendar,
      DollarSign,
      CheckCircle,
      Activity,
      Package,
      BarChart3,
      Settings,
    };
    return iconMap[iconName] || Activity;
  };

  // Fallback quick actions if API call fails
  const fallbackQuickActions: QuickAction[] = [
    {
      title: t("new_invoice", { ns: "dashboard" }),
      description: t("new_invoice_desc", { ns: "dashboard" }),
      icon: "FileText",
      color: "green",
      href: "/invoices/new",
    },
    {
      title: t("new_customer", { ns: "dashboard" }),
      description: t("new_customer_desc", { ns: "dashboard" }),
      icon: "Users",
      color: "blue",
      href: "/customers/new",
    },
    {
      title: t("new_opportunity", { ns: "dashboard" }),
      description: t("new_opportunity_desc", { ns: "dashboard" }),
      icon: "Target",
      color: "purple",
      href: "/opportunities/new",
    },
    {
      title: t("schedule", { ns: "dashboard" }),
      description: t("schedule_desc", { ns: "dashboard" }),
      icon: "Calendar",
      color: "orange",
      href: "/activities/new",
    },
  ];

  // Use real data or fallback
  const displayQuickActions =
    quickActionsData.length > 0 ? quickActionsData : fallbackQuickActions;

  const moduleCards = [
    {
      icon: "👥",
      title: t("business_management", { ns: "dashboard" }),
      description: t("business_management_desc", { ns: "dashboard" }),
      href: "/businesses",
      status: "active",
      phase: "milestone_1",
    },
    {
      icon: "🧾",
      title: t("greek_invoicing", { ns: "dashboard" }),
      description: t("greek_invoicing_desc", { ns: "dashboard" }),
      href: "/invoices",
      status: "active",
      phase: "milestone_1",
    },
    {
      icon: "🎯",
      title: t("sales_pipeline", { ns: "dashboard" }),
      description: t("sales_pipeline_desc", { ns: "dashboard" }),
      href: "/opportunities",
      status: "active",
      phase: "milestone_1",
    },
    {
      icon: "📦",
      title: t("product_catalog", { ns: "dashboard" }),
      description: t("product_catalog_desc", { ns: "dashboard" }),
      href: "/products",
      status: "developing",
      phase: "erp_core",
    },
    {
      icon: "📋",
      title: t("inventory_management", { ns: "dashboard" }),
      description: t("inventory_management_desc", { ns: "dashboard" }),
      href: "/inventory",
      status: "planned",
      phase: "erp_core",
    },
    {
      icon: "💰",
      title: t("financial_management", { ns: "dashboard" }),
      description: t("financial_management_desc", { ns: "dashboard" }),
      href: "/finance",
      status: "planned",
      phase: "erp_expansion",
    },
    {
      icon: "📊",
      title: t("business_analytics", { ns: "dashboard" }),
      description: t("business_analytics_desc", { ns: "dashboard" }),
      href: "/analytics",
      status: "planned",
      phase: "erp_expansion",
    },
    {
      icon: "🏛️",
      title: t("aade_compliance", { ns: "dashboard" }),
      description: t("aade_compliance_desc", { ns: "dashboard" }),
      href: "/compliance",
      status: "developing",
      phase: "milestone_1",
    },
    {
      icon: "👨‍💼",
      title: t("hr_management", { ns: "dashboard" }),
      description: t("hr_management_desc", { ns: "dashboard" }),
      href: "/hr",
      status: "planned",
      phase: "erp_expansion",
    },
  ];

  const getKpiIcon = (IconComponent: any, color: string) => {
    const colorClasses = {
      blue: "text-blue-600 bg-blue-100",
      green: "text-green-600 bg-green-100",
      purple: "text-purple-600 bg-purple-100",
      orange: "text-orange-600 bg-orange-100",
    };

    return (
      <div
        className={`p-3 rounded-full ${
          colorClasses[color as keyof typeof colorClasses]
        }`}
      >
        <IconComponent size={24} />
      </div>
    );
  };

  const getActivityIcon = (IconComponent: any, color: string) => {
    const colorClasses = {
      blue: "text-blue-600",
      green: "text-green-600",
      purple: "text-purple-600",
      orange: "text-orange-600",
    };

    return (
      <IconComponent
        size={16}
        className={colorClasses[color as keyof typeof colorClasses]}
      />
    );
  };

  const getModuleStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle size={20} className="text-green-600" />;
      case "developing":
        return <Zap size={20} className="text-blue-600" />;
      case "planned":
        return <Clock size={20} className="text-gray-400" />;
      default:
        return null;
    }
  };

  const getModuleStatusText = (status: string) => {
    switch (status) {
      case "active":
        return {
          text: t("module_active", { ns: "dashboard" }),
          className: "bg-green-100 text-green-700",
        };
      case "developing":
        return {
          text: t("module_developing", { ns: "dashboard" }),
          className: "bg-blue-100 text-blue-700",
        };
      case "planned":
        return {
          text: t("module_planned", { ns: "dashboard" }),
          className: "bg-gray-100 text-gray-600",
        };
      default:
        return { text: "", className: "" };
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case "milestone_1":
        return "border-l-4 border-l-green-500 bg-green-50";
      case "erp_core":
        return "border-l-4 border-l-blue-500 bg-blue-50";
      case "erp_expansion":
        return "border-l-4 border-l-purple-500 bg-purple-50";
      default:
        return "border-l-4 border-l-gray-300 bg-gray-50";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Error Notification */}
      {statsError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                {t("error_loading_stats", { ns: "dashboard" })}
              </h3>
              <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                <p>{t("data_temporarily_unavailable", { ns: "dashboard" })}</p>
                <p className="mt-1">
                  {t("retry_in_moment", { ns: "dashboard" })}
                </p>
              </div>
            </div>
            <div className="ml-3">
              <button
                onClick={() => {
                  setStatsError(null);
                  loadDashboardStats();
                }}
                className="bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-3 py-1 rounded text-sm hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
              >
                {t("retry", { ns: "common" }) || "Δοκιμή ξανά"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t("welcome_user", {
              ns: "dashboard",
              variables: { name: user?.name || "User" },
            })}
          </h1>
          <div className="text-sm text-gray-600">
            {formatGreekTime(currentTime)}
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          {t("company_overview", {
            ns: "dashboard",
            variables: {
              company:
                user?.name?.split("@")[0] ||
                user?.email?.split("@")[0] ||
                t("company_not_set", { ns: "dashboard" }),
            },
          })}
        </p>
      </div>

      {/* Milestone Progress */}
      <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {t("development_progress", { ns: "dashboard" })}
            </h2>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>{t("milestone_1_progress", { ns: "dashboard" })}</strong>→
              <strong className="ml-2">
                {t("erp_core_next", { ns: "dashboard" })}
              </strong>
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">3/4</div>
              <div className="text-xs text-gray-600">Milestone 1</div>
            </div>
            <ArrowUpRight className="text-blue-600" size={24} />
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">0/4</div>
              <div className="text-xs text-gray-600">ERP Core</div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {statsError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                Failed to load dashboard statistics
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {statsError}
              </p>
              <button
                onClick={loadDashboardStats}
                className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-500 font-medium"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, index) => (
          <div
            key={index}
            className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow ${
              statsLoading ? "animate-pulse" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {kpi.title}
                </p>
                {statsLoading ? (
                  <div className="space-y-2">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {kpi.value}
                    </p>
                    <div className="flex items-center mt-2">
                      <ArrowUpRight
                        size={16}
                        className={`mr-1 ${
                          kpi.trend === "up" ? "text-green-600" : "text-red-600"
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          kpi.trend === "up" ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {kpi.change}
                      </span>
                    </div>
                  </>
                )}
              </div>
              {statsLoading ? (
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              ) : (
                getKpiIcon(kpi.icon, kpi.color)
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {t("quick_actions", { ns: "dashboard" })}
          </h2>
          <div className="space-y-3">
            {actionsLoading
              ? [...Array(4)].map((_, index) => (
                  <div
                    key={index}
                    className="w-full p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse"
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mr-3"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))
              : displayQuickActions.map((action, index) => (
                  <button
                    key={index}
                    className="w-full p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md transition-all text-left group"
                  >
                    <div className="flex items-center">
                      <div
                        className={`p-2 rounded-lg mr-3 group-hover:scale-110 transition-transform ${
                          action.color === "blue"
                            ? "bg-blue-100 text-blue-600"
                            : action.color === "green"
                            ? "bg-green-100 text-green-600"
                            : action.color === "purple"
                            ? "bg-purple-100 text-purple-600"
                            : "bg-orange-100 text-orange-600"
                        }`}
                      >
                        {React.createElement(getIconComponent(action.icon), {
                          size: 20,
                        })}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {action.title}
                          {action.count !== undefined && (
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {action.count}
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {t("recent_activities", { ns: "dashboard" })}
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            {activitiesLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="flex items-center animate-pulse">
                    <div className="flex-shrink-0 mr-3">
                      <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : activitiesError ? (
              <div className="text-center py-8">
                <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {t("error_loading_activities", { ns: "dashboard" })}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {activitiesError}
                </p>
                <button
                  onClick={loadRecentActivities}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {t("retry", { ns: "common" }) || "Δοκιμή ξανά"}
                </button>
              </div>
            ) : recentActivitiesData.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {t("no_recent_activities", { ns: "dashboard" })}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("no_recent_activities_desc", { ns: "dashboard" })}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivitiesData.map((activity, index) => (
                  <div key={activity.id || index} className="flex items-center">
                    <div className="flex-shrink-0 mr-3">
                      {getActivityIcon(
                        getIconComponent(activity.icon),
                        activity.color
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!activitiesLoading &&
              !activitiesError &&
              recentActivitiesData.length > 0 && (
                <button className="w-full mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium">
                  {t("view_all_activities", { ns: "dashboard" })}
                </button>
              )}
          </div>
        </div>
      </div>

      {/* Module Cards - Organized by Development Phase */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {t("system_modules", { ns: "dashboard" })}
        </h2>

        {/* Phase Headers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
            <h3 className="font-semibold text-green-800 dark:text-green-400 flex items-center">
              <CheckCircle size={16} className="mr-2" />
              {t("milestone_1_title", { ns: "dashboard" })}
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              {t("milestone_1_desc", { ns: "dashboard" })}
            </p>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
            <h3 className="font-semibold text-blue-800 dark:text-blue-400 flex items-center">
              <Zap size={16} className="mr-2" />
              {t("erp_core_title", { ns: "dashboard" })}
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              {t("erp_core_desc", { ns: "dashboard" })}
            </p>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
            <h3 className="font-semibold text-purple-800 dark:text-purple-400 flex items-center">
              <Clock size={16} className="mr-2" />
              {t("erp_expansion_title", { ns: "dashboard" })}
            </h3>
            <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
              {t("erp_expansion_desc", { ns: "dashboard" })}
            </p>
          </div>
        </div>

        {/* Module Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {moduleCards.map((card, index) => (
            <div
              key={index}
              className={`bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all group cursor-pointer ${getPhaseColor(
                card.phase
              )}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-3xl mb-3">{card.icon}</div>
                <div className="flex flex-col items-end space-y-2">
                  {getModuleStatusBadge(card.status)}
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      getModuleStatusText(card.status).className
                    }`}
                  >
                    {getModuleStatusText(card.status).text}
                  </span>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {card.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                {card.description}
              </p>
              {card.status === "active" && (
                <div className="flex items-center text-blue-600 text-sm font-medium group-hover:text-blue-800">
                  {t("open_module", { ns: "dashboard" })}{" "}
                  <ArrowUpRight size={16} className="ml-1" />
                </div>
              )}
              {card.status === "developing" && (
                <div className="flex items-center text-blue-600 text-sm font-medium">
                  {t("in_development", { ns: "dashboard" })}{" "}
                  <Activity size={16} className="ml-1" />
                </div>
              )}
              {card.status === "planned" && (
                <div className="flex items-center text-gray-500 text-sm">
                  {t("next_phase", { ns: "dashboard" })}{" "}
                  <Clock size={16} className="ml-1" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="text-blue-600 mr-3" size={24} />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-300">
                {t("axiologic_integrated", { ns: "dashboard" })}
              </h3>
              <p className="text-blue-700 dark:text-blue-400 text-sm">
                {t("development_phases", { ns: "dashboard" })}
              </p>
            </div>
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
            {t("multi_company_security", { ns: "dashboard" })}
          </div>
        </div>
      </div>
    </div>
  );
}
