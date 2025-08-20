/**
 * Translation Context for Multilingual Support
 * 100% AGNOSTIC - No hardcoded languages, themes, or vertical-specific logic
 * All configuration comes from server/database via API
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  Language,
  TranslationContextValue,
  TranslationOptions,
  LanguageResources,
  UserLanguagePreferences,
} from "../types";

// Translation context
const TranslationContext = createContext<TranslationContextValue | null>(null);

// Storage keys
const LANGUAGE_STORAGE_KEY = "ui_language";
const PREFERENCES_STORAGE_KEY = "ui_language_preferences";

// Translation utilities
const interpolateString = (
  str: string,
  variables?: Record<string, string | number>
): string => {
  if (!variables) return str;

  return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return String(variables[key] || match);
  });
};

const getNestedValue = (obj: any, path: string): string | undefined => {
  return path.split(".").reduce((current, key) => current?.[key], obj);
};

// Translation provider component
interface TranslationProviderProps {
  children: React.ReactNode;
  resources?: LanguageResources;
  detectLanguage?: boolean;
  storageKey?: string;
  tenantId?: string; // For metadata API
  verticalContext?: string; // For vertical-specific translations (e.g., "legal", "admin")
  defaultLanguage?: Language; // Default language when no stored language exists
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({
  children,
  resources,
  detectLanguage = true,
  storageKey = LANGUAGE_STORAGE_KEY,
  tenantId,
  verticalContext,
  defaultLanguage = "en_US",
}) => {
  // Initialize language with null - must be provided by server
  const [language, setLanguageState] = useState<Language | null>(null);
  const [translationResources, setTranslationResources] =
    useState<LanguageResources>(resources || {});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isClient, setIsClient] = useState(false);

  // Fetch translations from metadata API
  const fetchTranslations = useCallback(
    async (locale: Language) => {
      setIsLoading(true);
      setError(undefined);

      try {
        console.log(`🌐 Fetching translations for locale: ${locale}`);

        // Build API URL with tenant and vertical context
        const url = new URL(
          `http://localhost:8000/metadata/translations/${locale}`
        );
        if (tenantId) {
          url.searchParams.set("tenant_id", tenantId);
        }
        if (verticalContext) {
          url.searchParams.set("vertical", verticalContext);
        }

        console.log(`🔍 API URL: ${url.toString()}`);
        const response = await fetch(url.toString());
        console.log(`🔍 API Response Status: ${response.status}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch translations: ${response.status}`);
        }

        const translationsData = await response.json();

        // Handle both array format (from database) and flat object format
        let translationsFlat: Record<string, string>;
        if (Array.isArray(translationsData)) {
          // Convert array of translation objects to flat key-value pairs
          translationsFlat = translationsData.reduce(
            (acc: Record<string, string>, item: any) => {
              acc[item.key] = item.text;
              return acc;
            },
            {}
          );
        } else {
          // Already flat object format
          translationsFlat = translationsData;
        }

        // Store flat translations in 'common' namespace since that's what components expect
        const flatResources = {
          common: translationsFlat, // Store flat translations under 'common' namespace
          flat: translationsFlat, // Also keep under 'flat' for backward compatibility
        };

        // Update resources
        setTranslationResources((prev) => ({
          ...prev,
          [locale]: flatResources,
        }));

        if (Object.keys(translationsFlat).length > 0) {
          console.log(
            `✅ Loaded ${Object.keys(translationsFlat).length} translations for ${locale}`
          );
        } else {
          throw new Error(`No translations returned for ${locale}`);
        }
      } catch (err) {
        console.error(`❌ Failed to load translations for ${locale}:`, err);
        setError(err instanceof Error ? err.message : "Unknown error");
        throw err; // Re-throw to be handled by calling code
      } finally {
        setIsLoading(false);
      }
    },
    [tenantId, verticalContext]
  );

  // Initialize language and translations
  useEffect(() => {
    setIsClient(true);

    // Must be provided by app configuration, not hardcoded
    if (typeof window === "undefined") {
      return; // SSR - wait for client
    }

    async function initializeTranslations() {
      try {
        // Get stored language first
        const stored = localStorage.getItem(storageKey);

        if (stored) {
          // Use stored language
          setLanguageState(stored as Language);
          await fetchTranslations(stored as Language);
        } else {
          // No stored language - use provided default language
          setLanguageState(defaultLanguage);
          localStorage.setItem(storageKey, defaultLanguage);
          await fetchTranslations(defaultLanguage);
        }
      } catch (err) {
        console.error("❌ Translation initialization failed:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Translation initialization failed"
        );
        setIsLoading(false);
      }
    }

    if (!resources) {
      initializeTranslations();
    } else {
      // Using provided resources
      setIsLoading(false);
    }
  }, [storageKey, resources, fetchTranslations]);

  // Language preferences
  const [preferences, setPreferences] = useState<UserLanguagePreferences>(
    () => {
      if (typeof window === "undefined") {
        return {
          primaryLanguage: null,
          fallbackLanguage: null,
          dateFormat: "MM/DD/YYYY",
          numberFormat: "american",
          currency: "USD",
          timezone: "America/New_York",
        };
      }

      const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // Fall through to defaults
        }
      }

      return {
        primaryLanguage: language,
        fallbackLanguage: null,
        dateFormat: "MM/DD/YYYY",
        numberFormat: "american",
        currency: "USD",
        timezone: "America/New_York",
      };
    }
  );

  // Update language and persist to storage
  const setLanguage = useCallback(
    async (newLanguage: Language) => {
      try {
        localStorage.setItem(storageKey, newLanguage);

        // Fetch translations for new language if not already loaded
        if (!translationResources[newLanguage]) {
          await fetchTranslations(newLanguage);
        }

        // Only set language state AFTER translations are loaded to prevent race condition
        setLanguageState(newLanguage);

        // Update preferences
        setPreferences((prev) => ({
          ...prev,
          primaryLanguage: newLanguage,
        }));
      } catch (err) {
        console.error(`❌ Failed to switch to language ${newLanguage}:`, err);
        setError(err instanceof Error ? err.message : "Language switch failed");
      }
    },
    [storageKey, translationResources, fetchTranslations]
  );

  // Translation function with FLAT KEYS support
  const t = useCallback(
    (key: string, options?: TranslationOptions): string => {
      const {
        ns = "common",
        defaultValue = key,
        variables,
        count,
      } = options || {};

      if (!language) {
        console.warn(`⚠️ No language set for translation key: ${key}`);
        return interpolateString(defaultValue, variables);
      }

      // Don't try to translate while still loading - return default to prevent race conditions
      if (isLoading) {
        return interpolateString(defaultValue, variables);
      }

      try {
        // Get translation from current language
        const currentLangResources = translationResources[language];

        if (currentLangResources) {
          // Try to get value directly from flat namespace first
          const flatTranslations = currentLangResources["flat"];
          if (flatTranslations && flatTranslations[key]) {
            const value = flatTranslations[key];
            return interpolateString(String(value), variables);
          }

          // Fallback to nested namespace approach for compatibility
          const namespace = currentLangResources[ns];
          if (namespace) {
            const value = getNestedValue(namespace, key);

            if (value) {
              // Handle pluralization
              if (count !== undefined && typeof count === "number") {
                // Simple pluralization logic - can be extended
                const pluralKey = count === 1 ? key : `${key}_plural`;
                const pluralValue = getNestedValue(namespace, pluralKey);
                if (pluralValue) {
                  return interpolateString(pluralValue, {
                    ...variables,
                    count,
                  });
                }
              }

              return interpolateString(String(value), variables);
            }
          }
        }

        // No translation found - return default value or key
        console.warn(
          `⚠️ Translation not found: ${key} (language: ${language})`
        );
        return interpolateString(defaultValue, variables);
      } catch (err) {
        console.warn(`Translation error for key "${key}":`, err);
        return defaultValue;
      }
    },
    [language, translationResources]
  );

  // Save preferences to localStorage
  useEffect(() => {
    if (isClient) {
      localStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify(preferences)
      );
    }
  }, [preferences, isClient]);

  // Context value
  const contextValue = useMemo<TranslationContextValue>(
    () => ({
      language,
      setLanguage,
      t,
      resources: translationResources,
      isLoading,
      error,
    }),
    [language, setLanguage, t, translationResources, isLoading, error]
  );

  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  );
};

// Hook to use translation context
export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
};

// Hook to get current language and setter
export const useLanguage = () => {
  const { language, setLanguage } = useTranslation();
  // Provide a safe default when language is null during initialization
  return { language: language || "en_US", setLanguage };
};

// Hook to get translation function with namespace
export const useTranslationNamespace = (namespace: string) => {
  const { t } = useTranslation();
  return useCallback(
    (key: string, options?: Omit<TranslationOptions, "ns">) => {
      return t(key, { ...options, ns: namespace });
    },
    [t, namespace]
  );
};
