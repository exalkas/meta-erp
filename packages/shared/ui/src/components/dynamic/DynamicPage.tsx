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

    if (pageDefinition.callbacks) {
      Object.entries(pageDefinition.callbacks).forEach(
        ([componentType, eventCallbacks]) => {
          callbacks[componentType] = {};

          Object.entries(eventCallbacks).forEach(([eventName, callbackDef]) => {
            callbacks[componentType][eventName] = async (...args: any[]) => {
              console.log(
                `🔄 Callback triggered: ${componentType}.${eventName}`,
                callbackDef
              );

              switch (callbackDef.action) {
                case "set_state":
                  if (callbackDef.target) {
                    setPageState((prev) => ({
                      ...prev,
                      [callbackDef.target!]: args[0],
                    }));
                  }
                  break;

                case "api_call":
                  if (
                    callbackDef.target &&
                    pageDefinition.api_endpoints?.[callbackDef.target]
                  ) {
                    const endpoint =
                      pageDefinition.api_endpoints[callbackDef.target];
                    console.log(`📡 API call to: ${endpoint}`, args);
                    // TODO: Make actual API call
                  }
                  break;

                case "navigate":
                  if (callbackDef.target) {
                    window.location.href = callbackDef.target;
                  }
                  break;

                case "custom":
                  // Execute custom JavaScript from metadata (careful!)
                  console.log(`🔧 Custom action: ${callbackDef.target}`, args);
                  break;

                default:
                  console.warn(
                    `Unknown callback action: ${callbackDef.action}`
                  );
              }
            };
          });
        }
      );
    }

    return callbacks;
  }, [pageDefinition]);

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
          `/api/metadata/layouts/${pageDefinition.layout_id}?tenant_id=${tenantId}`
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

  // LEGACY: Components approach (for backward compatibility)
  const pageTheme = pageDefinition.metadata_json?.theme || theme;
  const layoutStyle = pageDefinition.metadata_json?.layout || "default";
  const backgroundStyle = pageDefinition.metadata_json?.background || "default";

  // Build page container classes
  const containerClasses = ["min-h-screen", "relative", className];

  // Apply background styles
  if (backgroundStyle === "gradient") {
    containerClasses.push(
      pageTheme === "dark"
        ? "bg-gradient-to-br from-gray-900 to-gray-800"
        : "bg-gradient-to-br from-maritime-blue to-blue-900"
    );
  } else {
    containerClasses.push(pageTheme === "dark" ? "bg-gray-900" : "bg-gray-50");
  }

  // Apply layout styles
  if (layoutStyle === "centered") {
    containerClasses.push("flex items-center justify-center p-4");
  }

  return (
    <div className={containerClasses.join(" ")}>
      {/* Render page components */}
      {pageDefinition.components.map((component, index) => {
        // Handle positioned components (like ThemeSelector, LanguageSelector)
        if (component.position) {
          return (
            <div
              key={`${component.type}-${index}`}
              className={`absolute z-10 ${component.position.x} ${component.position.y}`}
            >
              <DynamicComponent
                type={component.type}
                props={component.props}
                onComponentError={(error: Error) =>
                  onComponentError?.(error, component.type)
                }
                contextProps={{
                  ...contextProps,
                  tenantId,
                }}
              />
            </div>
          );
        }

        // Handle regular flow components
        return (
          <div key={`${component.type}-${index}`} className="w-full">
            <DynamicComponent
              type={component.type}
              props={component.props}
              onComponentError={(error: Error) =>
                onComponentError?.(error, component.type)
              }
              contextProps={{
                ...contextProps,
                tenantId,
              }}
            />
          </div>
        );
      })}

      {/* Development info (only in debug mode) */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
          <div>Page: {pageDefinition.page_name}</div>
          <div>Route: {pageDefinition.route}</div>
          <div>Layout: {pageDefinition.layout_id || "Legacy"}</div>
          <div>Components: {pageDefinition.components.length}</div>
          <div>Tenant: {tenantId || "global"}</div>
        </div>
      )}
    </div>
  );
};

export default DynamicPage;
