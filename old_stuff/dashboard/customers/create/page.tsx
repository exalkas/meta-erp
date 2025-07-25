"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@erp/shared-ui";
import BusinessEntityForm from "../../../../components/business-entities/BusinessEntityForm";
import { ArrowLeft, Users, Plus } from "lucide-react";
import { Button } from "@erp/shared-ui";

export default function CreateCustomerPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [createAnother, setCreateAnother] = useState(false);

  const handleSuccess = (entity: any) => {
    if (createAnother) {
      // Stay on creation page - just show success message and reset form
      console.log("✅ Customer created, staying on page for another creation");
      // The form will handle showing success message
      // Form will reset automatically for create mode
    } else {
      // Redirect to customers list page
      router.push("/dashboard/customers");
    }
  };

  const handleCancel = () => {
    router.push("/dashboard/customers");
  };

  const handleBack = () => {
    router.push("/dashboard/customers");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("back_to_customers", { ns: "customers" })}
          </Button>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t("create_new_customer", { ns: "customers" })}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {t("create_customer_description", { ns: "customers" })}
            </p>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <BusinessEntityForm
          mode="create"
          initialRole="customer"
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          createAnother={createAnother}
          onCreateAnotherChange={setCreateAnother}
        />
      </div>
    </div>
  );
}
