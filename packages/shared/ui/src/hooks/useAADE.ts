import { useState, useEffect, useCallback } from "react";

export interface AADECredentials {
  userId: string;
  subscriptionKey: string;
  environment: "sandbox" | "production";
  companyAFM: string;
  companyDOY: string;
}

export interface AADEInvoice {
  mark: number;
  uid: string;
  issueDate: string;
  invType: "SALES" | "SERVICES" | "OTHER";
  series: string;
  aa: string;
  issuer: {
    vatNumber: string;
    country: string;
    branch: number;
  };
  counterpart: {
    vatNumber: string;
    country: string;
    branch: number;
    name?: string;
    address?: {
      street: string;
      number: string;
      postalCode: string;
      city: string;
    };
  };
  summary: {
    totalNetValue: number;
    totalVatAmount: number;
    totalWithheldAmount: number;
    totalFeesAmount: number;
    totalStampDutyAmount: number;
    totalOtherTaxesAmount: number;
    totalDeductionsAmount: number;
    totalGrossValue: number;
  };
  invoiceDetails: AADEInvoiceDetail[];
  paymentMethods?: AADEPaymentMethod[];
  taxesTotals?: AADETaxTotal[];
  classificationCategory?: string;
  relatedInvoices?: string[];
}

export interface AADEInvoiceDetail {
  lineNumber: number;
  netValue: number;
  vatCategory: string;
  vatAmount: number;
  vatExemptionCategory?: string;
  dienergia?: string;
  discountOption?: boolean;
  withheldAmount?: number;
  withheldPercentCategory?: string;
  stampDutyAmount?: number;
  stampDutyPercentCategory?: string;
  feesAmount?: number;
  feesPercentCategory?: string;
  otherTaxesPercentCategory?: string;
  otherTaxesAmount?: number;
  deductionsAmount?: number;
  lineComments?: string;
  quantity?: number;
  measurementUnit?: string;
  invoiceDetailType?: string;
  classification?: {
    classificationCategory: string;
    classificationType: string;
    classificationValue: number;
  }[];
}

export interface AADEPaymentMethod {
  type: string;
  amount: number;
  paymentMethodInfo?: string;
}

export interface AADETaxTotal {
  taxType: string;
  taxCategory: string;
  underlyingValue: number;
  taxAmount: number;
}

export interface AADEResponse {
  index: number;
  invoiceUid: string;
  invoiceMark: number;
  qrUrl: string;
  authenticationCode: string;
  classificationMark?: number;
  cancellationMark?: number;
  errors?: AADEError[];
  statusCode:
    | "Success"
    | "ValidationError"
    | "TechnicalError"
    | "XMLSyntaxError";
}

export interface AADEError {
  message: string;
  code: string;
  severity: "Error" | "Warning";
}

export interface AADEBookInfo {
  mark: number;
  uid: string;
  issueDate: string;
  entityVatNumber: string;
  totalNetValue: number;
  totalVatAmount: number;
  totalGrossValue: number;
  summary?: {
    totalNetValue: number;
    totalVatAmount: number;
    totalGrossValue: number;
    incomeClassification?: Array<{
      classificationType: string;
      classificationCategory: string;
      amount: number;
    }>;
    expensesClassification?: Array<{
      classificationType: string;
      classificationCategory: string;
      amount: number;
    }>;
  };
}

export interface AADEIncomeClassification {
  mark: number;
  entityVatNumber: string;
  classification: {
    classificationType: string;
    classificationCategory: string;
    amount: number;
  }[];
}

export interface AADEExpensesClassification {
  mark: number;
  entityVatNumber: string;
  classification: {
    classificationType: string;
    classificationCategory: string;
    amount: number;
  }[];
}

interface AADEHookState {
  isConnected: boolean;
  credentials: AADECredentials | null;
  lastSync: string | null;
  submissionQueue: AADEInvoice[];
  submissionHistory: AADEResponse[];
  currentQuota: {
    used: number;
    limit: number;
    remaining: number;
    resetDate: string;
  } | null;
  complianceStatus: {
    isCompliant: boolean;
    lastCheck: string;
    issues: string[];
    nextDeadline: string | null;
  };
  loading: boolean;
  error: string | null;
  statistics: {
    totalSubmitted: number;
    successRate: number;
    avgResponseTime: number;
    lastMonthSubmissions: number;
    pendingSubmissions: number;
  };
}

export function useAADE() {
  const [state, setState] = useState<AADEHookState>({
    isConnected: false,
    credentials: null,
    lastSync: null,
    submissionQueue: [],
    submissionHistory: [],
    currentQuota: null,
    complianceStatus: {
      isCompliant: false,
      lastCheck: "",
      issues: [],
      nextDeadline: null,
    },
    loading: false,
    error: null,
    statistics: {
      totalSubmitted: 0,
      successRate: 0,
      avgResponseTime: 0,
      lastMonthSubmissions: 0,
      pendingSubmissions: 0,
    },
  });

  // Authentication with AADE
  const authenticate = useCallback(
    async (credentials: AADECredentials): Promise<boolean> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // In a real implementation, authenticate with AADE API
        const response = await fetch("/api/aade/authenticate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        });

        if (response.ok) {
          setState((prev) => ({
            ...prev,
            isConnected: true,
            credentials,
            loading: false,
          }));

          // Load initial data after successful authentication
          await Promise.all([
            checkQuota(),
            loadSubmissionHistory(),
            checkCompliance(),
          ]);

          return true;
        } else {
          throw new Error("Authentication failed");
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            error instanceof Error ? error.message : "Authentication failed",
        }));
        return false;
      }
    },
    []
  );

  // Disconnect from AADE
  const disconnect = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isConnected: false,
      credentials: null,
      lastSync: null,
    }));
  }, []);

  // Submit single invoice to AADE
  const submitInvoice = useCallback(
    async (invoice: AADEInvoice): Promise<AADEResponse> => {
      if (!state.isConnected || !state.credentials) {
        throw new Error("Not connected to AADE");
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // Validate invoice before submission
        const validationErrors = validateInvoice(invoice);
        if (validationErrors.length > 0) {
          throw new Error(`Validation errors: ${validationErrors.join(", ")}`);
        }

        // In a real implementation, submit to AADE API
        const response = await fetch("/api/aade/submit-invoice", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${state.credentials.subscriptionKey}`,
          },
          body: JSON.stringify({
            invoice,
            environment: state.credentials.environment,
          }),
        });

        if (!response.ok) {
          throw new Error(`AADE submission failed: ${response.statusText}`);
        }

        const result: AADEResponse = await response.json();

        setState((prev) => ({
          ...prev,
          loading: false,
          submissionHistory: [result, ...prev.submissionHistory],
          statistics: {
            ...prev.statistics,
            totalSubmitted: prev.statistics.totalSubmitted + 1,
            successRate:
              result.statusCode === "Success"
                ? (prev.statistics.successRate *
                    prev.statistics.totalSubmitted +
                    100) /
                  (prev.statistics.totalSubmitted + 1)
                : (prev.statistics.successRate *
                    prev.statistics.totalSubmitted) /
                  (prev.statistics.totalSubmitted + 1),
          },
        }));

        // Update quota after successful submission
        if (result.statusCode === "Success") {
          await checkQuota();
        }

        return result;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Submission failed",
        }));
        throw error;
      }
    },
    [state.isConnected, state.credentials]
  );

  // Submit multiple invoices in batch
  const submitBatch = useCallback(
    async (invoices: AADEInvoice[]): Promise<AADEResponse[]> => {
      if (!state.isConnected || !state.credentials) {
        throw new Error("Not connected to AADE");
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const results: AADEResponse[] = [];

        // Process in batches of 10 (AADE limit)
        const batchSize = 10;
        for (let i = 0; i < invoices.length; i += batchSize) {
          const batch = invoices.slice(i, i + batchSize);

          const response = await fetch("/api/aade/submit-batch", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${state.credentials.subscriptionKey}`,
            },
            body: JSON.stringify({
              invoices: batch,
              environment: state.credentials.environment,
            }),
          });

          if (!response.ok) {
            throw new Error(`Batch submission failed: ${response.statusText}`);
          }

          const batchResults: AADEResponse[] = await response.json();
          results.push(...batchResults);

          // Add delay between batches to respect rate limits
          if (i + batchSize < invoices.length) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          submissionHistory: [...results, ...prev.submissionHistory],
        }));

        await checkQuota();
        return results;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            error instanceof Error ? error.message : "Batch submission failed",
        }));
        throw error;
      }
    },
    [state.isConnected, state.credentials]
  );

  // Cancel invoice in AADE
  const cancelInvoice = useCallback(
    async (invoiceMark: number): Promise<AADEResponse> => {
      if (!state.isConnected || !state.credentials) {
        throw new Error("Not connected to AADE");
      }

      try {
        const response = await fetch("/api/aade/cancel-invoice", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${state.credentials.subscriptionKey}`,
          },
          body: JSON.stringify({
            invoiceMark,
            environment: state.credentials.environment,
          }),
        });

        if (!response.ok) {
          throw new Error(
            `Invoice cancellation failed: ${response.statusText}`
          );
        }

        return await response.json();
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Cancellation failed",
        }));
        throw error;
      }
    },
    [state.isConnected, state.credentials]
  );

  // Get invoice details from AADE
  const getInvoiceDetails = useCallback(
    async (invoiceMark: number): Promise<AADEInvoice> => {
      if (!state.isConnected || !state.credentials) {
        throw new Error("Not connected to AADE");
      }

      try {
        const response = await fetch(`/api/aade/invoice/${invoiceMark}`, {
          headers: {
            Authorization: `Bearer ${state.credentials.subscriptionKey}`,
          },
        });

        if (!response.ok) {
          throw new Error(
            `Failed to get invoice details: ${response.statusText}`
          );
        }

        return await response.json();
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : "Failed to get invoice details",
        }));
        throw error;
      }
    },
    [state.isConnected, state.credentials]
  );

  // Get books information
  const getMyBooks = useCallback(
    async (dateFrom: string, dateTo: string): Promise<AADEBookInfo[]> => {
      if (!state.isConnected || !state.credentials) {
        throw new Error("Not connected to AADE");
      }

      try {
        const response = await fetch("/api/aade/my-books", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${state.credentials.subscriptionKey}`,
          },
          body: JSON.stringify({
            dateFrom,
            dateTo,
            entityVatNumber: state.credentials.companyAFM,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to get books: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Failed to get books",
        }));
        throw error;
      }
    },
    [state.isConnected, state.credentials]
  );

  // Submit income classification
  const submitIncomeClassification = useCallback(
    async (classification: AADEIncomeClassification): Promise<AADEResponse> => {
      if (!state.isConnected || !state.credentials) {
        throw new Error("Not connected to AADE");
      }

      try {
        const response = await fetch("/api/aade/income-classification", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${state.credentials.subscriptionKey}`,
          },
          body: JSON.stringify(classification),
        });

        if (!response.ok) {
          throw new Error(
            `Income classification failed: ${response.statusText}`
          );
        }

        return await response.json();
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : "Income classification failed",
        }));
        throw error;
      }
    },
    [state.isConnected, state.credentials]
  );

  // Submit expenses classification
  const submitExpensesClassification = useCallback(
    async (
      classification: AADEExpensesClassification
    ): Promise<AADEResponse> => {
      if (!state.isConnected || !state.credentials) {
        throw new Error("Not connected to AADE");
      }

      try {
        const response = await fetch("/api/aade/expenses-classification", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${state.credentials.subscriptionKey}`,
          },
          body: JSON.stringify(classification),
        });

        if (!response.ok) {
          throw new Error(
            `Expenses classification failed: ${response.statusText}`
          );
        }

        return await response.json();
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : "Expenses classification failed",
        }));
        throw error;
      }
    },
    [state.isConnected, state.credentials]
  );

  // Check API quota
  const checkQuota = useCallback(async () => {
    if (!state.isConnected || !state.credentials) {
      return;
    }

    try {
      const response = await fetch("/api/aade/quota", {
        headers: {
          Authorization: `Bearer ${state.credentials.subscriptionKey}`,
        },
      });

      if (response.ok) {
        const quota = await response.json();
        setState((prev) => ({ ...prev, currentQuota: quota }));
      }
    } catch (error) {
      console.error("Failed to check quota:", error);
    }
  }, [state.isConnected, state.credentials]);

  // Load submission history
  const loadSubmissionHistory = useCallback(async () => {
    if (!state.isConnected) {
      return;
    }

    try {
      const response = await fetch("/api/aade/submission-history");
      if (response.ok) {
        const history = await response.json();
        setState((prev) => ({ ...prev, submissionHistory: history }));
      }
    } catch (error) {
      console.error("Failed to load submission history:", error);
    }
  }, [state.isConnected]);

  // Check compliance status
  const checkCompliance = useCallback(async () => {
    if (!state.isConnected || !state.credentials) {
      return;
    }

    try {
      const response = await fetch("/api/aade/compliance-status", {
        headers: {
          Authorization: `Bearer ${state.credentials.subscriptionKey}`,
        },
      });

      if (response.ok) {
        const complianceStatus = await response.json();
        setState((prev) => ({ ...prev, complianceStatus }));
      }
    } catch (error) {
      console.error("Failed to check compliance:", error);
    }
  }, [state.isConnected, state.credentials]);

  // Validate invoice data
  const validateInvoice = useCallback((invoice: AADEInvoice): string[] => {
    const errors: string[] = [];

    // Required fields validation
    if (!invoice.issueDate) {
      errors.push("Issue date is required");
    }

    if (!invoice.invType) {
      errors.push("Invoice type is required");
    }

    if (!invoice.series) {
      errors.push("Invoice series is required");
    }

    if (!invoice.aa) {
      errors.push("Invoice AA is required");
    }

    // Issuer validation
    if (!invoice.issuer?.vatNumber) {
      errors.push("Issuer VAT number is required");
    }

    if (!invoice.issuer?.country) {
      errors.push("Issuer country is required");
    }

    // Counterpart validation
    if (!invoice.counterpart?.vatNumber) {
      errors.push("Counterpart VAT number is required");
    }

    if (!invoice.counterpart?.country) {
      errors.push("Counterpart country is required");
    }

    // Summary validation
    if (!invoice.summary?.totalNetValue || invoice.summary.totalNetValue <= 0) {
      errors.push("Total net value must be greater than 0");
    }

    if (
      !invoice.summary?.totalGrossValue ||
      invoice.summary.totalGrossValue <= 0
    ) {
      errors.push("Total gross value must be greater than 0");
    }

    // Invoice details validation
    if (!invoice.invoiceDetails || invoice.invoiceDetails.length === 0) {
      errors.push("At least one invoice detail is required");
    }

    invoice.invoiceDetails?.forEach((detail, index) => {
      if (!detail.netValue || detail.netValue <= 0) {
        errors.push(
          `Invoice detail ${index + 1}: Net value must be greater than 0`
        );
      }

      if (!detail.vatCategory) {
        errors.push(`Invoice detail ${index + 1}: VAT category is required`);
      }
    });

    // Greek-specific validations
    if (invoice.issuer?.country === "GR") {
      if (!invoice.issuer.vatNumber.match(/^\d{9}$/)) {
        errors.push("Greek VAT number must be 9 digits");
      }
    }

    return errors;
  }, []);

  // Add invoice to submission queue
  const addToQueue = useCallback((invoice: AADEInvoice) => {
    setState((prev) => ({
      ...prev,
      submissionQueue: [...prev.submissionQueue, invoice],
    }));
  }, []);

  // Remove invoice from submission queue
  const removeFromQueue = useCallback((invoiceUid: string) => {
    setState((prev) => ({
      ...prev,
      submissionQueue: prev.submissionQueue.filter(
        (inv) => inv.uid !== invoiceUid
      ),
    }));
  }, []);

  // Process entire submission queue
  const processQueue = useCallback(async (): Promise<AADEResponse[]> => {
    if (state.submissionQueue.length === 0) {
      return [];
    }

    const results = await submitBatch(state.submissionQueue);

    // Clear successful submissions from queue
    const successfulUids = results
      .filter((result) => result.statusCode === "Success")
      .map((result) => result.invoiceUid);

    setState((prev) => ({
      ...prev,
      submissionQueue: prev.submissionQueue.filter(
        (inv) => !successfulUids.includes(inv.uid)
      ),
    }));

    return results;
  }, [state.submissionQueue, submitBatch]);

  // Generate QR code URL for invoice
  const generateQRCode = useCallback((authenticationCode: string): string => {
    return `https://www1.aade.gr/sgsisapi/api/public/invoicesDoc/qr/${authenticationCode}`;
  }, []);

  // Calculate next submission deadline
  const getNextDeadline = useCallback((): Date | null => {
    // Greek tax law: invoices must be submitted within 10 days
    const lastInvoiceDate = state.submissionQueue
      .map((inv) => new Date(inv.issueDate))
      .sort((a, b) => b.getTime() - a.getTime())[0];

    if (!lastInvoiceDate) {
      return null;
    }

    const deadline = new Date(lastInvoiceDate);
    deadline.setDate(deadline.getDate() + 10);
    return deadline;
  }, [state.submissionQueue]);

  // Effects
  useEffect(() => {
    // Load saved credentials from localStorage
    const savedCredentials = localStorage.getItem("aade-credentials");
    if (savedCredentials) {
      try {
        const credentials = JSON.parse(savedCredentials);
        authenticate(credentials);
      } catch (error) {
        console.error("Failed to load saved credentials:", error);
      }
    }
  }, [authenticate]);

  useEffect(() => {
    // Set up periodic quota checking
    let quotaInterval: NodeJS.Timeout;

    if (state.isConnected) {
      quotaInterval = setInterval(checkQuota, 60 * 60 * 1000); // Every hour
    }

    return () => {
      if (quotaInterval) {
        clearInterval(quotaInterval);
      }
    };
  }, [state.isConnected, checkQuota]);

  useEffect(() => {
    // Save credentials to localStorage when they change
    if (state.credentials) {
      localStorage.setItem(
        "aade-credentials",
        JSON.stringify(state.credentials)
      );
    } else {
      localStorage.removeItem("aade-credentials");
    }
  }, [state.credentials]);

  return {
    // State
    ...state,

    // Authentication
    authenticate,
    disconnect,

    // Invoice operations
    submitInvoice,
    submitBatch,
    cancelInvoice,
    getInvoiceDetails,
    validateInvoice,

    // Books and classifications
    getMyBooks,
    submitIncomeClassification,
    submitExpensesClassification,

    // Queue management
    addToQueue,
    removeFromQueue,
    processQueue,

    // Utilities
    checkQuota,
    checkCompliance,
    generateQRCode,
    getNextDeadline,

    // Computed values
    isQuotaLow: state.currentQuota ? state.currentQuota.remaining < 100 : false,
    hasPendingSubmissions: state.submissionQueue.length > 0,
    complianceLevel: state.complianceStatus.isCompliant
      ? "COMPLIANT"
      : "NON_COMPLIANT",
  };
}
