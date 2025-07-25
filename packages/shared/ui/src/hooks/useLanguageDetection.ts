/**
 * Language detection hook
 * Automatically detects user language from various sources
 */

import { useCallback, useEffect, useState } from "react";
import { Language, LanguageDetectionOptions } from "../types";

interface LanguageDetectionResult {
  detectedLanguage: Language | null;
  detectionMethod:
    | "storage"
    | "path"
    | "headers"
    | "navigator"
    | "domain"
    | "query"
    | "cookie"
    | null;
  confidence: number;
  isDetecting: boolean;
  detect: () => Promise<Language | null>;
  forceDetection: () => Promise<Language | null>;
}

// Default detection options
const DEFAULT_OPTIONS: LanguageDetectionOptions = {
  detectFromPath: true,
  detectFromHeaders: true,
  detectFromNavigator: true,
  fallback: "el",
  cookieName: "ui_language",
  storageKey: "ui_language",
};

export const useLanguageDetection = (
  options: LanguageDetectionOptions = DEFAULT_OPTIONS
): LanguageDetectionResult => {
  const [detectedLanguage, setDetectedLanguage] = useState<Language | null>(
    null
  );
  const [detectionMethod, setDetectionMethod] =
    useState<LanguageDetectionResult["detectionMethod"]>(null);
  const [confidence, setConfidence] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);

  // Detect language from localStorage
  const detectFromStorage = useCallback((): {
    language: Language | null;
    confidence: number;
  } => {
    if (typeof window === "undefined" || !options.storageKey) {
      return { language: null, confidence: 0 };
    }

    try {
      const stored = localStorage.getItem(options.storageKey);
      if (stored === "el" || stored === "en") {
        return { language: stored as Language, confidence: 0.9 };
      }
    } catch (error) {
      console.warn("Failed to read from localStorage:", error);
    }

    return { language: null, confidence: 0 };
  }, [options.storageKey]);

  // Detect language from URL path
  const detectFromPath = useCallback((): {
    language: Language | null;
    confidence: number;
  } => {
    if (typeof window === "undefined" || !options.detectFromPath) {
      return { language: null, confidence: 0 };
    }

    const path = window.location.pathname;
    const segments = path.split("/").filter(Boolean);

    if (segments.length > 0) {
      const firstSegment = segments[0];
      if (firstSegment === "el" || firstSegment === "en") {
        return { language: firstSegment as Language, confidence: 0.8 };
      }
    }

    return { language: null, confidence: 0 };
  }, [options.detectFromPath]);

  // Detect language from query parameters
  const detectFromQuery = useCallback((): {
    language: Language | null;
    confidence: number;
  } => {
    if (typeof window === "undefined") {
      return { language: null, confidence: 0 };
    }

    const params = new URLSearchParams(window.location.search);
    const langParam = params.get("lang") || params.get("language");

    if (langParam === "el" || langParam === "en") {
      return { language: langParam as Language, confidence: 0.7 };
    }

    return { language: null, confidence: 0 };
  }, []);

  // Detect language from cookies
  const detectFromCookie = useCallback((): {
    language: Language | null;
    confidence: number;
  } => {
    if (typeof document === "undefined" || !options.cookieName) {
      return { language: null, confidence: 0 };
    }

    try {
      const cookies = document.cookie.split(";");
      const langCookie = cookies.find((cookie) =>
        cookie.trim().startsWith(`${options.cookieName}=`)
      );

      if (langCookie) {
        const value = langCookie.split("=")[1];
        if (value === "el" || value === "en") {
          return { language: value as Language, confidence: 0.6 };
        }
      }
    } catch (error) {
      console.warn("Failed to read from cookies:", error);
    }

    return { language: null, confidence: 0 };
  }, [options.cookieName]);

  // Detect language from domain
  const detectFromDomain = useCallback((): {
    language: Language | null;
    confidence: number;
  } => {
    if (typeof window === "undefined") {
      return { language: null, confidence: 0 };
    }

    const hostname = window.location.hostname;

    // Check for Greek domain indicators
    if (
      hostname.includes(".gr") ||
      hostname.includes("greek") ||
      hostname.includes("ellada")
    ) {
      return { language: "el", confidence: 0.5 };
    }

    // Check for English domain indicators
    if (
      hostname.includes(".com") ||
      hostname.includes("english") ||
      hostname.includes("international")
    ) {
      return { language: "en", confidence: 0.4 };
    }

    return { language: null, confidence: 0 };
  }, []);

  // Detect language from browser navigator
  const detectFromNavigator = useCallback((): {
    language: Language | null;
    confidence: number;
  } => {
    if (typeof navigator === "undefined" || !options.detectFromNavigator) {
      return { language: null, confidence: 0 };
    }

    const browserLanguages = navigator.languages || [navigator.language];

    for (const lang of browserLanguages) {
      const langCode = lang.split("-")[0].toLowerCase();
      if (langCode === "el") {
        return { language: "el", confidence: 0.6 };
      }
      if (langCode === "en") {
        return { language: "en", confidence: 0.3 };
      }
    }

    return { language: null, confidence: 0 };
  }, [options.detectFromNavigator]);

  // Detect language from HTTP headers (mock implementation for client-side)
  const detectFromHeaders = useCallback((): {
    language: Language | null;
    confidence: number;
  } => {
    if (!options.detectFromHeaders) {
      return { language: null, confidence: 0 };
    }

    // In a real implementation, this would check Accept-Language header
    // For now, we'll use navigator as a fallback
    return detectFromNavigator();
  }, [options.detectFromHeaders, detectFromNavigator]);

  // Main detection function
  const detect = useCallback(async (): Promise<Language | null> => {
    setIsDetecting(true);

    try {
      // Detection methods ordered by priority/confidence
      const detectionMethods = [
        { method: "storage", detect: detectFromStorage },
        { method: "path", detect: detectFromPath },
        { method: "query", detect: detectFromQuery },
        { method: "cookie", detect: detectFromCookie },
        { method: "headers", detect: detectFromHeaders },
        { method: "domain", detect: detectFromDomain },
        { method: "navigator", detect: detectFromNavigator },
      ] as const;

      let bestResult: {
        language: Language | null;
        confidence: number;
        method: string;
      } = {
        language: null,
        confidence: 0,
        method: "",
      };

      // Try each detection method
      for (const { method, detect } of detectionMethods) {
        const result = detect();
        if (result.language && result.confidence > bestResult.confidence) {
          bestResult = { ...result, method };
        }
      }

      // Set results
      setDetectedLanguage(bestResult.language);
      setDetectionMethod(
        bestResult.method as LanguageDetectionResult["detectionMethod"]
      );
      setConfidence(bestResult.confidence);

      return bestResult.language;
    } catch (error) {
      console.error("Language detection error:", error);
      const fallback = options.fallback || "el";
      setDetectedLanguage(fallback);
      setDetectionMethod(null);
      setConfidence(0);
      return fallback;
    } finally {
      setIsDetecting(false);
    }
  }, [
    detectFromStorage,
    detectFromPath,
    detectFromQuery,
    detectFromCookie,
    detectFromHeaders,
    detectFromDomain,
    detectFromNavigator,
    options.fallback,
  ]);

  // Force detection (ignores cache)
  const forceDetection = useCallback(async (): Promise<Language | null> => {
    // Clear current results
    setDetectedLanguage(null);
    setDetectionMethod(null);
    setConfidence(0);

    return detect();
  }, [detect]);

  // Auto-detect on mount
  useEffect(() => {
    detect();
  }, [detect]);

  return {
    detectedLanguage,
    detectionMethod,
    confidence,
    isDetecting,
    detect,
    forceDetection,
  };
};

// Hook for simplified language detection
export const useSimpleLanguageDetection = (fallback: Language = "el") => {
  const { detectedLanguage, isDetecting } = useLanguageDetection({
    fallback,
    detectFromPath: true,
    detectFromNavigator: true,
  });

  return {
    language: detectedLanguage || fallback,
    isDetecting,
  };
};

// Hook for language detection with callback
export const useLanguageDetectionWithCallback = (
  onLanguageDetected: (language: Language, method: string) => void,
  options?: LanguageDetectionOptions
) => {
  const { detectedLanguage, detectionMethod, confidence, isDetecting, detect } =
    useLanguageDetection(options);

  useEffect(() => {
    if (detectedLanguage && detectionMethod) {
      onLanguageDetected(detectedLanguage, detectionMethod);
    }
  }, [detectedLanguage, detectionMethod, onLanguageDetected]);

  return {
    detectedLanguage,
    detectionMethod,
    confidence,
    isDetecting,
    detect,
  };
};
