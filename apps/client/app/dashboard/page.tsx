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
 * Client Application Dashboard Page - Metadata-Driven
 *
 * This page demonstrates the complete metadata-driven architecture:
 * - Fetches client dashboard page definition from metadata API
 * - Uses DynamicPage with layout + sections rendering
 * - Client-specific components (customer management, orders, etc.)
 * - TranslationProvider and ThemeProvider fetch from metadata
 * - Real-time client data and analytics
 */

// Inner component that uses the metadata hook inside provider context
function ClientDashboardPageContent({
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
    pageRoute: "client-dashboard",
    tenantId,
  });

  // Handle logout - memoized to prevent re-rendering
  const handleLogout = useCallback(async () => {
    console.log("🚪 Client app logging out, calling auth service");
    try {
      // Call AuthenticationContext logout (handles API call + local cleanup)
      await authLogout();
      console.log("✅ Client logout successful, redirecting to login");
      router.push("/login");
    } catch (error) {
      console.warn(
        "⚠️ Client logout API failed, but redirecting anyway:",
        error
      );
      // Still redirect even if API fails (local cleanup already done)
      router.push("/login");
    }
  }, [authLogout, router]);

  // Handle component errors - memoized to prevent re-rendering
  const handleComponentError = useCallback(
    (error: Error, componentType: string) => {
      console.error(`Component error in ${componentType}:`, error);
    },
    []
  );

  // Context props for special components - memoized to prevent re-rendering
  const contextProps = useMemo(
    () => ({
      onLogout: handleLogout,
      currentUser: user,
    }),
    [handleLogout, user]
  );

  console.log("🎭 Client Dashboard rendering with:", {
    pageDefinition: !!pageDefinition,
    loading,
    error,
    tenantId,
    userId,
    pageRoute: "client-dashboard",
  });

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Failed to Load Client Dashboard
          </h2>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="text-sm text-red-500 mb-4">
            This may occur if the metadata API is not running or if there are
            connectivity issues.
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
    <DynamicPage
      pageDefinition={pageDefinition}
      tenantId={tenantId}
      loading={loading}
      onComponentError={handleComponentError}
      contextProps={contextProps}
    />
  );
}

// Main exported component that sets up providers
export default function ClientDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle authentication
  useEffect(() => {
    if (isClient && !authLoading && !user) {
      router.push("/login");
    }
  }, [isClient, user, authLoading, router]);

  // Don't render anything on server side
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show loading during auth check
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  // Get tenant_id and user_id from authenticated user - NO FALLBACKS
  if (!user?.tenant_id || !user?.user_id) {
    console.error("❌ No tenant_id or user_id in authenticated user:", user);
    router.push("/login");
    return null;
  }

  const tenantId = user.tenant_id;
  const userId = user.user_id;

  return (
    <TranslationProvider
      tenantId={tenantId}
      defaultLanguage="en-US"
      verticalContext="client"
    >
      <ThemeProvider tenantId={tenantId} userId={userId}>
        <ClientDashboardPageContent tenantId={tenantId} userId={userId} />
      </ThemeProvider>
    </TranslationProvider>
  );
}
