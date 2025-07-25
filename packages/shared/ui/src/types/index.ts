// Shared types and constants - server-safe

// Core language types
export type Language = "el" | "en";
export type TranslationKey = string;

// Translation types
export interface LanguageDetectionOptions {
  cookieName?: string;
  storageKey?: string;
  fallback?: Language;
  detectFromPath?: boolean;
  detectFromHeaders?: boolean;
  detectFromNavigator?: boolean;
}

export interface TranslationOptions {
  ns?: string;
  defaultValue?: string;
  variables?: Record<string, string | number>;
  count?: number;
  size?: string | number;
  width?: string | number;
  height?: string | number;
  start?: string | number;
  end?: string | number;
  total?: string | number;
}

// Translation resource types
export type TranslationValue = string | { [key: string]: TranslationValue };

export interface TranslationNamespace {
  [key: string]: TranslationValue;
}

export interface TranslationResources {
  [namespace: string]: TranslationNamespace;
}

export interface LanguageResources {
  [language: string]: TranslationResources;
}

// User language preferences
export interface UserLanguagePreferences {
  primaryLanguage: Language;
  fallbackLanguage: Language;
  dateFormat: "dd/MM/yyyy" | "MM/dd/yyyy" | "yyyy-MM-dd";
  numberFormat: "european" | "american";
  currency: "EUR" | "USD";
  timezone: string;
}

// Translation context types
export interface TranslationContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, options?: TranslationOptions) => string;
  resources: LanguageResources;
  isLoading: boolean;
  error?: string;
}

// Greek validation types
export interface GreekValidationRule {
  type: "afm" | "doy" | "phone" | "postal_code" | "iban" | "vat_number";
  message: string;
  validator: (value: string) => boolean;
}

// Greek locale settings
export type { GreekLocaleSettings } from "./greek";

// App constants and configurations
export { AppName, APP_CONFIGS } from "./constants";
export type { AppConfig } from "./constants";
