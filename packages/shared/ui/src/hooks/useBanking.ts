import { useState, useEffect, useCallback } from "react";

export interface GreekBankAccount {
  id: string;
  iban: string;
  bankCode: string;
  bankName: string;
  branchCode: string;
  accountNumber: string;
  accountType: "CHECKING" | "SAVINGS" | "BUSINESS" | "ESCROW";
  currency: "EUR";
  balance: number;
  availableBalance: number;
  status: "ACTIVE" | "INACTIVE" | "BLOCKED" | "CLOSED";
  owner: {
    name: string;
    afm: string;
    type: "INDIVIDUAL" | "BUSINESS";
  };
  features: {
    sepaEnabled: boolean;
    onlineBanking: boolean;
    mobileBanking: boolean;
    cardSupport: boolean;
  };
  limits: {
    dailyTransferLimit: number;
    monthlyTransferLimit: number;
    singleTransactionLimit: number;
  };
  lastUpdated: string;
}

export interface GreekBank {
  code: string;
  name: string;
  nameEn: string;
  swiftCode: string;
  website: string;
  isActive: boolean;
  supportedServices: {
    sepa: boolean;
    instantPayments: boolean;
    businessBanking: boolean;
    apiAccess: boolean;
  };
  fees: {
    sepaTransfer: number;
    domesticTransfer: number;
    internationalTransfer: number;
    accountMaintenance: number;
  };
}

export interface SEPATransaction {
  id: string;
  type: "CREDIT_TRANSFER" | "DIRECT_DEBIT" | "INSTANT_PAYMENT";
  status:
    | "PENDING"
    | "PROCESSING"
    | "COMPLETED"
    | "FAILED"
    | "CANCELLED"
    | "RETURNED";
  amount: number;
  currency: "EUR";
  from: {
    iban: string;
    name: string;
    address?: string;
  };
  to: {
    iban: string;
    name: string;
    address?: string;
  };
  reference: string;
  description: string;
  executionDate: string;
  valueDate: string;
  fees: {
    amount: number;
    type: "SENDER" | "RECEIVER" | "SHARED";
  };
  endToEndId: string;
  messageId: string;
  paymentId: string;
  statusReason?: string;
  returnReason?: string;
  greekCompliance: {
    afmValidated: boolean;
    amlChecked: boolean;
    taxReported: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BankStatement {
  accountIban: string;
  periodFrom: string;
  periodTo: string;
  openingBalance: number;
  closingBalance: number;
  transactions: BankTransaction[];
  summary: {
    totalCredits: number;
    totalDebits: number;
    creditCount: number;
    debitCount: number;
    fees: number;
  };
  generatedAt: string;
}

export interface BankTransaction {
  id: string;
  date: string;
  valueDate: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  description: string;
  reference: string;
  counterparty: {
    iban?: string;
    name: string;
    reference?: string;
  };
  category: string;
  fees: number;
  runningBalance: number;
  additionalInfo?: {
    merchantId?: string;
    cardNumber?: string;
    terminalId?: string;
    authCode?: string;
  };
}

export interface DirectDebitMandate {
  id: string;
  mandateId: string;
  creditorId: string;
  creditorName: string;
  debtorIban: string;
  debtorName: string;
  type: "CORE" | "B2B";
  sequenceType: "FIRST" | "RECURRING" | "FINAL" | "ONE_OFF";
  status: "ACTIVE" | "SUSPENDED" | "CANCELLED" | "EXPIRED";
  maxAmount?: number;
  validFrom: string;
  validTo?: string;
  lastUsed?: string;
  createdAt: string;
}

export interface PaymentOrder {
  id: string;
  type:
    | "SEPA_TRANSFER"
    | "DOMESTIC_TRANSFER"
    | "INTERNATIONAL_TRANSFER"
    | "DIRECT_DEBIT";
  priority: "NORMAL" | "HIGH" | "INSTANT";
  status:
    | "DRAFT"
    | "PENDING_APPROVAL"
    | "APPROVED"
    | "SUBMITTED"
    | "PROCESSED"
    | "REJECTED";
  amount: number;
  currency: string;
  fromAccount: string;
  toAccount: string;
  beneficiary: {
    name: string;
    address?: string;
    country: string;
  };
  purpose: string;
  reference: string;
  requestedExecutionDate: string;
  fees: {
    amount: number;
    currency: string;
    chargeBearer: "DEBT" | "CRED" | "SHAR";
  };
  approvals: Array<{
    userId: string;
    userName: string;
    timestamp: string;
    action: "APPROVED" | "REJECTED";
    comment?: string;
  }>;
  requiredApprovals: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface BankingHookState {
  accounts: GreekBankAccount[];
  selectedAccount: GreekBankAccount | null;
  banks: GreekBank[];
  transactions: SEPATransaction[];
  statements: BankStatement[];
  mandates: DirectDebitMandate[];
  paymentOrders: PaymentOrder[];
  loading: boolean;
  error: string | null;
  connectionStatus: {
    isConnected: boolean;
    lastSync: string | null;
    provider: string | null;
  };
  compliance: {
    amlEnabled: boolean;
    taxReportingEnabled: boolean;
    transactionLimitsEnabled: boolean;
  };
  settings: {
    autoSync: boolean;
    syncInterval: number; // minutes
    notifyOnTransactions: boolean;
    requireApprovalThreshold: number; // EUR
    enableInstantPayments: boolean;
  };
}

export function useBanking() {
  const [state, setState] = useState<BankingHookState>({
    accounts: [],
    selectedAccount: null,
    banks: [],
    transactions: [],
    statements: [],
    mandates: [],
    paymentOrders: [],
    loading: false,
    error: null,
    connectionStatus: {
      isConnected: false,
      lastSync: null,
      provider: null,
    },
    compliance: {
      amlEnabled: true,
      taxReportingEnabled: true,
      transactionLimitsEnabled: true,
    },
    settings: {
      autoSync: true,
      syncInterval: 60, // 1 hour
      notifyOnTransactions: true,
      requireApprovalThreshold: 10000, // 10,000 EUR
      enableInstantPayments: true,
    },
  });

  // Connect to banking provider
  const connectToBank = useCallback(
    async (bankCode: string, credentials: any): Promise<boolean> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // In a real implementation, connect to Open Banking API or bank's API
        const response = await fetch("/api/banking/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bankCode, credentials }),
        });

        if (response.ok) {
          const connectionData = await response.json();

          setState((prev) => ({
            ...prev,
            loading: false,
            connectionStatus: {
              isConnected: true,
              lastSync: new Date().toISOString(),
              provider: bankCode,
            },
          }));

          // Load initial data
          await Promise.all([loadAccounts(), loadRecentTransactions()]);

          return true;
        } else {
          throw new Error("Failed to connect to bank");
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Connection failed",
        }));
        return false;
      }
    },
    []
  );

  // Disconnect from banking provider
  const disconnect = useCallback(() => {
    setState((prev) => ({
      ...prev,
      connectionStatus: {
        isConnected: false,
        lastSync: null,
        provider: null,
      },
      accounts: [],
      transactions: [],
      statements: [],
    }));
  }, []);

  // Load bank accounts
  const loadAccounts = useCallback(async () => {
    if (!state.connectionStatus.isConnected) {
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    try {
      const response = await fetch("/api/banking/accounts");
      if (response.ok) {
        const accounts = await response.json();
        setState((prev) => ({
          ...prev,
          loading: false,
          accounts,
          selectedAccount: accounts.length > 0 ? accounts[0] : null,
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          error instanceof Error ? error.message : "Failed to load accounts",
      }));
    }
  }, [state.connectionStatus.isConnected]);

  // Select account
  const selectAccount = useCallback(
    (accountId: string) => {
      const account = state.accounts.find((acc) => acc.id === accountId);
      setState((prev) => ({ ...prev, selectedAccount: account || null }));
    },
    [state.accounts]
  );

  // Validate Greek IBAN
  const validateGreekIBAN = useCallback(
    (iban: string): { valid: boolean; errors: string[] } => {
      const errors: string[] = [];

      // Remove spaces and convert to uppercase
      const cleanIban = iban.replace(/\s/g, "").toUpperCase();

      // Check if it's a Greek IBAN
      if (!cleanIban.startsWith("GR")) {
        errors.push("IBAN must start with GR for Greek accounts");
      }

      // Check length (Greek IBAN is 27 characters)
      if (cleanIban.length !== 27) {
        errors.push("Greek IBAN must be exactly 27 characters");
      }

      // Check format: GR + 2 check digits + 7 bank/branch code + 16 account number
      const ibanRegex = /^GR\d{2}\d{7}\d{16}$/;
      if (!ibanRegex.test(cleanIban)) {
        errors.push("Invalid Greek IBAN format");
      }

      // Validate check digits using mod-97 algorithm
      if (errors.length === 0) {
        const rearranged = cleanIban.slice(4) + cleanIban.slice(0, 4);
        const numericString = rearranged.replace(/[A-Z]/g, (char) =>
          (char.charCodeAt(0) - 55).toString()
        );

        // Calculate mod 97 for large numbers
        let remainder = 0;
        for (let i = 0; i < numericString.length; i++) {
          remainder = (remainder * 10 + parseInt(numericString[i])) % 97;
        }

        if (remainder !== 1) {
          errors.push("Invalid IBAN check digits");
        }
      }

      return { valid: errors.length === 0, errors };
    },
    []
  );

  // Get bank information from IBAN
  const getBankFromIBAN = useCallback(
    (iban: string): GreekBank | null => {
      const validation = validateGreekIBAN(iban);
      if (!validation.valid) {
        return null;
      }

      const bankCode = iban.slice(4, 7); // First 3 digits after country code and check digits
      return state.banks.find((bank) => bank.code === bankCode) || null;
    },
    [state.banks, validateGreekIBAN]
  );

  // Create SEPA transfer
  const createSEPATransfer = useCallback(
    async (transfer: {
      fromIban: string;
      toIban: string;
      amount: number;
      beneficiaryName: string;
      reference: string;
      description: string;
      executionDate?: string;
      isInstant?: boolean;
    }): Promise<SEPATransaction> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // Validate IBANs
        const fromValidation = validateGreekIBAN(transfer.fromIban);
        const toValidation = validateGreekIBAN(transfer.toIban);

        if (!fromValidation.valid) {
          throw new Error(
            `Invalid sender IBAN: ${fromValidation.errors.join(", ")}`
          );
        }

        if (!toValidation.valid) {
          throw new Error(
            `Invalid recipient IBAN: ${toValidation.errors.join(", ")}`
          );
        }

        // Check compliance
        if (state.compliance.transactionLimitsEnabled) {
          const account = state.accounts.find(
            (acc) => acc.iban === transfer.fromIban
          );
          if (
            account &&
            transfer.amount > account.limits.singleTransactionLimit
          ) {
            throw new Error("Transfer amount exceeds single transaction limit");
          }
        }

        // Check if approval is required
        const requiresApproval =
          transfer.amount >= state.settings.requireApprovalThreshold;

        const response = await fetch("/api/banking/sepa-transfer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...transfer,
            requiresApproval,
            type: transfer.isInstant ? "INSTANT_PAYMENT" : "CREDIT_TRANSFER",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create SEPA transfer");
        }

        const transaction: SEPATransaction = await response.json();

        setState((prev) => ({
          ...prev,
          loading: false,
          transactions: [transaction, ...prev.transactions],
        }));

        return transaction;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            error instanceof Error ? error.message : "Transfer creation failed",
        }));
        throw error;
      }
    },
    [state.accounts, state.compliance, state.settings, validateGreekIBAN]
  );

  // Create direct debit
  const createDirectDebit = useCallback(
    async (debit: {
      mandateId: string;
      amount: number;
      reference: string;
      description: string;
      executionDate?: string;
    }): Promise<SEPATransaction> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // Validate mandate
        const mandate = state.mandates.find(
          (m) => m.mandateId === debit.mandateId
        );
        if (!mandate) {
          throw new Error("Direct debit mandate not found");
        }

        if (mandate.status !== "ACTIVE") {
          throw new Error(`Mandate is ${mandate.status.toLowerCase()}`);
        }

        if (mandate.maxAmount && debit.amount > mandate.maxAmount) {
          throw new Error("Amount exceeds mandate limit");
        }

        const response = await fetch("/api/banking/direct-debit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(debit),
        });

        if (!response.ok) {
          throw new Error("Failed to create direct debit");
        }

        const transaction: SEPATransaction = await response.json();

        setState((prev) => ({
          ...prev,
          loading: false,
          transactions: [transaction, ...prev.transactions],
        }));

        return transaction;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Direct debit creation failed",
        }));
        throw error;
      }
    },
    [state.mandates]
  );

  // Load recent transactions
  const loadRecentTransactions = useCallback(
    async (accountIban?: string, days: number = 30) => {
      setState((prev) => ({ ...prev, loading: true }));

      try {
        const iban = accountIban || state.selectedAccount?.iban;
        if (!iban) {
          throw new Error("No account selected");
        }

        const response = await fetch(
          `/api/banking/transactions?iban=${iban}&days=${days}`
        );
        if (response.ok) {
          const transactions = await response.json();
          setState((prev) => ({ ...prev, loading: false, transactions }));
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to load transactions",
        }));
      }
    },
    [state.selectedAccount]
  );

  // Generate bank statement
  const generateStatement = useCallback(
    async (
      accountIban: string,
      periodFrom: string,
      periodTo: string,
      format: "PDF" | "CSV" | "MT940" = "PDF"
    ): Promise<string> => {
      setState((prev) => ({ ...prev, loading: true }));

      try {
        const response = await fetch("/api/banking/statement", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountIban,
            periodFrom,
            periodTo,
            format,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate statement");
        }

        const result = await response.json();
        setState((prev) => ({ ...prev, loading: false }));

        return result.downloadUrl;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Statement generation failed",
        }));
        throw error;
      }
    },
    []
  );

  // Create payment order (for approval workflow)
  const createPaymentOrder = useCallback(
    async (
      order: Omit<
        PaymentOrder,
        "id" | "status" | "approvals" | "createdBy" | "createdAt" | "updatedAt"
      >
    ): Promise<PaymentOrder> => {
      setState((prev) => ({ ...prev, loading: true }));

      try {
        const response = await fetch("/api/banking/payment-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...order,
            createdBy: "current-user-id", // Get from auth context
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create payment order");
        }

        const paymentOrder: PaymentOrder = await response.json();

        setState((prev) => ({
          ...prev,
          loading: false,
          paymentOrders: [paymentOrder, ...prev.paymentOrders],
        }));

        return paymentOrder;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Payment order creation failed",
        }));
        throw error;
      }
    },
    []
  );

  // Approve payment order
  const approvePaymentOrder = useCallback(
    async (orderId: string, comment?: string): Promise<void> => {
      setState((prev) => ({ ...prev, loading: true }));

      try {
        const response = await fetch(
          `/api/banking/payment-order/${orderId}/approve`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ comment }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to approve payment order");
        }

        const updatedOrder: PaymentOrder = await response.json();

        setState((prev) => ({
          ...prev,
          loading: false,
          paymentOrders: prev.paymentOrders.map((order) =>
            order.id === orderId ? updatedOrder : order
          ),
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            error instanceof Error ? error.message : "Payment approval failed",
        }));
        throw error;
      }
    },
    []
  );

  // Get balance
  const getBalance = useCallback(
    async (
      accountIban: string
    ): Promise<{ available: number; current: number }> => {
      try {
        const response = await fetch(
          `/api/banking/balance?iban=${accountIban}`
        );
        if (response.ok) {
          return await response.json();
        }
        throw new Error("Failed to get balance");
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error ? error.message : "Balance check failed",
        }));
        throw error;
      }
    },
    []
  );

  // Check transaction status
  const checkTransactionStatus = useCallback(
    async (transactionId: string): Promise<SEPATransaction> => {
      try {
        const response = await fetch(
          `/api/banking/transaction/${transactionId}/status`
        );
        if (response.ok) {
          const transaction: SEPATransaction = await response.json();

          // Update transaction in state
          setState((prev) => ({
            ...prev,
            transactions: prev.transactions.map((t) =>
              t.id === transactionId ? transaction : t
            ),
          }));

          return transaction;
        }
        throw new Error("Failed to check transaction status");
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Status check failed",
        }));
        throw error;
      }
    },
    []
  );

  // Calculate transaction fees
  const calculateFees = useCallback(
    (
      type: "SEPA_TRANSFER" | "DOMESTIC_TRANSFER" | "INTERNATIONAL_TRANSFER",
      amount: number,
      isInstant: boolean = false
    ): number => {
      // Greek banking fee structure (simplified)
      const baseFees = {
        SEPA_TRANSFER: isInstant ? 10 : 2,
        DOMESTIC_TRANSFER: 1.5,
        INTERNATIONAL_TRANSFER: 25,
      };

      let fee = baseFees[type];

      // Add percentage for larger amounts
      if (amount > 50000) {
        fee += amount * 0.001; // 0.1%
      } else if (amount > 10000) {
        fee += amount * 0.0005; // 0.05%
      }

      return Math.round(fee * 100) / 100; // Round to 2 decimal places
    },
    []
  );

  // Update settings
  const updateSettings = useCallback(
    (newSettings: Partial<BankingHookState["settings"]>) => {
      setState((prev) => ({
        ...prev,
        settings: { ...prev.settings, ...newSettings },
      }));
    },
    []
  );

  // Load Greek banks list
  const loadGreekBanks = useCallback(async () => {
    try {
      const response = await fetch("/api/banking/greek-banks");
      if (response.ok) {
        const banks = await response.json();
        setState((prev) => ({ ...prev, banks }));
      }
    } catch (error) {
      console.error("Failed to load Greek banks:", error);
    }
  }, []);

  // Effects
  useEffect(() => {
    // Load Greek banks on mount
    loadGreekBanks();
  }, [loadGreekBanks]);

  useEffect(() => {
    // Set up auto-sync if enabled
    let syncInterval: NodeJS.Timeout;

    if (state.settings.autoSync && state.connectionStatus.isConnected) {
      syncInterval = setInterval(() => {
        loadRecentTransactions();
      }, state.settings.syncInterval * 60 * 1000);
    }

    return () => {
      if (syncInterval) {
        clearInterval(syncInterval);
      }
    };
  }, [
    state.settings.autoSync,
    state.settings.syncInterval,
    state.connectionStatus.isConnected,
    loadRecentTransactions,
  ]);

  return {
    // State
    ...state,

    // Connection
    connectToBank,
    disconnect,

    // Account management
    loadAccounts,
    selectAccount,
    getBalance,

    // IBAN utilities
    validateGreekIBAN,
    getBankFromIBAN,

    // Transactions
    createSEPATransfer,
    createDirectDebit,
    loadRecentTransactions,
    checkTransactionStatus,

    // Statements and reporting
    generateStatement,

    // Payment orders (approval workflow)
    createPaymentOrder,
    approvePaymentOrder,

    // Utilities
    calculateFees,
    updateSettings,
    loadGreekBanks,

    // Computed values
    hasActiveConnection: state.connectionStatus.isConnected,
    selectedAccountBalance: state.selectedAccount?.balance || 0,
    pendingTransactions: state.transactions.filter(
      (t) => t.status === "PENDING" || t.status === "PROCESSING"
    ),
    pendingPaymentOrders: state.paymentOrders.filter(
      (order) => order.status === "PENDING_APPROVAL"
    ),
  };
}
