"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@erp/shared-ui";
import { WidgetBuilder } from "@erp/shared-ui";
import { BarChart3, ArrowLeft } from "lucide-react";

export default function WidgetBuilderPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const handleBack = () => {
    router.push("/dashboard/crm");
  };

  const handleWidgetSave = (widget: any) => {
    console.log("Widget saved:", widget);
    // TODO: Integrate with actual API
  };

  const handleWidgetCancel = () => {
    router.push("/dashboard/crm");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>{t("back_to_crm", { ns: "crm" })}</span>
              </button>
              <div className="w-px h-6 bg-gray-300" />
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-6 w-6 text-orange-500" />
                <h1 className="text-2xl font-bold text-gray-900">
                  {t("widget_builder", { ns: "crm" })}
                </h1>
              </div>
            </div>
          </div>
          <p className="text-gray-600 mt-2">
            {t("widget_builder_description", { ns: "crm" })}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <WidgetBuilder
          onSave={handleWidgetSave}
          onCancel={handleWidgetCancel}
          showGreekFeatures={true}
        />
      </div>
    </div>
  );
}
