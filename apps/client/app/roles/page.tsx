/**
 * Role Templates Catalog Page - Metadata-Driven
 * Fetches page definition from metadata API and renders dynamically
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  DynamicPage,
  TranslationProvider,
  ThemeProvider,
  ProtectedRoute,
} from "@erp/shared-ui";

export default function RoleTemplatesPage() {
  const [pageDefinition, setPageDefinition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const tenantId = "89f84fea-b5b9-413c-945b-002c7fd9555d"; // Demo tenant UUID

  // Fetch page definition from metadata API
  useEffect(() => {
    const fetchPageDefinition = async () => {
      try {
        console.log(
          "📐 Fetching roles catalog page definition from metadata API"
        );

        const response = await fetch(
          `http://localhost:8000/metadata/pages/roles_catalog?tenant_id=${tenantId}`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch page definition: ${response.status} ${response.statusText}`
          );
        }

        const pageDef = await response.json();
        console.log(
          "✅ Role catalog page definition loaded:",
          pageDef.page_name
        );
        console.log(
          "📊 Role catalog sections:",
          Object.keys(pageDef.sections_data_json || {})
        );

        setPageDefinition(pageDef);
      } catch (err) {
        console.error("❌ Failed to load role catalog page:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPageDefinition();
  }, [tenantId]);

  // Handle component errors
  const handleComponentError = (error, componentType) => {
    console.error(`Component error in ${componentType}:`, error);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading role catalog from metadata...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">Failed to load role catalog</div>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute
      requiredRoles={["basic", "enhanced", "strict", "critical"]}
      redirectToLogin={true}
    >
      <TranslationProvider tenantId={tenantId}>
        <ThemeProvider tenantId={tenantId}>
          {/* Pure metadata-driven role catalog rendering */}
          <DynamicPage
            pageDefinition={pageDefinition}
            tenantId={tenantId}
            onComponentError={handleComponentError}
          />

          {/* Development debug info */}
          {process.env.NODE_ENV === "development" && (
            <div className="fixed top-4 right-4 bg-black bg-opacity-75 text-white text-xs p-3 rounded z-50 max-w-sm">
              <div className="font-bold mb-1">🎯 Metadata Role Catalog</div>
              <div>Page: {pageDefinition?.page_name || "unknown"}</div>
              <div>Layout: {pageDefinition?.layout_id || "default"}</div>
              <div>
                Sections:{" "}
                {pageDefinition?.sections_data_json
                  ? Object.keys(pageDefinition.sections_data_json).length
                  : 0}
              </div>
              <div>
                Real-time: {pageDefinition?.real_time_updates ? "✅" : "❌"}
              </div>
            </div>
          )}
        </ThemeProvider>
      </TranslationProvider>
    </ProtectedRoute>
  );
}
