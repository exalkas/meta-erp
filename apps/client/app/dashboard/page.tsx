"use client";

import React, { useState, useEffect } from "react";
import {
  DynamicPage,
  TranslationProvider,
  ThemeProvider,
  ProtectedRoute,
} from "@erp/shared-ui";

/**
 * Client Application Dashboard Page - Metadata-Driven
 *
 * This page demonstrates the complete metadata-driven architecture:
 * - Fetches page definition from metadata API
 * - Uses DynamicPage with layout + sections rendering
 * - Complex dashboard components (KPICards, MetadataDataTable, Navigation)
 * - TranslationProvider and ThemeProvider fetch from metadata
 * - Real-time data updates and state management
 */

export default function DashboardPage() {
  const [pageDefinition, setPageDefinition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const tenantId = "89f84fea-b5b9-413c-945b-002c7fd9555d"; // Demo tenant UUID - in real app, this would come from auth/context

  // Fetch page definition from real metadata API
  useEffect(() => {
    const initializeAndFetch = async () => {
      try {
        console.log("📐 Fetching dashboard page definition from metadata API");

        // Fetch page definition from API service
        const response = await fetch(
          `http://localhost:8000/metadata/pages/dashboard?tenant_id=${tenantId}`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch page definition: ${response.status} ${response.statusText}`
          );
        }

        const pageDef = await response.json();
        console.log("✅ Dashboard page definition loaded:", pageDef.page_name);
        console.log(
          "📊 Dashboard sections:",
          Object.keys(pageDef.sections_data_json || {})
        );

        setPageDefinition(pageDef);
      } catch (err) {
        console.error("❌ Failed to load dashboard page:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeAndFetch();
  }, [tenantId]);

  // Handle logout
  const handleLogout = () => {
    console.log("🚪 Logging out, redirecting to login");
    window.location.href = "/login";
  };

  // Handle component errors
  const handleComponentError = (error, componentType) => {
    console.error(`Component error in ${componentType}:`, error);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            Loading Maritime Business Dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Failed to Load Dashboard
          </h2>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="text-sm text-red-500 mb-4">
            This may occur if the real API services are not running or if there
            are connectivity issues.
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
            <button
              onClick={() => (window.location.href = "/login")}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute
      requiredRoles={["basic", "enhanced", "strict", "critical"]} // Allow all authenticated users
      redirectToLogin={true}
    >
      <TranslationProvider tenantId={tenantId}>
        <ThemeProvider tenantId={tenantId}>
          {/* Pure metadata-driven dashboard rendering */}
          <DynamicPage
            pageDefinition={pageDefinition}
            tenantId={tenantId}
            onComponentError={handleComponentError}
          />

          {/* Development debug info */}
          {process.env.NODE_ENV === "development" && (
            <div className="fixed top-4 right-4 bg-black bg-opacity-75 text-white text-xs p-3 rounded z-50 max-w-sm">
              <div className="font-bold mb-1">🚀 Metadata Dashboard</div>
              <div>Page: {pageDefinition?.page_name || "unknown"}</div>
              <div>Layout: {pageDefinition?.layout_id || "legacy"}</div>
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
