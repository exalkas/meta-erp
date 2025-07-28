/**
 * Dynamic Layout Component - Metadata-Driven Platform
 *
 * Renders page layouts from LayoutDefinition metadata with section-based composition.
 * Supports complex layouts with multiple sections and dynamic theming.
 */

import React, { useState, useEffect } from "react";
import { DynamicComponent } from "./DynamicComponent";
import { useTheme } from "../../contexts/ThemeContext";

interface LayoutDefinition {
  layout_id: string;
  name: string;
  display_name: string;
  description?: string;
  category?: string;
  sections_json: Record<string, SectionConfig>;
  css_classes_json?: Record<string, string>;
  container_classes?: string;
  is_responsive: boolean;
  supports_theming: boolean;
  is_system_layout: boolean;
  tenant_id?: string;
}

interface SectionConfig {
  className?: string;
  maxComponents?: number;
  style?: React.CSSProperties;
}

interface ComponentInstance {
  type: string;
  props: Record<string, any>;
  children?: ComponentInstance[];
}

interface DynamicLayoutProps {
  layoutDefinition: LayoutDefinition;
  sectionsData: Record<string, ComponentInstance[]>;
  tenantId?: string;
  className?: string;
  loading?: boolean;
  error?: string;
  onComponentError?: (
    error: Error,
    componentType: string,
    sectionName: string
  ) => void;
  // Add context props for special component handling
  contextProps?: {
    onLogin?: (data: {
      email: string;
      password: string;
      rememberMe?: boolean;
    }) => Promise<void>;
    onLogout?: () => void;
    currentUser?: any;
    tenantId?: string;
    // NEW: Metadata-driven properties
    metadataCallbacks?: Record<string, any>;
    pageState?: Record<string, any>;
    setPageState?: (state: Record<string, any>) => void;
    applyStateBindings?: (componentType: string, props: any) => any;
    apiEndpoints?: Record<string, string>;
  };
}

export const DynamicLayout: React.FC<DynamicLayoutProps> = ({
  layoutDefinition,
  sectionsData,
  tenantId,
  className = "",
  loading = false,
  error = null,
  onComponentError,
  contextProps = {},
}) => {
  const { theme } = useTheme();
  const [componentErrors, setComponentErrors] = useState<
    Record<string, string>
  >({});

  // Handle component-level errors
  const handleComponentError = (
    error: Error,
    componentType: string,
    sectionName: string,
    componentIndex: number
  ) => {
    const errorKey = `${sectionName}-${componentType}-${componentIndex}`;
    setComponentErrors((prev) => ({
      ...prev,
      [errorKey]: error.message,
    }));

    if (onComponentError) {
      onComponentError(error, componentType, sectionName);
    }

    console.error(
      `Error in component ${componentType} in section ${sectionName}:`,
      error
    );
  };

  // Clear errors when layout changes
  useEffect(() => {
    setComponentErrors({});
  }, [layoutDefinition.layout_id]);

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
            Layout Error
          </h2>
          <p className="text-red-600">{error}</p>
          <div className="mt-4 text-sm text-red-500">
            Layout: {layoutDefinition.display_name}
          </div>
        </div>
      </div>
    );
  }

  if (!layoutDefinition) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Layout definition is required</p>
        </div>
      </div>
    );
  }

  if (!layoutDefinition.sections_json) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">
            Layout sections configuration is missing
          </p>
        </div>
      </div>
    );
  }

  const safeSectionsData = sectionsData || {};

  // Build container classes
  const containerClasses = [layoutDefinition.container_classes || "", className]
    .filter(Boolean)
    .join(" ");

  // Apply theme styles if supported
  const themeClasses =
    layoutDefinition.supports_theming && theme
      ? `theme-${theme.toLowerCase()}`
      : "";

  return (
    <div
      className={`${containerClasses} ${themeClasses}`.trim()}
      data-layout-id={layoutDefinition.layout_id}
      data-layout-name={layoutDefinition.name}
    >
      {/* Development info (only in debug mode) */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-50">
          <div>Layout: {layoutDefinition.display_name}</div>
          <div>
            Sections: {Object.keys(layoutDefinition.sections_json).length}
          </div>
          <div>
            Theme Support: {layoutDefinition.supports_theming ? "Yes" : "No"}
          </div>
        </div>
      )}

      {/* Render layout sections */}
      {Object.entries(layoutDefinition.sections_json).map(
        ([sectionName, sectionConfig]) => {
          const sectionData = safeSectionsData[sectionName];
          const sectionComponents = Array.isArray(sectionData)
            ? sectionData
            : [];

          console.log(
            `🏗️ Rendering section: ${sectionName}, components:`,
            sectionComponents.length
          );

          const sectionClasses =
            layoutDefinition.css_classes_json?.[sectionName] ||
            sectionConfig.className ||
            "";

          return (
            <section
              key={sectionName}
              className={sectionClasses}
              data-section={sectionName}
              style={sectionConfig.style}
            >
              {/* Render components in this section */}
              {sectionComponents.length > 0 &&
                sectionComponents.map((component, index) => {
                  const errorKey = `${sectionName}-${component.type}-${index}`;
                  const hasError = componentErrors[errorKey];

                  // Check if section has reached max components
                  if (
                    sectionConfig.maxComponents &&
                    index >= sectionConfig.maxComponents
                  ) {
                    console.warn(
                      `Section ${sectionName} exceeded maxComponents (${sectionConfig.maxComponents})`
                    );
                    return null;
                  }

                  if (hasError) {
                    return (
                      <div
                        key={`${sectionName}-${component.type}-${index}`}
                        className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"
                      >
                        <h3 className="text-red-800 font-medium mb-2">
                          Component Error: {component.type}
                        </h3>
                        <p className="text-red-600 text-sm">{hasError}</p>
                        <div className="text-xs text-red-500 mt-2">
                          Section: {sectionName} | Index: {index}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <DynamicComponent
                      key={`${sectionName}-${component.type}-${index}`}
                      type={component.type}
                      props={component.props}
                      onComponentError={(error: Error) =>
                        handleComponentError(
                          error,
                          component.type,
                          sectionName,
                          index
                        )
                      }
                      contextProps={{
                        ...contextProps,
                        tenantId,
                      }}
                    />
                  );
                })}

              {/* Show empty section placeholder in development */}
              {process.env.NODE_ENV === "development" &&
                sectionComponents.length === 0 && (
                  <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500">
                    <div className="text-sm font-medium">
                      Empty Section: {sectionName}
                    </div>
                    <div className="text-xs mt-1">
                      Add components via metadata
                    </div>
                  </div>
                )}
            </section>
          );
        }
      )}
    </div>
  );
};

export default DynamicLayout;
