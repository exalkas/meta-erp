/**
 * Dynamic Component - Metadata-Driven Platform
 *
 * Maps component types from metadata to actual React components.
 * Handles component loading, props validation, and error boundaries.
 */

import React from "react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Checkbox } from "../ui/Checkbox";
import { Alert } from "../ui/Alert";
import { Logo } from "../ui/Logo";
import { LanguageSelector } from "../multilingual/LanguageSelector";
import { ThemeSelector } from "../multilingual/ThemeSelector";
import { SimplePasswordInput } from "../ui/SimplePasswordInput";
import { LoginForm } from "../auth/LoginForm";
import { Navigation } from "../layout/Navigation";
import { DashboardGrid } from "../layout/Grid";
import { Sidebar } from "../ui/Sidebar";
import { MetadataDataTable } from "./MetadataDataTable";
import { DynamicForm } from "./DynamicForm";

// Generic UI Components
import Filter from "../ui/Filter";
import StatsGrid from "../ui/StatsGrid";
import Wizard from "../ui/Wizard";
import ItemGrid from "../ui/ItemGrid";
import Pagination from "../ui/Pagination";
import Progress from "../ui/Progress";

// Domain-specific components (minimal wrappers)
import RoleTemplateCard from "../roles/RoleTemplateCard";
import VerticalFilter from "../roles/VerticalFilter";
import RoleList from "../roles/RoleList";

// Simple PageHeader component
const PageHeader: React.FC<{
  title?: string;
  titleKey?: string;
  subtitle?: string;
  subtitleKey?: string;
  actions?: Array<{
    label: string;
    type: "primary" | "secondary";
    action: string;
  }>;
}> = ({ title, titleKey, subtitle, subtitleKey, actions }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
          {title || titleKey}
        </h1>
        {(subtitle || subtitleKey) && (
          <p className="text-gray-600">{subtitle || subtitleKey}</p>
        )}
      </div>
      {actions && actions.length > 0 && (
        <div className="flex space-x-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.type === "primary" ? "primary" : "outline"}
              onClick={() => console.log(`Action: ${action.action}`)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

// Simple MenuTree component
const MenuTree: React.FC<{
  items: Array<{
    label: string;
    route: string;
    icon?: string;
    active?: boolean;
  }>;
}> = ({ items }) => {
  return (
    <nav className="space-y-2">
      {items.map((item, index) => (
        <a
          key={index}
          href={item.route}
          className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            item.active
              ? "bg-blue-100 text-blue-700"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          {item.icon && (
            <span className="mr-3 text-lg">
              {item.icon === "home" && "🏠"}
              {item.icon === "package" && "📦"}
              {item.icon === "shopping-cart" && "🛒"}
              {item.icon === "users" && "👥"}
              {item.icon === "bar-chart" && "📊"}
              {item.icon === "settings" && "⚙️"}
            </span>
          )}
          {item.label}
        </a>
      ))}
    </nav>
  );
};

// Simple RecentItems component
const RecentItems: React.FC<{
  limit?: number;
}> = ({ limit = 5 }) => {
  const mockItems = [
    { title: "Order #12345", time: "2 hours ago" },
    { title: "Customer ABC Corp", time: "4 hours ago" },
    { title: "Product Update", time: "1 day ago" },
    { title: "Inventory Alert", time: "2 days ago" },
    { title: "Payment Received", time: "3 days ago" },
  ].slice(0, limit);

  return (
    <div className="bg-white p-4 rounded-lg border">
      <h3 className="font-medium text-gray-900 mb-3">Recent Activity</h3>
      <div className="space-y-2">
        {mockItems.map((item, index) => (
          <div
            key={index}
            className="flex justify-between items-center text-sm"
          >
            <span className="text-gray-600">{item.title}</span>
            <span className="text-gray-400">{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Simple KPICards component
const KPICards: React.FC<{
  metrics: Array<{
    title: string;
    value: string;
    change?: string;
    icon?: string;
  }>;
}> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {metrics.map((metric, index) => (
        <div key={index} className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {metric.title}
              </p>
              <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              {metric.change && (
                <p
                  className={`text-sm ${
                    metric.change.startsWith("+")
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {metric.change}
                </p>
              )}
            </div>
            {metric.icon && (
              <div className="text-2xl">
                {metric.icon === "dollar-sign" && "💰"}
                {metric.icon === "shopping-cart" && "🛒"}
                {metric.icon === "package" && "📦"}
                {metric.icon === "users" && "👥"}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Simple StatusBar component
const StatusBar: React.FC<{
  text?: string;
}> = ({ text = "System Status: All systems operational" }) => {
  return <div className="text-center text-sm text-gray-500 py-2">{text}</div>;
};

// SidebarMenu component to handle sections structure
const SidebarMenu: React.FC<{
  variant?: string;
  collapsible?: boolean;
  sections?: Array<{
    title: string;
    items: Array<{
      label: string;
      route?: string;
      icon?: string;
      id?: string;
    }>;
  }>;
  [key: string]: any;
}> = ({
  sections = [],
  collapsible = true,
  variant = "vertical",
  ...props
}) => {
  // Transform sections into flat items array for Sidebar component
  const items = sections.flatMap((section, sectionIndex) => {
    const sectionItems = section.items.map((item, itemIndex) => ({
      id: item.id || `${sectionIndex}-${itemIndex}`,
      label: item.label,
      href: item.route,
      icon: item.icon
        ? React.createElement("span", { children: item.icon })
        : undefined,
      active: false,
      disabled: false,
    }));

    // Add section header as non-clickable item
    return [
      {
        id: `section-${sectionIndex}`,
        label: section.title,
        disabled: true,
        className:
          "text-xs font-semibold text-gray-500 uppercase tracking-wide px-3 py-2",
      },
      ...sectionItems,
    ];
  });

  return (
    <Sidebar
      items={items}
      collapsible={collapsible}
      variant="default"
      className="h-full"
      {...props}
    />
  );
};

// Placeholder components for dashboard widgets
const RecentActivity: React.FC<{
  title?: string;
  maxItems?: number;
  colspan?: number;
}> = ({ title = "Recent Activity", maxItems = 5 }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
      {title}
    </h3>
    <div className="space-y-3">
      {Array.from({ length: maxItems }, (_, i) => (
        <div
          key={i}
          className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Sample activity item {i + 1}
            </p>
            <p className="text-xs text-gray-400">Just now</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ChartWidget: React.FC<{
  title?: string;
  chartType?: string;
  timeRange?: string;
  colspan?: number;
}> = ({ title = "Chart", chartType = "line", timeRange = "7d" }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
      {title}
    </h3>
    <div className="h-32 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
      <p className="text-gray-500 dark:text-gray-400">
        {chartType.toUpperCase()} Chart ({timeRange})
      </p>
    </div>
  </div>
);

// Component registry mapping component types to React components
const COMPONENT_REGISTRY: Record<string, React.ComponentType<any>> = {
  // Form Controls
  Input: Input,
  SimplePasswordInput: SimplePasswordInput,
  Button: Button,
  Checkbox: Checkbox,

  // Display Components
  Alert: Alert,
  Logo: Logo,

  // Auth Components
  LoginForm: LoginForm,

  // Navigation Components
  LanguageSelector: LanguageSelector,
  ThemeSelector: ThemeSelector,
  Navigation: Navigation,
  MenuTree: MenuTree,

  // Data Components
  MetadataDataTable: MetadataDataTable,

  // Layout Components
  PageHeader: PageHeader,
  RecentItems: RecentItems,
  KPICards: KPICards,
  KPICard: KPICards, // Alias for KPICards
  StatusBar: StatusBar,
  DashboardGrid: DashboardGrid,
  Sidebar: Sidebar,
  SidebarMenu: SidebarMenu, // Custom component for sections structure
  RecentActivity: RecentActivity,
  ChartWidget: ChartWidget,

  // Complex Components
  Form: DynamicForm,

  // Generic UI Components
  Filter: Filter,
  StatsGrid: StatsGrid,
  Wizard: Wizard,
  ItemGrid: ItemGrid,
  Pagination: Pagination,
  Progress: Progress,

  // Domain-specific Components
  RoleTemplateCard: RoleTemplateCard,
  VerticalFilter: VerticalFilter,
  RoleList: RoleList,

  // DataTable alias for role management
  RoleManagementTable: MetadataDataTable,
};

interface DynamicComponentProps {
  type: string;
  props: Record<string, any>;
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
    tenantId?: string;
    // NEW: Metadata-driven properties
    metadataCallbacks?: Record<string, any>;
    pageState?: Record<string, any>;
    setPageState?: (state: Record<string, any>) => void;
    applyStateBindings?: (componentType: string, props: any) => any;
    apiEndpoints?: Record<string, string>;
  };
}

export const DynamicComponent: React.FC<DynamicComponentProps> = ({
  type,
  props,
  onComponentError,
  contextProps = {},
}) => {
  const Component = COMPONENT_REGISTRY[type];

  if (!Component) {
    console.warn(`⚠️ Unknown component type: ${type}`);
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
        <p className="text-yellow-700 text-sm">Unknown component: {type}</p>
      </div>
    );
  }

  try {
    // NEW: Apply state bindings from metadata
    let enhancedProps = contextProps.applyStateBindings
      ? contextProps.applyStateBindings(type, props)
      : { ...props };

    // NEW: Add metadata-driven callbacks
    if (contextProps.metadataCallbacks?.[type]) {
      Object.entries(contextProps.metadataCallbacks[type]).forEach(
        ([eventName, callback]) => {
          enhancedProps[eventName] = callback;
        }
      );
    }

    // ✅ METADATA-FIRST: LoginForm must get callback from metadata (no fallbacks)
    if (type === "LoginForm") {
      console.log("🔧 Setting up LoginForm with callbacks:", {
        hasMetadataCallback: !!contextProps.metadataCallbacks?.onLogin,
        callbackType: contextProps.metadataCallbacks?.onLogin
          ? "metadata"
          : "MISSING",
        metadataCallbackKeys: contextProps.metadataCallbacks
          ? Object.keys(contextProps.metadataCallbacks)
          : [],
      });

      if (!contextProps.metadataCallbacks?.onLogin) {
        console.error(
          "❌ METADATA ERROR: LoginForm requires onLogin callback from metadata! No fallback provided."
        );
        // Return a non-functional component instead of throwing during render
        enhancedProps = {
          ...enhancedProps,
          onLogin: async () => {
            throw new Error(
              "LoginForm: onLogin callback missing from metadata. Check page definition callbacks."
            );
          },
          language: "el",
          app: props.app || "client",
        };
      } else {
        enhancedProps = {
          ...enhancedProps,
          onLogin: contextProps.metadataCallbacks.onLogin, // ✅ METADATA-ONLY
          language: "el",
          app: props.app || "client",
        };
      }
    }

    // LEGACY: Fallback to hardcoded logic for other components not yet in metadata
    if (!contextProps.metadataCallbacks?.[type] && type !== "LoginForm") {
      // Navigation requires logout function
      if (type === "Navigation") {
        enhancedProps = {
          ...enhancedProps,
          onLogout:
            contextProps.onLogout ||
            (() => {
              console.log("🚪 Logout clicked");
              alert("Logout! (Mock implementation)");
            }),
          currentUser: contextProps.currentUser,
        };
      }
    }

    // MetadataDataTable requires listViewDefinition
    if (type === "MetadataDataTable") {
      // If listViewDefinition is not provided, create a default one
      if (!props.listViewDefinition && props.entity) {
        const defaultListViewDefinition = {
          id: `${props.entity}_${props.view || "default"}_view`,
          view_name: props.view || "default",
          display_label: props.title || `${props.entity} List`,
          entity_id: props.entity,
          columns: [
            {
              field: "id",
              label: "ID",
              data_type: "string",
              is_visible: true,
              is_sortable: true,
              is_filterable: false,
              width: 80,
            },
            {
              field: "name",
              label: "Name",
              data_type: "string",
              is_visible: true,
              is_sortable: true,
              is_filterable: true,
              width: 200,
            },
            {
              field: "status",
              label: "Status",
              data_type: "string",
              is_visible: true,
              is_sortable: true,
              is_filterable: true,
              width: 120,
            },
            {
              field: "created_at",
              label: "Created",
              data_type: "datetime",
              is_visible: true,
              is_sortable: true,
              is_filterable: false,
              width: 150,
            },
          ],
          default_page_size: 10,
          max_page_size: 100,
          default_sort_field: "created_at",
          default_sort_order: "DESC",
          filterable_fields: ["name", "status"],
          searchable_fields: ["name"],
          bulk_actions: [],
          row_actions: [],
          toolbar_actions: [],
        };

        enhancedProps = {
          ...props,
          listViewDefinition: defaultListViewDefinition,
          data: [
            {
              id: "1",
              name: "Acme Corporation",
              status: "Active",
              created_at: "2024-01-15",
            },
            {
              id: "2",
              name: "Beta Industries",
              status: "Active",
              created_at: "2024-01-10",
            },
            {
              id: "3",
              name: "Gamma Solutions",
              status: "Inactive",
              created_at: "2024-01-05",
            },
          ],
          total_count: 3,
        };
      }
    }

    return <Component {...enhancedProps} />;
  } catch (error) {
    console.error(`❌ Error rendering component ${type}:`, error);

    // Call error handler if provided
    if (onComponentError) {
      onComponentError(error as Error, type);
    }

    return (
      <div className="bg-red-50 border border-red-200 rounded p-2">
        <p className="text-red-700 text-sm">Error rendering {type}</p>
        {process.env.NODE_ENV === "development" && (
          <pre className="text-xs mt-1 text-red-600">
            {(error as Error).message}
          </pre>
        )}
      </div>
    );
  }
};

// Error boundary for individual components
class ErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    onError?: (error: Error) => void;
    componentType: string;
  },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      `Error in component ${this.props.componentType}:`,
      error,
      errorInfo
    );

    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded p-2 text-red-800 text-sm">
          Component error in {this.props.componentType}:{" "}
          {this.state.error?.message}
        </div>
      );
    }

    return this.props.children;
  }
}

export default DynamicComponent;
