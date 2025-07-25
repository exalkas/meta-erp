"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@erp/shared-ui";
import {
  Building2,
  Settings,
  Layout,
  BarChart3,
  Plus,
  Zap,
  Database,
  Palette,
  Target,
  Users,
} from "lucide-react";

export default function CRMPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const crmFeatures = [
    {
      id: "entity-builder",
      title: t("entity_builder", { ns: "crm" }),
      description: t("entity_builder_desc", { ns: "crm" }),
      icon: Database,
      href: "/dashboard/crm/entity-builder",
      color: "bg-blue-500",
      status: "active",
    },
    {
      id: "field-builder",
      title: t("field_builder", { ns: "crm" }),
      description: t("field_builder_desc", { ns: "crm" }),
      icon: Settings,
      href: "/dashboard/crm/field-builder",
      color: "bg-green-500",
      status: "active",
    },
    {
      id: "layout-designer",
      title: t("layout_designer", { ns: "crm" }),
      description: t("layout_designer_desc", { ns: "crm" }),
      icon: Layout,
      href: "/dashboard/crm/layout-designer",
      color: "bg-purple-500",
      status: "active",
    },
    {
      id: "widget-builder",
      title: t("widget_builder", { ns: "crm" }),
      description: t("widget_builder_desc", { ns: "crm" }),
      icon: BarChart3,
      href: "/dashboard/crm/widget-builder",
      color: "bg-orange-500",
      status: "active",
    },
    {
      id: "business-flow",
      title: t("business_flow_automation", { ns: "crm" }),
      description: t("business_flow_automation_desc", { ns: "crm" }),
      icon: Zap,
      href: "/dashboard/crm/business-flow",
      color: "bg-yellow-500",
      status: "coming_soon",
    },
    {
      id: "analytics",
      title: t("crm_analytics", { ns: "crm" }),
      description: t("crm_analytics_desc", { ns: "crm" }),
      icon: Target,
      href: "/dashboard/crm/analytics",
      color: "bg-red-500",
      status: "coming_soon",
    },
  ];

  const quickActions = [
    {
      id: "create-entity",
      title: t("create_new_entity", { ns: "crm" }),
      description: t("create_new_entity_desc", { ns: "crm" }),
      icon: Plus,
      href: "/dashboard/crm/entity-builder?action=create",
      color: "bg-blue-600",
    },
    {
      id: "design-layout",
      title: t("design_layout", { ns: "crm" }),
      description: t("design_layout_desc", { ns: "crm" }),
      icon: Palette,
      href: "/dashboard/crm/layout-designer?action=create",
      color: "bg-purple-600",
    },
    {
      id: "manage-customers",
      title: t("manage_customers", { ns: "crm" }),
      description: t("manage_customers_desc", { ns: "crm" }),
      icon: Users,
      href: "/dashboard/customers",
      color: "bg-green-600",
    },
  ];

  const handleFeatureClick = (feature: (typeof crmFeatures)[0]) => {
    if (feature.status === "active") {
      router.push(feature.href);
    }
  };

  const handleQuickAction = (action: (typeof quickActions)[0]) => {
    router.push(action.href);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-3">
          <Building2 className="h-8 w-8 text-maritime-blue" />
          <h1 className="text-3xl font-bold text-gray-900">
            {t("crm_system", { ns: "crm" })}
          </h1>
        </div>
        <p className="text-lg text-gray-600 max-w-3xl">
          {t("crm_system_description", { ns: "crm" })}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {t("quick_actions", { ns: "crm" })}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action)}
                className="flex items-start space-x-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-left group"
              >
                <div className={`p-2 rounded-lg ${action.color} text-white`}>
                  <IconComponent className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 group-hover:text-maritime-blue">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {action.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* CRM Features Grid */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {t("crm_features", { ns: "crm" })}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {crmFeatures.map((feature) => {
            const IconComponent = feature.icon;
            const isActive = feature.status === "active";

            return (
              <div
                key={feature.id}
                className={`relative p-6 rounded-lg border-2 transition-all duration-200 ${
                  isActive
                    ? "border-gray-200 hover:border-maritime-blue hover:shadow-lg cursor-pointer"
                    : "border-gray-100 opacity-75 cursor-not-allowed"
                } bg-white`}
                onClick={() => handleFeatureClick(feature)}
              >
                {/* Status Badge */}
                {feature.status === "coming_soon" && (
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {t("coming_soon", { ns: "common" })}
                    </span>
                  </div>
                )}

                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${feature.color} text-white`}>
                    <IconComponent className="h-8 w-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>

                {isActive && (
                  <div className="mt-4 flex items-center text-maritime-blue text-sm font-medium">
                    {t("get_started", { ns: "common" })}
                    <svg
                      className="ml-2 h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {t("total_entities", { ns: "crm" })}
              </p>
              <p className="text-3xl font-bold text-gray-900">12</p>
            </div>
            <Database className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {t("custom_fields", { ns: "crm" })}
              </p>
              <p className="text-3xl font-bold text-gray-900">45</p>
            </div>
            <Settings className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {t("active_layouts", { ns: "crm" })}
              </p>
              <p className="text-3xl font-bold text-gray-900">8</p>
            </div>
            <Layout className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {t("dashboard_widgets", { ns: "crm" })}
              </p>
              <p className="text-3xl font-bold text-gray-900">15</p>
            </div>
            <BarChart3 className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
