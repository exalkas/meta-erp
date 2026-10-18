/**
 * Dynamic Page Component - Metadata-Driven Platform
 *
 * Renders pages dynamically from PageDefinitions metadata.
 * Supports layout + sections architecture and tenant-specific overrides.
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { DynamicLayout } from "./DynamicLayout";
import { DynamicComponent } from "./DynamicComponent";
import { useTranslation, useLanguage } from "../../contexts/TranslationContext";
import { useTheme } from "../../contexts/ThemeContext";
import { API_ENDPOINTS, buildApiUrl, apiClient } from "../../config/api";
import { FullScreenSpinner } from "../ui/Spinner";

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

  // Metadata-driven state management
  const [pageState, setPageState] = useState<PageState>(
    pageDefinition.initial_state || {}
  );

  // Generate callbacks from metadata
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
                  console.log(`📡 Making API call to: ${endpoint}`, args);

                  try {
                    // Update loading state if bound
                    updatePageState(`widgets.${target}.loading`, true);

                    // Make the API call
                    const response = await apiClient.get(endpoint);

                    console.log(`✅ API call successful:`, {
                      endpoint,
                      response,
                    });

                    // Update state with response data
                    updatePageState(`widgets.${target}.data`, response);
                    updatePageState(`widgets.${target}.loading`, false);
                    updatePageState(`widgets.${target}.error`, null);
                  } catch (error) {
                    const errorMessage =
                      error instanceof Error ? error.message : String(error);
                    console.error(`❌ API call failed:`, {
                      endpoint,
                      target,
                      error: errorMessage,
                      errorType: typeof error,
                      fullError: error,
                    });

                    // Update error state
                    updatePageState(`widgets.${target}.loading`, false);
                    updatePageState(`widgets.${target}.error`, errorMessage);
                  }
                }
                break;

              case "action":
                // Handle action-based callbacks (like from websockets)
                console.log(`🎬 Action triggered: ${target}`, args);

                // Actions can trigger other callbacks
                if (target && target.startsWith("refresh")) {
                  const dataType = target.replace("refresh", "").toLowerCase();
                  const apiEndpoint = Object.keys(
                    pageDefinition.api_endpoints || {}
                  ).find((key) => key.toLowerCase().includes(dataType));

                  if (apiEndpoint) {
                    // Recursively call api_call
                    callbacks[eventName]("api_call", apiEndpoint);
                  }
                }
                break;

              case "navigate":
                if (target) {
                  console.log(`🧭 Navigation: ${target}`);
                  // Could integrate with Next.js router here
                  window.history.pushState({}, "", target);
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
            const propName = componentPath.split(".")[1]; // "DashboardGrid.filters" -> "filters"

            // Helper function to get nested state value
            const getNestedValue = (obj: any, path: string) => {
              return path
                .split(".")
                .reduce((current, key) => current?.[key], obj);
            };

            const stateValue = getNestedValue(pageState, statePath);

            if (stateValue !== undefined) {
              enhancedProps[propName] = stateValue;

              // Debug logging for state bindings
              console.log(`🔗 State binding applied:`, {
                component: componentType,
                prop: propName,
                statePath,
                value: stateValue,
              });
            }
          }
        }
      );

      return enhancedProps;
    },
    [pageDefinition.state_bindings, pageState]
  );

  // Helper function to update nested state
  const updatePageState = useCallback((statePath: string, value: any) => {
    setPageState((prevState) => {
      const newState = { ...prevState };
      const keys = statePath.split(".");
      let current = newState;

      // Navigate to the parent of the target key
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!current[key] || typeof current[key] !== "object") {
          current[key] = {};
        }
        current = current[key];
      }

      // Set the final value
      current[keys[keys.length - 1]] = value;

      console.log(`🔄 State updated:`, {
        statePath,
        value,
        newState: { ...newState },
      });

      return newState;
    });
  }, []);

  const metadataCallbacks = useMemo(
    () => generateCallbacks(),
    [pageDefinition, tenantId]
  );

  // Auto-load data when page loads - ONLY ONCE on mount
  useEffect(() => {
    const autoLoadData = async () => {
      // Look for callbacks that should be triggered on page load
      const loadCallbacks = [
        "onDataRefresh",
        "onLoadClients",
        "onLoadMatters",
        "onLoadDeadlines",
      ];

      console.log("🔄 DynamicPage: Checking auto-load callbacks:", {
        availableCallbacks: Object.keys(metadataCallbacks),
        lookingFor: loadCallbacks,
        hasApiEndpoints: !!pageDefinition.api_endpoints,
        apiEndpointCount: Object.keys(pageDefinition.api_endpoints || {})
          .length,
      });

      for (const callbackName of loadCallbacks) {
        if (metadataCallbacks[callbackName]) {
          console.log(`🚀 Auto-triggering callback: ${callbackName}`);
          try {
            await metadataCallbacks[callbackName]();
          } catch (error) {
            console.error(`❌ Auto-load failed for ${callbackName}:`, error);
            // Don't break the loop - continue with other callbacks
          }
        }
      }
    };

    // Only auto-load if we have API endpoints defined
    if (
      pageDefinition.api_endpoints &&
      Object.keys(pageDefinition.api_endpoints).length > 0
    ) {
      console.log("🚀 DynamicPage: Starting auto-load data process");
      autoLoadData();
    } else {
      console.log(
        "🚫 DynamicPage: No API endpoints defined, skipping auto-load"
      );
    }
  }, [pageDefinition.page_id]); // Only depend on page_id to run once per page

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

        const url = buildApiUrl(
          API_ENDPOINTS.layouts(pageDefinition.layout_id),
          {
            tenant_id: tenantId,
          }
        );
        const response = await fetch(url);

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
    const message = loading ? "Loading page..." : "Loading layout...";
    return <FullScreenSpinner message={message} />;
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
        className={className}
        onComponentError={(error, componentType, sectionName) => {
          console.error(`Component error in section ${sectionName}:`, error);
          onComponentError?.(error, componentType);
        }}
        contextProps={{
          ...contextProps,
          // Add tenantId to context
          tenantId,
          // Metadata-driven callbacks
          metadataCallbacks,
          // State management functions
          pageState,
          setPageState,
          updatePageState,
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
