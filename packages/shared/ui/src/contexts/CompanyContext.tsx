import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";

export interface Company {
  id: string;
  name: string;
  afm: string;
  doy: string;
  legalForm: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    region: string;
    country: string;
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  bankDetails: {
    iban: string;
    bankName: string;
    swiftCode: string;
  };
  taxSettings: {
    vatNumber: string;
    vatRate: number;
    taxOffice: string;
    exemptFromVat: boolean;
  };
  preferences: {
    language: "el" | "en";
    currency: "EUR";
    dateFormat: "dd/MM/yyyy" | "MM/dd/yyyy";
    timeZone: string;
  };
  subscription: {
    plan: string;
    features: string[];
    expiresAt: string;
  };
  compliance: {
    aadeConnected: boolean;
    lastAadeSync: string | null;
    taxPeriod: string;
    reportingFrequency: "monthly" | "quarterly" | "yearly";
  };
  createdAt: string;
  updatedAt: string;
}

export interface CompanyUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  lastLogin: string | null;
}

interface CompanyContextState {
  currentCompany: Company | null;
  companies: Company[];
  currentUser: CompanyUser | null;
  loading: boolean;
  error: string | null;
  isOwner: boolean;
  canManageUsers: boolean;
  canManageSettings: boolean;
  canAccessFinancials: boolean;
}

type CompanyAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_CURRENT_COMPANY"; payload: Company | null }
  | { type: "SET_COMPANIES"; payload: Company[] }
  | { type: "SET_CURRENT_USER"; payload: CompanyUser | null }
  | { type: "UPDATE_COMPANY"; payload: Partial<Company> }
  | {
      type: "UPDATE_USER_PERMISSIONS";
      payload: { userId: string; permissions: string[] };
    }
  | { type: "RESET_CONTEXT" };

const initialState: CompanyContextState = {
  currentCompany: null,
  companies: [],
  currentUser: null,
  loading: false,
  error: null,
  isOwner: false,
  canManageUsers: false,
  canManageSettings: false,
  canAccessFinancials: false,
};

function companyReducer(
  state: CompanyContextState,
  action: CompanyAction
): CompanyContextState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };

    case "SET_CURRENT_COMPANY":
      return { ...state, currentCompany: action.payload };

    case "SET_COMPANIES":
      return { ...state, companies: action.payload };

    case "SET_CURRENT_USER":
      const user = action.payload;
      return {
        ...state,
        currentUser: user,
        isOwner: user?.role === "owner" || false,
        canManageUsers:
          user?.permissions.includes("manage_users") ||
          user?.role === "owner" ||
          false,
        canManageSettings:
          user?.permissions.includes("manage_settings") ||
          user?.role === "owner" ||
          false,
        canAccessFinancials:
          user?.permissions.includes("access_financials") ||
          user?.role === "owner" ||
          false,
      };

    case "UPDATE_COMPANY":
      if (!state.currentCompany) return state;
      return {
        ...state,
        currentCompany: { ...state.currentCompany, ...action.payload },
        companies: state.companies.map((company) =>
          company.id === state.currentCompany?.id
            ? { ...company, ...action.payload }
            : company
        ),
      };

    case "UPDATE_USER_PERMISSIONS":
      return {
        ...state,
        currentUser:
          state.currentUser && state.currentUser.id === action.payload.userId
            ? { ...state.currentUser, permissions: action.payload.permissions }
            : state.currentUser,
      };

    case "RESET_CONTEXT":
      return initialState;

    default:
      return state;
  }
}

const CompanyContext = createContext<{
  state: CompanyContextState;
  dispatch: React.Dispatch<CompanyAction>;
  // Company management
  switchCompany: (companyId: string) => Promise<void>;
  updateCompanySettings: (settings: Partial<Company>) => Promise<void>;
  refreshCompanyData: () => Promise<void>;
  // User management
  inviteUser: (
    email: string,
    role: string,
    permissions: string[]
  ) => Promise<void>;
  updateUserPermissions: (
    userId: string,
    permissions: string[]
  ) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  // Compliance
  syncWithAADE: () => Promise<void>;
  validateCompanyCompliance: () => Promise<boolean>;
  generateComplianceReport: () => Promise<string>;
  // Utilities
  hasPermission: (permission: string) => boolean;
  canAccessModule: (module: string) => boolean;
  getCompanyTaxInfo: () => {
    vatRate: number;
    taxOffice: string;
    exemptFromVat: boolean;
  } | null;
} | null>(null);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(companyReducer, initialState);

  // Company management functions
  const switchCompany = async (companyId: string) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      // In a real implementation, this would call an API
      const company = state.companies.find((c) => c.id === companyId);
      if (company) {
        dispatch({ type: "SET_CURRENT_COMPANY", payload: company });
        // Update user permissions for this company
        // This would come from an API call
      }
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error ? error.message : "Failed to switch company",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const updateCompanySettings = async (settings: Partial<Company>) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      // In a real implementation, this would call an API
      dispatch({ type: "UPDATE_COMPANY", payload: settings });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error
            ? error.message
            : "Failed to update company settings",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const refreshCompanyData = async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      // In a real implementation, this would call an API
      // For now, just clear the loading state
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error
            ? error.message
            : "Failed to refresh company data",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // User management functions
  const inviteUser = async (
    email: string,
    role: string,
    permissions: string[]
  ) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      // In a real implementation, this would call an API
      console.log("Inviting user:", { email, role, permissions });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error ? error.message : "Failed to invite user",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const updateUserPermissions = async (
    userId: string,
    permissions: string[]
  ) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      // In a real implementation, this would call an API
      dispatch({
        type: "UPDATE_USER_PERMISSIONS",
        payload: { userId, permissions },
      });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error
            ? error.message
            : "Failed to update user permissions",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const removeUser = async (userId: string) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      // In a real implementation, this would call an API
      console.log("Removing user:", userId);
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error ? error.message : "Failed to remove user",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // Compliance functions
  const syncWithAADE = async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      // In a real implementation, this would call AADE API
      console.log("Syncing with AADE...");
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error ? error.message : "Failed to sync with AADE",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  const validateCompanyCompliance = async (): Promise<boolean> => {
    try {
      // In a real implementation, this would validate compliance
      return true;
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error
            ? error.message
            : "Failed to validate compliance",
      });
      return false;
    }
  };

  const generateComplianceReport = async (): Promise<string> => {
    try {
      // In a real implementation, this would generate a compliance report
      return "Compliance report generated successfully";
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error
            ? error.message
            : "Failed to generate compliance report",
      });
      return "";
    }
  };

  // Utility functions
  const hasPermission = (permission: string): boolean => {
    return state.currentUser?.permissions.includes(permission) || state.isOwner;
  };

  const canAccessModule = (module: string): boolean => {
    if (state.isOwner) return true;
    return state.currentUser?.permissions.includes(`access_${module}`) || false;
  };

  const getCompanyTaxInfo = () => {
    if (!state.currentCompany) return null;
    return {
      vatRate: state.currentCompany.taxSettings.vatRate,
      taxOffice: state.currentCompany.taxSettings.taxOffice,
      exemptFromVat: state.currentCompany.taxSettings.exemptFromVat,
    };
  };

  const contextValue = {
    state,
    dispatch,
    switchCompany,
    updateCompanySettings,
    refreshCompanyData,
    inviteUser,
    updateUserPermissions,
    removeUser,
    syncWithAADE,
    validateCompanyCompliance,
    generateComplianceReport,
    hasPermission,
    canAccessModule,
    getCompanyTaxInfo,
  };

  return (
    <CompanyContext.Provider value={contextValue}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
}

export default CompanyContext;
