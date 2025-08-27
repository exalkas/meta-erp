/**
 * Dynamic Page Component - Metadata-Driven Platform
 *
 * Renders pages dynamically from PageDefinitions metadata.
 * Supports layout + sections architecture and tenant-specific overrides.
 */

import React, { useState, useEffect, useCallback } from "react";
import { DynamicLayout } from "./DynamicLayout";
import { DynamicComponent } from "./DynamicComponent";
import { useTranslation, useLanguage } from "../../contexts/TranslationContext";
import { useTheme } from "../../contexts/ThemeContext";

// NEW: Metadata-driven state and callback management
interface PageState {
  [key: string]: any;
}

interface StateBinding {
  [componentPath: string]: string; // "MetadataDataTable.filters" -> "customers.filters"
}

interface CallbackDefinition {
  event: string;
  action: string;
  target?: string;
  params?: Record<string, any>;
}

interface PageCallbacks {
  [componentType: string]: {
    [eventName: string]: CallbackDefinition;
  };
}

export interface PageDefinition {
  page_id: string;
  page_name: string;
  route: string;
  title: string;
  description?: string;
  page_type: string;
  layout_id?: string;
  sections_data_json?: Record<string, ComponentInstance[]>;
  components: ComponentInstance[]; // Legacy support
  access_roles: string[];
  is_public: boolean;
  metadata_json?: Record<string, any>;
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;

  // NEW: Metadata-driven state and callbacks
  initial_state?: PageState;
  state_bindings?: StateBinding;
  api_endpoints?: Record<string, string>;
  callbacks?: PageCallbacks;
  real_time_updates?: boolean;
  websocket_events?: string[];
}

export interface ComponentInstance {
  type: string;
  props: Record<string, any>;
  position?: {
    x: string;
    y: string;
  };
  children?: ComponentInstance[];
}

interface LayoutDefinition {
  layout_id: string;
  name: string;
  display_name: string;
  description?: string;
  category?: string;
  sections_json: Record<string, any>;
  css_classes_json?: Record<string, string>;
  container_classes?: string;
  is_responsive: boolean;
  supports_theming: boolean;
  is_system_layout: boolean;
  tenant_id?: string;
}

interface DynamicPageProps {
  pageDefinition: PageDefinition;
  tenantId?: string;
  className?: string;
  loading?: boolean;
  error?: string;
  onComponentError?: (error: Error, componentType: string) => void;
  // Add context props for special component handling
  contextProps?: {
    onLogin?: (data: {
      email: string;
      password: string;
      rememberMe?: boolean;
    }) => Promise<void>;
    onLogout?: () => void;
    currentUser?: any;
  };
}

export const DynamicPage: React.FC<DynamicPageProps> = ({
  pageDefinition,
  tenantId,
  className = "",
  loading = false,
  error = null,
  onComponentError,
  contextProps = {},
}) => {
  console.log("🎭 DynamicPage rendering with pageDefinition:", {
    page_name: pageDefinition?.page_name,
    layout_id: pageDefinition?.layout_id,
    has_sections: !!pageDefinition?.sections_data_json,
    components_count: pageDefinition?.components?.length,
    has_callbacks: !!pageDefinition?.callbacks,
    callbacks_keys: pageDefinition?.callbacks
      ? Object.keys(pageDefinition.callbacks)
      : [],
    has_api_endpoints: !!pageDefinition?.api_endpoints,
    full_keys: Object.keys(pageDefinition || {}),
  });

  const { t } = useTranslation();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [layoutDefinition, setLayoutDefinition] =
    useState<LayoutDefinition | null>(null);
  const [layoutLoading, setLayoutLoading] = useState(false);
  const [layoutError, setLayoutError] = useState<string | null>(null);

  // NEW: Metadata-driven state management
  const [pageState, setPageState] = useState<PageState>(
    pageDefinition.initial_state || {}
  );

  // NEW: Generate callbacks from metadata
  const generateCallbacks = useCallback(() => {
    const callbacks: Record<string, any> = {};

    console.log("🔧 DynamicPage: Generating callbacks from metadata:", {
      hasCallbacks: !!pageDefinition.callbacks,
      callbackKeys: pageDefinition.callbacks
        ? Object.keys(pageDefinition.callbacks)
        : [],
      pageDefinitionKeys: Object.keys(pageDefinition),
    });

    if (pageDefinition.callbacks) {
      // ✅ FIXED: Handle flat callback structure from metadata
      Object.entries(pageDefinition.callbacks).forEach(
        ([eventName, callbackDef]) => {
          callbacks[eventName] = async (...args: any[]) => {
            console.log(`🔄 Callback triggered: ${eventName}`, callbackDef);

            // Parse callback definition (format: "action:target" or just "action")
            const callbackStr =
              typeof callbackDef === "string"
                ? callbackDef
                : callbackDef.toString();
            const [action, target] = callbackStr.includes(":")
              ? callbackStr.split(":", 2)
              : [callbackStr, null];

            switch (action) {
              case "redirect":
                if (target) {
                  console.log(`🔄 Redirecting to: ${target}`);
                  window.location.href = target;
                }
                break;

              case "state":
                if (target) {
                  const [statePath, value] = target.split("=", 2);
                  setPageState((prev) => ({
                    ...prev,
                    [statePath]: value || args[0],
                  }));
                }
                break;

              case "api_call":
                if (target && pageDefinition.api_endpoints?.[target]) {
                  const endpoint = pageDefinition.api_endpoints[target];
                  console.log(`📡 API call to: ${endpoint}`, args);
                  // TODO: Make actual API call
                }
                break;

              case "custom":
                console.log(`🔧 Custom action: ${target}`, args);
                break;

              default:
                console.warn(`Unknown callback action: ${action}`);
            }
          };
        }
      );

      // ✅ ADDED: Special authentication callback for LoginForm
      if (pageDefinition.callbacks.onLoginSuccess) {
        callbacks.onLogin = async (loginData: {
          email: string;
          password: string;
          rememberMe?: boolean;
        }) => {
          try {
            console.log("🔐 Attempting login through metadata-driven auth");

            // Import authApiClient dynamically to avoid SSR issues
            const { authApiClient } = await import(
              "../../services/authApiClient"
            );

            console.log("🚀 Using real auth service for authentication");
            const authResponse = await authApiClient.loginWithPassword(
              loginData.email,
              loginData.password,
              tenantId, // Use tenant from props
              "Web Browser" // Device name
            );

            console.log("✅ Authentication successful through auth service");

            // ✅ FIXED: Store tokens properly (localStorage + cookie) without React hook
            const tokens = {
              accessToken: authResponse.access_token,
              refreshToken: authResponse.refresh_token,
              expiresIn: authResponse.expires_in,
              expiresAt: new Date(
                Date.now() + authResponse.expires_in * 1000
              ).toISOString(),
            };

            // Set tokens in localStorage and cookies
            if (typeof window !== "undefined") {
              localStorage.setItem("auth_tokens", JSON.stringify(tokens));
              localStorage.setItem(
                "auth_user",
                JSON.stringify(authResponse.user)
              );

              // Set HTTP cookie for middleware (same logic as useAuthGuard)
              const isSecure = window.location.protocol === "https:";
              const cookieValue = `auth_token=${tokens.accessToken}; path=/; SameSite=lax${isSecure ? "; Secure" : ""}`;
              console.log("🍪 Setting auth cookie:", cookieValue);
              document.cookie = cookieValue;
            }

            console.log(
              "✅ Authentication tokens stored (including HTTP cookie for middleware)"
            );

            // Execute the success callback from metadata
            if (callbacks.onLoginSuccess) {
              await callbacks.onLoginSuccess();
            }
          } catch (err) {
            console.error("❌ Login error:", err);

            // Execute error callback if defined
            if (callbacks.onLoginError) {
              await callbacks.onLoginError(err);
            }

            throw err;
          }
        };
      }
    }

    return callbacks;
  }, [pageDefinition, tenantId]);

  // NEW: Apply state bindings to components
  const applyStateBindings = useCallback(
    (componentType: string, componentProps: any) => {
      if (!pageDefinition.state_bindings) return componentProps;

      const enhancedProps = { ...componentProps };

      Object.entries(pageDefinition.state_bindings).forEach(
        ([componentPath, statePath]) => {
          if (componentPath.startsWith(componentType)) {
            const propName = componentPath.split(".")[1]; // "MetadataDataTable.filters" -> "filters"
            enhancedProps[propName] = pageState[statePath];
          }
        }
      );

      return enhancedProps;
    },
    [pageDefinition.state_bindings, pageState]
  );

  const metadataCallbacks = generateCallbacks();

  // Fetch layout definition if page uses layout + sections
  useEffect(() => {
    const fetchLayout = async () => {
      if (!pageDefinition.layout_id) {
        return; // No layout - use legacy components approach
      }

      setLayoutLoading(true);
      setLayoutError(null);

      try {
        console.log(
          `📐 Fetching layout definition: ${pageDefinition.layout_id}`
        );

        const response = await fetch(
          `http://localhost:8000/metadata/layouts/${pageDefinition.layout_id}?tenant_id=${tenantId}`
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch layout: ${response.status} ${response.statusText}`
          );
        }

        const layout = await response.json();
        setLayoutDefinition(layout);
        console.log(`✅ Layout definition loaded: ${layout.display_name}`);
      } catch (err) {
        console.error(
          `❌ Failed to load layout ${pageDefinition.layout_id}:`,
          err
        );
        setLayoutError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLayoutLoading(false);
      }
    };

    fetchLayout();
  }, [pageDefinition.layout_id, tenantId]);

  if (loading || layoutLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Page Error
          </h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (layoutError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Layout Error
          </h2>
          <p className="text-red-600">{layoutError}</p>
          <div className="mt-4 text-sm text-red-500">
            Page: {pageDefinition.page_name} | Layout:{" "}
            {pageDefinition.layout_id}
          </div>
        </div>
      </div>
    );
  }

  // NEW: Layout + Sections approach
  if (
    pageDefinition.layout_id &&
    layoutDefinition &&
    pageDefinition.sections_data_json
  ) {
    console.log(
      `📐 Using Layout + Sections approach for page: ${pageDefinition.page_name}`
    );
    console.log(`🏗️ Layout:`, layoutDefinition.display_name);
    console.log(`📋 Sections data:`, pageDefinition.sections_data_json);
    console.log(
      `📋 Sections data type:`,
      typeof pageDefinition.sections_data_json
    );
    console.log(
      `📋 Sections data keys:`,
      Object.keys(pageDefinition.sections_data_json || {})
    );

    console.log("🔧 DynamicPage: Passing callbacks to DynamicLayout:", {
      callbackCount: Object.keys(metadataCallbacks).length,
      callbackNames: Object.keys(metadataCallbacks),
      hasMetadataCallbacks: !!metadataCallbacks,
      metadataCallbacks,
    });

    return (
      <DynamicLayout
        layoutDefinition={layoutDefinition}
        sectionsData={pageDefinition.sections_data_json || {}}
        tenantId={tenantId}
        className={className}
        onComponentError={(error, componentType, sectionName) => {
          console.error(`Component error in section ${sectionName}:`, error);
          onComponentError?.(error, componentType);
        }}
        contextProps={{
          ...contextProps,
          // Metadata-driven callbacks
          metadataCallbacks,
          // State management functions
          pageState,
          setPageState,
          applyStateBindings,
          // API endpoints from metadata
          apiEndpoints: pageDefinition.api_endpoints,
        }}
      />
    );
  }

  // ERROR: Page must use layout + sections approach
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-lg font-semibold text-red-800 mb-2">
          Configuration Error
        </h2>
        <p className="text-red-600">
          Page "{pageDefinition.page_name}" must use layout + sections approach.
          Legacy component approach is no longer supported.
        </p>
        <div className="mt-4 text-sm text-red-500">
          Required: layout_id and sections_data_json
        </div>
      </div>
    </div>
  );
};

export default DynamicPage;
