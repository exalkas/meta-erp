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
  responsive_classes?: Record<string, string>;
  is_responsive: boolean;
  supports_theming: boolean;
  is_system_layout: boolean;
  tenant_id?: string;
}

interface SectionConfig {
  className?: string;
  maxComponents?: number;
  style?: React.CSSProperties;
  allowedComponents?: string[];
  components?: ComponentInstance[];
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

  // Sidebar state management
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Build container classes with dynamic sidebar support and responsive grid
  const baseContainerClasses = layoutDefinition.container_classes || "";

  // ✅ METADATA-DRIVEN: Apply responsive classes exactly as specified in metadata
  const responsiveClasses = layoutDefinition.responsive_classes
    ? [
        layoutDefinition.responsive_classes.mobile || "",
        layoutDefinition.responsive_classes.tablet
          ? `md:${layoutDefinition.responsive_classes.tablet}`
          : "",
        layoutDefinition.responsive_classes.desktop
          ? `lg:${layoutDefinition.responsive_classes.desktop}`
          : "",
      ]
        .filter(Boolean)
        .join(" ")
    : "";

  // ✅ NO HARDCODED CLASSES: Use only metadata-defined classes
  const containerClasses = [baseContainerClasses, responsiveClasses, className]
    .filter(Boolean)
    .join(" ");

  // 🔍 DEBUG: Log CSS class application pipeline
  console.log("🎨 DynamicLayout CSS Pipeline:", {
    layoutId: layoutDefinition.layout_id,
    layoutName: layoutDefinition.display_name,
    baseContainerClasses,
    rawResponsiveClasses: layoutDefinition.responsive_classes,
    processedResponsiveClasses: responsiveClasses,
    finalContainerClasses: containerClasses,
    className: className,
  });

  // ✅ METADATA-DRIVEN: Use section classes exactly from metadata
  const getSectionClasses = (sectionName: string, originalClasses: string) => {
    // Use css_classes_json from metadata if available, otherwise use section className
    const metadataClasses =
      layoutDefinition.css_classes_json?.[sectionName] || originalClasses;

    // For sidebar, add responsive visibility and collapse state from metadata
    if (sectionName === "sidebar") {
      // Get base classes from metadata
      let finalClasses = metadataClasses;

      // Add width based on collapse state (this is dynamic behavior, not in metadata)
      const widthClass = sidebarCollapsed ? "w-16" : "w-64";
      finalClasses = `${finalClasses} ${widthClass}`;

      // ✅ FLEXBOX: Always hide sidebar on mobile, show on md+ screens
      finalClasses = `${finalClasses} hidden md:flex`;

      // 🔍 DEBUG: Log sidebar section classes
      console.log(`🔧 Section Classes (${sectionName}):`, {
        metadataClasses,
        widthClass,
        sidebarCollapsed,
        finalClasses,
      });

      return finalClasses;
    }

    // 🔍 DEBUG: Log section classes for all sections
    console.log(`🔧 Section Classes (${sectionName}):`, {
      metadataClasses,
      finalClasses: metadataClasses,
    });

    return metadataClasses;
  };

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
      {/* Render header section first */}
      {layoutDefinition.sections_json.header &&
        renderSection("header", layoutDefinition.sections_json.header)}

      {/* ✅ PURE FLEXBOX: Body container for sidebar + main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Render sidebar section */}
        {layoutDefinition.sections_json.sidebar &&
          renderSection("sidebar", layoutDefinition.sections_json.sidebar)}
        {/* Render main section */}
        {layoutDefinition.sections_json.main &&
          renderSection("main", layoutDefinition.sections_json.main)}
      </div>

      {/* Render footer section last */}
      {layoutDefinition.sections_json.footer &&
        renderSection("footer", layoutDefinition.sections_json.footer)}
    </div>
  );

  // Helper function to render individual sections
  function renderSection(sectionName: string, sectionConfig: any) {
    // Combine layout-defined components with page-defined components
    const layoutComponents = sectionConfig.components || [];
    const pageComponents = Array.isArray(safeSectionsData[sectionName])
      ? safeSectionsData[sectionName]
      : [];

    const sectionComponents = [...layoutComponents, ...pageComponents];

    console.log(
      `🏗️ Rendering section: ${sectionName}`,
      `Layout components: ${layoutComponents.length},`,
      `Page components: ${pageComponents.length},`,
      `Total: ${sectionComponents.length}`,
      {
        layoutComponents: layoutComponents.map((c: any) => ({
          type: c.type,
          propsKeys: Object.keys(c.props || {}),
        })),
        pageComponents: pageComponents.map((c: any) => ({
          type: c.type,
          propsKeys: Object.keys(c.props || {}),
        })),
      }
    );

    const baseSectionClasses =
      layoutDefinition.css_classes_json?.[sectionName] ||
      sectionConfig.className ||
      "";
    const sectionClasses = getSectionClasses(sectionName, baseSectionClasses);

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

            // Enhance component props based on section and type
            let enhancedProps = { ...component.props };

            // Add sidebar state for sidebar components
            if (
              sectionName === "sidebar" &&
              (component.type === "SidebarMenu" || component.type === "Sidebar")
            ) {
              enhancedProps = {
                ...enhancedProps,
                collapsed: sidebarCollapsed,
                onToggleCollapse: () => setSidebarCollapsed(!sidebarCollapsed),
                showToggleButton: true,
                overlayOnMobile: true,
                isOpen: mobileMenuOpen,
                onClose: () => setMobileMenuOpen(false),
                // Pass user data from context
                currentUser: contextProps.currentUser,
              };
            }

            // Add mobile menu toggle for navigation components
            if (sectionName === "header" && component.type === "Navigation") {
              // Get sidebar sections for mobile menu
              const sidebarConfig = layoutDefinition.sections_json.sidebar;
              const sidebarComponent = sidebarConfig?.components?.[0];
              const sidebarSections = sidebarComponent?.props?.sections || [];

              enhancedProps = {
                ...enhancedProps,
                onMobileMenuToggle: () => setMobileMenuOpen(!mobileMenuOpen),
                mobileMenuOpen,
                sidebarSections: sidebarSections, // ✅ Pass sidebar sections to mobile menu
                // Pass user data from context
                user: contextProps.currentUser
                  ? {
                      name:
                        contextProps.currentUser.first_name +
                        " " +
                        contextProps.currentUser.last_name,
                      email: contextProps.currentUser.email,
                      avatar: contextProps.currentUser.avatar_url,
                      showProfile: enhancedProps.user?.showProfile,
                      showAvatar: enhancedProps.user?.showAvatar,
                    }
                  : enhancedProps.user,
              };
            }

            return (
              <DynamicComponent
                key={`${sectionName}-${component.type}-${index}`}
                type={component.type}
                props={enhancedProps}
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
              <div className="text-xs mt-1">Add components via metadata</div>
            </div>
          )}
      </section>
    );
  }
};

export default DynamicLayout;
