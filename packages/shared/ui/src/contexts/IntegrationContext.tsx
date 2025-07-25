import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";

export interface Integration {
  id: string;
  name: string;
  type:
    | "AADE"
    | "BANKING"
    | "PAYMENT"
    | "SHIPPING"
    | "ACCOUNTING"
    | "CRM"
    | "E_COMMERCE"
    | "GOVERNMENT"
    | "CUSTOM";
  category:
    | "FINANCIAL"
    | "TAX"
    | "LOGISTICS"
    | "MARKETING"
    | "COMPLIANCE"
    | "UTILITIES";
  provider: string;
  version: string;
  status: "ACTIVE" | "INACTIVE" | "ERROR" | "MAINTENANCE" | "DEPRECATED";
  isRequired: boolean;
  isGreekSpecific: boolean;
  configuration: {
    endpoint: string;
    authentication: {
      type: "API_KEY" | "OAUTH2" | "BASIC_AUTH" | "CERTIFICATE" | "JWT";
      credentials: Record<string, any>;
      expiresAt?: string;
    };
    settings: Record<string, any>;
    rateLimit: {
      requests: number;
      period: number; // seconds
      current: number;
      resetAt: string;
    };
    timeout: number; // seconds
    retryPolicy: {
      maxRetries: number;
      backoffMultiplier: number;
      initialDelay: number; // milliseconds
    };
  };
  features: string[];
  supportedOperations: IntegrationOperation[];
  compliance: {
    gdprCompliant: boolean;
    iso27001: boolean;
    greekLaw: boolean;
    certifications: string[];
  };
  monitoring: {
    healthCheck: {
      enabled: boolean;
      interval: number; // minutes
      endpoint: string;
      expectedStatus: number;
    };
    logging: {
      enabled: boolean;
      level: "ERROR" | "WARN" | "INFO" | "DEBUG";
      retention: number; // days
    };
    metrics: {
      enabled: boolean;
      collectPerformance: boolean;
      collectErrors: boolean;
    };
  };
  webhooks: IntegrationWebhook[];
  lastUsed: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationOperation {
  id: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  endpoint: string;
  description: string;
  inputSchema: any;
  outputSchema: any;
  isAsync: boolean;
  cacheable: boolean;
  cacheTimeout?: number; // seconds
  rateLimit?: {
    requests: number;
    period: number;
  };
}

export interface IntegrationWebhook {
  id: string;
  event: string;
  url: string;
  secret: string;
  isActive: boolean;
  retryPolicy: {
    maxRetries: number;
    retryDelay: number; // seconds
  };
  lastTriggered?: string;
  failureCount: number;
}

export interface IntegrationExecution {
  id: string;
  integrationId: string;
  operation: string;
  status:
    | "PENDING"
    | "RUNNING"
    | "SUCCESS"
    | "FAILED"
    | "TIMEOUT"
    | "CANCELLED";
  input: any;
  output?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    startTime: string;
    endTime?: string;
    duration?: number; // milliseconds
    retryCount: number;
    userId: string;
    companyId: string;
    traceId: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationMetrics {
  integrationId: string;
  period: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  avgResponseTime: number;
  avgDailyUsage: number;
  errorRate: number;
  uptime: number; // percentage
  topErrors: Array<{
    code: string;
    message: string;
    count: number;
  }>;
  performanceBreakdown: Array<{
    operation: string;
    avgDuration: number;
    executions: number;
  }>;
}

export interface IntegrationTemplate {
  id: string;
  name: string;
  description: string;
  type: Integration["type"];
  provider: string;
  isOfficial: boolean;
  isGreekSpecific: boolean;
  configuration: {
    requiredFields: Array<{
      name: string;
      type: string;
      label: string;
      description: string;
      required: boolean;
      validation?: string;
    }>;
    optionalFields: Array<{
      name: string;
      type: string;
      label: string;
      description: string;
      defaultValue?: any;
    }>;
    presets: Record<string, any>;
  };
  documentation: {
    setup: string;
    usage: string;
    troubleshooting: string;
    examples: Array<{
      name: string;
      description: string;
      code: string;
    }>;
  };
  rating: number;
  downloads: number;
  lastUpdated: string;
}

interface IntegrationContextState {
  integrations: Integration[];
  templates: IntegrationTemplate[];
  executions: IntegrationExecution[];
  metrics: Record<string, IntegrationMetrics>;
  loading: boolean;
  error: string | null;
  filters: {
    type?: string;
    status?: string;
    provider?: string;
    category?: string;
  };
  settings: {
    enableGlobalLogging: boolean;
    enableGlobalMetrics: boolean;
    defaultTimeout: number;
    maxConcurrentExecutions: number;
    enableWebhooks: boolean;
    enableRateLimiting: boolean;
  };
  connectionStatus: Record<
    string,
    {
      isConnected: boolean;
      lastCheck: string;
      responseTime: number;
      error?: string;
    }
  >;
}

type IntegrationAction =
  | { type: "SET_INTEGRATIONS"; payload: Integration[] }
  | { type: "ADD_INTEGRATION"; payload: Integration }
  | {
      type: "UPDATE_INTEGRATION";
      payload: { id: string; updates: Partial<Integration> };
    }
  | { type: "REMOVE_INTEGRATION"; payload: string }
  | { type: "SET_TEMPLATES"; payload: IntegrationTemplate[] }
  | { type: "SET_EXECUTIONS"; payload: IntegrationExecution[] }
  | { type: "ADD_EXECUTION"; payload: IntegrationExecution }
  | {
      type: "UPDATE_EXECUTION";
      payload: { id: string; updates: Partial<IntegrationExecution> };
    }
  | {
      type: "SET_METRICS";
      payload: { integrationId: string; metrics: IntegrationMetrics };
    }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | {
      type: "SET_FILTERS";
      payload: Partial<IntegrationContextState["filters"]>;
    }
  | {
      type: "UPDATE_SETTINGS";
      payload: Partial<IntegrationContextState["settings"]>;
    }
  | {
      type: "UPDATE_CONNECTION_STATUS";
      payload: { integrationId: string; status: any };
    };

const initialState: IntegrationContextState = {
  integrations: [],
  templates: [],
  executions: [],
  metrics: {},
  loading: false,
  error: null,
  filters: {},
  settings: {
    enableGlobalLogging: true,
    enableGlobalMetrics: true,
    defaultTimeout: 30,
    maxConcurrentExecutions: 10,
    enableWebhooks: true,
    enableRateLimiting: true,
  },
  connectionStatus: {},
};

function integrationReducer(
  state: IntegrationContextState,
  action: IntegrationAction
): IntegrationContextState {
  switch (action.type) {
    case "SET_INTEGRATIONS":
      return { ...state, integrations: action.payload };

    case "ADD_INTEGRATION":
      return {
        ...state,
        integrations: [...state.integrations, action.payload],
      };

    case "UPDATE_INTEGRATION":
      return {
        ...state,
        integrations: state.integrations.map((integration) =>
          integration.id === action.payload.id
            ? {
                ...integration,
                ...action.payload.updates,
                updatedAt: new Date().toISOString(),
              }
            : integration
        ),
      };

    case "REMOVE_INTEGRATION":
      return {
        ...state,
        integrations: state.integrations.filter(
          (integration) => integration.id !== action.payload
        ),
      };

    case "SET_TEMPLATES":
      return { ...state, templates: action.payload };

    case "SET_EXECUTIONS":
      return { ...state, executions: action.payload };

    case "ADD_EXECUTION":
      return {
        ...state,
        executions: [action.payload, ...state.executions.slice(0, 999)], // Keep only last 1000 executions
      };

    case "UPDATE_EXECUTION":
      return {
        ...state,
        executions: state.executions.map((execution) =>
          execution.id === action.payload.id
            ? {
                ...execution,
                ...action.payload.updates,
                updatedAt: new Date().toISOString(),
              }
            : execution
        ),
      };

    case "SET_METRICS":
      return {
        ...state,
        metrics: {
          ...state.metrics,
          [action.payload.integrationId]: action.payload.metrics,
        },
      };

    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload };

    case "SET_FILTERS":
      return { ...state, filters: { ...state.filters, ...action.payload } };

    case "UPDATE_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case "UPDATE_CONNECTION_STATUS":
      return {
        ...state,
        connectionStatus: {
          ...state.connectionStatus,
          [action.payload.integrationId]: action.payload.status,
        },
      };

    default:
      return state;
  }
}

const IntegrationContext = createContext<{
  state: IntegrationContextState;
  dispatch: React.Dispatch<IntegrationAction>;
  // Integration management
  createIntegration: (
    integration: Omit<Integration, "id" | "createdAt" | "updatedAt">
  ) => void;
  updateIntegration: (id: string, updates: Partial<Integration>) => void;
  deleteIntegration: (id: string) => void;
  activateIntegration: (id: string) => void;
  deactivateIntegration: (id: string) => void;
  // Template management
  loadTemplates: () => Promise<void>;
  createFromTemplate: (
    templateId: string,
    configuration: any
  ) => Promise<Integration>;
  // Execution management
  executeOperation: (
    integrationId: string,
    operation: string,
    input: any
  ) => Promise<any>;
  cancelExecution: (executionId: string) => Promise<void>;
  retryExecution: (executionId: string) => Promise<void>;
  // Connection testing
  testConnection: (integrationId: string) => Promise<boolean>;
  testAllConnections: () => Promise<void>;
  checkHealth: (
    integrationId: string
  ) => Promise<{ healthy: boolean; details: any }>;
  // Metrics and monitoring
  getMetrics: (integrationId: string, period?: string) => Promise<void>;
  getExecutionHistory: (
    integrationId: string,
    filters?: any
  ) => Promise<IntegrationExecution[]>;
  generateReport: (type: string, filters?: any) => Promise<string>;
  // Greek-specific integrations
  connectToAADE: (credentials: any) => Promise<Integration>;
  connectToGreekBank: (
    bankCode: string,
    credentials: any
  ) => Promise<Integration>;
  connectToTaxis: (credentials: any) => Promise<Integration>;
  connectToEFKA: (credentials: any) => Promise<Integration>;
  // Webhook management
  addWebhook: (
    integrationId: string,
    webhook: Omit<IntegrationWebhook, "id">
  ) => void;
  removeWebhook: (integrationId: string, webhookId: string) => void;
  testWebhook: (integrationId: string, webhookId: string) => Promise<boolean>;
  // Utilities
  validateConfiguration: (
    templateId: string,
    configuration: any
  ) => { valid: boolean; errors: string[] };
  getIntegrationsByType: (type: string) => Integration[];
  getActiveIntegrations: () => Integration[];
  getGreekIntegrations: () => Integration[];
  // Settings
  updateSettings: (
    settings: Partial<IntegrationContextState["settings"]>
  ) => void;
  // Filters
  setFilters: (filters: Partial<IntegrationContextState["filters"]>) => void;
  clearFilters: () => void;
  // Import/Export
  exportIntegration: (integrationId: string) => string;
  importIntegration: (integrationData: string) => void;
} | null>(null);

export function IntegrationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(integrationReducer, initialState);

  // Generate unique IDs
  const generateId = () =>
    `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Integration management
  const createIntegration = (
    integration: Omit<Integration, "id" | "createdAt" | "updatedAt">
  ) => {
    const newIntegration: Integration = {
      ...integration,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dispatch({ type: "ADD_INTEGRATION", payload: newIntegration });
  };

  const updateIntegration = (id: string, updates: Partial<Integration>) => {
    dispatch({ type: "UPDATE_INTEGRATION", payload: { id, updates } });
  };

  const deleteIntegration = (id: string) => {
    dispatch({ type: "REMOVE_INTEGRATION", payload: id });
  };

  const activateIntegration = (id: string) => {
    updateIntegration(id, { status: "ACTIVE" });
  };

  const deactivateIntegration = (id: string) => {
    updateIntegration(id, { status: "INACTIVE" });
  };

  // Template management
  const loadTemplates = async () => {
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const response = await fetch("/api/integrations/templates");
      if (response.ok) {
        const templates = await response.json();
        dispatch({ type: "SET_TEMPLATES", payload: templates });
      }
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error ? error.message : "Failed to load templates",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const createFromTemplate = async (
    templateId: string,
    configuration: any
  ): Promise<Integration> => {
    const template = state.templates.find((t) => t.id === templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    // Validate configuration
    const validation = validateConfiguration(templateId, configuration);
    if (!validation.valid) {
      throw new Error(`Configuration errors: ${validation.errors.join(", ")}`);
    }

    const integration: Omit<Integration, "id" | "createdAt" | "updatedAt"> = {
      name: template.name,
      type: template.type,
      category: "FINANCIAL", // Default category
      provider: template.provider,
      version: "1.0.0",
      status: "INACTIVE",
      isRequired: false,
      isGreekSpecific: template.isGreekSpecific,
      configuration: {
        endpoint: configuration.endpoint || "",
        authentication: configuration.authentication,
        settings: configuration.settings || {},
        rateLimit: {
          requests: 100,
          period: 3600,
          current: 0,
          resetAt: new Date().toISOString(),
        },
        timeout: state.settings.defaultTimeout,
        retryPolicy: {
          maxRetries: 3,
          backoffMultiplier: 2,
          initialDelay: 1000,
        },
      },
      features: template.configuration.presets.features || [],
      supportedOperations: [],
      compliance: {
        gdprCompliant: true,
        iso27001: false,
        greekLaw: template.isGreekSpecific,
        certifications: [],
      },
      monitoring: {
        healthCheck: {
          enabled: true,
          interval: 15,
          endpoint: "/health",
          expectedStatus: 200,
        },
        logging: {
          enabled: state.settings.enableGlobalLogging,
          level: "INFO",
          retention: 30,
        },
        metrics: {
          enabled: state.settings.enableGlobalMetrics,
          collectPerformance: true,
          collectErrors: true,
        },
      },
      webhooks: [],
      lastUsed: null,
    };

    createIntegration(integration);

    // Return the created integration (with generated ID)
    const createdIntegration =
      state.integrations[state.integrations.length - 1];
    return createdIntegration;
  };

  // Execution management
  const executeOperation = async (
    integrationId: string,
    operation: string,
    input: any
  ): Promise<any> => {
    const integration = state.integrations.find((i) => i.id === integrationId);
    if (!integration) {
      throw new Error("Integration not found");
    }

    if (integration.status !== "ACTIVE") {
      throw new Error(`Integration is ${integration.status.toLowerCase()}`);
    }

    const execution: IntegrationExecution = {
      id: generateId(),
      integrationId,
      operation,
      status: "PENDING",
      input,
      metadata: {
        startTime: new Date().toISOString(),
        retryCount: 0,
        userId: "current-user-id",
        companyId: "current-company-id",
        traceId: generateId(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dispatch({ type: "ADD_EXECUTION", payload: execution });

    try {
      // Update execution status
      dispatch({
        type: "UPDATE_EXECUTION",
        payload: {
          id: execution.id,
          updates: { status: "RUNNING" },
        },
      });

      // Execute the operation
      const response = await fetch("/api/integrations/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${
            integration.configuration.authentication.credentials.token || ""
          }`,
        },
        body: JSON.stringify({
          integrationId,
          operation,
          input,
          executionId: execution.id,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Success
        dispatch({
          type: "UPDATE_EXECUTION",
          payload: {
            id: execution.id,
            updates: {
              status: "SUCCESS",
              output: result,
              metadata: {
                ...execution.metadata,
                endTime: new Date().toISOString(),
                duration:
                  Date.now() - new Date(execution.metadata.startTime).getTime(),
              },
            },
          },
        });

        // Update integration last used
        updateIntegration(integrationId, {
          lastUsed: new Date().toISOString(),
        });

        return result;
      } else {
        // Error
        throw new Error(result.message || "Operation failed");
      }
    } catch (error) {
      // Update execution with error
      dispatch({
        type: "UPDATE_EXECUTION",
        payload: {
          id: execution.id,
          updates: {
            status: "FAILED",
            error: {
              code: "EXECUTION_ERROR",
              message: error instanceof Error ? error.message : "Unknown error",
            },
            metadata: {
              ...execution.metadata,
              endTime: new Date().toISOString(),
              duration:
                Date.now() - new Date(execution.metadata.startTime).getTime(),
            },
          },
        },
      });

      throw error;
    }
  };

  const cancelExecution = async (executionId: string) => {
    dispatch({
      type: "UPDATE_EXECUTION",
      payload: {
        id: executionId,
        updates: { status: "CANCELLED" },
      },
    });
  };

  const retryExecution = async (executionId: string) => {
    const execution = state.executions.find((e) => e.id === executionId);
    if (!execution) {
      throw new Error("Execution not found");
    }

    // Create a new execution based on the failed one
    await executeOperation(
      execution.integrationId,
      execution.operation,
      execution.input
    );
  };

  // Connection testing
  const testConnection = async (integrationId: string): Promise<boolean> => {
    const integration = state.integrations.find((i) => i.id === integrationId);
    if (!integration) {
      throw new Error("Integration not found");
    }

    try {
      const response = await fetch("/api/integrations/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrationId }),
      });

      const result = await response.json();

      dispatch({
        type: "UPDATE_CONNECTION_STATUS",
        payload: {
          integrationId,
          status: {
            isConnected: response.ok,
            lastCheck: new Date().toISOString(),
            responseTime: result.responseTime || 0,
            error: response.ok ? undefined : result.message,
          },
        },
      });

      return response.ok;
    } catch (error) {
      dispatch({
        type: "UPDATE_CONNECTION_STATUS",
        payload: {
          integrationId,
          status: {
            isConnected: false,
            lastCheck: new Date().toISOString(),
            responseTime: 0,
            error:
              error instanceof Error ? error.message : "Connection test failed",
          },
        },
      });

      return false;
    }
  };

  const testAllConnections = async () => {
    const activeIntegrations = state.integrations.filter(
      (i) => i.status === "ACTIVE"
    );

    await Promise.all(
      activeIntegrations.map((integration) => testConnection(integration.id))
    );
  };

  const checkHealth = async (
    integrationId: string
  ): Promise<{ healthy: boolean; details: any }> => {
    const integration = state.integrations.find((i) => i.id === integrationId);
    if (!integration) {
      throw new Error("Integration not found");
    }

    try {
      const response = await fetch("/api/integrations/health-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrationId }),
      });

      const result = await response.json();
      return { healthy: response.ok, details: result };
    } catch (error) {
      return {
        healthy: false,
        details: {
          error: error instanceof Error ? error.message : "Health check failed",
        },
      };
    }
  };

  // Metrics and monitoring
  const getMetrics = async (integrationId: string, period: string = "30d") => {
    try {
      const response = await fetch(
        `/api/integrations/metrics?integrationId=${integrationId}&period=${period}`
      );
      if (response.ok) {
        const metrics = await response.json();
        dispatch({ type: "SET_METRICS", payload: { integrationId, metrics } });
      }
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error ? error.message : "Failed to get metrics",
      });
    }
  };

  const getExecutionHistory = async (
    integrationId: string,
    filters?: any
  ): Promise<IntegrationExecution[]> => {
    try {
      const params = new URLSearchParams({ integrationId, ...filters });
      const response = await fetch(`/api/integrations/executions?${params}`);
      if (response.ok) {
        return await response.json();
      }
      throw new Error("Failed to get execution history");
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error
            ? error.message
            : "Failed to get execution history",
      });
      return [];
    }
  };

  const generateReport = async (
    type: string,
    filters?: any
  ): Promise<string> => {
    try {
      const response = await fetch("/api/integrations/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, filters }),
      });

      if (response.ok) {
        const result = await response.json();
        return result.reportUrl;
      }
      throw new Error("Failed to generate report");
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error ? error.message : "Report generation failed",
      });
      throw error;
    }
  };

  // Greek-specific integrations
  const connectToAADE = async (credentials: any): Promise<Integration> => {
    const integration: Omit<Integration, "id" | "createdAt" | "updatedAt"> = {
      name: "AADE Integration",
      type: "AADE",
      category: "TAX",
      provider: "Greek Tax Authority",
      version: "1.0.0",
      status: "ACTIVE",
      isRequired: true,
      isGreekSpecific: true,
      configuration: {
        endpoint: "https://www1.aade.gr/sgsisapi/api",
        authentication: {
          type: "API_KEY",
          credentials,
        },
        settings: {
          environment: credentials.environment || "production",
        },
        rateLimit: {
          requests: 100,
          period: 3600,
          current: 0,
          resetAt: new Date().toISOString(),
        },
        timeout: 30,
        retryPolicy: {
          maxRetries: 3,
          backoffMultiplier: 2,
          initialDelay: 1000,
        },
      },
      features: ["invoice_submission", "classification", "books"],
      supportedOperations: [
        {
          id: "submit_invoice",
          name: "Submit Invoice",
          method: "POST",
          endpoint: "/invoices",
          description: "Submit invoice to AADE",
          inputSchema: {},
          outputSchema: {},
          isAsync: false,
          cacheable: false,
        },
      ],
      compliance: {
        gdprCompliant: true,
        iso27001: true,
        greekLaw: true,
        certifications: ["AADE_CERTIFIED"],
      },
      monitoring: {
        healthCheck: {
          enabled: true,
          interval: 15,
          endpoint: "/health",
          expectedStatus: 200,
        },
        logging: {
          enabled: true,
          level: "INFO",
          retention: 2555, // 7 years for tax compliance
        },
        metrics: {
          enabled: true,
          collectPerformance: true,
          collectErrors: true,
        },
      },
      webhooks: [],
      lastUsed: null,
    };

    createIntegration(integration);
    return state.integrations[state.integrations.length - 1];
  };

  const connectToGreekBank = async (
    bankCode: string,
    credentials: any
  ): Promise<Integration> => {
    const integration: Omit<Integration, "id" | "createdAt" | "updatedAt"> = {
      name: `Greek Bank Integration (${bankCode})`,
      type: "BANKING",
      category: "FINANCIAL",
      provider: `Greek Bank ${bankCode}`,
      version: "1.0.0",
      status: "ACTIVE",
      isRequired: false,
      isGreekSpecific: true,
      configuration: {
        endpoint: `https://api.bank-${bankCode}.gr`,
        authentication: {
          type: "OAUTH2",
          credentials,
        },
        settings: {
          bankCode,
        },
        rateLimit: {
          requests: 1000,
          period: 3600,
          current: 0,
          resetAt: new Date().toISOString(),
        },
        timeout: 30,
        retryPolicy: {
          maxRetries: 3,
          backoffMultiplier: 2,
          initialDelay: 1000,
        },
      },
      features: [
        "sepa_transfers",
        "direct_debits",
        "account_info",
        "statements",
      ],
      supportedOperations: [],
      compliance: {
        gdprCompliant: true,
        iso27001: true,
        greekLaw: true,
        certifications: ["PSD2_COMPLIANT"],
      },
      monitoring: {
        healthCheck: {
          enabled: true,
          interval: 5,
          endpoint: "/health",
          expectedStatus: 200,
        },
        logging: {
          enabled: true,
          level: "INFO",
          retention: 2555,
        },
        metrics: {
          enabled: true,
          collectPerformance: true,
          collectErrors: true,
        },
      },
      webhooks: [],
      lastUsed: null,
    };

    createIntegration(integration);
    return state.integrations[state.integrations.length - 1];
  };

  const connectToTaxis = async (credentials: any): Promise<Integration> => {
    // Implementation for Taxis.net integration
    const integration: Omit<Integration, "id" | "createdAt" | "updatedAt"> = {
      name: "Taxis.net Integration",
      type: "GOVERNMENT",
      category: "TAX",
      provider: "Taxis.net",
      version: "1.0.0",
      status: "ACTIVE",
      isRequired: false,
      isGreekSpecific: true,
      configuration: {
        endpoint: "https://www1.gsis.gr/taxisnet",
        authentication: {
          type: "CERTIFICATE",
          credentials,
        },
        settings: {},
        rateLimit: {
          requests: 50,
          period: 3600,
          current: 0,
          resetAt: new Date().toISOString(),
        },
        timeout: 45,
        retryPolicy: {
          maxRetries: 2,
          backoffMultiplier: 3,
          initialDelay: 2000,
        },
      },
      features: ["tax_forms", "declarations", "certificates"],
      supportedOperations: [],
      compliance: {
        gdprCompliant: true,
        iso27001: true,
        greekLaw: true,
        certifications: ["GOVERNMENT_CERTIFIED"],
      },
      monitoring: {
        healthCheck: {
          enabled: true,
          interval: 30,
          endpoint: "/ping",
          expectedStatus: 200,
        },
        logging: {
          enabled: true,
          level: "INFO",
          retention: 2555,
        },
        metrics: {
          enabled: true,
          collectPerformance: true,
          collectErrors: true,
        },
      },
      webhooks: [],
      lastUsed: null,
    };

    createIntegration(integration);
    return state.integrations[state.integrations.length - 1];
  };

  const connectToEFKA = async (credentials: any): Promise<Integration> => {
    // Implementation for EFKA (Greek Social Security) integration
    const integration: Omit<Integration, "id" | "createdAt" | "updatedAt"> = {
      name: "EFKA Integration",
      type: "GOVERNMENT",
      category: "COMPLIANCE",
      provider: "EFKA",
      version: "1.0.0",
      status: "ACTIVE",
      isRequired: false,
      isGreekSpecific: true,
      configuration: {
        endpoint: "https://www.efka.gov.gr/api",
        authentication: {
          type: "CERTIFICATE",
          credentials,
        },
        settings: {},
        rateLimit: {
          requests: 30,
          period: 3600,
          current: 0,
          resetAt: new Date().toISOString(),
        },
        timeout: 60,
        retryPolicy: {
          maxRetries: 2,
          backoffMultiplier: 3,
          initialDelay: 3000,
        },
      },
      features: ["social_security", "contributions", "declarations"],
      supportedOperations: [],
      compliance: {
        gdprCompliant: true,
        iso27001: true,
        greekLaw: true,
        certifications: ["SOCIAL_SECURITY_CERTIFIED"],
      },
      monitoring: {
        healthCheck: {
          enabled: true,
          interval: 30,
          endpoint: "/status",
          expectedStatus: 200,
        },
        logging: {
          enabled: true,
          level: "INFO",
          retention: 2555,
        },
        metrics: {
          enabled: true,
          collectPerformance: true,
          collectErrors: true,
        },
      },
      webhooks: [],
      lastUsed: null,
    };

    createIntegration(integration);
    return state.integrations[state.integrations.length - 1];
  };

  // Webhook management
  const addWebhook = (
    integrationId: string,
    webhook: Omit<IntegrationWebhook, "id">
  ) => {
    const newWebhook: IntegrationWebhook = {
      ...webhook,
      id: generateId(),
    };

    const integration = state.integrations.find((i) => i.id === integrationId);
    if (integration) {
      updateIntegration(integrationId, {
        webhooks: [...integration.webhooks, newWebhook],
      });
    }
  };

  const removeWebhook = (integrationId: string, webhookId: string) => {
    const integration = state.integrations.find((i) => i.id === integrationId);
    if (integration) {
      updateIntegration(integrationId, {
        webhooks: integration.webhooks.filter((w) => w.id !== webhookId),
      });
    }
  };

  const testWebhook = async (
    integrationId: string,
    webhookId: string
  ): Promise<boolean> => {
    try {
      const response = await fetch("/api/integrations/test-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrationId, webhookId }),
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  };

  // Utilities
  const validateConfiguration = (
    templateId: string,
    configuration: any
  ): { valid: boolean; errors: string[] } => {
    const template = state.templates.find((t) => t.id === templateId);
    if (!template) {
      return { valid: false, errors: ["Template not found"] };
    }

    const errors: string[] = [];

    // Validate required fields
    template.configuration.requiredFields.forEach((field) => {
      if (!configuration[field.name]) {
        errors.push(`${field.label} is required`);
      } else if (field.validation) {
        const regex = new RegExp(field.validation);
        if (!regex.test(configuration[field.name])) {
          errors.push(`${field.label} format is invalid`);
        }
      }
    });

    return { valid: errors.length === 0, errors };
  };

  const getIntegrationsByType = (type: string): Integration[] => {
    return state.integrations.filter(
      (integration) => integration.type === type
    );
  };

  const getActiveIntegrations = (): Integration[] => {
    return state.integrations.filter(
      (integration) => integration.status === "ACTIVE"
    );
  };

  const getGreekIntegrations = (): Integration[] => {
    return state.integrations.filter(
      (integration) => integration.isGreekSpecific
    );
  };

  // Settings
  const updateSettings = (
    settings: Partial<IntegrationContextState["settings"]>
  ) => {
    dispatch({ type: "UPDATE_SETTINGS", payload: settings });
  };

  // Filters
  const setFilters = (filters: Partial<IntegrationContextState["filters"]>) => {
    dispatch({ type: "SET_FILTERS", payload: filters });
  };

  const clearFilters = () => {
    dispatch({ type: "SET_FILTERS", payload: {} });
  };

  // Import/Export
  const exportIntegration = (integrationId: string): string => {
    const integration = state.integrations.find((i) => i.id === integrationId);
    return JSON.stringify(integration, null, 2);
  };

  const importIntegration = (integrationData: string) => {
    try {
      const integration = JSON.parse(integrationData);
      integration.id = generateId();
      integration.createdAt = new Date().toISOString();
      integration.updatedAt = new Date().toISOString();
      dispatch({ type: "ADD_INTEGRATION", payload: integration });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: "Invalid integration data" });
    }
  };

  // Effects
  useEffect(() => {
    // Load initial data
    loadTemplates();
  }, []);

  useEffect(() => {
    // Set up health checks for active integrations
    const healthCheckInterval = setInterval(() => {
      const activeIntegrations = state.integrations.filter(
        (i) => i.status === "ACTIVE" && i.monitoring.healthCheck.enabled
      );

      activeIntegrations.forEach((integration) => {
        checkHealth(integration.id);
      });
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(healthCheckInterval);
  }, [state.integrations]);

  const contextValue = {
    state,
    dispatch,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    activateIntegration,
    deactivateIntegration,
    loadTemplates,
    createFromTemplate,
    executeOperation,
    cancelExecution,
    retryExecution,
    testConnection,
    testAllConnections,
    checkHealth,
    getMetrics,
    getExecutionHistory,
    generateReport,
    connectToAADE,
    connectToGreekBank,
    connectToTaxis,
    connectToEFKA,
    addWebhook,
    removeWebhook,
    testWebhook,
    validateConfiguration,
    getIntegrationsByType,
    getActiveIntegrations,
    getGreekIntegrations,
    updateSettings,
    setFilters,
    clearFilters,
    exportIntegration,
    importIntegration,
  };

  return (
    <IntegrationContext.Provider value={contextValue}>
      {children}
    </IntegrationContext.Provider>
  );
}

export function useIntegration() {
  const context = useContext(IntegrationContext);
  if (!context) {
    throw new Error(
      "useIntegration must be used within an IntegrationProvider"
    );
  }
  return context;
}

export default IntegrationContext;
