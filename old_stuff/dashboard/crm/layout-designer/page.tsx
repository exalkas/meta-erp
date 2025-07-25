"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@erp/shared-ui";
import { LayoutDesigner } from "@erp/shared-ui";
import { Layout, ArrowLeft } from "lucide-react";

export default function LayoutDesignerPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const handleBack = () => {
    router.push("/dashboard/crm");
  };

  const handleLayoutSave = (layout: any) => {
    console.log("Layout saved:", layout);
    // TODO: Integrate with actual API
  };

  const handleLayoutCancel = () => {
    router.push("/dashboard/crm");
  };

  // Mock entity data for demo purposes
  const mockEntity = {
    id: "demo-entity-1",
    name: "customer",
    pluralName: "customers",
    labelSingular: "Customer",
    labelPlural: "Customers",
    labelSingularGreek: "Πελάτης",
    labelPluralGreek: "Πελάτες",
    icon: "users",
    color: "#3B82F6",
    description: "Customer entity for demonstration",
    descriptionGreek: "Οντότητα πελάτη για επίδειξη",
    module: "crm",
    category: "business",
    customizationLevel: "standard",
    fields: [
      {
        id: "name",
        name: "name",
        type: "text",
        label: "Name",
        labelGreek: "Όνομα",
        required: true,
        isActive: true,
      },
      {
        id: "email",
        name: "email",
        type: "email",
        label: "Email",
        labelGreek: "Email",
        required: true,
        isActive: true,
      },
      {
        id: "phone",
        name: "phone",
        type: "greek_phone",
        label: "Phone",
        labelGreek: "Τηλέφωνο",
        required: false,
        isActive: true,
      },
      {
        id: "afm",
        name: "afm",
        type: "afm",
        label: "AFM",
        labelGreek: "ΑΦΜ",
        required: false,
        isActive: true,
      },
    ],
    relationships: [],
    indexes: [],
    constraints: [],
    layouts: [],
    defaultLayout: "form",
    listViewConfig: {},
    searchConfig: {},
    greekCompliance: {},
    aadeIntegration: false,
    taxRelevant: false,
    gdprRelevant: true,
    workflows: [],
    validationRules: [],
    businessRules: [],
    permissions: {},
    accessControl: {},
    version: "1.0.0",
    createdBy: "demo",
    createdAt: new Date(),
    updatedBy: "demo",
    updatedAt: new Date(),
    isActive: true,
    isSystemEntity: false,
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
                <Layout className="h-6 w-6 text-purple-500" />
                <h1 className="text-2xl font-bold text-gray-900">
                  {t("layout_designer", { ns: "crm" })}
                </h1>
              </div>
            </div>
          </div>
          <p className="text-gray-600 mt-2">
            {t("layout_designer_description", { ns: "crm" })}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <LayoutDesigner
          entity={mockEntity as any}
          layoutType={"form" as any}
          onSave={handleLayoutSave}
          onCancel={handleLayoutCancel}
          showGreekFeatures={true}
        />
      </div>
    </div>
  );
}
