import { useState, useCallback, useRef } from "react";
import { useAudit } from "../contexts/AuditContext";
import { useCompany } from "../contexts/CompanyContext";
import { useNotification } from "../contexts/NotificationContext";
import { useGreekValidation } from "./useGreekValidation";

interface GreekDocumentProcessingOptions {
  enableOCR?: boolean;
  enableAutoValidation?: boolean;
  enableAADEIntegration?: boolean;
  auditLog?: boolean;
  autoCorrect?: boolean;
  complianceLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  ocrEndpoint?: string;
  validationEndpoint?: string;
  aadeEndpoint?: string;
  supportedLanguages?: string[];
  confidenceThreshold?: number;
}

interface ProcessedDocument {
  id: string;
  type: GreekDocumentType;
  status: ProcessingStatus;
  originalFile: ProcessedFile;
  extractedData: ExtractedDocumentData;
  validation: DocumentValidation;
  aadeData?: AADEDocumentData;
  processing: ProcessingMetadata;
  confidence: number;
  errors: ProcessingError[];
  warnings: ProcessingWarning[];
}

interface ProcessedFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  checksum: string;
}

interface ExtractedDocumentData {
  // Document identification
  documentNumber: string;
  documentSeries?: string;
  issueDate: string;
  dueDate?: string;

  // Issuer information
  issuer: GreekBusinessEntity;

  // Recipient information
  recipient: GreekBusinessEntity;

  // Financial data
  lineItems: DocumentLineItem[];
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  currency: string;

  // VAT breakdown
  vatBreakdown: VATBreakdown[];

  // Payment information
  paymentMethod?: string;
  paymentTerms?: string;
  bankAccount?: string;

  // Additional fields
  notes?: string;
  references?: string[];
  customFields: Record<string, any>;
}

interface GreekBusinessEntity {
  name: string;
  afm: string;
  doy: string;
  address: GreekAddress;
  phone?: string;
  email?: string;
  website?: string;
  legalForm?: string;
  activity?: string;
}

interface GreekAddress {
  street: string;
  number?: string;
  city: string;
  postalCode: string;
  region: string;
  country: string;
}

interface DocumentLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  unit?: string;
  productCode?: string;
  category?: string;
}

interface VATBreakdown {
  rate: number;
  netAmount: number;
  vatAmount: number;
  totalAmount: number;
  exemptionReason?: string;
}

interface DocumentValidation {
  isValid: boolean;
  confidence: number;
  validationResults: ValidationResult[];
  greekCompliance: GreekComplianceValidation;
  mathematicalValidation: MathematicalValidation;
  businessRules: BusinessRuleValidation[];
}

interface ValidationResult {
  field: string;
  isValid: boolean;
  message: string;
  severity: "error" | "warning" | "info";
  suggestedValue?: any;
}

interface GreekComplianceValidation {
  afmValidation: {
    issuerValid: boolean;
    recipientValid: boolean;
    errors: string[];
  };
  doyValidation: {
    issuerValid: boolean;
    recipientValid: boolean;
    errors: string[];
  };
  vatValidation: {
    ratesValid: boolean;
    calculationsValid: boolean;
    exemptionsValid: boolean;
    errors: string[];
  };
  documentTypeCompliance: {
    isCompliant: boolean;
    requiredFields: string[];
    missingFields: string[];
  };
}

interface MathematicalValidation {
  lineItemsValid: boolean;
  vatCalculationsValid: boolean;
  totalsValid: boolean;
  discrepancies: {
    field: string;
    expected: number;
    actual: number;
    difference: number;
  }[];
}

interface BusinessRuleValidation {
  rule: string;
  isValid: boolean;
  message: string;
  severity: "error" | "warning";
}

interface AADEDocumentData {
  mark: string;
  uid?: string;
  authenticationCode?: string;
  transmissionFailure?: string;
  qrUrl?: string;
  submissionDate?: string;
  statusDate?: string;
  cancellationDate?: string;
  paymentMethods?: AADEPaymentMethod[];
  incomeClassification?: IncomeClassification[];
  expensesClassification?: ExpensesClassification[];
}

interface AADEPaymentMethod {
  type: string;
  amount: number;
  paymentMethodInfo?: string;
}

interface IncomeClassification {
  classificationType: string;
  classificationCategory: string;
  amount: number;
}

interface ExpensesClassification {
  classificationType: string;
  classificationCategory: string;
  amount: number;
  vatCategory?: string;
  vatExemptionCategory?: string;
}

interface ProcessingMetadata {
  startTime: string;
  endTime?: string;
  duration?: number;
  ocrEngine?: string;
  ocrVersion?: string;
  processingSteps: ProcessingStep[];
  performance: {
    ocrTime: number;
    validationTime: number;
    aadeTime?: number;
    totalTime: number;
  };
}

interface ProcessingStep {
  step: string;
  status: "pending" | "running" | "completed" | "failed";
  startTime: string;
  endTime?: string;
  result?: any;
  error?: string;
}

interface ProcessingError {
  code: string;
  message: string;
  field?: string;
  severity: "error" | "warning";
  suggestion?: string;
}

interface ProcessingWarning {
  code: string;
  message: string;
  field?: string;
  suggestion?: string;
}

type GreekDocumentType =
  | "timologio_polisis" // Τιμολόγιο Πώλησης
  | "timologio_agorastis" // Τιμολόγιο Αγοραστή
  | "apodeixi_lianikh" // Απόδειξη Λιανικής
  | "apodeixi_paragoghs" // Απόδειξη Παραγωγής
  | "deltio_apostolis" // Δελτίο Αποστολής
  | "pistotiko" // Πιστωτικό
  | "chreotiko" // Χρεωστικό
  | "other";

type ProcessingStatus =
  | "pending" // Αναμονή
  | "processing" // Επεξεργασία
  | "completed" // Ολοκληρώθηκε
  | "failed" // Αποτυχία
  | "validated" // Επικυρώθηκε
  | "submitted" // Υποβλήθηκε
  | "rejected"; // Απορρίφθηκε

interface DocumentProcessingState {
  documents: ProcessedDocument[];
  currentDocument: ProcessedDocument | null;
  isProcessing: boolean;
  isValidating: boolean;
  isSubmitting: boolean;
  error: string | null;
  progress: ProcessingProgress;
  statistics: ProcessingStatistics;
}

interface ProcessingProgress {
  currentStep: string;
  completed: number;
  total: number;
  percentage: number;
  estimatedTimeRemaining?: number;
}

interface ProcessingStatistics {
  totalProcessed: number;
  successful: number;
  failed: number;
  averageProcessingTime: number;
  averageConfidence: number;
  documentTypeBreakdown: Record<GreekDocumentType, number>;
}

interface DocumentProcessingResult extends DocumentProcessingState {
  // Processing operations
  processDocument: (file: File) => Promise<ProcessedDocument>;
  processMultipleDocuments: (files: File[]) => Promise<ProcessedDocument[]>;
  reprocessDocument: (documentId: string) => Promise<ProcessedDocument>;

  // Validation operations
  validateDocument: (documentId: string) => Promise<DocumentValidation>;
  validateExtractedData: (
    data: ExtractedDocumentData
  ) => Promise<DocumentValidation>;
  autoCorrectDocument: (documentId: string) => Promise<ProcessedDocument>;

  // Data operations
  updateExtractedData: (
    documentId: string,
    data: Partial<ExtractedDocumentData>
  ) => Promise<void>;
  exportToFormat: (
    documentId: string,
    format: "xml" | "json" | "pdf"
  ) => Promise<string>;

  // AADE operations
  submitToAADE: (documentId: string) => Promise<AADEDocumentData>;
  checkAADEStatus: (documentId: string) => Promise<AADEDocumentData>;
  cancelAADESubmission: (documentId: string) => Promise<void>;

  // Document operations
  getDocumentById: (id: string) => ProcessedDocument | null;
  deleteDocument: (documentId: string) => Promise<void>;
  duplicateDocument: (documentId: string) => Promise<ProcessedDocument>;

  // Search and filtering
  searchDocuments: (query: string) => ProcessedDocument[];
  filterByType: (type: GreekDocumentType) => ProcessedDocument[];
  filterByStatus: (status: ProcessingStatus) => ProcessedDocument[];
  filterByDateRange: (
    startDate: string,
    endDate: string
  ) => ProcessedDocument[];

  // Utility operations
  clearProcessedDocuments: () => void;
  getProcessingStatistics: () => ProcessingStatistics;
  refreshDocument: (documentId: string) => Promise<ProcessedDocument>;
}

/**
 * Enhanced Greek document processing hook
 * Provides OCR, validation, and AADE integration for Greek business documents
 */
export function useGreekDocumentProcessing(
  options: GreekDocumentProcessingOptions = {}
): DocumentProcessingResult {
  const { logAction } = useAudit();
  const { state: companyState } = useCompany();
  const { addNotification } = useNotification();
  const { validateAFM, validateDOY } = useGreekValidation();

  const {
    enableOCR = true,
    enableAutoValidation = true,
    enableAADEIntegration = true,
    auditLog = true,
    autoCorrect = false,
    complianceLevel = "HIGH",
    ocrEndpoint = "/api/ocr/process",
    validationEndpoint = "/api/validation/document",
    aadeEndpoint = "/api/aade",
    supportedLanguages = ["el", "en"],
    confidenceThreshold = 0.8,
  } = options;

  const [state, setState] = useState<DocumentProcessingState>({
    documents: [],
    currentDocument: null,
    isProcessing: false,
    isValidating: false,
    isSubmitting: false,
    error: null,
    progress: {
      currentStep: "",
      completed: 0,
      total: 0,
      percentage: 0,
    },
    statistics: {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      averageProcessingTime: 0,
      averageConfidence: 0,
      documentTypeBreakdown: {} as Record<GreekDocumentType, number>,
    },
  });

  const processingRef = useRef<Map<string, AbortController>>(new Map());

  // API helper
  const apiCall = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      const response = await fetch(endpoint, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "X-Company-ID": companyState.currentCompany?.id || "",
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      return response.json();
    },
    [companyState.currentCompany?.id]
  );

  // Audit logging helper
  const auditDocumentOperation = useCallback(
    (operation: string, documentData?: any, error?: Error) => {
      if (!auditLog) return;

      logAction({
        userId: "current_user",
        userEmail: "user@example.com",
        companyId: companyState.currentCompany?.id || "unknown",
        sessionId: "current_session",
        action: `document_processing.${operation}`,
        module: "documents",
        feature: "greek_document_processing",
        resource: "greek_document",
        resourceId: documentData?.id || "unknown",
        details: {
          method: operation.includes("delete")
            ? "DELETE"
            : operation.includes("create") || operation.includes("process")
            ? "CREATE"
            : operation.includes("update")
            ? "UPDATE"
            : "READ",
          outcome: error ? "FAILURE" : "SUCCESS",
          errorMessage: error?.message,
          metadata: {
            operation,
            documentType: documentData?.type,
            confidence: documentData?.confidence,
            processing: documentData?.processing,
          },
        },
        ipAddress: "127.0.0.1",
        userAgent: navigator.userAgent,
        compliance: {
          level: "CRITICAL",
          category: "FINANCIAL",
          requiresRetention: true,
          personalDataInvolved: true,
          financialDataInvolved: true,
        },
        risk: {
          score: 80,
          factors: [
            "financial_document_processing",
            "tax_document",
            "aade_integration",
          ],
          flagged: complianceLevel === "CRITICAL" || !!error,
          requiresReview: true,
        },
      });
    },
    [auditLog, logAction, companyState.currentCompany?.id, complianceLevel]
  );

  // Document type detection
  const detectDocumentType = useCallback(
    (extractedText: string): GreekDocumentType => {
      const text = extractedText.toLowerCase();

      if (text.includes("τιμολόγιο πώλησης") || text.includes("invoice")) {
        return "timologio_polisis";
      }
      if (text.includes("τιμολόγιο αγοραστή")) {
        return "timologio_agorastis";
      }
      if (
        text.includes("απόδειξη λιανικής") ||
        text.includes("retail receipt")
      ) {
        return "apodeixi_lianikh";
      }
      if (text.includes("απόδειξη παραγωγής")) {
        return "apodeixi_paragoghs";
      }
      if (text.includes("δελτίο αποστολής") || text.includes("delivery note")) {
        return "deltio_apostolis";
      }
      if (text.includes("πιστωτικό") || text.includes("credit note")) {
        return "pistotiko";
      }
      if (text.includes("χρεωστικό") || text.includes("debit note")) {
        return "chreotiko";
      }

      return "other";
    },
    []
  );

  // Greek entity validation
  const validateGreekEntity = useCallback(
    (entity: GreekBusinessEntity): string[] => {
      const errors: string[] = [];

      if (!validateAFM(entity.afm)) {
        errors.push(`Μη έγκυρο ΑΦΜ: ${entity.afm}`);
      }

      if (!validateDOY(entity.doy)) {
        errors.push(`Μη έγκυρος κωδικός ΔΟΥ: ${entity.doy}`);
      }

      if (!entity.name || entity.name.trim().length === 0) {
        errors.push("Η επωνυμία είναι υποχρεωτική");
      }

      return errors;
    },
    [validateAFM, validateDOY]
  );

  // Mathematical validation
  const validateMathematics = useCallback(
    (data: ExtractedDocumentData): MathematicalValidation => {
      const discrepancies: any[] = [];
      let lineItemsValid = true;
      let vatCalculationsValid = true;
      let totalsValid = true;

      // Validate line items
      data.lineItems.forEach((item, index) => {
        const expectedVatAmount =
          item.quantity * item.unitPrice * (item.vatRate / 100);
        const expectedTotalAmount =
          item.quantity * item.unitPrice + expectedVatAmount;

        if (Math.abs(item.vatAmount - expectedVatAmount) > 0.01) {
          lineItemsValid = false;
          discrepancies.push({
            field: `lineItems[${index}].vatAmount`,
            expected: expectedVatAmount,
            actual: item.vatAmount,
            difference: item.vatAmount - expectedVatAmount,
          });
        }

        if (Math.abs(item.totalAmount - expectedTotalAmount) > 0.01) {
          lineItemsValid = false;
          discrepancies.push({
            field: `lineItems[${index}].totalAmount`,
            expected: expectedTotalAmount,
            actual: item.totalAmount,
            difference: item.totalAmount - expectedTotalAmount,
          });
        }
      });

      // Validate VAT calculations
      const calculatedVatAmount = data.lineItems.reduce(
        (sum, item) => sum + item.vatAmount,
        0
      );
      if (Math.abs(data.vatAmount - calculatedVatAmount) > 0.01) {
        vatCalculationsValid = false;
        discrepancies.push({
          field: "vatAmount",
          expected: calculatedVatAmount,
          actual: data.vatAmount,
          difference: data.vatAmount - calculatedVatAmount,
        });
      }

      // Validate totals
      const calculatedSubtotal = data.lineItems.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      );
      if (Math.abs(data.subtotal - calculatedSubtotal) > 0.01) {
        totalsValid = false;
        discrepancies.push({
          field: "subtotal",
          expected: calculatedSubtotal,
          actual: data.subtotal,
          difference: data.subtotal - calculatedSubtotal,
        });
      }

      const calculatedTotal = data.subtotal + data.vatAmount;
      if (Math.abs(data.totalAmount - calculatedTotal) > 0.01) {
        totalsValid = false;
        discrepancies.push({
          field: "totalAmount",
          expected: calculatedTotal,
          actual: data.totalAmount,
          difference: data.totalAmount - calculatedTotal,
        });
      }

      return {
        lineItemsValid,
        vatCalculationsValid,
        totalsValid,
        discrepancies,
      };
    },
    []
  );

  // Process document
  const processDocument = useCallback(
    async (file: File): Promise<ProcessedDocument> => {
      const documentId = `doc_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const abortController = new AbortController();
      processingRef.current.set(documentId, abortController);

      setState((prev) => ({
        ...prev,
        isProcessing: true,
        error: null,
        progress: {
          currentStep: "Προετοιμασία επεξεργασίας...",
          completed: 0,
          total: 4,
          percentage: 0,
        },
      }));

      try {
        const startTime = Date.now();
        const processingSteps: ProcessingStep[] = [];

        // Step 1: File upload and OCR
        setState((prev) => ({
          ...prev,
          progress: {
            ...prev.progress,
            currentStep: "Ανάγνωση εγγράφου (OCR)...",
            completed: 1,
            percentage: 25,
          },
        }));

        const ocrStartTime = Date.now();
        const formData = new FormData();
        formData.append("file", file);
        formData.append("languages", supportedLanguages.join(","));

        const ocrResponse = await fetch(ocrEndpoint, {
          method: "POST",
          body: formData,
          signal: abortController.signal,
          headers: {
            "X-Company-ID": companyState.currentCompany?.id || "",
          },
        });

        if (!ocrResponse.ok) {
          throw new Error("OCR processing failed");
        }

        const ocrResult = await ocrResponse.json();
        const ocrTime = Date.now() - ocrStartTime;

        processingSteps.push({
          step: "OCR",
          status: "completed",
          startTime: new Date(ocrStartTime).toISOString(),
          endTime: new Date().toISOString(),
          result: {
            confidence: ocrResult.confidence,
            textLength: ocrResult.text.length,
          },
        });

        // Step 2: Document type detection and data extraction
        setState((prev) => ({
          ...prev,
          progress: {
            ...prev.progress,
            currentStep: "Εξαγωγή δεδομένων...",
            completed: 2,
            percentage: 50,
          },
        }));

        const documentType = detectDocumentType(ocrResult.text);
        const extractedData: ExtractedDocumentData = ocrResult.extractedData;

        // Step 3: Validation
        setState((prev) => ({
          ...prev,
          progress: {
            ...prev.progress,
            currentStep: "Επικύρωση δεδομένων...",
            completed: 3,
            percentage: 75,
          },
        }));

        const validationStartTime = Date.now();
        const validation = await validateExtractedData(extractedData);
        const validationTime = Date.now() - validationStartTime;

        processingSteps.push({
          step: "Validation",
          status: "completed",
          startTime: new Date(validationStartTime).toISOString(),
          endTime: new Date().toISOString(),
          result: {
            isValid: validation.isValid,
            confidence: validation.confidence,
          },
        });

        // Step 4: Finalization
        setState((prev) => ({
          ...prev,
          progress: {
            ...prev.progress,
            currentStep: "Ολοκλήρωση...",
            completed: 4,
            percentage: 100,
          },
        }));

        const endTime = Date.now();
        const totalTime = endTime - startTime;

        const processedDocument: ProcessedDocument = {
          id: documentId,
          type: documentType,
          status: validation.isValid ? "validated" : "completed",
          originalFile: {
            id: `file_${documentId}`,
            name: file.name,
            url: URL.createObjectURL(file),
            size: file.size,
            type: file.type,
            checksum: await calculateChecksum(file),
          },
          extractedData,
          validation,
          processing: {
            startTime: new Date(startTime).toISOString(),
            endTime: new Date(endTime).toISOString(),
            duration: totalTime,
            ocrEngine: "Greek-OCR-Engine",
            ocrVersion: "2.1.0",
            processingSteps,
            performance: {
              ocrTime,
              validationTime,
              totalTime,
            },
          },
          confidence: ocrResult.confidence,
          errors: [],
          warnings: [],
        };

        setState((prev) => ({
          ...prev,
          documents: [...prev.documents, processedDocument],
          currentDocument: processedDocument,
          isProcessing: false,
          progress: {
            currentStep: "",
            completed: 0,
            total: 0,
            percentage: 0,
          },
          statistics: {
            ...prev.statistics,
            totalProcessed: prev.statistics.totalProcessed + 1,
            successful:
              prev.statistics.successful + (validation.isValid ? 1 : 0),
            failed: prev.statistics.failed + (validation.isValid ? 0 : 1),
            averageProcessingTime:
              (prev.statistics.averageProcessingTime *
                prev.statistics.totalProcessed +
                totalTime) /
              (prev.statistics.totalProcessed + 1),
            averageConfidence:
              (prev.statistics.averageConfidence *
                prev.statistics.totalProcessed +
                ocrResult.confidence) /
              (prev.statistics.totalProcessed + 1),
            documentTypeBreakdown: {
              ...prev.statistics.documentTypeBreakdown,
              [documentType]:
                (prev.statistics.documentTypeBreakdown[documentType] || 0) + 1,
            },
          },
        }));

        auditDocumentOperation("process", processedDocument);

        addNotification({
          type: validation.isValid ? "success" : "warning",
          title: "Επεξεργασία εγγράφου",
          message: validation.isValid
            ? `Το έγγραφο "${file.name}" επεξεργάστηκε επιτυχώς`
            : `Το έγγραφο "${file.name}" επεξεργάστηκε με προειδοποιήσεις`,
          priority: "medium",
          category: "business",
          isPersistent: false,
          autoClose: true,
          duration: 5000,
        });

        return processedDocument;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: (error as Error).message,
        }));

        auditDocumentOperation("process", { file: file.name }, error as Error);

        addNotification({
          type: "error",
          title: "Σφάλμα επεξεργασίας",
          message: `Αποτυχία επεξεργασίας του εγγράφου "${file.name}": ${
            (error as Error).message
          }`,
          priority: "high",
          category: "business",
          isPersistent: false,
          autoClose: true,
          duration: 7000,
        });

        throw error;
      } finally {
        processingRef.current.delete(documentId);
      }
    },
    [
      ocrEndpoint,
      supportedLanguages,
      companyState.currentCompany?.id,
      detectDocumentType,
      auditDocumentOperation,
      addNotification,
    ]
  );

  // Calculate checksum helper
  const calculateChecksum = useCallback(async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }, []);

  // Validate extracted data
  const validateExtractedData = useCallback(
    async (data: ExtractedDocumentData): Promise<DocumentValidation> => {
      const validationResults: ValidationResult[] = [];

      // Greek compliance validation
      const issuerErrors = validateGreekEntity(data.issuer);
      const recipientErrors = validateGreekEntity(data.recipient);

      issuerErrors.forEach((error) => {
        validationResults.push({
          field: "issuer",
          isValid: false,
          message: error,
          severity: "error",
        });
      });

      recipientErrors.forEach((error) => {
        validationResults.push({
          field: "recipient",
          isValid: false,
          message: error,
          severity: "error",
        });
      });

      // Mathematical validation
      const mathValidation = validateMathematics(data);

      mathValidation.discrepancies.forEach((discrepancy) => {
        validationResults.push({
          field: discrepancy.field,
          isValid: false,
          message: `Μαθηματικό σφάλμα: αναμενόμενη τιμή ${discrepancy.expected}, πραγματική ${discrepancy.actual}`,
          severity: "error",
          suggestedValue: discrepancy.expected,
        });
      });

      const greekCompliance: GreekComplianceValidation = {
        afmValidation: {
          issuerValid: issuerErrors.length === 0,
          recipientValid: recipientErrors.length === 0,
          errors: [...issuerErrors, ...recipientErrors],
        },
        doyValidation: {
          issuerValid: validateDOY(data.issuer.doy),
          recipientValid: validateDOY(data.recipient.doy),
          errors: [],
        },
        vatValidation: {
          ratesValid: true, // TODO: Implement VAT rate validation
          calculationsValid: mathValidation.vatCalculationsValid,
          exemptionsValid: true, // TODO: Implement exemption validation
          errors: [],
        },
        documentTypeCompliance: {
          isCompliant: true, // TODO: Implement document type compliance check
          requiredFields: [],
          missingFields: [],
        },
      };

      const businessRules: BusinessRuleValidation[] = [];

      // Check if total amount is reasonable
      if (data.totalAmount > 100000) {
        businessRules.push({
          rule: "large_amount_check",
          isValid: false,
          message: "Το συνολικό ποσό είναι ασυνήθιστα μεγάλο",
          severity: "warning",
        });
      }

      const isValid =
        validationResults.filter((r) => r.severity === "error").length === 0;
      const confidence = Math.max(0, 1 - validationResults.length * 0.1);

      return {
        isValid,
        confidence,
        validationResults,
        greekCompliance,
        mathematicalValidation: mathValidation,
        businessRules,
      };
    },
    [validateGreekEntity, validateMathematics, validateDOY]
  );

  // Submit to AADE
  const submitToAADE = useCallback(
    async (documentId: string): Promise<AADEDocumentData> => {
      const document = state.documents.find((d) => d.id === documentId);
      if (!document) {
        throw new Error("Document not found");
      }

      setState((prev) => ({
        ...prev,
        isSubmitting: true,
        error: null,
      }));

      try {
        const aadeData = await apiCall(`${aadeEndpoint}/submit`, {
          method: "POST",
          body: JSON.stringify({
            documentId,
            documentData: document.extractedData,
          }),
        });

        setState((prev) => ({
          ...prev,
          documents: prev.documents.map((d) =>
            d.id === documentId ? { ...d, status: "submitted", aadeData } : d
          ),
          isSubmitting: false,
        }));

        auditDocumentOperation("submit_aade", { documentId, aadeData });

        addNotification({
          type: "success",
          title: "Υποβολή AADE",
          message: "Το έγγραφο υποβλήθηκε επιτυχώς στο AADE",
          priority: "high",
          category: "compliance",
          isPersistent: false,
          autoClose: true,
          duration: 5000,
        });

        return aadeData;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isSubmitting: false,
          error: (error as Error).message,
        }));

        auditDocumentOperation("submit_aade", { documentId }, error as Error);

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
      apiCall,
      aadeEndpoint,
      auditDocumentOperation,
      addNotification,
    ]
  );

  return {
    ...state,
    processDocument,
    processMultipleDocuments: async (files: File[]) => {
      const results: ProcessedDocument[] = [];
      for (const file of files) {
        try {
          const result = await processDocument(file);
          results.push(result);
        } catch (error) {
          console.error("Failed to process file:", file.name, error);
        }
      }
      return results;
    },
    reprocessDocument: async (documentId: string) => {
      const document = state.documents.find((d) => d.id === documentId);
      if (!document) {
        throw new Error("Document not found");
      }
      // TODO: Implement reprocessing logic
      return document;
    },
    validateDocument: async (documentId: string) => {
      const document = state.documents.find((d) => d.id === documentId);
      if (!document) {
        throw new Error("Document not found");
      }
      return validateExtractedData(document.extractedData);
    },
    validateExtractedData,
    autoCorrectDocument: async (documentId: string) => {
      const document = state.documents.find((d) => d.id === documentId);
      if (!document) {
        throw new Error("Document not found");
      }
      // TODO: Implement auto-correction logic
      return document;
    },
    updateExtractedData: async (
      documentId: string,
      data: Partial<ExtractedDocumentData>
    ) => {
      setState((prev) => ({
        ...prev,
        documents: prev.documents.map((d) =>
          d.id === documentId
            ? { ...d, extractedData: { ...d.extractedData, ...data } }
            : d
        ),
      }));
    },
    exportToFormat: async (
      documentId: string,
      format: "xml" | "json" | "pdf"
    ) => {
      return await apiCall(`/export/${documentId}?format=${format}`);
    },
    submitToAADE,
    checkAADEStatus: async (documentId: string) => {
      return await apiCall(`${aadeEndpoint}/status/${documentId}`);
    },
    cancelAADESubmission: async (documentId: string) => {
      await apiCall(`${aadeEndpoint}/cancel/${documentId}`, {
        method: "POST",
      });
    },
    getDocumentById: (id: string) => {
      return state.documents.find((d) => d.id === id) || null;
    },
    deleteDocument: async (documentId: string) => {
      setState((prev) => ({
        ...prev,
        documents: prev.documents.filter((d) => d.id !== documentId),
      }));
    },
    duplicateDocument: async (documentId: string) => {
      const document = state.documents.find((d) => d.id === documentId);
      if (!document) {
        throw new Error("Document not found");
      }

      const newDocument = {
        ...document,
        id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: "completed" as ProcessingStatus,
      };

      setState((prev) => ({
        ...prev,
        documents: [...prev.documents, newDocument],
      }));

      return newDocument;
    },
    searchDocuments: (query: string) => {
      return state.documents.filter(
        (doc) =>
          doc.extractedData.documentNumber
            .toLowerCase()
            .includes(query.toLowerCase()) ||
          doc.extractedData.issuer.name
            .toLowerCase()
            .includes(query.toLowerCase()) ||
          doc.extractedData.recipient.name
            .toLowerCase()
            .includes(query.toLowerCase())
      );
    },
    filterByType: (type: GreekDocumentType) => {
      return state.documents.filter((doc) => doc.type === type);
    },
    filterByStatus: (status: ProcessingStatus) => {
      return state.documents.filter((doc) => doc.status === status);
    },
    filterByDateRange: (startDate: string, endDate: string) => {
      return state.documents.filter((doc) => {
        const docDate = new Date(doc.extractedData.issueDate);
        return docDate >= new Date(startDate) && docDate <= new Date(endDate);
      });
    },
    clearProcessedDocuments: () => {
      setState((prev) => ({
        ...prev,
        documents: [],
        currentDocument: null,
      }));
    },
    getProcessingStatistics: () => state.statistics,
    refreshDocument: async (documentId: string) => {
      // TODO: Implement refresh logic
      const document = state.documents.find((d) => d.id === documentId);
      if (!document) {
        throw new Error("Document not found");
      }
      return document;
    },
  };
}

export default useGreekDocumentProcessing;
