/**
 * Mock Page Service
 *
 * Handles page definitions, layouts, and page-related metadata
 * Separated from the main mock data service for better maintainability
 */

export interface PageDefinition {
  page_id: string;
  page_name: string;
  route: string;
  title: string;
  description?: string;
  page_type: string;
  layout_id?: string;
  sections_data_json?: any;
  components: any[];
  initial_state?: any;
  state_bindings?: any;
  api_endpoints?: any;
  callbacks?: any;
  real_time_updates?: boolean;
  cache_strategy?: string;
  websocket_events?: any;
  metadata_json?: any;
  access_roles: string[];
  is_public: boolean;
  tenant_id?: string;
  created_at: string;
  updated_at: string;
}

export interface LayoutDefinition {
  layout_id: string;
  name: string;
  display_name: string;
  description?: string;
  category?: string;
  sections_json: any;
  css_classes_json?: any;
  container_classes?: string;
  is_responsive: boolean;
  supports_theming: boolean;
  is_system_layout: boolean;
  tenant_id?: string;
}

class MockPageStore {
  private pages: Map<string, PageDefinition> = new Map();
  private layouts: Map<string, LayoutDefinition> = new Map();

  constructor() {
    this.initializeLayouts();
    this.initializePages();
  }

  private initializeLayouts() {
    const layouts: LayoutDefinition[] = [
      {
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
      {
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
      {
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
    ];

    layouts.forEach((layout) => {
      this.layouts.set(layout.layout_id, layout);
    });
  }

  private initializePages() {
    const pages: PageDefinition[] = [
      {
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
        components: [],
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
      {
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
        components: [],
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
      {
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
        state_bindings: {
          "DynamicForm.formData": "form.data",
          "DynamicForm.errors": "form.errors",
          "DynamicForm.loading": "form.loading",
          "DynamicForm.touched": "form.touched",
          "AFMInput.validation": "validation.afm",
        },
        api_endpoints: {
          create_customer: "/api/customers",
          validate_afm: "/api/validation/afm",
          validate_email: "/api/validation/email",
          get_regions: "/api/geography/regions",
        },
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
        components: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    pages.forEach((page) => {
      this.pages.set(page.page_id, page);
    });
  }

  // Getters
  getPages() {
    return Array.from(this.pages.values());
  }
  getPage(pageId: string) {
    return this.pages.get(pageId);
  }
  getPageByRoute(route: string) {
    return Array.from(this.pages.values()).find((p) => p.route === route);
  }
  getLayouts() {
    return Array.from(this.layouts.values());
  }
  getLayout(layoutId: string) {
    return this.layouts.get(layoutId);
  }

  // Setters for future CRUD operations
  setPage(page: PageDefinition) {
    this.pages.set(page.page_id, page);
  }
  setLayout(layout: LayoutDefinition) {
    this.layouts.set(layout.layout_id, layout);
  }
  deletePage(pageId: string) {
    this.pages.delete(pageId);
  }
  deleteLayout(layoutId: string) {
    this.layouts.delete(layoutId);
  }
}

const pageStore = new MockPageStore();

export class MockPageService {
  static async getPageDefinition(
    route: string,
    tenantId?: string
  ): Promise<PageDefinition | null> {
    console.log(`🎭 MockPageService.getPageDefinition(${route}, ${tenantId})`);

    await new Promise((resolve) => setTimeout(resolve, 100));

    const cleanRoute = route.split("?")[0];
    console.log(`🔍 Cleaned route for lookup: ${cleanRoute}`);

    const page = pageStore.getPageByRoute(cleanRoute);

    if (page) {
      console.log(`✅ Found page: ${page.page_name} (${page.page_id})`);
    } else {
      console.log(`❌ Page not found for route: ${cleanRoute}`);
      console.log(
        `📋 Available routes:`,
        pageStore.getPages().map((p) => p.route)
      );
    }

    return page || null;
  }

  static async listPagesForTenant(
    tenantId?: string,
    pageType?: string
  ): Promise<PageDefinition[]> {
    console.log(
      `🎭 MockPageService.listPagesForTenant(${tenantId}, ${pageType})`
    );

    await new Promise((resolve) => setTimeout(resolve, 150));

    let pages = pageStore.getPages();

    if (pageType) {
      pages = pages.filter((p) => p.page_type === pageType);
    }

    console.log(`✅ Found ${pages.length} pages`);
    return pages;
  }

  static async getLayout(
    layoutId: string,
    tenantId?: string
  ): Promise<LayoutDefinition | null> {
    console.log(`🏗️ MockPageService.getLayout(${layoutId}, ${tenantId})`);

    await new Promise((resolve) => setTimeout(resolve, 80));

    const layout = pageStore.getLayout(layoutId);

    if (layout) {
      console.log(`✅ Found layout: ${layout.display_name}`);
    } else {
      console.log(`❌ Layout not found: ${layoutId}`);
    }

    return layout || null;
  }

  static async getLayouts(
    tenantId?: string,
    category?: string
  ): Promise<LayoutDefinition[]> {
    console.log(`🏗️ MockPageService.getLayouts(${tenantId}, ${category})`);

    await new Promise((resolve) => setTimeout(resolve, 120));

    let layouts = pageStore.getLayouts();

    if (category) {
      layouts = layouts.filter((layout) => layout.category === category);
    }

    console.log(`✅ Found ${layouts.length} layouts`);
    return layouts;
  }
}

export default MockPageService;
