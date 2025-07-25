"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslation, ContactForm } from "@erp/shared-ui";
import { ArrowLeft, UserCog, Users } from "lucide-react";
import { Button } from "@erp/shared-ui";

export default function EditContactPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;
  const contactId = params.contactId as string;

  const handleBack = () => {
    router.push(`/dashboard/customers/${customerId}?tab=contacts`);
  };

  const handleContactSuccess = (contact: any) => {
    console.log("✅ Contact updated successfully:", contact);
    // Redirect back to customer detail page contacts tab
    router.push(`/dashboard/customers/${customerId}?tab=contacts`);
  };

  const handleContactCancel = () => {
    router.push(`/dashboard/customers/${customerId}?tab=contacts`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>{t("back_to_customer", { ns: "contacts" })}</span>
              </Button>
              <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                  <UserCog className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t("edit_contact", { ns: "contacts" })}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    {t("edit_contact_description", { ns: "contacts" })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <ContactForm
            businessEntityId={customerId}
            contactId={contactId}
            mode="edit"
            onSuccess={handleContactSuccess}
            onCancel={handleContactCancel}
          />
        </div>
      </div>
    </div>
  );
}
