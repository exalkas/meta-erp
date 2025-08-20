"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  DynamicPage,
  TranslationProvider,
  ThemeProvider,
  ProtectedRoute,
  useAuth,
  useMetadataPage,
} from "@erp/shared-ui";

/**
 * Admin Application Builder Page - Metadata-Driven
 *
 * This page uses the same metadata-driven architecture as the dashboard:
 * - Fetches app-builder page definition from metadata API
 * - Uses DynamicPage with layout + sections rendering
 * - Same header/sidebar layout as dashboard for consistency
 */

// Inner component that uses the metadata hook inside provider context
function AppBuilderPageContent({
  tenantId,
  userId,
}: {
  tenantId: string;
  userId: string;
}) {
  const router = useRouter();
  const { logout: authLogout, user } = useAuth();

  // Use metadata page hook that handles language/theme changes
  const { pageDefinition, loading, error } = useMetadataPage({
    pageRoute: "app-builder",
    tenantId,
  });

  // Handle user logout
  const handleLogout = useCallback(() => {
    authLogout();
    router.push("/login");
  }, [authLogout, router]);

  // Handle component errors - memoized to prevent re-rendering
  const handleComponentError = useCallback(
    (error: unknown, componentType: string) => {
      console.error(`App-builder component error in ${componentType}:`, error);
    },
    []
  );

  // Handle page actions
  const handleAction = useCallback(
    (action: string, data?: any) => {
      console.log("🎬 App-builder page action:", action, data);

      if (action === "logout") {
        handleLogout();
      } else if (action.startsWith("navigate:")) {
        const route = action.replace("navigate:", "");
        router.push(route);
      } else if (action === "handleGenerateBlueprint") {
        console.log("🚀 Generating blueprint with data:", data);
        // This will be handled by the FormWizard component via metadata
      }
    },
    [handleLogout, router]
  );

  // Context props for DynamicPage components
  const contextProps = useMemo(
    () => ({
      onLogout: handleLogout,
      onAction: handleAction,
    }),
    [handleLogout, handleAction]
  );

  if (loading) {
    return (
      <ProtectedRoute
        requiredPermissions={["TENANT.APPLICATIONS.BUILDER.ACCESS"]}
        redirectToLogin={true}
      >
        <TranslationProvider tenantId={tenantId}>
          <ThemeProvider tenantId={tenantId} userId={userId}>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">
                  Loading Application Builder...
                </p>
              </div>
            </div>
          </ThemeProvider>
        </TranslationProvider>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute
        requiredPermissions={["TENANT.APPLICATIONS.BUILDER.ACCESS"]}
        redirectToLogin={true}
      >
        <TranslationProvider tenantId={tenantId}>
          <ThemeProvider tenantId={tenantId} userId={userId}>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="text-red-600 text-xl mb-4">⚠️ Error</div>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            </div>
          </ThemeProvider>
        </TranslationProvider>
      </ProtectedRoute>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Application Builder...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {pageDefinition && (
        <DynamicPage
          pageDefinition={pageDefinition}
          tenantId={tenantId}
          onComponentError={handleComponentError}
          contextProps={contextProps}
        />
      )}

      {/* Development debug info for admin - positioned below top navigation */}
      {process.env.NODE_ENV === "development" && pageDefinition && (
        <div className="fixed top-16 right-4 bg-black bg-opacity-75 text-white text-xs p-3 rounded z-40 max-w-sm">
          <div className="font-bold mb-1">🔧 App Builder</div>
          <div>Page: {pageDefinition.page_name || "unknown"}</div>
          <div>Layout: {pageDefinition.layout_id || "legacy"}</div>
          <div>
            Sections:{" "}
            {pageDefinition.sections_data_json
              ? Object.keys(pageDefinition.sections_data_json).length
              : 0}
          </div>
          <div>Real-time: {pageDefinition.real_time_updates ? "✅" : "❌"}</div>
          <div className="text-yellow-300 mt-1">App Builder Mode</div>
        </div>
      )}
    </>
  );
}

// Main exported component that sets up providers
export default function ApplicationBuilderPage() {
  const tenantId = "89f84fea-b5b9-413c-945b-002c7fd9555d"; // Demo tenant UUID - in real app, this would come from auth/context
  const userId = "01111111-1111-1111-1111-111111111111"; // Demo user UUID - in real app, this would come from auth context

  return (
    <ProtectedRoute
      requiredPermissions={["TENANT.APPLICATIONS.BUILDER.ACCESS"]}
      redirectToLogin={true}
    >
      <TranslationProvider tenantId={tenantId}>
        <ThemeProvider tenantId={tenantId} userId={userId}>
          <AppBuilderPageContent tenantId={tenantId} userId={userId} />
        </ThemeProvider>
      </TranslationProvider>
    </ProtectedRoute>
  );
}
