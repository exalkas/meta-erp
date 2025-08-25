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
      currentUser: user,
    }),
    [handleLogout, handleAction, user]
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
    </>
  );
}

// Main exported component that sets up providers
export default function LegalDashboardPage() {
  const { user } = useAuth(); // Get user from auth context

  return (
    <ProtectedRoute
      requiredPermissions={[]} // Allow all authenticated users for dashboard
      redirectToLogin={true}
    >
      <TranslationProvider
        tenantId={user?.tenant_id}
        defaultLanguage="en_US"
        verticalContext="legal"
      >
        <ThemeProvider tenantId={user?.tenant_id} userId={user?.user_id}>
          <LegalDashboardPageContent
            tenantId={user?.tenant_id || ""}
            userId={user?.user_id || ""}
          />
        </ThemeProvider>
      </TranslationProvider>
    </ProtectedRoute>
  );
}
