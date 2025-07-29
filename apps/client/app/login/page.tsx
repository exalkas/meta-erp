"use client";

import React, { useState, useEffect } from "react";
import {
  DynamicPage,
  TranslationProvider,
  ThemeProvider,
  initializeMockApi,
} from "@erp/shared-ui";

/**
 * Client Application Login Page - Metadata-Driven
 *
 * This page demonstrates the complete metadata-driven architecture:
 * - Fetches page definition from metadata API
 * - Uses DynamicPage for layout + sections rendering
 * - TranslationProvider and ThemeProvider fetch from metadata
 * - Mock data service for development without database
 */

export default function LoginPage() {
  const [pageDefinition, setPageDefinition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const tenantId = "dev-tenant-001"; // In real app, this would come from auth/context

  // Initialize mock API and fetch page definition
  useEffect(() => {
    const initializeAndFetch = async () => {
      try {
        console.log("🎭 Initializing mock API for login page");

        // Initialize mock API first
        const { initializeMockApi } = await import("@erp/shared-ui");
        initializeMockApi(true);

        // Small delay to ensure mock API is ready
        await new Promise((resolve) => setTimeout(resolve, 100));

        console.log("📐 Fetching login page definition from metadata API");

        // Fetch page definition
        const response = await fetch(
          `/api/metadata/pages/login?tenant_id=${tenantId}`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch page definition: ${response.status} ${response.statusText}`
          );
        }

        const pageDef = await response.json();
        console.log("✅ Login page definition loaded:", pageDef.page_name);

        setPageDefinition(pageDef);
      } catch (err) {
        console.error("❌ Failed to load login page:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeAndFetch();
  }, [tenantId]);

  // Handle successful login
  const handleLoginSuccess = () => {
    console.log("✅ Login successful, redirecting to dashboard");
    window.location.href = "/dashboard";
  };

  // Handle login form submission
  const handleLogin = async (data: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }) => {
    console.log("🔐 Login attempt with:", data);
    try {
      // Import the authApiClient here to avoid SSR issues
      const { authApiClient } = await import("@erp/shared-ui");

      console.log("🚀 Attempting login with real auth service");
      const authResponse = await authApiClient.loginWithPassword(
        data.email,
        data.password,
        undefined, // Use default tenant_id
        "Web Browser" // Device name
      );

      console.log("✅ Login successful:", authResponse.user.email);

      // Store tokens securely (you might want to use a more secure method)
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "auth_tokens",
          JSON.stringify({
            accessToken: authResponse.access_token,
            refreshToken: authResponse.refresh_token,
            expiresIn: authResponse.expires_in,
            expiresAt: new Date(
              Date.now() + authResponse.expires_in * 1000
            ).toISOString(),
          })
        );
        localStorage.setItem("auth_user", JSON.stringify(authResponse.user));
      }

      handleLoginSuccess();
    } catch (error) {
      console.error("❌ Login failed:", error);
      throw error; // Let LoginForm handle the error display
    }
  };

  // Handle component errors
  const handleComponentError = (error, componentType) => {
    console.error(`Component error in ${componentType}:`, error);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-red-800 font-semibold mb-2">
            Failed to Load Login Page
          </h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <TranslationProvider tenantId={tenantId}>
      <ThemeProvider tenantId={tenantId}>
        {/* Pure metadata-driven page rendering */}
        <DynamicPage
          pageDefinition={pageDefinition}
          tenantId={tenantId}
          onComponentError={handleComponentError}
          contextProps={{
            onLogin: handleLogin,
          }}
        />
      </ThemeProvider>
    </TranslationProvider>
  );
}
