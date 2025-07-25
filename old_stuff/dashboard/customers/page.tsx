"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation, useAuth } from "@erp/shared-ui";
import BusinessEntityList from "../../../components/business-entities/BusinessEntityList";
import { Button, Card, CardContent, CardHeader } from "@erp/shared-ui";
import { Users, TrendingUp, DollarSign, Activity, Plus } from "lucide-react";

interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  totalSales: number;
  averageOrderValue: number;
}

export default function CustomersPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, tokens, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<CustomerStats>({
    totalCustomers: 0,
    activeCustomers: 0,
    totalSales: 0,
    averageOrderValue: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const handleCreateCustomer = () => {
    router.push("/dashboard/customers/create");
  };

  const handleCustomerClick = (entity: any) => {
    router.push(`/dashboard/customers/${entity.id}`);
  };

  // Load customer statistics from API
  const loadCustomerStats = async () => {
    if (!tokens?.accessToken) {
      setStatsError("Authentication required");
      return;
    }

    try {
      setStatsLoading(true);
      setStatsError(null);

      const response = await fetch(
        "/api/v1/business-entities/stats/customers",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setStats({
        totalCustomers: data.total_customers,
        activeCustomers: data.active_customers,
        totalSales: data.total_sales,
        averageOrderValue: data.average_order_value,
      });
    } catch (error) {
      console.error("Error loading customer statistics:", error);
      setStatsError(
        error instanceof Error
          ? error.message
          : "Failed to load customer statistics"
      );
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (tokens?.accessToken) {
      loadCustomerStats();
    }
  }, [tokens?.accessToken]);

  const statsCards = [
    {
      title: t("total_customers", { ns: "customers" }),
      value: stats.totalCustomers.toLocaleString(),
      icon: Users,
      color: "blue",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: t("active_customers", { ns: "customers" }),
      value: stats.activeCustomers.toLocaleString(),
      icon: Activity,
      color: "green",
      bgColor: "bg-green-100 dark:bg-green-900/20",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      title: t("total_sales", { ns: "customers" }),
      value: `€${stats.totalSales.toLocaleString()}`,
      icon: DollarSign,
      color: "yellow",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
      iconColor: "text-yellow-600 dark:text-yellow-400",
    },
    {
      title: t("average_order_value", { ns: "customers" }),
      value: `€${stats.averageOrderValue.toLocaleString()}`,
      icon: TrendingUp,
      color: "purple",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
  ];

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
                {t("error_loading_stats", { ns: "customers" })}
              </h3>
              <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                <p>{statsError}</p>
              </div>
            </div>
            <div className="ml-3">
              <button
                onClick={loadCustomerStats}
                className="bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-3 py-1 rounded text-sm hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
              >
                {t("retry", { ns: "common" }) || "Δοκιμή ξανά"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t("customers_title", { ns: "customers" })}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {t("customers_description", { ns: "customers" })}
            </p>
          </div>
          {/* <Button
            onClick={handleCreateCustomer}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            <Plus className="w-4 h-4" />
            {t("add_new_customer", { ns: "customers" })}
          </Button> */}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((card, index) => (
          <Card
            key={index}
            className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow ${
              statsLoading ? "animate-pulse" : ""
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {card.title}
                  </p>
                  {statsLoading ? (
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {card.value}
                    </p>
                  )}
                </div>
                {statsLoading ? (
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                ) : (
                  <div className={`p-3 rounded-full ${card.bgColor}`}>
                    <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Customer List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <BusinessEntityList
          roleFilter="customer"
          title={t("customer_directory", { ns: "customers" })}
          showCreateButton={true}
          onCreateClick={handleCreateCustomer}
          onEntityClick={handleCustomerClick}
        />
      </div>
    </div>
  );
}
