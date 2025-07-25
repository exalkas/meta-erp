import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  companyId: string;
  sessionId: string;
  action: string;
  module: string;
  feature: string;
  resource: string;
  resourceId?: string;
  details: {
    method: "CREATE" | "READ" | "UPDATE" | "DELETE" | "EXECUTE";
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    changes?: string[];
    outcome: "SUCCESS" | "FAILURE" | "PARTIAL";
    errorMessage?: string;
    metadata?: Record<string, any>;
  };
  ipAddress: string;
  userAgent: string;
  location?: {
    country: string;
    city: string;
    region: string;
  };
  compliance: {
    level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    category:
      | "SYSTEM"
      | "USER"
      | "BUSINESS"
      | "FINANCIAL"
      | "PERSONAL_DATA"
      | "AADE"
      | "TAX";
    requiresRetention: boolean;
    retentionPeriod?: string; // ISO duration format
    personalDataInvolved: boolean;
    financialDataInvolved: boolean;
  };
  risk: {
    score: number; // 0-100
    factors: string[];
    flagged: boolean;
    requiresReview: boolean;
    reviewedBy?: string;
    reviewedAt?: string;
  };
}

export interface AuditFilter {
  userId?: string;
  companyId?: string;
  module?: string;
  feature?: string;
  action?: string;
  method?: string;
  outcome?: string;
  complianceLevel?: string;
  complianceCategory?: string;
  riskScore?: {
    min: number;
    max: number;
  };
  dateRange?: {
    start: string;
    end: string;
  };
  flaggedOnly?: boolean;
  personalDataOnly?: boolean;
  financialDataOnly?: boolean;
  ipAddress?: string;
  searchTerm?: string;
}

export interface AuditStatistics {
  totalEntries: number;
  entriesByModule: Record<string, number>;
  entriesByAction: Record<string, number>;
  entriesByOutcome: Record<string, number>;
  entriesByComplianceLevel: Record<string, number>;
  entriesByRiskScore: Record<string, number>;
  flaggedEntries: number;
  personalDataEntries: number;
  financialDataEntries: number;
  averageRiskScore: number;
  topUsers: Array<{ userId: string; userEmail: string; count: number }>;
  topResources: Array<{ resource: string; count: number }>;
  complianceMetrics: {
    retentionCompliance: number;
    personalDataCompliance: number;
    financialDataCompliance: number;
  };
}

export interface AuditSettings {
  enableRealTimeLogging: boolean;
  enableRiskAnalysis: boolean;
  enablePersonalDataTracking: boolean;
  enableFinancialDataTracking: boolean;
  enableLocationTracking: boolean;
  retentionPeriod: string; // ISO duration format
  autoFlagHighRisk: boolean;
  riskThreshold: number;
  complianceAlerts: {
    enabled: boolean;
    criticalActions: boolean;
    personalDataAccess: boolean;
    financialDataAccess: boolean;
    aadeIntegration: boolean;
  };
  exportSettings: {
    enableExport: boolean;
    formats: string[];
    maxExportSize: number;
    requiresApproval: boolean;
  };
}

interface AuditContextState {
  logs: AuditLogEntry[];
  statistics: AuditStatistics | null;
  settings: AuditSettings;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  lastSync: string | null;
  currentFilter: AuditFilter;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
}

type AuditReducerAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_LOGS"; payload: AuditLogEntry[] }
  | { type: "ADD_LOG"; payload: AuditLogEntry }
  | { type: "SET_STATISTICS"; payload: AuditStatistics }
  | { type: "SET_SETTINGS"; payload: Partial<AuditSettings> }
  | { type: "SET_FILTER"; payload: AuditFilter }
  | {
      type: "SET_PAGINATION";
      payload: Partial<AuditContextState["pagination"]>;
    }
  | { type: "SET_CONNECTION_STATUS"; payload: boolean }
  | { type: "SET_LAST_SYNC"; payload: string }
  | { type: "RESET_CONTEXT" };

const defaultSettings: AuditSettings = {
  enableRealTimeLogging: true,
  enableRiskAnalysis: true,
  enablePersonalDataTracking: true,
  enableFinancialDataTracking: true,
  enableLocationTracking: false,
  retentionPeriod: "P7Y", // 7 years
  autoFlagHighRisk: true,
  riskThreshold: 70,
  complianceAlerts: {
    enabled: true,
    criticalActions: true,
    personalDataAccess: true,
    financialDataAccess: true,
    aadeIntegration: true,
  },
  exportSettings: {
    enableExport: true,
    formats: ["JSON", "CSV", "PDF"],
    maxExportSize: 10000,
    requiresApproval: true,
  },
};

const initialState: AuditContextState = {
  logs: [],
  statistics: null,
  settings: defaultSettings,
  loading: false,
  error: null,
  isConnected: false,
  lastSync: null,
  currentFilter: {},
  pagination: {
    page: 1,
    pageSize: 50,
    total: 0,
    hasMore: false,
  },
};

function auditReducer(
  state: AuditContextState,
  action: AuditReducerAction
): AuditContextState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };

    case "SET_LOGS":
      return { ...state, logs: action.payload };

    case "ADD_LOG":
      return { ...state, logs: [action.payload, ...state.logs] };

    case "SET_STATISTICS":
      return { ...state, statistics: action.payload };

    case "SET_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case "SET_FILTER":
      return { ...state, currentFilter: action.payload };

    case "SET_PAGINATION":
      return {
        ...state,
        pagination: { ...state.pagination, ...action.payload },
      };

    case "SET_CONNECTION_STATUS":
      return { ...state, isConnected: action.payload };

    case "SET_LAST_SYNC":
      return { ...state, lastSync: action.payload };

    case "RESET_CONTEXT":
      return initialState;

    default:
      return state;
  }
}

const AuditContext = createContext<{
  state: AuditContextState;
  dispatch: React.Dispatch<AuditReducerAction>;
  // Logging functions
  logAction: (action: Omit<AuditLogEntry, "id" | "timestamp">) => void;
  logUserAction: (
    action: string,
    module: string,
    feature: string,
    resource: string,
    details?: any
  ) => void;
  logSystemAction: (action: string, details?: any) => void;
  logBusinessAction: (action: string, resource: string, details?: any) => void;
  logFinancialAction: (action: string, resource: string, details?: any) => void;
  logPersonalDataAction: (
    action: string,
    resource: string,
    details?: any
  ) => void;
  logAADEAction: (action: string, details?: any) => void;
  // Query functions
  getLogs: (
    filter?: AuditFilter,
    page?: number,
    pageSize?: number
  ) => Promise<void>;
  getStatistics: (filter?: AuditFilter) => Promise<void>;
  searchLogs: (searchTerm: string, filter?: AuditFilter) => Promise<void>;
  // Filter functions
  setFilter: (filter: AuditFilter) => void;
  clearFilter: () => void;
  // Export functions
  exportLogs: (format: string, filter?: AuditFilter) => Promise<string>;
  generateComplianceReport: (
    companyId: string,
    period?: string
  ) => Promise<string>;
  generateUserActivityReport: (
    userId: string,
    period?: string
  ) => Promise<string>;
  // Risk analysis
  analyzeRisk: (logEntry: AuditLogEntry) => number;
  flagHighRiskActivity: (logEntry: AuditLogEntry) => void;
  reviewFlaggedActivity: (logId: string, reviewedBy: string) => Promise<void>;
  // Compliance functions
  checkRetentionCompliance: () => Promise<boolean>;
  cleanupExpiredLogs: () => Promise<void>;
  validatePersonalDataAccess: (logEntry: AuditLogEntry) => boolean;
  validateFinancialDataAccess: (logEntry: AuditLogEntry) => boolean;
  // Settings
  updateSettings: (settings: Partial<AuditSettings>) => void;
  // Real-time features
  connectToAuditService: () => void;
  disconnectFromAuditService: () => void;
  syncAuditLogs: () => Promise<void>;
} | null>(null);

export function AuditProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(auditReducer, initialState);

  // Generate unique audit log ID
  const generateId = () =>
    `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Core logging functions
  const logAction = (action: Omit<AuditLogEntry, "id" | "timestamp">) => {
    const logEntry: AuditLogEntry = {
      ...action,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };

    // Analyze risk
    const riskScore = analyzeRisk(logEntry);
    logEntry.risk = {
      ...logEntry.risk,
      score: riskScore,
    };

    // Auto-flag high risk
    if (
      state.settings.autoFlagHighRisk &&
      riskScore >= state.settings.riskThreshold
    ) {
      logEntry.risk.flagged = true;
      logEntry.risk.requiresReview = true;
    }

    dispatch({ type: "ADD_LOG", payload: logEntry });

    // In a real implementation, send to server
    if (state.settings.enableRealTimeLogging) {
      // Send to audit service
    }
  };

  const logUserAction = (
    action: string,
    module: string,
    feature: string,
    resource: string,
    details?: any
  ) => {
    logAction({
      userId: "current-user-id", // In real implementation, get from auth context
      userEmail: "user@example.com",
      companyId: "current-company-id",
      sessionId: "current-session-id",
      action,
      module,
      feature,
      resource,
      details: {
        method: "EXECUTE",
        outcome: "SUCCESS",
        ...details,
      },
      ipAddress: "127.0.0.1",
      userAgent: navigator.userAgent,
      compliance: {
        level: "MEDIUM",
        category: "USER",
        requiresRetention: true,
        personalDataInvolved: false,
        financialDataInvolved: false,
      },
      risk: {
        score: 0,
        factors: [],
        flagged: false,
        requiresReview: false,
      },
    });
  };

  const logSystemAction = (action: string, details?: any) => {
    logAction({
      userId: "system",
      userEmail: "system@internal",
      companyId: "system",
      sessionId: "system-session",
      action,
      module: "system",
      feature: "system",
      resource: "system",
      details: {
        method: "EXECUTE",
        outcome: "SUCCESS",
        ...details,
      },
      ipAddress: "127.0.0.1",
      userAgent: "System",
      compliance: {
        level: "LOW",
        category: "SYSTEM",
        requiresRetention: true,
        personalDataInvolved: false,
        financialDataInvolved: false,
      },
      risk: {
        score: 0,
        factors: [],
        flagged: false,
        requiresReview: false,
      },
    });
  };

  const logBusinessAction = (
    action: string,
    resource: string,
    details?: any
  ) => {
    logAction({
      userId: "current-user-id",
      userEmail: "user@example.com",
      companyId: "current-company-id",
      sessionId: "current-session-id",
      action,
      module: "business",
      feature: "business",
      resource,
      details: {
        method: "EXECUTE",
        outcome: "SUCCESS",
        ...details,
      },
      ipAddress: "127.0.0.1",
      userAgent: navigator.userAgent,
      compliance: {
        level: "MEDIUM",
        category: "BUSINESS",
        requiresRetention: true,
        personalDataInvolved: false,
        financialDataInvolved: false,
      },
      risk: {
        score: 0,
        factors: [],
        flagged: false,
        requiresReview: false,
      },
    });
  };

  const logFinancialAction = (
    action: string,
    resource: string,
    details?: any
  ) => {
    logAction({
      userId: "current-user-id",
      userEmail: "user@example.com",
      companyId: "current-company-id",
      sessionId: "current-session-id",
      action,
      module: "financial",
      feature: "financial",
      resource,
      details: {
        method: "EXECUTE",
        outcome: "SUCCESS",
        ...details,
      },
      ipAddress: "127.0.0.1",
      userAgent: navigator.userAgent,
      compliance: {
        level: "HIGH",
        category: "FINANCIAL",
        requiresRetention: true,
        personalDataInvolved: false,
        financialDataInvolved: true,
      },
      risk: {
        score: 0,
        factors: [],
        flagged: false,
        requiresReview: false,
      },
    });
  };

  const logPersonalDataAction = (
    action: string,
    resource: string,
    details?: any
  ) => {
    logAction({
      userId: "current-user-id",
      userEmail: "user@example.com",
      companyId: "current-company-id",
      sessionId: "current-session-id",
      action,
      module: "personal-data",
      feature: "personal-data",
      resource,
      details: {
        method: "EXECUTE",
        outcome: "SUCCESS",
        ...details,
      },
      ipAddress: "127.0.0.1",
      userAgent: navigator.userAgent,
      compliance: {
        level: "CRITICAL",
        category: "PERSONAL_DATA",
        requiresRetention: true,
        personalDataInvolved: true,
        financialDataInvolved: false,
      },
      risk: {
        score: 0,
        factors: [],
        flagged: false,
        requiresReview: false,
      },
    });
  };

  const logAADEAction = (action: string, details?: any) => {
    logAction({
      userId: "current-user-id",
      userEmail: "user@example.com",
      companyId: "current-company-id",
      sessionId: "current-session-id",
      action,
      module: "aade",
      feature: "aade",
      resource: "aade-integration",
      details: {
        method: "EXECUTE",
        outcome: "SUCCESS",
        ...details,
      },
      ipAddress: "127.0.0.1",
      userAgent: navigator.userAgent,
      compliance: {
        level: "HIGH",
        category: "AADE",
        requiresRetention: true,
        personalDataInvolved: false,
        financialDataInvolved: true,
      },
      risk: {
        score: 0,
        factors: [],
        flagged: false,
        requiresReview: false,
      },
    });
  };

  // Query functions
  const getLogs = async (filter?: AuditFilter, page = 1, pageSize = 50) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      // In a real implementation, fetch from API
      dispatch({ type: "SET_FILTER", payload: filter || {} });
      dispatch({ type: "SET_PAGINATION", payload: { page, pageSize } });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error ? error.message : "Failed to fetch logs",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const getStatistics = async (filter?: AuditFilter) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      // In a real implementation, fetch statistics from API
      const mockStats: AuditStatistics = {
        totalEntries: 1000,
        entriesByModule: {},
        entriesByAction: {},
        entriesByOutcome: {},
        entriesByComplianceLevel: {},
        entriesByRiskScore: {},
        flaggedEntries: 50,
        personalDataEntries: 100,
        financialDataEntries: 200,
        averageRiskScore: 25,
        topUsers: [],
        topResources: [],
        complianceMetrics: {
          retentionCompliance: 95,
          personalDataCompliance: 98,
          financialDataCompliance: 99,
        },
      };
      dispatch({ type: "SET_STATISTICS", payload: mockStats });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error ? error.message : "Failed to fetch statistics",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const searchLogs = async (searchTerm: string, filter?: AuditFilter) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      // In a real implementation, search API
      const searchFilter = { ...filter, searchTerm };
      await getLogs(searchFilter);
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error ? error.message : "Failed to search logs",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // Filter functions
  const setFilter = (filter: AuditFilter) => {
    dispatch({ type: "SET_FILTER", payload: filter });
  };

  const clearFilter = () => {
    dispatch({ type: "SET_FILTER", payload: {} });
  };

  // Export functions
  const exportLogs = async (
    format: string,
    filter?: AuditFilter
  ): Promise<string> => {
    try {
      // In a real implementation, call export API
      return "Export completed successfully";
    } catch (error) {
      throw new Error("Failed to export logs");
    }
  };

  const generateComplianceReport = async (
    companyId: string,
    period?: string
  ): Promise<string> => {
    try {
      // In a real implementation, generate compliance report
      return "Compliance report generated successfully";
    } catch (error) {
      throw new Error("Failed to generate compliance report");
    }
  };

  const generateUserActivityReport = async (
    userId: string,
    period?: string
  ): Promise<string> => {
    try {
      // In a real implementation, generate user activity report
      return "User activity report generated successfully";
    } catch (error) {
      throw new Error("Failed to generate user activity report");
    }
  };

  // Risk analysis
  const analyzeRisk = (logEntry: AuditLogEntry): number => {
    let riskScore = 0;
    const factors: string[] = [];

    // Base risk by compliance level
    switch (logEntry.compliance.level) {
      case "CRITICAL":
        riskScore += 40;
        factors.push("Critical compliance level");
        break;
      case "HIGH":
        riskScore += 30;
        factors.push("High compliance level");
        break;
      case "MEDIUM":
        riskScore += 20;
        factors.push("Medium compliance level");
        break;
      case "LOW":
        riskScore += 10;
        factors.push("Low compliance level");
        break;
    }

    // Additional risk factors
    if (logEntry.compliance.personalDataInvolved) {
      riskScore += 20;
      factors.push("Personal data involved");
    }

    if (logEntry.compliance.financialDataInvolved) {
      riskScore += 15;
      factors.push("Financial data involved");
    }

    if (logEntry.details.outcome === "FAILURE") {
      riskScore += 25;
      factors.push("Failed operation");
    }

    if (logEntry.details.method === "DELETE") {
      riskScore += 15;
      factors.push("Deletion operation");
    }

    // Update risk factors
    logEntry.risk.factors = factors;

    return Math.min(riskScore, 100);
  };

  const flagHighRiskActivity = (logEntry: AuditLogEntry) => {
    // In a real implementation, flag the activity
    console.log("Flagging high risk activity:", logEntry.id);
  };

  const reviewFlaggedActivity = async (logId: string, reviewedBy: string) => {
    try {
      // In a real implementation, update review status
      console.log("Reviewing flagged activity:", logId, "by", reviewedBy);
    } catch (error) {
      throw new Error("Failed to review flagged activity");
    }
  };

  // Compliance functions
  const checkRetentionCompliance = async (): Promise<boolean> => {
    try {
      // In a real implementation, check retention compliance
      return true;
    } catch (error) {
      return false;
    }
  };

  const cleanupExpiredLogs = async () => {
    try {
      // In a real implementation, cleanup expired logs
      console.log("Cleaning up expired logs");
    } catch (error) {
      throw new Error("Failed to cleanup expired logs");
    }
  };

  const validatePersonalDataAccess = (logEntry: AuditLogEntry): boolean => {
    // In a real implementation, validate personal data access
    return logEntry.compliance.personalDataInvolved;
  };

  const validateFinancialDataAccess = (logEntry: AuditLogEntry): boolean => {
    // In a real implementation, validate financial data access
    return logEntry.compliance.financialDataInvolved;
  };

  // Settings
  const updateSettings = (settings: Partial<AuditSettings>) => {
    dispatch({ type: "SET_SETTINGS", payload: settings });
  };

  // Real-time features
  const connectToAuditService = () => {
    // In a real implementation, connect to audit service
    dispatch({ type: "SET_CONNECTION_STATUS", payload: true });
  };

  const disconnectFromAuditService = () => {
    // In a real implementation, disconnect from audit service
    dispatch({ type: "SET_CONNECTION_STATUS", payload: false });
  };

  const syncAuditLogs = async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      // In a real implementation, sync with audit service
      dispatch({ type: "SET_LAST_SYNC", payload: new Date().toISOString() });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error ? error.message : "Failed to sync audit logs",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const contextValue = {
    state,
    dispatch,
    logAction,
    logUserAction,
    logSystemAction,
    logBusinessAction,
    logFinancialAction,
    logPersonalDataAction,
    logAADEAction,
    getLogs,
    getStatistics,
    searchLogs,
    setFilter,
    clearFilter,
    exportLogs,
    generateComplianceReport,
    generateUserActivityReport,
    analyzeRisk,
    flagHighRiskActivity,
    reviewFlaggedActivity,
    checkRetentionCompliance,
    cleanupExpiredLogs,
    validatePersonalDataAccess,
    validateFinancialDataAccess,
    updateSettings,
    connectToAuditService,
    disconnectFromAuditService,
    syncAuditLogs,
  };

  return (
    <AuditContext.Provider value={contextValue}>
      {children}
    </AuditContext.Provider>
  );
}

export function useAudit() {
  const context = useContext(AuditContext);
  if (!context) {
    throw new Error("useAudit must be used within an AuditProvider");
  }
  return context;
}

export default AuditContext;
