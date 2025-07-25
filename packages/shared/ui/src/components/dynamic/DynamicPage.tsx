/**
 * Dynamic Page Component - Metadata-Driven Platform
 *
 * Renders pages dynamically from PageDefinitions metadata.
 * Supports component composition and tenant-specific overrides.
 */

import React, { useState, useEffect } from "react";
import { DynamicComponent } from "./DynamicComponent";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";

export interface PageDefinition {
  page_id: string;
  page_name: string;
  route: string;
  title: string;
  description?: string;
  page_type: string;
  components: ComponentInstance[];
  access_roles: string[];
  is_public: boolean;
  metadata_json?: Record<string, any>;
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
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

interface DynamicPageProps {
  pageDefinition: PageDefinition;
  tenantId?: string;
  className?: string;
  loading?: boolean;
  error?: string;
  onComponentError?: (error: Error, componentType: string) => void;
}

export const DynamicPage: React.FC<DynamicPageProps> = ({
  pageDefinition,
  tenantId,
  className = "",
  loading = false,
  error = null,
  onComponentError,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [componentErrors, setComponentErrors] = useState<
    Record<string, string>
  >({});

  // Handle component-level errors
  const handleComponentError = (
    error: Error,
    componentType: string,
    index: number
  ) => {
    const errorKey = `${componentType}-${index}`;
    setComponentErrors((prev) => ({
      ...prev,
      [errorKey]: error.message,
    }));

    if (onComponentError) {
      onComponentError(error, componentType);
    }

    console.error(`Error in component ${componentType}:`, error);
  };

  // Clear errors when page definition changes
  useEffect(() => {
    setComponentErrors({});
  }, [pageDefinition.page_id]);

  if (loading) {
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
            {t("error.page_load_failed", "Failed to load page")}
          </h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  // Apply page-level styles based on metadata
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
        const errorKey = `${component.type}-${index}`;
        const hasError = componentErrors[errorKey];

        // Handle positioned components (like ThemeSelector, LanguageSelector)
        if (component.position) {
          return (
            <div
              key={`${component.type}-${index}`}
              className={`absolute z-10 ${component.position.x} ${component.position.y}`}
            >
              {hasError ? (
                <div className="bg-red-100 border border-red-300 rounded p-2 text-red-700 text-xs">
                  Error: {hasError}
                </div>
              ) : (
                <DynamicComponent
                  type={component.type}
                  props={component.props}
                  tenantId={tenantId}
                  onError={(error) =>
                    handleComponentError(error, component.type, index)
                  }
                />
              )}
            </div>
          );
        }

        // Handle regular flow components
        return (
          <div key={`${component.type}-${index}`} className="w-full">
            {hasError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h3 className="text-red-800 font-medium mb-2">
                  Component Error: {component.type}
                </h3>
                <p className="text-red-600 text-sm">{hasError}</p>
              </div>
            ) : (
              <DynamicComponent
                type={component.type}
                props={component.props}
                tenantId={tenantId}
                onError={(error) =>
                  handleComponentError(error, component.type, index)
                }
              />
            )}
          </div>
        );
      })}

      {/* Development info (only in debug mode) */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
          <div>Page: {pageDefinition.page_name}</div>
          <div>Route: {pageDefinition.route}</div>
          <div>Components: {pageDefinition.components.length}</div>
          <div>Tenant: {tenantId || "global"}</div>
        </div>
      )}
    </div>
  );
};

export default DynamicPage;
