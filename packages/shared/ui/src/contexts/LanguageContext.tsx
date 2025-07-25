/**
 * Language Context for Language Management
 * Provides language detection, switching, and preferences management
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  Language,
  UserLanguagePreferences,
  LanguageDetectionOptions,
} from "../types";

// Language context interface
interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  preferences: UserLanguagePreferences;
  setPreferences: (preferences: UserLanguagePreferences) => void;
  supportedLanguages: Language[];
  detectLanguage: () => Language | null;
  isRTL: boolean;
}

// Default language preferences
const DEFAULT_PREFERENCES: UserLanguagePreferences = {
  primaryLanguage: "el",
  fallbackLanguage: "en",
  dateFormat: "dd/MM/yyyy",
  numberFormat: "european",
  currency: "EUR",
  timezone: "Europe/Athens",
};

// Language context
const LanguageContext = createContext<LanguageContextValue | null>(null);

// Language detection utilities
const detectLanguageFromNavigator = (): Language | null => {
  if (typeof window === "undefined") return null;

  const browserLang = navigator.language || navigator.languages?.[0];
  if (browserLang?.startsWith("el")) return "el";
  if (browserLang?.startsWith("en")) return "en";
  return null;
};

const detectLanguageFromPath = (): Language | null => {
  if (typeof window === "undefined") return null;

  const path = window.location.pathname;
  const pathLang = path.split("/")[1];
  return pathLang === "el" || pathLang === "en" ? pathLang : null;
};

const detectLanguageFromDomain = (): Language | null => {
  if (typeof window === "undefined") return null;

  const hostname = window.location.hostname;
  if (hostname.includes(".gr") || hostname.includes("greek")) return "el";
  if (hostname.includes(".com") || hostname.includes("english")) return "en";
  return null;
};

const detectLanguageFromStorage = (key: string): Language | null => {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(key);
  if (stored && (stored === "el" || stored === "en")) {
    return stored as Language;
  }
  return null;
};

// Language provider component
interface LanguageProviderProps {
  children: React.ReactNode;
  defaultLanguage?: Language;
  supportedLanguages?: Language[];
  detectionOptions?: LanguageDetectionOptions;
  storageKey?: string;
  preferencesKey?: string;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
  defaultLanguage = "el",
  supportedLanguages = ["el", "en"],
  detectionOptions = {
    detectFromPath: true,
    detectFromHeaders: true,
    detectFromNavigator: true,
    fallback: "el",
  },
  storageKey = "ui_language",
  preferencesKey = "ui_language_preferences",
}) => {
  // Initialize language with detection
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") return defaultLanguage;

    // Try storage first
    const stored = detectLanguageFromStorage(storageKey);
    if (stored) return stored;

    // Auto-detect language
    const detected =
      (detectionOptions.detectFromPath && detectLanguageFromPath()) ||
      (detectionOptions.detectFromHeaders && detectLanguageFromDomain()) ||
      (detectionOptions.detectFromNavigator && detectLanguageFromNavigator());

    if (detected && supportedLanguages.includes(detected)) {
      localStorage.setItem(storageKey, detected);
      return detected;
    }

    return detectionOptions.fallback || defaultLanguage;
  });

  // Initialize preferences
  const [preferences, setPreferencesState] = useState<UserLanguagePreferences>(
    () => {
      if (typeof window === "undefined") {
        return { ...DEFAULT_PREFERENCES, primaryLanguage: language };
      }

      const stored = localStorage.getItem(preferencesKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return {
            ...DEFAULT_PREFERENCES,
            ...parsed,
            primaryLanguage: language,
          };
        } catch {
          // Fall through to defaults
        }
      }

      return { ...DEFAULT_PREFERENCES, primaryLanguage: language };
    }
  );

  // Set language with persistence
  const setLanguage = useCallback(
    (newLanguage: Language) => {
      if (!supportedLanguages.includes(newLanguage)) {
        console.warn(`Language "${newLanguage}" is not supported`);
        return;
      }

      setLanguageState(newLanguage);
      localStorage.setItem(storageKey, newLanguage);

      // Update preferences
      setPreferencesState((prev) => ({
        ...prev,
        primaryLanguage: newLanguage,
      }));

      // Update document language
      if (typeof document !== "undefined") {
        document.documentElement.lang = newLanguage;
        document.documentElement.dir = "ltr"; // Greek and English are both LTR
      }
    },
    [supportedLanguages, storageKey]
  );

  // Set preferences with persistence
  const setPreferences = useCallback(
    (newPreferences: UserLanguagePreferences) => {
      setPreferencesState(newPreferences);
      localStorage.setItem(preferencesKey, JSON.stringify(newPreferences));

      // Update language if changed
      if (newPreferences.primaryLanguage !== language) {
        setLanguage(newPreferences.primaryLanguage);
      }
    },
    [language, setLanguage, preferencesKey]
  );

  // Language detection function
  const detectLanguage = useCallback((): Language | null => {
    const detected =
      (detectionOptions.detectFromPath && detectLanguageFromPath()) ||
      (detectionOptions.detectFromHeaders && detectLanguageFromDomain()) ||
      (detectionOptions.detectFromNavigator && detectLanguageFromNavigator());

    return detected && supportedLanguages.includes(detected) ? detected : null;
  }, [detectionOptions, supportedLanguages]);

  // Check if current language is RTL (Greek and English are both LTR)
  const isRTL = false; // Future RTL support for other languages

  // Update document language on language change
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
      document.documentElement.dir = isRTL ? "rtl" : "ltr";
    }
  }, [language, isRTL]);

  // Context value
  const contextValue: LanguageContextValue = {
    language,
    setLanguage,
    preferences,
    setPreferences,
    supportedLanguages,
    detectLanguage,
    isRTL,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook to use language context
export const useLanguageContext = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error(
      "useLanguageContext must be used within a LanguageProvider"
    );
  }
  return context;
};

// Hook for language switching
export const useLanguageSwitcher = () => {
  const { language, setLanguage, supportedLanguages } = useLanguageContext();

  const switchLanguage = useCallback(
    (targetLanguage?: Language) => {
      if (targetLanguage) {
        setLanguage(targetLanguage);
      } else {
        // Toggle between supported languages
        const currentIndex = supportedLanguages.indexOf(language);
        const nextIndex = (currentIndex + 1) % supportedLanguages.length;
        setLanguage(supportedLanguages[nextIndex]);
      }
    },
    [language, setLanguage, supportedLanguages]
  );

  return { switchLanguage, currentLanguage: language, supportedLanguages };
};

// Hook for language preferences
export const useLanguagePreferences = () => {
  const { preferences, setPreferences } = useLanguageContext();

  const updatePreferences = useCallback(
    (updates: Partial<UserLanguagePreferences>) => {
      setPreferences({ ...preferences, ...updates });
    },
    [preferences, setPreferences]
  );

  return { preferences, updatePreferences };
};

// Hook for language detection
export const useLanguageDetection = () => {
  const { detectLanguage } = useLanguageContext();

  const autoDetectAndSet = useCallback(() => {
    const detected = detectLanguage();
    if (detected) {
      // This would need to be connected to the setLanguage function
      // For now, just return the detected language
      return detected;
    }
    return null;
  }, [detectLanguage]);

  return { detectLanguage, autoDetectAndSet };
};
