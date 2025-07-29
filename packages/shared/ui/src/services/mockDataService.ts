/**
 * Mock Data Service - Complete Metadata Platform Testing
 *
 * REFACTORED: Now delegates to specialized services for better maintainability
 *
 * This service now acts as a facade/coordinator for the specialized services:
 * - MockAuthService: Authentication and user management
 * - MockPageService: Page definitions and layouts
 * - MockEntityService: Entity and field definitions (coming next)
 * - MockTranslationService: i18n translations (coming next)
 * - MockThemeService: Theme management (coming next)
 */

// Import specialized services
import MockAuthService, { type User } from "./auth/MockAuthService";
import MockPageService, {
  type PageDefinition,
  type LayoutDefinition,
} from "./metadata/MockPageService";

// Re-export types for backward compatibility
export type { User, PageDefinition, LayoutDefinition };

interface EntityDefinition {
  id: string;
  entity_name: string;
  display_label: string;
  plural_label: string;
  description?: string;
  icon?: string;
  color?: string;
  vertical?: string;
  vertical_pack_id?: string;
  is_system_entity: boolean;
  supports_attachments: boolean;
  supports_comments: boolean;
  supports_workflows: boolean;
  api_name: string;
  enable_api: boolean;
  tenant_id?: string;
  created_at: string;
  updated_at: string;
}

interface FieldDefinition {
  id: string;
  entity_id: string;
  field_name: string;
  label_key: string;
  data_type: string;
  is_required: boolean;
  is_system_field: boolean;
  sort_order: number;
  is_searchable: boolean;
  is_sortable: boolean;
  is_filterable: boolean;
  help_text?: string;
  placeholder?: string;
  validation_rules?: any;
  picklist_name?: string;
  default_value?: any;
}

interface ListViewDefinition {
  id: string;
  view_name: string;
  display_label: string;
  description?: string;
  entity_id: string;
  columns: any[];
  default_sort_field?: string;
  default_sort_order: string;
  default_page_size: number;
  quick_filters?: any[];
  advanced_filters?: any;
  search_enabled: boolean;
  search_fields?: string[];
  global_search: boolean;
  pagination_enabled: boolean;
  page_size_options: number[];
  show_total_count: boolean;
  export_enabled: boolean;
  export_formats: string[];
  bulk_actions?: any[];
  row_actions?: any[];
  toolbar_actions?: any[];
  show_row_numbers: boolean;
  striped_rows: boolean;
  access_roles: string[];
  is_public: boolean;
}

interface ComponentDefinition {
  component_id: string;
  name: string;
  type: string;
  props_schema: any;
  module: string;
  icon?: string;
  category: string;
  description?: string;
  version: string;
  is_system_component: boolean;
  supports_children: boolean;
  default_props?: any;
  style_schema?: any;
  event_handlers?: string[];
  documentation_url?: string;
  recommended_for?: string;
}

// User and LayoutDefinition types now imported from specialized services

interface Translation {
  locale: string;
  key: string;
  text: string;
  namespace?: string;
  context?: string;
}

interface Theme {
  theme_id: string;
  name: string;
  description?: string;
  parent_theme_id?: string;
  is_system_theme: boolean;
  is_active: boolean;
  is_default: boolean;
  properties: Record<string, string>;
  tenant_id?: string;
}

// Mock Data Storage
class MockDataStore {
  private pages: Record<string, PageDefinition> = {};
  private layouts: Record<string, LayoutDefinition> = {};
  private entities: Record<string, EntityDefinition> = {};
  private fields: Record<string, FieldDefinition[]> = {};
  private listViews: Record<string, ListViewDefinition> = {};
  private components: Record<string, ComponentDefinition> = {};
  private users: User[] = [];
  private passwords: Record<string, string> = {};
  private data: Record<string, Record<string, any>[]> = {};
  private translations: Record<string, Translation[]> = {};
  private themes: Record<string, Theme> = {};

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Initialize layouts
    this.initializeLayouts();

    // Initialize translations
    this.initializeTranslations();

    // Initialize themes
    this.initializeThemes();

    // Initialize pages (updated to use layouts)
    this.initializePages();

    // Initialize other data...
    this.initializeEntities();
    this.initializeFields();
    this.initializeListViews();
    this.initializeComponents();
    this.initializeUsers();
    this.initializeBusinessData();
  }

  // Layout Management
  private initializeLayouts() {
    this.layouts = {
      "centered-auth-layout": {
        layout_id: "centered-auth-layout",
        name: "centered-auth-layout",
        display_name: "Centered Authentication Layout",
        description: "Centered layout for login and authentication pages",
        category: "auth",
        sections_json: {
          header: {
            className: "text-center mb-8",
            maxComponents: 1,
          },
          main: {
            className: "w-full max-w-md",
            maxComponents: 1,
          },
          footer: {
            className:
              "flex justify-between items-center mt-6 pt-4 border-t border-gray-200",
            maxComponents: 10,
          },
        },
        css_classes_json: {
          header: "text-center mb-8",
          main: "w-full max-w-md",
          footer:
            "flex justify-between items-center mt-6 pt-4 border-t border-gray-200",
        },
        container_classes:
          "min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex flex-col items-center justify-center p-4",
        is_responsive: true,
        supports_theming: true,
        is_system_layout: true,
        tenant_id: undefined,
      },
      "dashboard-layout": {
        layout_id: "dashboard-layout",
        name: "dashboard-layout",
        display_name: "Standard Dashboard Layout",
        description:
          "Standard layout for dashboard pages with header, sidebar, main content",
        category: "dashboard",
        sections_json: {
          header: {
            className: "bg-white shadow-sm border-b border-gray-200 h-16",
            maxComponents: 1,
          },
          sidebar: {
            className:
              "bg-white shadow-sm border-r border-gray-200 w-64 min-h-screen",
            maxComponents: 5,
          },
          main: {
            className: "flex-1 bg-gray-50 p-8",
            maxComponents: 10,
          },
          footer: {
            className: "bg-white border-t border-gray-200 p-4",
            maxComponents: 3,
          },
        },
        css_classes_json: {
          header: "bg-white shadow-sm border-b border-gray-200 h-16",
          sidebar:
            "bg-white shadow-sm border-r border-gray-200 w-64 min-h-screen",
          main: "flex-1 bg-gray-50 p-8",
          footer: "bg-white border-t border-gray-200 p-4",
        },
        container_classes: "min-h-screen bg-gray-50 flex flex-col",
        is_responsive: true,
        supports_theming: true,
        is_system_layout: true,
        tenant_id: undefined,
      },
      // NEW: Form Layout for Add/Edit pages
      "form-layout": {
        layout_id: "form-layout",
        name: "form-layout",
        display_name: "Standard Form Layout",
        description:
          "Layout for create/edit forms with header, main content, and sidebar help",
        category: "form",
        sections_json: {
          header: {
            className: "bg-white border-b border-gray-200 px-6 py-4",
            maxComponents: 1,
          },
          main: {
            className: "flex-1 bg-white p-6",
            maxComponents: 1,
          },
          sidebar: {
            className: "w-80 bg-gray-50 p-6 border-l border-gray-200",
            maxComponents: 3,
          },
        },
        css_classes_json: {
          header: "bg-white border-b border-gray-200 px-6 py-4",
          main: "flex-1 bg-white p-6",
          sidebar: "w-80 bg-gray-50 p-6 border-l border-gray-200",
        },
        container_classes: "min-h-screen bg-gray-50 flex flex-col",
        is_responsive: true,
        supports_theming: true,
        is_system_layout: true,
        tenant_id: undefined,
      },
    };
  }

  // Translation Management
  private initializeTranslations() {
    const englishTranslations: Translation[] = [
      { locale: "en", key: "login.title", text: "Sign In", namespace: "auth" },
      { locale: "en", key: "login.email", text: "Email", namespace: "auth" },
      {
        locale: "en",
        key: "login.password",
        text: "Password",
        namespace: "auth",
      },
      { locale: "en", key: "login.submit", text: "Sign In", namespace: "auth" },
      {
        locale: "en",
        key: "login.forgot_password",
        text: "",
        namespace: "auth",
      },
      {
        locale: "en",
        key: "dashboard.title",
        text: "Dashboard",
        namespace: "app",
      },
      {
        locale: "en",
        key: "dashboard.welcome",
        text: "Welcome back",
        namespace: "app",
      },
      {
        locale: "en",
        key: "common.loading",
        text: "Loading...",
        namespace: "common",
      },
      { locale: "en", key: "common.error", text: "Error", namespace: "common" },
      { locale: "en", key: "common.save", text: "Save", namespace: "common" },
      {
        locale: "en",
        key: "common.cancel",
        text: "Cancel",
        namespace: "common",
      },
      {
        locale: "en",
        key: "error.page_load_failed",
        text: "Failed to load page",
        namespace: "error",
      },
    ];

    const greekTranslations: Translation[] = [
      { locale: "el", key: "login.title", text: "Σύνδεση", namespace: "auth" },
      { locale: "el", key: "login.email", text: "Email", namespace: "auth" },
      {
        locale: "el",
        key: "login.password",
        text: "Κωδικός",
        namespace: "auth",
      },
      { locale: "el", key: "login.submit", text: "Σύνδεση", namespace: "auth" },
      {
        locale: "el",
        key: "login.forgot_password",
        text: "Ξεχάσατε τον κωδικό σας;",
        namespace: "auth",
      },
      {
        locale: "el",
        key: "dashboard.title",
        text: "Πίνακας Ελέγχου",
        namespace: "app",
      },
      {
        locale: "el",
        key: "dashboard.welcome",
        text: "Καλώς ήρθατε",
        namespace: "app",
      },
      {
        locale: "el",
        key: "common.loading",
        text: "Φόρτωση...",
        namespace: "common",
      },
      {
        locale: "el",
        key: "common.error",
        text: "Σφάλμα",
        namespace: "common",
      },
      {
        locale: "el",
        key: "common.save",
        text: "Αποθήκευση",
        namespace: "common",
      },
      {
        locale: "el",
        key: "common.cancel",
        text: "Ακύρωση",
        namespace: "common",
      },
      {
        locale: "el",
        key: "error.page_load_failed",
        text: "Αποτυχία φόρτωσης σελίδας",
        namespace: "error",
      },
    ];

    this.translations = {
      en: englishTranslations,
      el: greekTranslations,
    };
  }

  // Theme Management
  private initializeThemes() {
    this.themes = {
      "maritime-theme": {
        theme_id: "maritime-theme",
        name: "maritime-theme",
        description: "Maritime business theme with blue ocean colors",
        is_system_theme: true,
        is_active: true,
        is_default: true,
        properties: {
          "--primary-color": "203 100% 45%",
          "--primary-foreground": "210 40% 98%",
          "--secondary-color": "203 15% 90%",
          "--secondary-foreground": "222.2 84% 4.9%",
          "--accent-color": "43 100% 50%",
          "--accent-foreground": "222.2 84% 4.9%",
          "--background": "0 0% 100%",
          "--foreground": "222.2 84% 4.9%",
          "--card": "0 0% 100%",
          "--card-foreground": "222.2 84% 4.9%",
          "--border": "214.3 31.8% 91.4%",
          "--input": "214.3 31.8% 91.4%",
          "--ring": "203 100% 45%",
          "--radius": "0.5rem",
        },
        tenant_id: undefined,
      },
      // Add "light" theme as alias for maritime-theme for compatibility
      light: {
        theme_id: "light",
        name: "light",
        description: "Light theme (Maritime style)",
        is_system_theme: true,
        is_active: true,
        is_default: false,
        properties: {
          "--primary-color": "203 100% 45%",
          "--primary-foreground": "210 40% 98%",
          "--secondary-color": "203 15% 90%",
          "--secondary-foreground": "222.2 84% 4.9%",
          "--accent-color": "43 100% 50%",
          "--accent-foreground": "222.2 84% 4.9%",
          "--background": "0 0% 100%",
          "--foreground": "222.2 84% 4.9%",
          "--card": "0 0% 100%",
          "--card-foreground": "222.2 84% 4.9%",
          "--border": "214.3 31.8% 91.4%",
          "--input": "214.3 31.8% 91.4%",
          "--ring": "203 100% 45%",
          "--radius": "0.5rem",
        },
        tenant_id: undefined,
      },
      "dark-theme": {
        theme_id: "dark-theme",
        name: "dark-theme",
        description: "Dark theme for night mode",
        is_system_theme: true,
        is_active: true,
        is_default: false,
        properties: {
          "--primary-color": "217.2 91.2% 59.8%",
          "--primary-foreground": "222.2 84% 4.9%",
          "--secondary-color": "217.2 32.6% 17.5%",
          "--secondary-foreground": "210 40% 98%",
          "--accent-color": "217.2 32.6% 17.5%",
          "--accent-foreground": "210 40% 98%",
          "--background": "222.2 84% 4.9%",
          "--foreground": "210 40% 98%",
          "--card": "222.2 84% 4.9%",
          "--card-foreground": "210 40% 98%",
          "--border": "217.2 32.6% 17.5%",
          "--input": "217.2 32.6% 17.5%",
          "--ring": "224.3 76.3% 94.1%",
          "--radius": "0.5rem",
        },
        tenant_id: undefined,
      },
    };
  }

  // Mock page definitions
  private initializePages() {
    this.pages = {
      "login-page-001": {
        page_id: "login-page-001",
        page_name: "login_page",
        route: "/login",
        title: "Axiologic",
        description: "Maritime Business Platform - Metadata-Driven Login",
        page_type: "authentication",
        layout_id: "centered-auth-layout",
        sections_data_json: {
          header: [
            {
              type: "Logo",
              props: { size: "md" },
            },
          ],
          main: [
            {
              type: "LoginForm",
              props: { app: "client" },
            },
          ],
          footer: [
            {
              type: "LanguageSelector",
              props: { size: "sm" },
            },
            {
              type: "ThemeSelector",
              props: { size: "sm" },
            },
          ],
        },
        components: [], // Legacy - keeping for backward compatibility
        access_roles: [],
        is_public: true,
        metadata_json: {
          background: "gradient",
          layout: "centered",
          theme: "maritime",
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      "dashboard-page-001": {
        page_id: "dashboard-page-001",
        page_name: "dashboard",
        route: "/dashboard",
        title: "Maritime Business Dashboard",
        description: "Main application dashboard with business widgets",
        page_type: "dashboard",
        layout_id: "dashboard-layout",
        sections_data_json: {
          header: [
            {
              type: "Navigation",
              props: {
                variant: "horizontal",
                items: [
                  {
                    id: "dashboard",
                    label: { en: "Dashboard", el: "Πίνακας Ελέγχου" },
                    href: "/dashboard",
                    active: true,
                  },
                  {
                    id: "customers",
                    label: { en: "Customers", el: "Πελάτες" },
                    href: "/customers",
                  },
                  {
                    id: "projects",
                    label: { en: "Projects", el: "Έργα" },
                    href: "/projects",
                  },
                  {
                    id: "reports",
                    label: { en: "Reports", el: "Αναφορές" },
                    href: "/reports",
                  },
                ],
                showLanguageSelector: true,
              },
            },
          ],
          sidebar: [
            {
              type: "MenuTree",
              props: {
                items: [
                  {
                    label: "Dashboard",
                    route: "/dashboard",
                    icon: "dashboard",
                    active: true,
                  },
                  {
                    label: "Customers",
                    route: "/customers",
                    icon: "users",
                  },
                  {
                    label: "Projects",
                    route: "/projects",
                    icon: "folder",
                  },
                  {
                    label: "Invoices",
                    route: "/invoices",
                    icon: "receipt",
                  },
                  {
                    label: "Reports",
                    route: "/reports",
                    icon: "chart",
                  },
                ],
              },
            },
            {
              type: "RecentItems",
              props: { limit: 5 },
            },
          ],
          main: [
            {
              type: "KPICards",
              props: {
                metrics: [
                  {
                    title: "Total Customers",
                    value: "1,247",
                    change: "+12%",
                    icon: "users",
                  },
                  {
                    title: "Monthly Revenue",
                    value: "€85,430",
                    change: "+8.5%",
                    icon: "revenue",
                  },
                  {
                    title: "Active Projects",
                    value: "23",
                    change: "+3",
                    icon: "projects",
                  },
                  {
                    title: "Completion Rate",
                    value: "94.2%",
                    change: "+2.1%",
                    icon: "chart",
                  },
                ],
              },
            },
            {
              type: "MetadataDataTable",
              props: {
                entity: "customers",
                view: "all_customers",
                title: "Customer Overview",
              },
            },
          ],
          footer: [
            {
              type: "StatusBar",
              props: {},
            },
          ],
        },
        components: [], // Legacy - keeping for backward compatibility
        initial_state: {
          "customers.filters": { status: "active" },
          "dashboard.selectedKPIs": ["customers", "revenue"],
        },
        state_bindings: {
          "MetadataDataTable.filters": "customers.filters",
          "KPICards.selected": "dashboard.selectedKPIs",
        },
        api_endpoints: {
          customers: "/api/data/customers",
          kpis: "/api/data/kpis",
        },
        real_time_updates: true,
        cache_strategy: "stale-while-revalidate",
        websocket_events: ["customer.created", "customer.updated"],
        access_roles: ["admin", "manager", "user"],
        is_public: false,
        metadata_json: {
          theme: "maritime",
          features: ["kpis", "data_tables", "real_time"],
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      // NEW: Add Customer Page - Complete Metadata Example
      "add-customer-page-001": {
        page_id: "add-customer-page-001",
        page_name: "add_customer",
        route: "/customers/add",
        title: "Add New Customer",
        description:
          "Create a new customer record with validation and API integration",
        page_type: "form",
        layout_id: "form-layout",
        sections_data_json: {
          header: [
            {
              type: "PageHeader",
              props: {
                title: "Add New Customer",
                subtitle: "Create a new customer record",
                showBackButton: true,
                backUrl: "/customers",
              },
            },
          ],
          main: [
            {
              type: "DynamicForm",
              props: {
                entity: "customer",
                formType: "create",
                fields: [
                  {
                    name: "company_name",
                    type: "text",
                    label: "Company Name",
                    required: true,
                    validation: { minLength: 2, maxLength: 100 },
                  },
                  {
                    name: "contact_person",
                    type: "text",
                    label: "Contact Person",
                    required: true,
                  },
                  {
                    name: "email",
                    type: "email",
                    label: "Email Address",
                    required: true,
                    validation: { email: true },
                  },
                  {
                    name: "phone",
                    type: "phone",
                    label: "Phone Number",
                    component: "GreekPhoneInput",
                  },
                  {
                    name: "afm",
                    type: "text",
                    label: "ΑΦΜ (Tax ID)",
                    component: "AFMInput",
                    required: true,
                  },
                  {
                    name: "address",
                    type: "address",
                    label: "Address",
                    component: "GreekAddressInput",
                  },
                  {
                    name: "customer_type",
                    type: "select",
                    label: "Customer Type",
                    options: [
                      { value: "individual", label: "Individual" },
                      { value: "business", label: "Business" },
                      { value: "enterprise", label: "Enterprise" },
                    ],
                    required: true,
                  },
                ],
                submitButtonText: "Create Customer",
                cancelButtonText: "Cancel",
              },
            },
          ],
          sidebar: [
            {
              type: "FormHelp",
              props: {
                title: "Customer Information",
                helpItems: [
                  {
                    title: "ΑΦΜ Validation",
                    description:
                      "Greek tax identification number will be validated automatically",
                  },
                  {
                    title: "Address Format",
                    description: "Use Greek postal codes and region selection",
                  },
                ],
              },
            },
          ],
        },

        // METADATA-DRIVEN STATE MANAGEMENT
        initial_state: {
          "form.data": {
            company_name: "",
            contact_person: "",
            email: "",
            phone: "",
            afm: "",
            address: {},
            customer_type: "business",
          },
          "form.errors": {},
          "form.loading": false,
          "form.touched": {},
          "validation.afm": null,
          "validation.email": null,
        },

        // STATE BINDINGS - How component props connect to page state
        state_bindings: {
          "DynamicForm.formData": "form.data",
          "DynamicForm.errors": "form.errors",
          "DynamicForm.loading": "form.loading",
          "DynamicForm.touched": "form.touched",
          "AFMInput.validation": "validation.afm",
        },

        // API ENDPOINTS
        api_endpoints: {
          create_customer: "/api/customers",
          validate_afm: "/api/validation/afm",
          validate_email: "/api/validation/email",
          get_regions: "/api/geography/regions",
        },

        // METADATA-DRIVEN CALLBACKS
        callbacks: {
          DynamicForm: {
            onSubmit: {
              event: "onSubmit",
              action: "api_call",
              target: "create_customer",
              params: { method: "POST" },
            },
            onCancel: {
              event: "onCancel",
              action: "navigate",
              target: "/customers",
            },
            onChange: {
              event: "onChange",
              action: "set_state",
              target: "form.data",
            },
            onValidationError: {
              event: "onValidationError",
              action: "set_state",
              target: "form.errors",
            },
          },
          AFMInput: {
            onValidate: {
              event: "onValidate",
              action: "api_call",
              target: "validate_afm",
            },
            onValidationResult: {
              event: "onValidationResult",
              action: "set_state",
              target: "validation.afm",
            },
          },
          PageHeader: {
            onBack: {
              event: "onBack",
              action: "navigate",
              target: "/customers",
            },
          },
        },

        // REAL-TIME AND ADVANCED FEATURES
        real_time_updates: false,
        cache_strategy: "no-cache",
        websocket_events: [],
        access_roles: ["admin", "manager"],
        is_public: false,
        metadata_json: {
          theme: "maritime",
          layout: "form",
          validation: "strict",
        },
        components: [], // Legacy support
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
  }

  // Mock entity definitions
  private initializeEntities() {
    this.entities = {
      "contact-entity-001": {
        id: "contact-entity-001",
        entity_name: "Contact",
        display_label: "Contact",
        plural_label: "Contacts",
        description: "Business and personal contacts",
        icon: "users",
        color: "#0066CC",
        vertical: "ecommerce",
        vertical_pack_id: "ecommerce-pack-v1",
        is_system_entity: false,
        supports_attachments: true,
        supports_comments: true,
        supports_workflows: true,
        api_name: "Contact",
        enable_api: true,
        tenant_id: "dev-tenant-001",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
  }

  // Mock field definitions
  private initializeFields() {
    this.fields = {
      "contact-entity-001": [
        {
          id: "contact-field-001",
          entity_id: "contact-entity-001",
          field_name: "full_name",
          label_key: "Contact.FullName.Label",
          data_type: "string",
          is_required: true,
          is_system_field: false,
          sort_order: 1,
          is_searchable: true,
          is_sortable: true,
          is_filterable: true,
          help_text: "Contact's full name",
          placeholder: "Enter full name",
        },
        {
          id: "contact-field-002",
          entity_id: "contact-entity-001",
          field_name: "email",
          label_key: "Contact.Email.Label",
          data_type: "email",
          is_required: true,
          is_system_field: false,
          sort_order: 2,
          is_searchable: true,
          is_sortable: true,
          is_filterable: true,
          help_text: "Contact's email address",
          placeholder: "Enter email address",
        },
        {
          id: "contact-field-003",
          entity_id: "contact-entity-001",
          field_name: "company_name",
          label_key: "Contact.Company.Label",
          data_type: "string",
          is_required: false,
          is_system_field: false,
          sort_order: 3,
          is_searchable: true,
          is_sortable: true,
          is_filterable: true,
          help_text: "Company name",
          placeholder: "Enter company name",
        },
        {
          id: "contact-field-004",
          entity_id: "contact-entity-001",
          field_name: "status",
          label_key: "Contact.Status.Label",
          data_type: "picklist",
          is_required: true,
          is_system_field: false,
          sort_order: 4,
          is_searchable: false,
          is_sortable: true,
          is_filterable: true,
          help_text: "Contact status",
          picklist_name: "Contact.Status",
        },
        {
          id: "contact-field-005",
          entity_id: "contact-entity-001",
          field_name: "created_at",
          label_key: "Contact.CreatedAt.Label",
          data_type: "datetime",
          is_required: true,
          is_system_field: true,
          sort_order: 5,
          is_searchable: false,
          is_sortable: true,
          is_filterable: true,
          help_text: "Date contact was created",
        },
        {
          id: "contact-field-006",
          entity_id: "contact-entity-001",
          field_name: "annual_revenue",
          label_key: "Contact.Revenue.Label",
          data_type: "currency",
          is_required: false,
          is_system_field: false,
          sort_order: 6,
          is_searchable: false,
          is_sortable: true,
          is_filterable: true,
          help_text: "Annual revenue",
          placeholder: "Enter annual revenue",
        },
      ],
    };
  }

  // Mock list view definitions
  private initializeListViews() {
    this.listViews = {
      "contact-listview-001": {
        id: "contact-listview-001",
        view_name: "all_contacts",
        display_label: "All Contacts",
        description: "Complete list of all contacts with advanced filtering",
        entity_id: "contact-entity-001",
        columns: [
          {
            field: "full_name",
            label: "Full Name",
            data_type: "string",
            sortable: true,
            filterable: true,
            searchable: true,
            width: 200,
            align: "left",
          },
          {
            field: "email",
            label: "Email",
            data_type: "email",
            sortable: true,
            filterable: true,
            searchable: true,
            width: 250,
            align: "left",
          },
          {
            field: "company_name",
            label: "Company",
            data_type: "string",
            sortable: true,
            filterable: true,
            searchable: true,
            width: 180,
            align: "left",
          },
          {
            field: "status",
            label: "Status",
            data_type: "picklist",
            sortable: true,
            filterable: true,
            searchable: false,
            width: 120,
            align: "center",
            render_component: "StatusBadge",
          },
          {
            field: "created_at",
            label: "Created",
            data_type: "datetime",
            sortable: true,
            filterable: true,
            searchable: false,
            width: 150,
            align: "center",
            format: "MMM DD, YYYY",
          },
          {
            field: "annual_revenue",
            label: "Revenue",
            data_type: "currency",
            sortable: true,
            filterable: true,
            searchable: false,
            width: 130,
            align: "right",
          },
        ],
        default_sort_field: "created_at",
        default_sort_order: "DESC",
        default_page_size: 25,
        quick_filters: [
          {
            field: "status",
            label: "Active",
            value: "active",
            operator: "equals",
            icon: "check-circle",
          },
          {
            field: "status",
            label: "Prospects",
            value: "prospect",
            operator: "equals",
            icon: "eye",
          },
          {
            field: "created_at",
            label: "This Month",
            value: "2024-01-01",
            operator: "gte",
            icon: "calendar",
          },
        ],
        advanced_filters: {
          enabled: true,
          operators: [
            "equals",
            "not_equals",
            "contains",
            "not_contains",
            "starts_with",
            "ends_with",
            "is_empty",
            "is_not_empty",
            "greater_than",
            "less_than",
            "between",
            "in",
            "not_in",
          ],
          date_ranges: [
            "today",
            "yesterday",
            "this_week",
            "last_week",
            "this_month",
            "last_month",
            "this_year",
          ],
          numeric_ranges: true,
        },
        search_enabled: true,
        search_fields: ["full_name", "email", "company_name"],
        global_search: true,
        pagination_enabled: true,
        page_size_options: [10, 25, 50, 100, 200],
        show_total_count: true,
        export_enabled: true,
        export_formats: ["csv", "excel", "pdf"],
        bulk_actions: [
          {
            id: "bulk_delete",
            label: "Delete Selected",
            icon: "trash",
            confirm_message:
              "Are you sure you want to delete the selected contacts?",
            requires_selection: true,
          },
          {
            id: "bulk_email",
            label: "Send Email",
            icon: "mail",
            requires_selection: true,
          },
        ],
        row_actions: [
          {
            id: "view_contact",
            label: "View",
            icon: "eye",
            route: "/contacts/{id}",
          },
          {
            id: "edit_contact",
            label: "Edit",
            icon: "edit",
            route: "/contacts/{id}/edit",
          },
          {
            id: "delete_contact",
            label: "Delete",
            icon: "trash",
            action: "delete",
            confirm_message: "Are you sure you want to delete this contact?",
          },
        ],
        toolbar_actions: [
          {
            id: "new_contact",
            label: "New Contact",
            icon: "plus",
            route: "/contacts/new",
            button_type: "primary",
          },
          {
            id: "import_contacts",
            label: "Import",
            icon: "upload",
            action: "import",
            button_type: "outline",
          },
        ],
        show_row_numbers: false,
        striped_rows: true,
        access_roles: ["admin", "sales", "marketing"],
        is_public: false,
      },
    };
  }

  // Mock component definitions
  private initializeComponents() {
    this.components = {
      "input-component-001": {
        component_id: "input-component-001",
        name: "Input",
        type: "fieldControl",
        props_schema: {
          type: "object",
          properties: {
            placeholder: { type: "string" },
            required: { type: "boolean" },
            disabled: { type: "boolean" },
            maxLength: { type: "number" },
          },
        },
        module: "core",
        icon: "type",
        category: "Form",
        description: "Basic text input field",
        version: "1.0.0",
        is_system_component: true,
        supports_children: false,
        default_props: {
          placeholder: "Enter text...",
          required: false,
          disabled: false,
        },
        style_schema: {
          type: "object",
          properties: {
            width: { type: "string" },
            variant: { type: "string", enum: ["default", "outline", "ghost"] },
          },
        },
        event_handlers: ["onChange", "onBlur", "onFocus"],
        documentation_url: "https://docs.axiologic.com/components/input",
      },
      "select-component-001": {
        component_id: "select-component-001",
        name: "Select",
        type: "fieldControl",
        props_schema: {
          type: "object",
          properties: {
            options: { type: "array" },
            placeholder: { type: "string" },
            multiple: { type: "boolean" },
          },
        },
        module: "core",
        icon: "chevron-down",
        category: "Form",
        description: "Dropdown selection field",
        version: "1.0.0",
        is_system_component: true,
        supports_children: false,
        default_props: {
          placeholder: "Select option...",
          multiple: false,
        },
        event_handlers: ["onChange", "onOpen", "onClose"],
      },
      "datatable-component-001": {
        component_id: "datatable-component-001",
        name: "MetadataDataTable",
        type: "dataDisplay",
        props_schema: {
          type: "object",
          properties: {
            entityName: { type: "string" },
            viewName: { type: "string" },
            height: { type: "number" },
          },
        },
        module: "core",
        icon: "table",
        category: "Data",
        description:
          "Metadata-driven data table with pagination, filtering, and sorting",
        version: "1.0.0",
        is_system_component: true,
        supports_children: false,
        event_handlers: ["onRowClick", "onFilter", "onSort", "onPageChange"],
      },
    };
  }

  // Mock contact data for the data table
  private initializeBusinessData() {
    this.data = {
      Contact: [
        {
          id: "contact-001",
          full_name: "John Smith",
          email: "john.smith@example.com",
          company_name: "Acme Corp",
          status: "active",
          annual_revenue: 50000,
          created_at: "2024-01-15T10:30:00Z",
        },
        {
          id: "contact-002",
          full_name: "Maria Rodriguez",
          email: "maria.r@techstart.io",
          company_name: "TechStart",
          status: "prospect",
          annual_revenue: 25000,
          created_at: "2024-01-18T14:20:00Z",
        },
        {
          id: "contact-003",
          full_name: "David Chen",
          email: "d.chen@globaltech.com",
          company_name: "Global Tech Solutions",
          status: "active",
          annual_revenue: 150000,
          created_at: "2024-01-20T09:15:00Z",
        },
        {
          id: "contact-004",
          full_name: "Sarah Johnson",
          email: "sarah.j@innovate.co",
          company_name: "Innovate Co",
          status: "inactive",
          annual_revenue: 75000,
          created_at: "2024-01-22T16:45:00Z",
        },
        {
          id: "contact-005",
          full_name: "Ahmed Hassan",
          email: "ahmed@futureflow.net",
          company_name: "Future Flow",
          status: "prospect",
          annual_revenue: 35000,
          created_at: "2024-01-25T11:30:00Z",
        },
      ],
    };
  }

  // User Management (Legacy - will be removed when fully migrated to MockAuthService)
  private initializeUsers() {
    this.users = [
      {
        user_id: "admin-user-001",
        email: "admin@dev.local",
        first_name: "Admin",
        last_name: "User",
        is_active: true,
        roles: ["admin", "manager"],
        tenant_id: "dev-tenant-001",
        created_at: new Date().toISOString(),
        email_verified: true,
        phone_verified: false,
        two_factor_enabled: false,
        passkey_enabled: false,
        login_attempts: 0,
      },
      {
        user_id: "demo-user-001",
        email: "demo@dev.local",
        first_name: "Demo",
        last_name: "User",
        is_active: true,
        roles: ["user"],
        tenant_id: "dev-tenant-001",
        created_at: new Date().toISOString(),
        email_verified: true,
        phone_verified: false,
        two_factor_enabled: false,
        passkey_enabled: false,
        login_attempts: 0,
      },
    ];

    this.passwords = {
      "admin@dev.local": "",
      "demo@dev.local": "demo123!",
    };
  }

  // Getters
  getUsers() {
    return this.users;
  }
  getPasswords() {
    return this.passwords;
  }
  getPages() {
    return Object.values(this.pages);
  }
  getEntities() {
    return Object.values(this.entities);
  }
  getFields() {
    return Object.values(this.fields).flat();
  }
  getListViews() {
    return Object.values(this.listViews);
  }
  getComponents() {
    return Object.values(this.components);
  }
  getContactData() {
    return this.data["Contact"];
  }
  getLayouts() {
    return Object.values(this.layouts);
  }
  getTranslations() {
    return Object.values(this.translations);
  }
  getThemes() {
    return Object.values(this.themes);
  }
}

// Singleton mock data store
const mockDataStore = new MockDataStore();

// Re-export MockPageService as MockPageEngine for backward compatibility
export { MockPageService as MockPageEngine } from "./metadata/MockPageService";

// Mock Data Engine
export class MockDataEngine {
  static async getEntityDefinition(
    entityName: string,
    tenantId?: string
  ): Promise<EntityDefinition | null> {
    console.log(
      `🔢 MockDataEngine.getEntityDefinition(${entityName}, ${tenantId})`
    );

    await new Promise((resolve) => setTimeout(resolve, 80));

    const entities = mockDataStore.getEntities();
    const entity = entities.find((e) => e.entity_name === entityName);

    if (entity) {
      console.log(`✅ Found entity: ${entity.display_label} (${entity.id})`);
    } else {
      console.log(`❌ Entity not found: ${entityName}`);
    }

    return entity || null;
  }

  static async getEntityFields(
    entityName: string,
    tenantId?: string
  ): Promise<FieldDefinition[]> {
    console.log(
      `🔢 MockDataEngine.getEntityFields(${entityName}, ${tenantId})`
    );

    await new Promise((resolve) => setTimeout(resolve, 120));

    const entity = await this.getEntityDefinition(entityName, tenantId);
    if (!entity) return [];

    const fields = mockDataStore
      .getFields()
      .filter((f) => f.entity_id === entity.id);

    console.log(`✅ Found ${fields.length} fields for ${entityName}`);
    return fields;
  }

  static async getListViewDefinition(
    entityName: string,
    viewName: string,
    tenantId?: string
  ): Promise<ListViewDefinition | null> {
    console.log(
      `�� MockDataEngine.getListViewDefinition(${entityName}, ${viewName}, ${tenantId})`
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    const entity = await this.getEntityDefinition(entityName, tenantId);
    if (!entity) return null;

    const listViews = mockDataStore.getListViews();
    const listView = listViews.find(
      (lv) => lv.entity_id === entity.id && lv.view_name === viewName
    );

    if (listView) {
      console.log(
        `✅ Found list view: ${listView.display_label} (${listView.id})`
      );
    } else {
      console.log(`❌ List view not found: ${viewName} for ${entityName}`);
    }

    return listView || null;
  }

  static async getEntityData(
    entityName: string,
    tenantId?: string,
    viewName?: string,
    page: number = 1,
    pageSize: number = 25,
    sortField?: string,
    sortOrder: string = "ASC",
    search?: string,
    searchFields?: string[],
    filters?: Record<string, any>
  ): Promise<any> {
    console.log(
      `🔢 MockDataEngine.getEntityData(${entityName}, page=${page}, pageSize=${pageSize})`
    );

    await new Promise((resolve) => setTimeout(resolve, 200));

    let data = mockDataStore.getContactData(); // For now, just return contact data

    // Apply search filter
    if (search && searchFields) {
      data = data.filter((item: Record<string, any>) =>
        searchFields.some((field) =>
          item[field]?.toString().toLowerCase().includes(search.toLowerCase())
        )
      );
    }

    // Apply filters
    if (filters) {
      data = data.filter((item: Record<string, any>) => {
        return Object.entries(filters).every(([field, value]) => {
          if (value === null || value === undefined || value === "")
            return true;
          return item[field] === value;
        });
      });
    }

    // Apply sorting
    if (sortField) {
      data.sort((a: Record<string, any>, b: Record<string, any>) => {
        const aVal = a[sortField];
        const bVal = b[sortField];

        if (sortOrder === "DESC") {
          return bVal > aVal ? 1 : -1;
        } else {
          return aVal > bVal ? 1 : -1;
        }
      });
    }

    // Apply pagination
    const totalCount = data.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = data.slice(startIndex, endIndex);

    const result = {
      data: paginatedData,
      total_count: totalCount,
      page,
      page_size: pageSize,
      total_pages: totalPages,
      has_next: page < totalPages,
      has_previous: page > 1,
    };

    console.log(
      `✅ Returning ${paginatedData.length} of ${totalCount} total records`
    );
    return result;
  }
}

// Mock Component Engine
export class MockComponentEngine {
  static async getComponentDefinition(
    componentName: string,
    module?: string
  ): Promise<ComponentDefinition | null> {
    console.log(
      `🧩 MockComponentEngine.getComponentDefinition(${componentName}, ${module})`
    );

    await new Promise((resolve) => setTimeout(resolve, 60));

    const components = mockDataStore.getComponents();
    const component = components.find(
      (c) => c.name === componentName && (!module || c.module === module)
    );

    if (component) {
      console.log(
        `✅ Found component: ${component.name} (${component.component_id})`
      );
    } else {
      console.log(`❌ Component not found: ${componentName}`);
    }

    return component || null;
  }

  static async getFieldComponentMapping(
    dataType: string
  ): Promise<ComponentDefinition | null> {
    console.log(`🧩 MockComponentEngine.getFieldComponentMapping(${dataType})`);

    await new Promise((resolve) => setTimeout(resolve, 40));

    // Field type to component mappings
    const mappings: { [key: string]: { name: string; module: string } } = {
      string: { name: "Input", module: "core" },
      email: { name: "Input", module: "core" },
      integer: { name: "Input", module: "core" },
      decimal: { name: "Input", module: "core" },
      boolean: { name: "Checkbox", module: "core" },
      date: { name: "DatePicker", module: "core" },
      datetime: { name: "DateTimePicker", module: "core" },
      picklist: { name: "Select", module: "core" },
      currency: { name: "Input", module: "core" },
    };

    const mapping = mappings[dataType] || { name: "Input", module: "core" };
    const component = await this.getComponentDefinition(
      mapping.name,
      mapping.module
    );

    if (component) {
      component.recommended_for = dataType;
      console.log(`✅ Mapped ${dataType} to ${component.name}`);
    }

    return component;
  }
}

// Re-export MockAuthService from specialized service
export { default as MockAuthService } from "./auth/MockAuthService";

// =============================================
// MOCK LAYOUT ENGINE
// =============================================

export class MockLayoutEngine {
  static async getLayouts(
    tenantId?: string,
    category?: string
  ): Promise<LayoutDefinition[]> {
    console.log(`🏗️ MockLayoutEngine.getLayouts(${tenantId}, ${category})`);

    let layouts = mockDataStore.getLayouts();

    if (category) {
      layouts = layouts.filter((layout) => layout.category === category);
    }

    return layouts;
  }

  static async getLayout(
    layoutId: string,
    tenantId?: string
  ): Promise<LayoutDefinition | null> {
    console.log(`🏗️ MockLayoutEngine.getLayout(${layoutId}, ${tenantId})`);

    const layouts = mockDataStore.getLayouts();
    const layout = layouts.find((l) => l.layout_id === layoutId);

    if (layout) {
      console.log(`✅ Found layout: ${layout.display_name}`);
      return layout;
    }

    console.log(`❌ Layout not found: ${layoutId}`);
    return null;
  }
}

// =============================================
// MOCK TRANSLATION ENGINE
// =============================================

export class MockTranslationEngine {
  static async getTranslations(
    locale: string,
    tenantId?: string,
    namespace?: string
  ): Promise<Record<string, string>> {
    console.log(
      `🌐 MockTranslationEngine.getTranslations(${locale}, ${tenantId}, ${namespace})`
    );

    // Get all translation arrays: [englishTranslations, greekTranslations]
    const allTranslationArrays = mockDataStore.getTranslations();
    console.log(`🌐 Found ${allTranslationArrays.length} translation arrays`);

    // Find the translation array for the requested locale
    let localeTranslations: Translation[] | undefined;
    for (const translationArray of allTranslationArrays) {
      if (
        translationArray.length > 0 &&
        translationArray[0].locale === locale
      ) {
        localeTranslations = translationArray;
        break;
      }
    }

    if (!localeTranslations) {
      console.log(`❌ No translations found for locale: ${locale}`);
      return {};
    }

    console.log(
      `🌐 Found ${localeTranslations.length} translations for locale: ${locale}`
    );

    // Filter by namespace if requested
    let filteredTranslations = localeTranslations;
    if (namespace) {
      filteredTranslations = localeTranslations.filter(
        (t) => t.namespace === namespace
      );
      console.log(
        `🌐 Filtered to ${filteredTranslations.length} translations for namespace: ${namespace}`
      );
    }

    // Convert to key-value pairs
    const result: Record<string, string> = {};
    filteredTranslations.forEach((translation) => {
      result[translation.key] = translation.text;
    });

    console.log(
      `✅ Returning ${Object.keys(result).length} translations for ${locale}`
    );
    console.log(`🌐 Sample translations:`, Object.keys(result).slice(0, 5));
    return result;
  }
}

// =============================================
// MOCK THEME ENGINE
// =============================================

export class MockThemeEngine {
  static async getThemes(
    tenantId?: string,
    activeOnly: boolean = true
  ): Promise<Theme[]> {
    console.log(`🎨 MockThemeEngine.getThemes(${tenantId}, ${activeOnly})`);

    let themes = mockDataStore.getThemes();

    if (activeOnly) {
      themes = themes.filter((theme) => theme.is_active);
    }

    console.log(`✅ Found ${themes.length} themes`);
    return themes;
  }

  static async getTheme(
    themeId: string,
    tenantId?: string
  ): Promise<Theme | null> {
    console.log(`🎨 MockThemeEngine.getTheme(${themeId}, ${tenantId})`);

    const themes = mockDataStore.getThemes();
    const theme = themes.find((t) => t.theme_id === themeId);

    if (theme) {
      console.log(`✅ Found theme: ${theme.name}`);
      return theme;
    }

    console.log(`❌ Theme not found: ${themeId}`);
    return null;
  }

  static async getThemeCSS(
    themeId: string,
    tenantId?: string
  ): Promise<string> {
    console.log(`🎨 MockThemeEngine.getThemeCSS(${themeId}, ${tenantId})`);

    const theme = await this.getTheme(themeId, tenantId);

    if (!theme) {
      return "";
    }

    // Generate CSS custom properties
    const cssProperties = [":root {"];

    Object.entries(theme.properties).forEach(([key, value]) => {
      cssProperties.push(`  ${key}: ${value};`);
    });

    cssProperties.push("}");

    const css = cssProperties.join("\n");
    console.log(`✅ Generated CSS for theme: ${theme.name}`);
    return css;
  }

  static async getDefaultTheme(tenantId?: string): Promise<Theme | null> {
    console.log(`🎨 MockThemeEngine.getDefaultTheme(${tenantId})`);

    const themes = mockDataStore.getThemes();
    const defaultTheme = themes.find((t) => t.is_default && t.is_active);

    if (defaultTheme) {
      console.log(`✅ Found default theme: ${defaultTheme.name}`);
      return defaultTheme;
    }

    // Fallback to first active theme
    const firstActiveTheme = themes.find((t) => t.is_active);
    if (firstActiveTheme) {
      console.log(
        `✅ Using first active theme as default: ${firstActiveTheme.name}`
      );
      return firstActiveTheme;
    }

    console.log(`❌ No default theme found`);
    return null;
  }
}

// Export default mock data store for direct access
export default mockDataStore;
