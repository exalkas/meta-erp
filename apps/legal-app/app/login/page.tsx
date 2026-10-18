"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  DynamicPage,
  TranslationProvider,
  ThemeProvider,
  useMetadataPage,
  FullScreenSpinner,
} from "@erp/shared-ui";

/**
 * Legal Application Login Page - Metadata-Driven
 *
 * This page demonstrates the complete metadata-driven architecture:
 * - Fetches legal login page definition from metadata API
 * - Uses DynamicPage for layout + sections rendering
 * - TranslationProvider and ThemeProvider fetch from metadata
 * - Real API services with authentication
 */

// Inner component that uses the metadata hook inside provider context
function LegalLoginPageContent({
  tenantId,
  userId,
}: {
  tenantId: string;
  userId: string;
}) {
  const router = useRouter();

  // Use metadata page hook that handles language/theme changes
  const { pageDefinition, loading, error } = useMetadataPage({
    pageRoute: "login",
    tenantId,
  });

  // Handle successful login - memoized to prevent re-rendering
  const handleLoginSuccess = useCallback(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("✅ Legal login successful, handling redirect");
    }

    // Check for redirect URL from query params (set by middleware)
    const urlParams = new URLSearchParams(window.location.search);
    const redirectTo = urlParams.get("redirectTo");

    // Redirect to original page or default to legal dashboard
    const targetUrl =
      redirectTo && redirectTo !== "/login" ? redirectTo : "/dashboard";

    if (process.env.NODE_ENV === "development") {
      console.log(`🚀 Redirecting to legal app: ${targetUrl}`);
    }

    router.push(targetUrl);
  }, [router]);

  // Handle login form submission - memoized to prevent re-rendering
  const handleLogin = useCallback(
    async (data: { email: string; password: string; rememberMe?: boolean }) => {
      console.log("🔐 Legal login attempt with:", data);

      try {
        // Import the authApiClient here to avoid SSR issues
        const { authApiClient } = await import("@erp/shared-ui");

        console.log("🚀 Attempting legal login with real auth service");

        // Add timeout to prevent hanging requests
        const authPromise = authApiClient.loginWithPassword(
          data.email,
          data.password,
          undefined, // Use default tenant_id
          "Legal Practice App" // Device name
        );

        // Set a reasonable timeout for login requests (30 seconds)
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Login request timed out")), 30000);
        });

        const authResponse = (await Promise.race([
          authPromise,
          timeoutPromise,
        ])) as Awaited<typeof authPromise>;

        console.log("✅ Legal login successful:", authResponse.user.email);

        // Store tokens securely in both localStorage AND cookies for middleware
        if (typeof window !== "undefined") {
          try {
            const authTokens = {
              accessToken: authResponse.access_token,
              refreshToken: authResponse.refresh_token,
              expiresIn: authResponse.expires_in,
              expiresAt: new Date(
                Date.now() + authResponse.expires_in * 1000
              ).toISOString(),
            };

            // Transform auth service user to AuthUser format with legacy fields
            const authUser = {
              // Auth service fields
              ...authResponse.user,
              // Legacy compatibility fields
              id: authResponse.user.user_id,
              name: authResponse.user.display_name,
              role: authResponse.user.compliance_level,
              companyId: authResponse.user.tenant_id,
              permissions: [], // TODO: implement from roles
              isActive: authResponse.user.status === "active",
              canBeDeleted: false,
              canChangePassword: true,
              lastLogin: authResponse.user.last_login,
              createdAt: authResponse.user.created_at,
              updatedAt: authResponse.user.created_at, // TODO: implement
            };

            // Store in localStorage for useAuthGuard
            localStorage.setItem("auth_tokens", JSON.stringify(authTokens));
            localStorage.setItem("auth_user", JSON.stringify(authUser));

            // Store in cookies for middleware (production-ready format)
            const isSecure = window.location.protocol === "https:";
            const sameSite = "Lax"; // CSRF protection
            const cookieOptions = `path=/; max-age=${authResponse.expires_in}; SameSite=${sameSite}${isSecure ? "; Secure" : ""}`;

            // Set authentication cookies with proper encoding
            document.cookie = `auth_token=${authResponse.access_token}; ${cookieOptions}`;
            document.cookie = `auth_tokens=${encodeURIComponent(JSON.stringify(authTokens))}; ${cookieOptions}`;
            document.cookie = `auth_user=${encodeURIComponent(JSON.stringify(authUser))}; ${cookieOptions}`;

            // Verify tokens are stored (only in development)
            if (process.env.NODE_ENV === "development") {
              console.log("🍪 Tokens stored, calling handleLoginSuccess");
            }

            // Call redirect after successful token storage
            handleLoginSuccess();
          } catch (storageError) {
            console.error(
              "❌ Failed to store authentication tokens:",
              storageError
            );
            throw new Error("Failed to save login session. Please try again.");
          }
        } else {
          // SSR fallback - this shouldn't happen in login component
          throw new Error("Client-side storage not available");
        }
      } catch (error) {
        console.error("❌ Legal login failed:", error);
        throw error; // Let LoginForm handle the error display
      }
    },
    [handleLoginSuccess]
  );

  // Handle component errors - memoized to prevent re-rendering
  const handleComponentError = useCallback(
    (error: unknown, componentType: string) => {
      console.error(`Legal component error in ${componentType}:`, error);
    },
    []
  );

  // Memoize context props to prevent re-rendering - MUST be at top level
  const contextProps = useMemo(
    () => ({
      onLogin: handleLogin,
    }),
    [handleLogin]
  );

  if (loading) {
    return <FullScreenSpinner message="Loading Legal Practice App..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-lg font-semibold text-destructive mb-2">
            Error Loading Page
          </h2>
          <p className="text-destructive/80 mb-4">
            Unable to load the login page. Please try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-destructive text-destructive-foreground px-4 py-2 rounded hover:bg-destructive/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Pure metadata-driven page rendering for legal */}
      {pageDefinition && (
        <DynamicPage
          pageDefinition={pageDefinition}
          tenantId={tenantId}
          onComponentError={handleComponentError}
          contextProps={contextProps}
        />
      )}
    </>
  );
}

// Main exported component that sets up providers
export default function LegalLoginPage() {
  const tenantId = "89f84fea-b5b9-413c-945b-002c7fd9555d"; // Demo tenant UUID - in real app, this would come from auth/context
  const userId = "01111111-1111-1111-1111-111111111111"; // Demo user UUID - in real app, this would come from auth context

  return (
    <TranslationProvider
      tenantId={tenantId}
      defaultLanguage="en-US"
      verticalContext="legal"
    >
      <ThemeProvider tenantId={tenantId} userId={userId}>
        <LegalLoginPageContent tenantId={tenantId} userId={userId} />
      </ThemeProvider>
    </TranslationProvider>
  );
}
