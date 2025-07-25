/**
 * Greek localization hook
 * Provides comprehensive Greek formatting and reference data access
 */

import { useCallback, useMemo } from "react";
import { useGreekLocale } from "../contexts/GreekLocaleContext";
import { useTranslation } from "../contexts/TranslationContext";
import { useGreekValidation } from "./useGreekValidation";
import { Language } from "../types";
import {
  GreekReferenceData,
  AFMValidationResult,
  GreekPhoneValidationResult,
  IBANValidationResult,
  PostalCodeValidationResult,
  VATCalculationContext,
  VATCalculationResult,
  GreekTaxOffice,
  GreekRegion,
  GreekBank,
  GreekLegalForm,
  GreekBusinessActivity,
} from "../types/greek";

interface GreekLocalizationHookResult {
  // Current language and settings
  language: Language;
  isGreek: boolean;

  // Formatting functions
  formatAFM: (afm: string) => string;
  formatPhone: (phone: string) => string;
  formatPostalCode: (code: string) => string;
  formatIBAN: (iban: string) => string;
  formatCurrency: (
    amount: number,
    options?: Intl.NumberFormatOptions
  ) => string;
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (number: number, options?: Intl.NumberFormatOptions) => string;
  formatPercentage: (number: number) => string;

  // Reference data access
  referenceData: GreekReferenceData | null;
  isLoadingReferenceData: boolean;
  referenceDataError: string | null;

  // Reference data helpers
  getRegionName: (regionId: string) => string;
  getDOYName: (doyCode: string) => string;
  getBankName: (bankCode: string) => string;
  getLegalFormName: (legalFormCode: string) => string;
  getBusinessActivityName: (kadCode: string) => string;

  // Reference data finders
  findRegion: (regionCode: string) => GreekRegion | undefined;
  findDOY: (doyCode: string) => GreekTaxOffice | undefined;
  findBank: (bankCode: string) => GreekBank | undefined;
  findLegalForm: (legalFormCode: string) => GreekLegalForm | undefined;
  findBusinessActivity: (kadCode: string) => GreekBusinessActivity | undefined;

  // Translation helpers
  t: (
    key: string,
    options?: { variables?: Record<string, string | number> }
  ) => string;
  tGreek: (
    key: string,
    options?: { variables?: Record<string, string | number> }
  ) => string;

  // Validation functions
  validateAFM: (afm: string) => boolean;
  validatePhone: (phone: string) => boolean;
  validatePostalCode: (code: string) => boolean;
  validateIBAN: (iban: string) => boolean;

  // Utility functions
  isValidGreekString: (str: string) => boolean;
  normalizeGreekText: (text: string) => string;
  getGreekAlphabetPosition: (letter: string) => number;

  // VAT calculation
  calculateVAT: (context: VATCalculationContext) => VATCalculationResult | null;

  // Common Greek business patterns
  getCommonGreekPatterns: () => {
    afmPattern: RegExp;
    phonePattern: RegExp;
    postalCodePattern: RegExp;
    ibanPattern: RegExp;
  };
}

export const useGreekLocalization = (): GreekLocalizationHookResult => {
  const greekLocale = useGreekLocale();
  const { t, language } = useTranslation();

  const {
    formatAFM: baseFormatAFM,
    formatPhone: baseFormatPhone,
    formatPostalCode: baseFormatPostalCode,
    formatIBAN: baseFormatIBAN,
    formatCurrency: baseFormatCurrency,
    formatDate: baseFormatDate,
    formatTime: baseFormatTime,
    formatNumber: baseFormatNumber,
    referenceData,
    isLoading: isLoadingReferenceData,
    error: referenceDataError,
    getRegionName,
    getDOYName,
    getBankName,
    getLegalFormName,
    getBusinessActivityName,
    validateAFM,
    validatePhone,
    validatePostalCode,
    validateIBAN,
  } = greekLocale;

  // Check if current language is Greek
  const isGreek = language === "el";

  // Enhanced formatting functions
  const formatCurrency = useCallback(
    (amount: number, options?: Intl.NumberFormatOptions) => {
      const locale = isGreek ? "el-GR" : "en-US";
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "EUR",
        ...options,
      }).format(amount);
    },
    [isGreek]
  );

  const formatDate = useCallback(
    (date: Date, options?: Intl.DateTimeFormatOptions) => {
      const locale = isGreek ? "el-GR" : "en-US";
      return new Intl.DateTimeFormat(locale, {
        timeZone: "Europe/Athens",
        ...options,
      }).format(date);
    },
    [isGreek]
  );

  const formatTime = useCallback(
    (date: Date, options?: Intl.DateTimeFormatOptions) => {
      const locale = isGreek ? "el-GR" : "en-US";
      return new Intl.DateTimeFormat(locale, {
        timeZone: "Europe/Athens",
        hour: "2-digit",
        minute: "2-digit",
        ...options,
      }).format(date);
    },
    [isGreek]
  );

  const formatNumber = useCallback(
    (number: number, options?: Intl.NumberFormatOptions) => {
      const locale = isGreek ? "el-GR" : "en-US";
      return new Intl.NumberFormat(locale, options).format(number);
    },
    [isGreek]
  );

  const formatPercentage = useCallback(
    (number: number) => {
      const locale = isGreek ? "el-GR" : "en-US";
      return new Intl.NumberFormat(locale, {
        style: "percent",
        minimumFractionDigits: 1,
        maximumFractionDigits: 2,
      }).format(number / 100);
    },
    [isGreek]
  );

  // Validation functions are handled by useGreekValidation hook

  // Reference data finders
  const findRegion = useCallback(
    (regionCode: string): GreekRegion | undefined => {
      return referenceData?.regions.find((r) => r.regionCode === regionCode);
    },
    [referenceData?.regions]
  );

  const findDOY = useCallback(
    (doyCode: string): GreekTaxOffice | undefined => {
      return referenceData?.taxOffices.find((d) => d.doyCode === doyCode);
    },
    [referenceData?.taxOffices]
  );

  const findBank = useCallback(
    (bankCode: string): GreekBank | undefined => {
      return referenceData?.banks.find((b) => b.bankCode === bankCode);
    },
    [referenceData?.banks]
  );

  const findLegalForm = useCallback(
    (legalFormCode: string): GreekLegalForm | undefined => {
      return referenceData?.legalForms.find(
        (l) => l.legalFormCode === legalFormCode
      );
    },
    [referenceData?.legalForms]
  );

  const findBusinessActivity = useCallback(
    (kadCode: string): GreekBusinessActivity | undefined => {
      return referenceData?.businessActivities.find(
        (a) => a.kadCode === kadCode
      );
    },
    [referenceData?.businessActivities]
  );

  // Translation helpers
  const tGreek = useCallback(
    (
      key: string,
      options?: { variables?: Record<string, string | number> }
    ) => {
      return t(key, { ...options, ns: "greek" });
    },
    [t]
  );

  // Utility functions
  const isValidGreekString = useCallback((str: string): boolean => {
    // Check if string contains Greek characters
    return /[\u0370-\u03FF\u1F00-\u1FFF]/.test(str);
  }, []);

  const normalizeGreekText = useCallback((text: string): string => {
    // Remove diacritics and normalize Greek text
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
      .replace(/ς/g, "σ") // Replace final sigma with regular sigma
      .toLowerCase();
  }, []);

  const getGreekAlphabetPosition = useCallback((letter: string): number => {
    const greekAlphabet = "αβγδεζηθικλμνξοπρστυφχψω";
    return greekAlphabet.indexOf(letter.toLowerCase()) + 1;
  }, []);

  // VAT calculation (simplified)
  const calculateVAT = useCallback(
    (context: VATCalculationContext): VATCalculationResult | null => {
      if (!referenceData) return null;

      // This is a simplified implementation
      // In a real app, this would use complex business logic
      const standardRate = 24;
      const reducedRate = 13;

      let applicableRate = standardRate;

      // Apply reduced rate for islands
      if (
        context.businessLocation.locationType === "aegean_islands" ||
        context.businessLocation.locationType === "ionian_islands"
      ) {
        applicableRate = 17;
      }

      // Apply reduced rate for food takeaway
      if (
        context.productCategory === "food" &&
        context.consumptionMethod === "takeaway"
      ) {
        applicableRate = reducedRate;
      }

      const netAmount = context.transactionDate ? 100 : 0; // Placeholder
      const vatAmount = (netAmount * applicableRate) / 100;
      const totalAmount = netAmount + vatAmount;

      return {
        applicableRate,
        vatAmount,
        netAmount,
        totalAmount,
        rateCode: `VAT_${applicableRate}`,
        rateNameEl: `Φ.Π.Α. ${applicableRate}%`,
        rateNameEn: `VAT ${applicableRate}%`,
        explanation: `Applied ${applicableRate}% VAT rate`,
        legalReference: "Greek VAT Code",
        contextFactors: [],
        warnings: [],
      };
    },
    [referenceData]
  );

  // Common Greek patterns
  const getCommonGreekPatterns = useCallback(
    () => ({
      afmPattern: /^\d{9}$/,
      phonePattern: /^(\+30|0030|30)?[26-9]\d{8}$/,
      postalCodePattern: /^\d{5}$/,
      ibanPattern: /^GR\d{25}$/,
    }),
    []
  );

  return {
    language,
    isGreek,
    formatAFM: baseFormatAFM,
    formatPhone: baseFormatPhone,
    formatPostalCode: baseFormatPostalCode,
    formatIBAN: baseFormatIBAN,
    formatCurrency,
    formatDate,
    formatTime,
    formatNumber,
    formatPercentage,
    referenceData,
    isLoadingReferenceData,
    referenceDataError,
    getRegionName,
    getDOYName,
    getBankName,
    getLegalFormName,
    getBusinessActivityName,
    findRegion,
    findDOY,
    findBank,
    findLegalForm,
    findBusinessActivity,
    t,
    tGreek,
    validateAFM,
    validatePhone,
    validatePostalCode,
    validateIBAN,
    isValidGreekString,
    normalizeGreekText,
    getGreekAlphabetPosition,
    calculateVAT,
    getCommonGreekPatterns,
  };
};

// Simplified hook for basic Greek formatting
