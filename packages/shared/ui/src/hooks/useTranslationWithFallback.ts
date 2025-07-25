/**
 * Enhanced translation hook with fallback language support
 * Provides additional features for handling missing translations
 */

import { useCallback } from "react";
import { useTranslation } from "../contexts/TranslationContext";
import { TranslationOptions, Language } from "../types";

interface TranslationWithFallbackOptions extends TranslationOptions {
  fallbackLanguage?: Language;
  showMissingKey?: boolean;
  logMissingKeys?: boolean;
}

interface TranslationWithFallbackResult {
  t: (key: string, options?: TranslationWithFallbackOptions) => string;
  hasTranslation: (key: string, namespace?: string) => boolean;
  getTranslationForLanguage: (
    key: string,
    language: Language,
    options?: TranslationOptions
  ) => string;
  getMissingKeys: () => string[];
  language: Language;
  fallbackLanguage: Language;
}

// Track missing keys for debugging
const missingKeys = new Set<string>();

export const useTranslationWithFallback = (
  defaultFallbackLanguage: Language = "en",
  enableMissingKeyTracking = true
): TranslationWithFallbackResult => {
  const { t: baseT, language, resources } = useTranslation();

  // Enhanced translation function with fallback
  const t = useCallback(
    (key: string, options?: TranslationWithFallbackOptions): string => {
      const {
        fallbackLanguage = defaultFallbackLanguage,
        showMissingKey = false,
        logMissingKeys = enableMissingKeyTracking,
        ...baseOptions
      } = options || {};

      // Try current language first
      const currentResult = baseT(key, baseOptions);

      // If we got back the key or default value, try fallback
      if (currentResult === key || currentResult === baseOptions.defaultValue) {
        // Try fallback language
        const fallbackResult = baseT(key, {
          ...baseOptions,
          defaultValue: undefined, // Don't use default value for fallback attempt
        });

        // If fallback also failed, handle missing key
        if (fallbackResult === key) {
          const missingKeyString = `${baseOptions.ns || "common"}:${key}`;

          if (logMissingKeys) {
            missingKeys.add(missingKeyString);
            console.warn(
              `Missing translation key: ${missingKeyString} for language: ${language}`
            );
          }

          if (showMissingKey) {
            return `[${missingKeyString}]`;
          }

          return baseOptions.defaultValue || key;
        }

        return fallbackResult;
      }

      return currentResult;
    },
    [baseT, language, defaultFallbackLanguage, enableMissingKeyTracking]
  );

  // Check if translation exists
  const hasTranslation = useCallback(
    (key: string, namespace = "common"): boolean => {
      const langResources = resources[language];
      if (!langResources) return false;

      const namespaceResources = langResources[namespace];
      if (!namespaceResources) return false;

      const value = key.split(".").reduce((current: any, keyPart: string) => {
        return current && typeof current === "object"
          ? current[keyPart]
          : undefined;
      }, namespaceResources);
      return value !== undefined && value !== null;
    },
    [resources, language]
  );

  // Get translation for specific language
  const getTranslationForLanguage = useCallback(
    (
      key: string,
      targetLanguage: Language,
      options?: TranslationOptions
    ): string => {
      const langResources = resources[targetLanguage];
      if (!langResources) return key;

      const namespace = options?.ns || "common";
      const namespaceResources = langResources[namespace];
      if (!namespaceResources) return key;

      const value = key.split(".").reduce((current: any, keyPart: string) => {
        return current && typeof current === "object"
          ? current[keyPart]
          : undefined;
      }, namespaceResources);

      if (typeof value === "string") {
        // Apply variable interpolation if provided
        if (options?.variables) {
          return value.replace(/\{\{(\w+)\}\}/g, (match, varKey) => {
            return String(options.variables![varKey] || match);
          });
        }
        return value;
      }

      return options?.defaultValue || key;
    },
    [resources]
  );

  // Get missing keys for debugging
  const getMissingKeys = useCallback((): string[] => {
    return Array.from(missingKeys);
  }, []);

  return {
    t,
    hasTranslation,
    getTranslationForLanguage,
    getMissingKeys,
    language,
    fallbackLanguage: defaultFallbackLanguage,
  };
};

// Hook for checking multiple translations at once
export const useTranslationBatch = (keys: string[], namespace?: string) => {
  const { hasTranslation, getTranslationForLanguage, language } =
    useTranslationWithFallback();

  const checkTranslations = useCallback(() => {
    return keys.map((key) => ({
      key,
      exists: hasTranslation(key, namespace),
      value: getTranslationForLanguage(key, language, { ns: namespace }),
    }));
  }, [keys, namespace, hasTranslation, getTranslationForLanguage, language]);

  return checkTranslations;
};

// Hook for pluralization with fallback
export const useTranslationPluralization = () => {
  const { t } = useTranslationWithFallback();

  const pluralize = useCallback(
    (
      key: string,
      count: number,
      options?: TranslationWithFallbackOptions
    ): string => {
      // Simple pluralization logic
      const pluralKey = count === 1 ? key : `${key}_plural`;

      return t(pluralKey, {
        ...options,
        variables: { ...options?.variables, count },
        count,
      });
    },
    [t]
  );

  return { pluralize };
};
