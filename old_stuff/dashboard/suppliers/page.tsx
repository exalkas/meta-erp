"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation, useAuth } from "@erp/shared-ui";
import BusinessEntityList from "../../../components/business-entities/BusinessEntityList";
import { Button, Card, CardContent, CardHeader } from "@erp/shared-ui";
import { Building2, Package, TrendingDown, Star, Plus } from "lucide-react";

interface SupplierStats {
  totalSuppliers: number;
  activeSuppliers: number;
  totalPurchases: number;
  averageRating: number;
}

export default function SuppliersPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, tokens, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<SupplierStats>({
    totalSuppliers: 0,
    activeSuppliers: 0,
    totalPurchases: 0,
    averageRating: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  const handleCreateSupplier = () => {
    router.push("/dashboard/suppliers/create");
  };

  const handleSupplierClick = (entity: any) => {
    router.push(`/dashboard/suppliers/${entity.id}`);
  };

  // Load supplier statistics from API
  const loadSupplierStats = async () => {
    if (!tokens?.accessToken) {
      setStatsError("Authentication required");
      return;
    }

    try {
      setStatsLoading(true);
      setStatsError(null);

      const response = await fetch(
        "/api/v1/business-entities/stats/suppliers",
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
        totalSuppliers: data.total_suppliers,
        activeSuppliers: data.active_suppliers,
        totalPurchases: data.total_purchases,
        averageRating: data.average_rating,
      });
    } catch (error) {
      console.error("Error loading supplier statistics:", error);
      setStatsError(
        error instanceof Error
          ? error.message
          : "Failed to load supplier statistics"
      );
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (tokens?.accessToken) {
      loadSupplierStats();
    }
  }, [tokens?.accessToken]);

  const statsCards = [
    {
      title: t("total_suppliers", { ns: "suppliers" }),
      value: stats.totalSuppliers.toLocaleString(),
      icon: Building2,
      color: "blue",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: t("active_suppliers", { ns: "suppliers" }),
      value: stats.activeSuppliers.toLocaleString(),
      icon: Package,
      color: "green",
      bgColor: "bg-green-100 dark:bg-green-900/20",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      title: t("total_purchases", { ns: "suppliers" }),
      value: `€${stats.totalPurchases.toLocaleString()}`,
      icon: TrendingDown,
      color: "orange",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
      iconColor: "text-orange-600 dark:text-orange-400",
    },
    {
      title: t("average_rating", { ns: "suppliers" }),
      value: `${stats.averageRating.toFixed(1)}/5.0`,
      icon: Star,
      color: "yellow",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/20",
      iconColor: "text-yellow-600 dark:text-yellow-400",
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
                {t("error_loading_stats", { ns: "suppliers" })}
              </h3>
              <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                <p>{statsError}</p>
              </div>
            </div>
            <div className="ml-3">
              <button
                onClick={loadSupplierStats}
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
              {t("suppliers_title", { ns: "suppliers" })}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {t("suppliers_description", { ns: "suppliers" })}
            </p>
          </div>
          <Button
            onClick={handleCreateSupplier}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            <Plus className="w-4 h-4" />
            {t("add_new_supplier", { ns: "suppliers" })}
          </Button>
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

      {/* Supplier List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <BusinessEntityList
          roleFilter="supplier"
          title={t("supplier_directory", { ns: "suppliers" })}
          showCreateButton={true}
          onCreateClick={handleCreateSupplier}
          onEntityClick={handleSupplierClick}
        />
      </div>
    </div>
  );
}
