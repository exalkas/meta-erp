"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@erp/shared-ui";
import BusinessEntityForm from "../../../../components/business-entities/BusinessEntityForm";
import { ArrowLeft, Building2 } from "lucide-react";
import { Button } from "@erp/shared-ui";

export default function CreateSupplierPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const handleSuccess = (entity: any) => {
    // Redirect to supplier detail page or supplier list
    router.push(`/dashboard/suppliers/${entity.id}`);
  };

  const handleCancel = () => {
    router.push("/dashboard/suppliers");
  };

  const handleBack = () => {
    router.push("/dashboard/suppliers");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("back_to_suppliers", { ns: "suppliers" })}
          </Button>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
            <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t("create_new_supplier", { ns: "suppliers" })}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {t("create_supplier_description", { ns: "suppliers" })}
            </p>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <BusinessEntityForm
          mode="create"
          initialRole="supplier"
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
