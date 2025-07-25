/**
 * Metadata-Driven Login Page
 *
 * Fetches login page definition from metadata API and renders using existing components.
 * Demonstrates the metadata-driven architecture with a working login flow.
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  LoginForm,
  useAuth,
  LanguageSelector,
  useLanguage,
  useTranslation,
  ThemeSelector,
  useTheme,
  Logo,
} from "../..";
import { AppName } from "../../types";

interface PageComponent {
  type: string;
  props: Record<string, any>;
  position?: {
    x: string;
    y: string;
  };
}

interface PageDefinition {
  page_id: string;
  page_name: string;
  route: string;
  title: string;
  description?: string;
  page_type: string;
  components: PageComponent[];
  access_roles: string[];
  is_public: boolean;
  metadata_json?: Record<string, any>;
  tenant_id?: string;
}

interface MetadataLoginPageProps {
  onLoginSuccess?: (redirectTo?: string) => void;
  redirectTo?: string;
}

export default function MetadataLoginPage({
  onLoginSuccess,
  redirectTo = "/dashboard",
}: MetadataLoginPageProps) {
  const { login, isLoading, error, clearError } = useAuth();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [pageDefinition, setPageDefinition] = useState<PageDefinition | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Track client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch page definition from metadata API
  useEffect(() => {
    async function fetchPageDefinition() {
      try {
        setLoading(true);
        setPageError(null);

        // Fetch from metadata API
        const response = await fetch(
          `${
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
          }/api/metadata/pages/login`,
          {
            headers: {
              "Content-Type": "application/json",
              // Add tenant header if available
              ...(process.env.NEXT_PUBLIC_TENANT_ID && {
                "X-Tenant-ID": process.env.NEXT_PUBLIC_TENANT_ID,
              }),
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch page definition: ${response.status}`
          );
        }

        const pageData = await response.json();
        setPageDefinition(pageData);

        console.log("✅ Metadata-driven page loaded:", pageData);
      } catch (err) {
        console.error("❌ Failed to load page metadata:", err);
        setPageError(
          err instanceof Error ? err.message : "Failed to load page metadata"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchPageDefinition();
  }, []);

  // Use stable theme during SSR
  const displayTheme = isClient ? theme : "light";

  // Handle login with metadata context
  const handleLogin = async (data: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }) => {
    try {
      clearError();
      console.log("🔐 Metadata-driven login attempt...");

      await login(data);
      console.log("✅ Login successful via metadata system");

      console.log("🔄 Redirecting to:", redirectTo);

      // Use callback or fallback navigation
      if (onLoginSuccess) {
        onLoginSuccess(redirectTo);
      } else {
        // Fallback: try window.location if available
        if (typeof window !== "undefined") {
          const waitForCookie = () => {
            let attempts = 0;
            const maxAttempts = 20;

            const checkCookie = () => {
              const hasCookie = document.cookie.includes("auth_token=");
              attempts++;

              if (hasCookie) {
                console.log("🍪 Auth cookie confirmed, redirecting...");
                window.location.href = redirectTo;
              } else if (attempts >= maxAttempts) {
                console.log("⏰ Cookie timeout, redirecting anyway...");
                window.location.href = redirectTo;
              } else {
                setTimeout(checkCookie, 50);
              }
            };
            checkCookie();
          };

          waitForCookie();
        }
      }
    } catch (error) {
      console.error("❌ Metadata-driven login failed:", error);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-maritime-blue to-blue-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading metadata-driven page...</p>
        </div>
      </div>
    );
  }

  // Error state - fallback to existing login
  if (pageError || !pageDefinition) {
    console.warn("⚠️ Falling back to static login page due to:", pageError);

    return (
      <div
        className={`min-h-screen flex items-center justify-center p-4 transition-colors ${
          displayTheme === "dark"
            ? "bg-gradient-to-br from-gray-900 to-gray-800"
            : "bg-gradient-to-br from-maritime-blue to-blue-900"
        }`}
      >
        {/* Static fallback with metadata error info */}
        <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
          <ThemeSelector variant="toggle" size="sm" />
          <LanguageSelector
            variant="dropdown"
            size="sm"
            showFlag={true}
            showNativeName={true}
            theme={displayTheme}
          />
        </div>

        <div className="w-full max-w-lg lg:max-w-xl xl:max-w-2xl">
          <div
            className={`rounded-2xl shadow-2xl overflow-hidden transition-colors ${
              displayTheme === "dark" ? "bg-gray-800" : "bg-white"
            }`}
          >
            {/* Error notification */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <p className="text-yellow-800 text-sm">
                <strong>Metadata System:</strong> Using fallback login (Error:{" "}
                {pageError})
              </p>
            </div>

            <div
              className={`px-8 py-8 text-center transition-colors ${
                displayTheme === "dark"
                  ? "bg-gradient-to-r from-gray-700 to-gray-600"
                  : "bg-gradient-to-r from-maritime-blue to-blue-700"
              }`}
            >
              <div className="mx-auto mb-4 flex items-center justify-center">
                <Logo size="lg" />
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                Metadata ERP
              </h1>
              <p className="text-blue-100">Fallback Login Page</p>
            </div>

            <div className="px-8 py-6 lg:px-10 lg:py-8">
              <LoginForm
                app={AppName.CLIENT}
                onLogin={handleLogin}
                isLoading={isLoading}
                error={error || undefined}
                language={language}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render metadata-driven page
  const backgroundStyle =
    pageDefinition.metadata_json?.background || "gradient";
  const layoutStyle = pageDefinition.metadata_json?.layout || "centered";

  console.log("🎨 Rendering metadata-driven login page:", {
    pageId: pageDefinition.page_id,
    components: pageDefinition.components.length,
    theme: displayTheme,
    background: backgroundStyle,
    layout: layoutStyle,
  });

  return (
    <div
      className={`min-h-screen relative transition-colors ${
        backgroundStyle === "gradient"
          ? displayTheme === "dark"
            ? "bg-gradient-to-br from-gray-900 to-gray-800"
            : "bg-gradient-to-br from-maritime-blue to-blue-900"
          : displayTheme === "dark"
            ? "bg-gray-900"
            : "bg-gray-50"
      } ${
        layoutStyle === "centered" ? "flex items-center justify-center p-4" : ""
      }`}
    >
      {/* Render positioned components (ThemeSelector, LanguageSelector) */}
      {pageDefinition.components
        .filter((comp) => comp.position)
        .map((component, index) => (
          <div
            key={`positioned-${component.type}-${index}`}
            className={`absolute z-10 ${component.position?.x} ${component.position?.y}`}
          >
            {component.type === "ThemeSelector" && (
              <ThemeSelector
                variant={component.props.variant || "toggle"}
                size={component.props.size || "sm"}
              />
            )}
            {component.type === "LanguageSelector" && (
              <LanguageSelector
                variant={component.props.variant || "dropdown"}
                size={component.props.size || "sm"}
                showFlag={component.props.showFlag !== false}
                showNativeName={component.props.showNativeName !== false}
                theme={displayTheme}
              />
            )}
          </div>
        ))}

      {/* Main content container */}
      <div className="w-full max-w-lg lg:max-w-xl xl:max-w-2xl">
        <div
          className={`rounded-2xl shadow-2xl overflow-hidden transition-colors ${
            displayTheme === "dark" ? "bg-gray-800" : "bg-white"
          }`}
        >
          {/* Metadata success notification */}
          <div className="bg-green-50 border-l-4 border-green-400 p-3">
            <p className="text-green-800 text-sm">
              <strong>✅ Metadata System Active:</strong> Page loaded from
              database (ID: {pageDefinition.page_id.slice(0, 8)})
            </p>
          </div>

          {/* Header */}
          <div
            className={`px-8 py-8 text-center transition-colors ${
              displayTheme === "dark"
                ? "bg-gradient-to-r from-gray-700 to-gray-600"
                : "bg-gradient-to-r from-maritime-blue to-blue-700"
            }`}
          >
            <div className="mx-auto mb-4 flex items-center justify-center">
              <Logo size="lg" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
              {pageDefinition.title}
            </h1>
            <p className="text-blue-100">
              {pageDefinition.description || "Metadata-driven login"}
            </p>
          </div>

          {/* Form */}
          <div className="px-8 py-6 lg:px-10 lg:py-8">
            <div className="mb-4 text-center">
              <h2
                className={`text-xl lg:text-2xl font-bold mb-2 transition-colors ${
                  displayTheme === "dark" ? "text-white" : "text-gray-800"
                }`}
              >
                {t("welcome", { ns: "auth" })}
              </h2>
              <p
                className={`transition-colors ${
                  displayTheme === "dark" ? "text-gray-300" : "text-gray-600"
                }`}
              >
                {t("sign_in_prompt", { ns: "auth" })}
              </p>
            </div>

            {/* Render Form component from metadata */}
            {pageDefinition.components
              .filter((comp) => comp.type === "Form")
              .map((component, index) => (
                <LoginForm
                  key={`form-${index}`}
                  app={AppName.CLIENT}
                  onLogin={handleLogin}
                  isLoading={isLoading}
                  error={error || undefined}
                  language={language}
                />
              ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p
            className={`text-sm transition-colors ${
              displayTheme === "dark" ? "text-gray-300" : "text-blue-100"
            }`}
          >
            © {new Date().getFullYear()} Metadata ERP Platform.{" "}
            {t("all_rights_reserved", { ns: "auth" })}
          </p>
        </div>
      </div>

      {/* Development info */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded max-w-xs">
          <div>
            <strong>Metadata Debug:</strong>
          </div>
          <div>Page: {pageDefinition.page_name}</div>
          <div>Route: {pageDefinition.route}</div>
          <div>Components: {pageDefinition.components.length}</div>
          <div>Tenant: {pageDefinition.tenant_id || "global"}</div>
          <div>Theme: {displayTheme}</div>
        </div>
      )}
    </div>
  );
}
