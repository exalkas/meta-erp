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
  ThemeChooser,
  ThemeSelector,
} from "@erp/shared-ui";

/**
 * Legal Application Dashboard Page - Metadata-Driven
 *
 * This page demonstrates the complete metadata-driven architecture:
 * - Fetches legal dashboard page definition from metadata API
 * - Uses DynamicPage with layout + sections rendering
 * - Legal-specific components (matter management, IOLTA compliance, etc.)
 * - TranslationProvider and ThemeProvider fetch from metadata
 * - Real-time legal data and AI insights
 */

// Inner component that uses the metadata hook inside provider context
function LegalDashboardPageContent({
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
    pageRoute: "legal-dashboard",
    tenantId,
  });

  // Handle logout - memoized to prevent re-rendering
  const handleLogout = useCallback(async () => {
    console.log("🚪 Legal app logging out, calling auth service");
    try {
      // Call AuthenticationContext logout (handles API call + local cleanup)
      await authLogout();
      console.log("✅ Legal logout successful, redirecting to login");
      router.push("/login");
    } catch (error) {
      console.warn(
        "⚠️ Legal logout API failed, but redirecting anyway:",
        error
      );
      // Still redirect even if API fails (local cleanup already done)
      router.push("/login");
    }
  }, [authLogout, router]);

  // Handle component errors - memoized to prevent re-rendering
  const handleComponentError = useCallback(
    (error: unknown, componentType: string) => {
      console.error(`Legal component error in ${componentType}:`, error);
    },
    []
  );

  // Handle navigation and logout actions from metadata
  const handleAction = useCallback(
    async (action: string, item: any) => {
      console.log("🎯 Legal dashboard action:", action, item);

      if (action === "logout") {
        await handleLogout();
      } else if (action.startsWith("navigate:")) {
        const path = action.replace("navigate:", "");
        router.push(path);
      } else {
        console.warn("Unknown action:", action);
      }
    },
    [handleLogout, router]
  );

  // Memoize context props to prevent re-rendering - MUST be at top level
  const contextProps = useMemo(
    () => ({
      onLogout: handleLogout,
      onAction: handleAction,
    }),
    [handleLogout, handleAction]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Legal Practice Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Failed to Load Legal Dashboard
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
              onClick={() => router.push("/login")}
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
    <>
      {/* TEMPORARY: Theme Testing Controls (Legal App Only) */}
      {pageDefinition && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              🎨 Theme Testing (Legal App Only)
            </h2>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Base Theme:
                </span>
                <ThemeChooser variant="dropdown" size="sm" />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  Light/Dark:
                </span>
                <ThemeSelector variant="toggle" size="sm" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pure metadata-driven legal dashboard rendering */}
      {pageDefinition && (
        <DynamicPage
          pageDefinition={pageDefinition}
          tenantId={tenantId}
          onComponentError={handleComponentError}
          contextProps={contextProps}
        />
      )}

      {/* Development debug info for legal app - positioned below top navigation */}
      {process.env.NODE_ENV === "development" && pageDefinition && (
        <div className="fixed top-16 right-4 bg-black bg-opacity-75 text-white text-xs p-3 rounded z-40 max-w-sm">
          <div className="font-bold mb-1">⚖️ Legal Practice App</div>
          <div>Page: {pageDefinition.page_name || "unknown"}</div>
          <div>Layout: {pageDefinition.layout_id || "legacy"}</div>
          <div>
            Sections:{" "}
            {pageDefinition.sections_data_json
              ? Object.keys(pageDefinition.sections_data_json).length
              : 0}
          </div>
          <div>Real-time: {pageDefinition.real_time_updates ? "✅" : "❌"}</div>
          <div className="text-yellow-300 mt-1">Legal Mode Active</div>
        </div>
      )}
    </>
  );
}

// Main exported component that sets up providers
export default function LegalDashboardPage() {
  const tenantId = "89f84fea-b5b9-413c-945b-002c7fd9555d"; // Demo tenant UUID - in real app, this would come from auth/context
  const userId = "01111111-1111-1111-1111-111111111111"; // Demo user UUID - in real app, this would come from auth context

  return (
    <ProtectedRoute
      requiredPermissions={[]} // Allow all authenticated users for dashboard
      redirectToLogin={true}
    >
      <TranslationProvider
        tenantId={tenantId}
        defaultLanguage="en_US"
        verticalContext="legal"
      >
        <ThemeProvider tenantId={tenantId} userId={userId}>
          <LegalDashboardPageContent tenantId={tenantId} userId={userId} />
        </ThemeProvider>
      </TranslationProvider>
    </ProtectedRoute>
  );
}
