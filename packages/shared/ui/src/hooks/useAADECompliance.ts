import { useState, useCallback, useEffect, useRef } from "react";
import { useAudit } from "../contexts/AuditContext";
import { useCompany } from "../contexts/CompanyContext";
import { useNotification } from "../contexts/NotificationContext";

interface AADEComplianceOptions {
  enableRealTimeValidation?: boolean;
  enableAutoSubmission?: boolean;
  enableBatchProcessing?: boolean;
  auditLog?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
  apiEndpoint?: string;
  testMode?: boolean;
  complianceLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  webhookUrl?: string;
}

interface AADEDocument {
  id: string;
  localId: string;
  uid?: string;
  mark?: string;
  documentType: AADEDocumentType;
  series: string;
  aa: string;
  issueDate: string;
  invType: string;
  currency: string;

  // Parties
  issuer: AADEIssuer;
  counterpart: AADECounterpart;

  // Payment details
  paymentMethods: AADEPaymentMethod[];

  // Document details
  invoiceHeader: AADEInvoiceHeader;
  invoiceDetails: AADEInvoiceDetail[];
  invoiceSummary: AADEInvoiceSummary;

  // Classifications
  incomeClassification?: AADEIncomeClassification[];
  expensesClassification?: AADEExpensesClassification[];

  // Status and metadata
  status: AADEDocumentStatus;
  submissionResult?: AADESubmissionResult;
  validationResult?: AADEValidationResult;

  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  cancelledAt?: string;
}

interface AADEIssuer {
  vatNumber: string;
  country: string;
  branch: number;
}

interface AADECounterpart {
  vatNumber?: string;
  country?: string;
  branch?: number;
  name?: string;
  address?: AADEAddress;
}

interface AADEAddress {
  street?: string;
  number?: string;
  postalCode?: string;
  city?: string;
}

interface AADEPaymentMethod {
  type: string;
  amount: number;
  paymentMethodInfo?: string;
}

interface AADEInvoiceHeader {
  series: string;
  aa: string;
  issueDate: string;
  invType: string;
  vatPaymentSuspension?: boolean;
  currency?: string;
  exchangeRate?: number;
  correlatedInvoices?: string[];
  selfPricing?: boolean;
  dispatchDate?: string;
  dispatchTime?: string;
  vehicleNumber?: string;
  movePurpose?: string;
}

interface AADEInvoiceDetail {
  lineNumber: number;
  itemCode?: string;
  itemDescr: string;
  fuelCode?: string;
  quantity: number;
  measurementUnit: string;
  invoiceDetailType: number;
  netValue: number;
  vatCategory: number;
  vatAmount: number;
  vatExemptionCategory?: number;
  dienergia?: number;
  discountOption?: boolean;
  withheldAmount?: number;
  withheldPercentCategory?: number;
  stampDutyAmount?: number;
  stampDutyPercentCategory?: number;
  feesAmount?: number;
  feesPercentCategory?: number;
  otherTaxesPercentCategory?: number;
  otherTaxesAmount?: number;
  deductionsAmount?: number;
  lineComments?: string;
  incomeClassification?: AADEIncomeClassification[];
  expensesClassification?: AADEExpensesClassification[];
}

interface AADEInvoiceSummary {
  totalNetValue: number;
  totalVatAmount: number;
  totalWithheldAmount: number;
  totalFeesAmount: number;
  totalStampDutyAmount: number;
  totalOtherTaxesAmount: number;
  totalDeductionsAmount: number;
  totalGrossValue: number;
  incomeClassification?: AADEIncomeClassification[];
  expensesClassification?: AADEExpensesClassification[];
}

interface AADEIncomeClassification {
  classificationType: string;
  classificationCategory: string;
  amount: number;
}

interface AADEExpensesClassification {
  classificationType: string;
  classificationCategory: string;
  amount: number;
  vatCategory?: string;
  vatExemptionCategory?: string;
}

interface AADESubmissionResult {
  index: number;
  invoiceUid: string;
  invoiceMark: string;
  classificationMark?: string;
  authenticationCode: string;
  transmissionFailure?: string;
  qrUrl?: string;
}

interface AADEValidationResult {
  isValid: boolean;
  errors: AADEError[];
  warnings: AADEWarning[];
  validationDate: string;
  validationRules: AADEValidationRule[];
}

interface AADEError {
  code: string;
  message: string;
  field?: string;
  severity: "critical" | "error" | "warning";
}

interface AADEWarning {
  code: string;
  message: string;
  field?: string;
  recommendation?: string;
}

interface AADEValidationRule {
  rule: string;
  description: string;
  passed: boolean;
  value?: any;
  expectedValue?: any;
}

type AADEDocumentType =
  | "1.1" // Τιμολόγιο Πώλησης
  | "1.2" // Τιμολόγιο Πώλησης / Ενδοκοινοτικές Παραδόσεις
  | "1.3" // Τιμολόγιο Πώλησης / Παραδόσεις Τρίτων Χωρών
  | "1.4" // Τιμολόγιο Πώλησης / Λοιπά
  | "1.5" // Τιμολόγιο Πώλησης / Παρεχόμενες Υπηρεσίες
  | "1.6" // Τιμολόγιο Πώλησης / Συμπληρωματικό Παραστατικό
  | "2.1" // Τιμολόγιο Παροχής
  | "2.2" // Τιμολόγιο Παροχής / Ενδοκοινοτικές Λήψεις
  | "2.3" // Τιμολόγιο Παροχής / Λήψεις Τρίτων Χωρών
  | "2.4" // Τιμολόγιο Παροχής / Λοιπά
  | "5.1" // Πιστωτικό Τιμολόγιο / Συσχετιζόμενο
  | "5.2" // Πιστωτικό Τιμολόγιο / Μη Συσχετιζόμενο
  | "6.1" // Στοιχείο Αυτοπαράδοσης
  | "6.2" // Στοιχείο Ιδιοχρησιμοποίησης
  | "7.1" // Συμβόλαιο - Έσοδο
  | "8.1" // Ενοίκια - Έσοδο
  | "8.2" // Ειδικό Στοιχείο – Έσοδο Πρακτόρων
  | "11.1" // ΑΛΠ
  | "11.2" // ΑΠΥ
  | "11.3" // Απλοποιημένο Τιμολόγιο
  | "11.4" // ΑΛΠ / Πιστωτικό
  | "11.5"; // ΑΠΥ / Πιστωτικό

type AADEDocumentStatus =
  | "draft" // Προσχέδιο
  | "validated" // Επικυρωμένο
  | "submitted" // Υποβλημένο
  | "accepted" // Αποδεκτό
  | "rejected" // Απορριφθέν
  | "cancelled" // Ακυρωμένο
  | "error" // Σφάλμα
  | "pending" // Εκκρεμές
  | "processing"; // Επεξεργασία

interface AADEComplianceState {
  documents: AADEDocument[];
  currentDocument: AADEDocument | null;
  isConnected: boolean;
  isValidating: boolean;
  isSubmitting: boolean;
  isSyncing: boolean;
  error: string | null;
  connectionStatus: AADEConnectionStatus;
  submissionQueue: AADESubmissionQueue[];
  statistics: AADEStatistics;
  settings: AADESettings;
}

interface AADEConnectionStatus {
  status: "connected" | "disconnected" | "error" | "testing";
  lastCheck: string;
  version: string;
  environment: "production" | "test";
  remainingQuota?: number;
  nextReset?: string;
}

interface AADESubmissionQueue {
  id: string;
  documentId: string;
  priority: "low" | "medium" | "high" | "urgent";
  scheduledAt: string;
  attempts: number;
  lastAttempt?: string;
  status: "pending" | "processing" | "completed" | "failed";
  error?: string;
}

interface AADEStatistics {
  totalDocuments: number;
  submittedDocuments: number;
  acceptedDocuments: number;
  rejectedDocuments: number;
  pendingDocuments: number;
  successRate: number;
  averageSubmissionTime: number;
  lastSubmission?: string;
  monthlySubmissions: Record<string, number>;
  documentTypeBreakdown: Record<AADEDocumentType, number>;
}

interface AADESettings {
  autoSubmission: boolean;
  realTimeValidation: boolean;
  batchProcessing: boolean;
  submissionSchedule: {
    enabled: boolean;
    frequency: "hourly" | "daily" | "weekly";
    time?: string;
  };
  notifications: {
    onSuccess: boolean;
    onError: boolean;
    onWarning: boolean;
  };
  backup: {
    enabled: boolean;
    frequency: "daily" | "weekly" | "monthly";
    retention: number; // days
  };
}

interface AADEComplianceResult extends AADEComplianceState {
  // Connection management
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  testConnection: () => Promise<boolean>;
  checkStatus: () => Promise<AADEConnectionStatus>;

  // Document operations
  createDocument: (data: Partial<AADEDocument>) => Promise<AADEDocument>;
  updateDocument: (
    id: string,
    data: Partial<AADEDocument>
  ) => Promise<AADEDocument>;
  deleteDocument: (id: string) => Promise<void>;
  duplicateDocument: (id: string) => Promise<AADEDocument>;

  // Validation
  validateDocument: (documentId: string) => Promise<AADEValidationResult>;
  validateDocumentData: (
    data: Partial<AADEDocument>
  ) => Promise<AADEValidationResult>;
  batchValidate: (
    documentIds: string[]
  ) => Promise<Record<string, AADEValidationResult>>;

  // Submission
  submitDocument: (documentId: string) => Promise<AADESubmissionResult>;
  submitBatch: (documentIds: string[]) => Promise<AADESubmissionResult[]>;
  cancelSubmission: (documentId: string) => Promise<void>;
  resubmitDocument: (documentId: string) => Promise<AADESubmissionResult>;

  // Queue management
  addToQueue: (
    documentId: string,
    priority?: "low" | "medium" | "high" | "urgent"
  ) => void;
  removeFromQueue: (queueId: string) => void;
  processQueue: () => Promise<void>;
  clearQueue: () => void;

  // Document retrieval
  getDocument: (id: string) => AADEDocument | null;
  getDocumentByUid: (uid: string) => AADEDocument | null;
  getDocumentsByStatus: (status: AADEDocumentStatus) => AADEDocument[];
  getDocumentsByType: (type: AADEDocumentType) => AADEDocument[];
  getDocumentsByDateRange: (
    startDate: string,
    endDate: string
  ) => AADEDocument[];

  // Search and filtering
  searchDocuments: (query: string) => AADEDocument[];
  filterDocuments: (filters: AADEDocumentFilter) => AADEDocument[];

  // Reporting and analytics
  generateComplianceReport: (period: string) => Promise<AADEComplianceReport>;
  getSubmissionStatistics: () => AADEStatistics;
  exportDocuments: (
    format: "xml" | "json" | "csv",
    documentIds?: string[]
  ) => Promise<string>;

  // Settings and configuration
  updateSettings: (settings: Partial<AADESettings>) => Promise<void>;
  resetSettings: () => Promise<void>;

  // Sync and backup
  syncWithAADE: () => Promise<void>;
  backupDocuments: () => Promise<string>;
  restoreFromBackup: (backupData: string) => Promise<void>;

  // Utility
  refresh: () => Promise<void>;
  clearErrors: () => void;
}

interface AADEDocumentFilter {
  status?: AADEDocumentStatus[];
  type?: AADEDocumentType[];
  dateRange?: {
    start: string;
    end: string;
  };
  amountRange?: {
    min: number;
    max: number;
  };
  issuer?: string;
  counterpart?: string;
  hasErrors?: boolean;
  submitted?: boolean;
}

interface AADEComplianceReport {
  period: string;
  totalDocuments: number;
  submittedDocuments: number;
  acceptedDocuments: number;
  rejectedDocuments: number;
  complianceRate: number;
  issuesFound: AADEIssue[];
  recommendations: string[];
  generatedAt: string;
}

interface AADEIssue {
  documentId: string;
  type: "error" | "warning" | "compliance";
  description: string;
  resolution?: string;
  priority: "low" | "medium" | "high" | "critical";
}

/**
 * Enhanced AADE compliance hook for Greek tax authority integration
 * Provides complete document validation, submission, and compliance management
 */
export function useAADECompliance(
  options: AADEComplianceOptions = {}
): AADEComplianceResult {
  const { logAction } = useAudit();
  const { state: companyState } = useCompany();
  const { addNotification } = useNotification();

  const {
    enableRealTimeValidation = true,
    enableAutoSubmission = false,
    enableBatchProcessing = true,
    auditLog = true,
    retryAttempts = 3,
    retryDelay = 5000,
    apiEndpoint = "/api/aade",
    testMode = false,
    complianceLevel = "CRITICAL",
    webhookUrl,
  } = options;

  const [state, setState] = useState<AADEComplianceState>({
    documents: [],
    currentDocument: null,
    isConnected: false,
    isValidating: false,
    isSubmitting: false,
    isSyncing: false,
    error: null,
    connectionStatus: {
      status: "disconnected",
      lastCheck: "",
      version: "",
      environment: testMode ? "test" : "production",
    },
    submissionQueue: [],
    statistics: {
      totalDocuments: 0,
      submittedDocuments: 0,
      acceptedDocuments: 0,
      rejectedDocuments: 0,
      pendingDocuments: 0,
      successRate: 0,
      averageSubmissionTime: 0,
      monthlySubmissions: {},
      documentTypeBreakdown: {} as Record<AADEDocumentType, number>,
    },
    settings: {
      autoSubmission: enableAutoSubmission,
      realTimeValidation: enableRealTimeValidation,
      batchProcessing: enableBatchProcessing,
      submissionSchedule: {
        enabled: false,
        frequency: "daily",
      },
      notifications: {
        onSuccess: true,
        onError: true,
        onWarning: true,
      },
      backup: {
        enabled: true,
        frequency: "daily",
        retention: 30,
      },
    },
  });

  const queueProcessorRef = useRef<NodeJS.Timeout | null>(null);
  const retryRef = useRef<Record<string, NodeJS.Timeout>>({});

  // API helper
  const apiCall = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      const response = await fetch(`${apiEndpoint}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "X-Company-ID": companyState.currentCompany?.id || "",
          "X-Environment": testMode ? "test" : "production",
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`AADE API Error: ${response.statusText}`);
      }

      return response.json();
    },
    [apiEndpoint, companyState.currentCompany?.id, testMode]
  );

  // Audit logging helper
  const auditAADEOperation = useCallback(
    (operation: string, data?: any, error?: Error) => {
      if (!auditLog) return;

      logAction({
        userId: "current_user",
        userEmail: "user@example.com",
        companyId: companyState.currentCompany?.id || "unknown",
        sessionId: "current_session",
        action: `aade.${operation}`,
        module: "compliance",
        feature: "aade_integration",
        resource: "aade_document",
        resourceId: data?.id || data?.documentId || "unknown",
        details: {
          method: operation.includes("delete")
            ? "DELETE"
            : operation.includes("create") || operation.includes("submit")
            ? "CREATE"
            : operation.includes("update")
            ? "UPDATE"
            : "READ",
          outcome: error ? "FAILURE" : "SUCCESS",
          errorMessage: error?.message,
          metadata: {
            operation,
            environment: testMode ? "test" : "production",
            data: data ? JSON.stringify(data) : undefined,
          },
        },
        ipAddress: "127.0.0.1",
        userAgent: navigator.userAgent,
        compliance: {
          level: "CRITICAL",
          category: "TAX",
          requiresRetention: true,
          personalDataInvolved: true,
          financialDataInvolved: true,
        },
        risk: {
          score: 90,
          factors: [
            "tax_authority_integration",
            "financial_compliance",
            "government_reporting",
          ],
          flagged: true,
          requiresReview: true,
        },
      });
    },
    [auditLog, logAction, companyState.currentCompany?.id, testMode]
  );

  // Connection management
  const connect = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isConnected: false, error: null }));

      const connectionResult = await apiCall("/connect", {
        method: "POST",
        body: JSON.stringify({
          companyId: companyState.currentCompany?.id,
          environment: testMode ? "test" : "production",
        }),
      });

      setState((prev) => ({
        ...prev,
        isConnected: true,
        connectionStatus: {
          ...connectionResult,
          status: "connected",
          lastCheck: new Date().toISOString(),
        },
      }));

      auditAADEOperation("connect", connectionResult);

      addNotification({
        type: "success",
        title: "Σύνδεση AADE",
        message: "Η σύνδεση με το AADE ολοκληρώθηκε επιτυχώς",
        priority: "high",
        category: "compliance",
        isPersistent: false,
        autoClose: true,
        duration: 5000,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isConnected: false,
        error: (error as Error).message,
        connectionStatus: {
          ...prev.connectionStatus,
          status: "error",
          lastCheck: new Date().toISOString(),
        },
      }));

      auditAADEOperation("connect", undefined, error as Error);

      addNotification({
        type: "error",
        title: "Σφάλμα σύνδεσης AADE",
        message: `Αποτυχία σύνδεσης: ${(error as Error).message}`,
        priority: "high",
        category: "compliance",
        isPersistent: true,
        autoClose: false,
      });

      throw error;
    }
  }, [
    apiCall,
    companyState.currentCompany?.id,
    testMode,
    auditAADEOperation,
    addNotification,
  ]);

  // Document validation
  const validateDocument = useCallback(
    async (documentId: string): Promise<AADEValidationResult> => {
      const document = state.documents.find((d) => d.id === documentId);
      if (!document) {
        throw new Error("Document not found");
      }

      setState((prev) => ({ ...prev, isValidating: true, error: null }));

      try {
        const validationResult = await apiCall(`/validate/${documentId}`, {
          method: "POST",
        });

        setState((prev) => ({
          ...prev,
          documents: prev.documents.map((d) =>
            d.id === documentId
              ? {
                  ...d,
                  validationResult,
                  status: validationResult.isValid ? "validated" : "error",
                }
              : d
          ),
          isValidating: false,
        }));

        auditAADEOperation("validate", { documentId, validationResult });

        return validationResult;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isValidating: false,
          error: (error as Error).message,
        }));
        auditAADEOperation("validate", { documentId }, error as Error);
        throw error;
      }
    },
    [state.documents, apiCall, auditAADEOperation]
  );

  // Document submission
  const submitDocument = useCallback(
    async (documentId: string): Promise<AADESubmissionResult> => {
      const document = state.documents.find((d) => d.id === documentId);
      if (!document) {
        throw new Error("Document not found");
      }

      if (!state.isConnected) {
        throw new Error("Not connected to AADE");
      }

      setState((prev) => ({ ...prev, isSubmitting: true, error: null }));

      try {
        const submissionResult = await apiCall(`/submit/${documentId}`, {
          method: "POST",
        });

        setState((prev) => ({
          ...prev,
          documents: prev.documents.map((d) =>
            d.id === documentId
              ? {
                  ...d,
                  submissionResult,
                  status: "submitted",
                  uid: submissionResult.invoiceUid,
                  mark: submissionResult.invoiceMark,
                  submittedAt: new Date().toISOString(),
                }
              : d
          ),
          isSubmitting: false,
          statistics: {
            ...prev.statistics,
            submittedDocuments: prev.statistics.submittedDocuments + 1,
            successRate:
              ((prev.statistics.submittedDocuments + 1) /
                prev.statistics.totalDocuments) *
              100,
          },
        }));

        auditAADEOperation("submit", { documentId, submissionResult });

        addNotification({
          type: "success",
          title: "Υποβολή AADE",
          message: `Το έγγραφο υποβλήθηκε επιτυχώς με UID: ${submissionResult.invoiceUid}`,
          priority: "high",
          category: "compliance",
          isPersistent: false,
          autoClose: true,
          duration: 7000,
        });

        return submissionResult;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          error: (error as Error).message,
          documents: prev.documents.map((d) =>
            d.id === documentId ? { ...d, status: "error" } : d
          ),
        }));

        auditAADEOperation("submit", { documentId }, error as Error);

        addNotification({
          type: "error",
          title: "Σφάλμα υποβολής AADE",
          message: `Αποτυχία υποβολής: ${(error as Error).message}`,
          priority: "high",
          category: "compliance",
          isPersistent: false,
          autoClose: true,
          duration: 7000,
        });

        throw error;
      }
    },
    [
      state.documents,
      state.isConnected,
      apiCall,
      auditAADEOperation,
      addNotification,
    ]
  );

  // Queue management
  const addToQueue = useCallback(
    (
      documentId: string,
      priority: "low" | "medium" | "high" | "urgent" = "medium"
    ) => {
      const queueItem: AADESubmissionQueue = {
        id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        documentId,
        priority,
        scheduledAt: new Date().toISOString(),
        attempts: 0,
        status: "pending",
      };

      setState((prev) => ({
        ...prev,
        submissionQueue: [...prev.submissionQueue, queueItem].sort((a, b) => {
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }),
      }));

      auditAADEOperation("queue_add", { documentId, priority });
    },
    [auditAADEOperation]
  );

  const processQueue = useCallback(async () => {
    const pendingItems = state.submissionQueue.filter(
      (item) => item.status === "pending"
    );

    for (const item of pendingItems.slice(0, 5)) {
      // Process max 5 at a time
      try {
        setState((prev) => ({
          ...prev,
          submissionQueue: prev.submissionQueue.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: "processing",
                  attempts: q.attempts + 1,
                  lastAttempt: new Date().toISOString(),
                }
              : q
          ),
        }));

        await submitDocument(item.documentId);

        setState((prev) => ({
          ...prev,
          submissionQueue: prev.submissionQueue.map((q) =>
            q.id === item.id ? { ...q, status: "completed" } : q
          ),
        }));
      } catch (error) {
        const shouldRetry = item.attempts < retryAttempts;

        setState((prev) => ({
          ...prev,
          submissionQueue: prev.submissionQueue.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: shouldRetry ? "pending" : "failed",
                  error: (error as Error).message,
                }
              : q
          ),
        }));

        if (shouldRetry) {
          // Schedule retry
          retryRef.current[item.id] = setTimeout(() => {
            delete retryRef.current[item.id];
          }, retryDelay);
        }
      }
    }
  }, [state.submissionQueue, submitDocument, retryAttempts, retryDelay]);

  // Auto-process queue
  useEffect(() => {
    if (
      enableBatchProcessing &&
      state.submissionQueue.some((item) => item.status === "pending")
    ) {
      queueProcessorRef.current = setTimeout(() => {
        processQueue();
      }, 2000);
    }

    return () => {
      if (queueProcessorRef.current) {
        clearTimeout(queueProcessorRef.current);
      }
    };
  }, [enableBatchProcessing, state.submissionQueue, processQueue]);

  // Cleanup
  useEffect(() => {
    return () => {
      Object.values(retryRef.current).forEach((timeout) =>
        clearTimeout(timeout)
      );
      if (queueProcessorRef.current) {
        clearTimeout(queueProcessorRef.current);
      }
    };
  }, []);

  return {
    ...state,
    connect,
    disconnect: async () => {
      await apiCall("/disconnect", { method: "POST" });
      setState((prev) => ({
        ...prev,
        isConnected: false,
        connectionStatus: { ...prev.connectionStatus, status: "disconnected" },
      }));
    },
    testConnection: async () => {
      try {
        await apiCall("/test");
        return true;
      } catch {
        return false;
      }
    },
    checkStatus: async () => {
      const status = await apiCall("/status");
      setState((prev) => ({ ...prev, connectionStatus: status }));
      return status;
    },
    createDocument: async (data: Partial<AADEDocument>) => {
      const document = await apiCall("/documents", {
        method: "POST",
        body: JSON.stringify(data),
      });

      setState((prev) => ({
        ...prev,
        documents: [...prev.documents, document],
        statistics: {
          ...prev.statistics,
          totalDocuments: prev.statistics.totalDocuments + 1,
        },
      }));

      return document;
    },
    updateDocument: async (id: string, data: Partial<AADEDocument>) => {
      const updated = await apiCall(`/documents/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });

      setState((prev) => ({
        ...prev,
        documents: prev.documents.map((d) => (d.id === id ? updated : d)),
      }));

      return updated;
    },
    deleteDocument: async (id: string) => {
      await apiCall(`/documents/${id}`, { method: "DELETE" });
      setState((prev) => ({
        ...prev,
        documents: prev.documents.filter((d) => d.id !== id),
      }));
    },
    duplicateDocument: async (id: string) => {
      const original = state.documents.find((d) => d.id === id);
      if (!original) throw new Error("Document not found");

      const duplicate = {
        ...original,
        id: undefined,
        uid: undefined,
        mark: undefined,
        status: "draft" as AADEDocumentStatus,
        submissionResult: undefined,
        submittedAt: undefined,
      };

      return await apiCall("/documents", {
        method: "POST",
        body: JSON.stringify(duplicate),
      });
    },
    validateDocument,
    validateDocumentData: async (data: Partial<AADEDocument>) => {
      return await apiCall("/validate", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    batchValidate: async (documentIds: string[]) => {
      return await apiCall("/validate/batch", {
        method: "POST",
        body: JSON.stringify({ documentIds }),
      });
    },
    submitDocument,
    submitBatch: async (documentIds: string[]) => {
      const results = [];
      for (const id of documentIds) {
        try {
          const result = await submitDocument(id);
          results.push(result);
        } catch (error) {
          console.error(`Failed to submit document ${id}:`, error);
        }
      }
      return results;
    },
    cancelSubmission: async (documentId: string) => {
      await apiCall(`/cancel/${documentId}`, { method: "POST" });
      setState((prev) => ({
        ...prev,
        documents: prev.documents.map((d) =>
          d.id === documentId
            ? {
                ...d,
                status: "cancelled",
                cancelledAt: new Date().toISOString(),
              }
            : d
        ),
      }));
    },
    resubmitDocument: async (documentId: string) => {
      return await submitDocument(documentId);
    },
    addToQueue,
    removeFromQueue: (queueId: string) => {
      setState((prev) => ({
        ...prev,
        submissionQueue: prev.submissionQueue.filter((q) => q.id !== queueId),
      }));
    },
    processQueue,
    clearQueue: () => {
      setState((prev) => ({ ...prev, submissionQueue: [] }));
    },
    getDocument: (id: string) => {
      return state.documents.find((d) => d.id === id) || null;
    },
    getDocumentByUid: (uid: string) => {
      return state.documents.find((d) => d.uid === uid) || null;
    },
    getDocumentsByStatus: (status: AADEDocumentStatus) => {
      return state.documents.filter((d) => d.status === status);
    },
    getDocumentsByType: (type: AADEDocumentType) => {
      return state.documents.filter((d) => d.documentType === type);
    },
    getDocumentsByDateRange: (startDate: string, endDate: string) => {
      return state.documents.filter((d) => {
        const docDate = new Date(d.issueDate);
        return docDate >= new Date(startDate) && docDate <= new Date(endDate);
      });
    },
    searchDocuments: (query: string) => {
      return state.documents.filter(
        (d) =>
          d.series.toLowerCase().includes(query.toLowerCase()) ||
          d.aa.toLowerCase().includes(query.toLowerCase()) ||
          d.issuer.vatNumber.includes(query) ||
          d.counterpart?.name?.toLowerCase().includes(query.toLowerCase())
      );
    },
    filterDocuments: (filters: AADEDocumentFilter) => {
      return state.documents.filter((doc) => {
        if (filters.status && !filters.status.includes(doc.status))
          return false;
        if (filters.type && !filters.type.includes(doc.documentType))
          return false;
        if (filters.dateRange) {
          const docDate = new Date(doc.issueDate);
          if (
            docDate < new Date(filters.dateRange.start) ||
            docDate > new Date(filters.dateRange.end)
          ) {
            return false;
          }
        }
        if (filters.amountRange) {
          const amount = doc.invoiceSummary.totalGrossValue;
          if (
            amount < filters.amountRange.min ||
            amount > filters.amountRange.max
          ) {
            return false;
          }
        }
        if (filters.issuer && !doc.issuer.vatNumber.includes(filters.issuer))
          return false;
        if (
          filters.counterpart &&
          !doc.counterpart?.vatNumber?.includes(filters.counterpart)
        )
          return false;
        if (filters.hasErrors !== undefined) {
          const hasErrors = (doc.validationResult?.errors?.length || 0) > 0;
          if (hasErrors !== filters.hasErrors) return false;
        }
        if (filters.submitted !== undefined) {
          const isSubmitted =
            doc.status === "submitted" || doc.status === "accepted";
          if (isSubmitted !== filters.submitted) return false;
        }
        return true;
      });
    },
    generateComplianceReport: async (period: string) => {
      return await apiCall(`/reports/compliance?period=${period}`);
    },
    getSubmissionStatistics: () => state.statistics,
    exportDocuments: async (
      format: "xml" | "json" | "csv",
      documentIds?: string[]
    ) => {
      const params = new URLSearchParams({ format });
      if (documentIds) {
        params.append("ids", documentIds.join(","));
      }
      return await apiCall(`/export?${params.toString()}`);
    },
    updateSettings: async (settings: Partial<AADESettings>) => {
      setState((prev) => ({
        ...prev,
        settings: { ...prev.settings, ...settings },
      }));
    },
    resetSettings: async () => {
      setState((prev) => ({
        ...prev,
        settings: {
          autoSubmission: false,
          realTimeValidation: true,
          batchProcessing: true,
          submissionSchedule: { enabled: false, frequency: "daily" },
          notifications: { onSuccess: true, onError: true, onWarning: true },
          backup: { enabled: true, frequency: "daily", retention: 30 },
        },
      }));
    },
    syncWithAADE: async () => {
      setState((prev) => ({ ...prev, isSyncing: true }));
      try {
        const syncResult = await apiCall("/sync", { method: "POST" });
        auditAADEOperation("sync", syncResult);
      } finally {
        setState((prev) => ({ ...prev, isSyncing: false }));
      }
    },
    backupDocuments: async () => {
      return await apiCall("/backup", { method: "POST" });
    },
    restoreFromBackup: async (backupData: string) => {
      await apiCall("/restore", {
        method: "POST",
        body: JSON.stringify({ backupData }),
      });
    },
    refresh: async () => {
      const documents = await apiCall("/documents");
      setState((prev) => ({ ...prev, documents }));
    },
    clearErrors: () => {
      setState((prev) => ({ ...prev, error: null }));
    },
  };
}

export default useAADECompliance;
