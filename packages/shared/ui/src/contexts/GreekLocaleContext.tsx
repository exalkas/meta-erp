/**
 * Greek Locale Context for Greek-specific localization
 * Provides Greek formatting, validation, and reference data
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Language, GreekLocaleSettings } from "../types";
import { GreekReferenceData } from "../types/greek";

// Greek locale context interface
interface GreekLocaleContextValue {
  language: Language;
  settings: GreekLocaleSettings;
  updateSettings: (updates: Partial<GreekLocaleSettings>) => void;
  referenceData: GreekReferenceData | null;
  isLoading: boolean;
  error: string | null;

  // Formatting functions
  formatAFM: (afm: string) => string;
  formatPhone: (phone: string) => string;
  formatPostalCode: (code: string) => string;
  formatIBAN: (iban: string) => string;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date) => string;
  formatTime: (date: Date) => string;
  formatNumber: (number: number) => string;

  // Validation functions
  validateAFM: (afm: string) => boolean;
  validatePhone: (phone: string) => boolean;
  validatePostalCode: (code: string) => boolean;
  validateIBAN: (iban: string) => boolean;

  // Reference data helpers
  getRegionName: (regionId: string) => string;
  getDOYName: (doyCode: string) => string;
  getBankName: (bankCode: string) => string;
  getLegalFormName: (legalFormCode: string) => string;
  getBusinessActivityName: (kadCode: string) => string;
}

// Default Greek locale settings
const DEFAULT_SETTINGS: GreekLocaleSettings = {
  language: "el",
  region: "GR",
  timezone: "Europe/Athens",
  currency: "EUR",
  dateFormat: "dd/MM/yyyy",
  timeFormat: "HH:mm",
  numberFormat: {
    decimal: ",",
    thousands: ".",
    precision: 2,
  },
  currencyFormat: {
    style: "currency",
    currency: "EUR",
  },
  phoneFormat: "+30 XXX XXX XXXX",
  postalCodeFormat: "XXXXX",
  afmFormat: "XXX XXX XXX",
  ibanFormat: "GRXX XXXX XXXX XXXX XXXX XXXX XXX",
  addressFormat: ["street", "streetNumber", "postalCode", "city", "region"],
};

// Greek locale context
const GreekLocaleContext = createContext<GreekLocaleContextValue | null>(null);

// AFM validation algorithm
const validateAFMChecksum = (afm: string): boolean => {
  if (afm.length !== 9) return false;

  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += parseInt(afm[i]) * Math.pow(2, 8 - i);
  }

  const remainder = sum % 11;
  const checkDigit = remainder < 2 ? remainder : 11 - remainder;

  return checkDigit === parseInt(afm[8]);
};

// IBAN validation algorithm
const validateIBANChecksum = (iban: string): boolean => {
  // Basic IBAN validation for Greek IBANs
  const cleanIBAN = iban.replace(/\s/g, "").toUpperCase();
  if (!cleanIBAN.startsWith("GR") || cleanIBAN.length !== 27) return false;

  // Move first 4 characters to the end
  const rearranged = cleanIBAN.slice(4) + cleanIBAN.slice(0, 4);

  // Replace letters with numbers (A=10, B=11, etc.)
  const numericString = rearranged.replace(/[A-Z]/g, (letter) => {
    return (letter.charCodeAt(0) - 55).toString();
  });

  // Calculate mod 97
  let remainder = 0;
  for (let i = 0; i < numericString.length; i++) {
    remainder = (remainder * 10 + parseInt(numericString[i])) % 97;
  }

  return remainder === 1;
};

// Greek locale provider component
interface GreekLocaleProviderProps {
  children: React.ReactNode;
  initialLanguage?: Language;
  settings?: Partial<GreekLocaleSettings>;
  apiEndpoint?: string;
  enableReferenceDataFetch?: boolean;
}

export const GreekLocaleProvider: React.FC<GreekLocaleProviderProps> = ({
  children,
  initialLanguage = "el",
  settings: initialSettings = {},
  apiEndpoint = "/api/v1/greek-reference-data",
  enableReferenceDataFetch = false, // Default to false for development
}) => {
  console.log("GreekLocaleProvider: Initializing with config:", {
    initialLanguage,
    apiEndpoint,
    enableReferenceDataFetch,
    hasCustomSettings: Object.keys(initialSettings).length > 0,
  });

  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [settings, setSettingsState] = useState<GreekLocaleSettings>({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
    language: initialLanguage,
  });
  const [referenceData, setReferenceData] = useState<GreekReferenceData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update settings
  const updateSettings = useCallback(
    (updates: Partial<GreekLocaleSettings>) => {
      setSettingsState((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  // Load reference data
  const loadReferenceData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    console.log(
      "GreekLocaleProvider: Attempting to load reference data from:",
      apiEndpoint
    );

    try {
      const response = await fetch(apiEndpoint);
      console.log(
        "GreekLocaleProvider: API response status:",
        response.status,
        response.statusText
      );

      if (!response.ok) {
        // Don't throw error for missing API - just log it and continue with null data
        console.warn(
          `GreekLocaleProvider: Reference data API not available (${response.status}: ${response.statusText}). Continuing with null reference data.`
        );
        setReferenceData(null);
        return;
      }

      const data = await response.json();
      console.log(
        "GreekLocaleProvider: Successfully loaded reference data:",
        data
      );
      setReferenceData(data);
    } catch (err) {
      // Don't set error state for missing API - just log and continue
      console.warn(
        "GreekLocaleProvider: Could not load reference data, continuing without it:",
        err
      );
      setReferenceData(null);
    } finally {
      setIsLoading(false);
    }
  }, [apiEndpoint]);

  // Load reference data on mount (only if enabled)
  useEffect(() => {
    if (enableReferenceDataFetch) {
      console.log(
        "GreekLocaleProvider: Reference data fetch is enabled, loading..."
      );
      loadReferenceData();
    } else {
      console.log(
        "GreekLocaleProvider: Reference data fetch is disabled, skipping API call"
      );
      setReferenceData(null);
    }
  }, [loadReferenceData, enableReferenceDataFetch]);

  // Formatting functions
  const formatAFM = useCallback((afm: string): string => {
    const cleaned = afm.replace(/\s/g, "");
    if (cleaned.length === 9) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");
    }
    return afm;
  }, []);

  const formatPhone = useCallback((phone: string): string => {
    const cleaned = phone.replace(/\D/g, "");

    // Greek mobile numbers (69X, 68X)
    if (cleaned.startsWith("30")) {
      const number = cleaned.slice(2);
      if (number.length === 10) {
        return `+30 ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(
          6
        )}`;
      }
    } else if (cleaned.startsWith("69") || cleaned.startsWith("68")) {
      if (cleaned.length === 10) {
        return `+30 ${cleaned.slice(0, 3)} ${cleaned.slice(
          3,
          6
        )} ${cleaned.slice(6)}`;
      }
    }

    return phone;
  }, []);

  const formatPostalCode = useCallback((code: string): string => {
    const cleaned = code.replace(/\D/g, "");
    if (cleaned.length === 5) {
      return cleaned;
    }
    return code;
  }, []);

  const formatIBAN = useCallback((iban: string): string => {
    const cleaned = iban.replace(/\s/g, "").toUpperCase();
    if (cleaned.length === 27 && cleaned.startsWith("GR")) {
      return cleaned.replace(/(.{4})/g, "$1 ").trim();
    }
    return iban;
  }, []);

  const formatCurrency = useCallback(
    (amount: number): string => {
      return new Intl.NumberFormat("el-GR", {
        style: "currency",
        currency: settings.currency,
        minimumFractionDigits: settings.numberFormat.precision,
        maximumFractionDigits: settings.numberFormat.precision,
      }).format(amount);
    },
    [settings.currency, settings.numberFormat.precision]
  );

  const formatDate = useCallback(
    (date: Date): string => {
      return new Intl.DateTimeFormat("el-GR", {
        timeZone: settings.timezone,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date);
    },
    [settings.timezone]
  );

  const formatTime = useCallback(
    (date: Date): string => {
      return new Intl.DateTimeFormat("el-GR", {
        timeZone: settings.timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(date);
    },
    [settings.timezone]
  );

  const formatNumber = useCallback(
    (number: number): string => {
      return new Intl.NumberFormat("el-GR", {
        minimumFractionDigits: settings.numberFormat.precision,
        maximumFractionDigits: settings.numberFormat.precision,
      }).format(number);
    },
    [settings.numberFormat.precision]
  );

  // Validation functions
  const validateAFM = useCallback((afm: string): boolean => {
    const cleaned = afm.replace(/\s/g, "");
    return /^\d{9}$/.test(cleaned) && validateAFMChecksum(cleaned);
  }, []);

  const validatePhone = useCallback((phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, "");
    // Greek mobile: 69X XXXX XXX, 68X XXXX XXX
    // Greek landline: 2X XXXX XXXX
    return /^(30)?(69|68|2[1-9])\d{8}$/.test(cleaned);
  }, []);

  const validatePostalCode = useCallback((code: string): boolean => {
    const cleaned = code.replace(/\D/g, "");
    return /^\d{5}$/.test(cleaned);
  }, []);

  const validateIBAN = useCallback((iban: string): boolean => {
    const cleaned = iban.replace(/\s/g, "").toUpperCase();
    return (
      cleaned.startsWith("GR") &&
      cleaned.length === 27 &&
      /^GR\d{25}$/.test(cleaned) &&
      validateIBANChecksum(cleaned)
    );
  }, []);

  // Reference data helpers
  const getRegionName = useCallback(
    (regionId: string): string => {
      if (!referenceData) return regionId;

      const region = referenceData.regions.find((r) => r.id === regionId);
      return region
        ? language === "el"
          ? region.regionNameEl
          : region.regionNameEn
        : regionId;
    },
    [referenceData, language]
  );

  const getDOYName = useCallback(
    (doyCode: string): string => {
      if (!referenceData) return doyCode;

      const doy = referenceData.taxOffices.find((d) => d.doyCode === doyCode);
      return doy
        ? language === "el"
          ? doy.doyNameEl
          : doy.doyNameEn
        : doyCode;
    },
    [referenceData, language]
  );

  const getBankName = useCallback(
    (bankCode: string): string => {
      if (!referenceData) return bankCode;

      const bank = referenceData.banks.find((b) => b.bankCode === bankCode);
      return bank
        ? language === "el"
          ? bank.bankNameEl
          : bank.bankNameEn
        : bankCode;
    },
    [referenceData, language]
  );

  const getLegalFormName = useCallback(
    (legalFormCode: string): string => {
      if (!referenceData) return legalFormCode;

      const legalForm = referenceData.legalForms.find(
        (l) => l.legalFormCode === legalFormCode
      );
      return legalForm
        ? language === "el"
          ? legalForm.legalFormNameEl
          : legalForm.legalFormNameEn
        : legalFormCode;
    },
    [referenceData, language]
  );

  const getBusinessActivityName = useCallback(
    (kadCode: string): string => {
      if (!referenceData) return kadCode;

      const activity = referenceData.businessActivities.find(
        (a) => a.kadCode === kadCode
      );
      return activity
        ? language === "el"
          ? activity.kadNameEl
          : activity.kadNameEn
        : kadCode;
    },
    [referenceData, language]
  );

  // Update language when it changes
  useEffect(() => {
    if (language !== settings.language) {
      updateSettings({ language });
    }
  }, [language, settings.language, updateSettings]);

  // Context value
  const contextValue: GreekLocaleContextValue = {
    language,
    settings,
    updateSettings,
    referenceData,
    isLoading,
    error,
    formatAFM,
    formatPhone,
    formatPostalCode,
    formatIBAN,
    formatCurrency,
    formatDate,
    formatTime,
    formatNumber,
    validateAFM,
    validatePhone,
    validatePostalCode,
    validateIBAN,
    getRegionName,
    getDOYName,
    getBankName,
    getLegalFormName,
    getBusinessActivityName,
  };

  return (
    <GreekLocaleContext.Provider value={contextValue}>
      {children}
    </GreekLocaleContext.Provider>
  );
};

// Hook to use Greek locale context
export const useGreekLocale = () => {
  const context = useContext(GreekLocaleContext);
  if (!context) {
    throw new Error("useGreekLocale must be used within a GreekLocaleProvider");
  }
  return context;
};

// Hook for Greek formatting
export const useGreekFormatting = () => {
  const {
    formatAFM,
    formatPhone,
    formatPostalCode,
    formatIBAN,
    formatCurrency,
    formatDate,
    formatTime,
    formatNumber,
  } = useGreekLocale();

  return {
    formatAFM,
    formatPhone,
    formatPostalCode,
    formatIBAN,
    formatCurrency,
    formatDate,
    formatTime,
    formatNumber,
  };
};

// Hook for Greek validation
export const useGreekValidation = () => {
  const { validateAFM, validatePhone, validatePostalCode, validateIBAN } =
    useGreekLocale();

  return {
    validateAFM,
    validatePhone,
    validatePostalCode,
    validateIBAN,
  };
};

// Hook for Greek reference data
export const useGreekReferenceData = () => {
  const {
    referenceData,
    isLoading,
    error,
    getRegionName,
    getDOYName,
    getBankName,
    getLegalFormName,
    getBusinessActivityName,
  } = useGreekLocale();

  return {
    referenceData,
    isLoading,
    error,
    getRegionName,
    getDOYName,
    getBankName,
    getLegalFormName,
    getBusinessActivityName,
  };
};
