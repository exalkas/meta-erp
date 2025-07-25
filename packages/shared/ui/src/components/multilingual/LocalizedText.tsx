import React from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import { Language, TranslationKey } from "../../types";

export interface LocalizedTextProps {
  /** Translation key or object with language-specific text */
  text: TranslationKey | Record<Language, string>;
  /** Fallback text if translation is missing */
  fallback?: string;
  /** HTML element to render */
  as?: keyof JSX.IntrinsicElements;
  /** Additional CSS classes */
  className?: string;
  /** Show language indicator for debugging */
  showLanguageIndicator?: boolean;
  /** Values for string interpolation */
  values?: Record<string, string | number>;
  /** Custom language override */
  language?: Language;
  children?: React.ReactNode;
}

export const LocalizedText: React.FC<LocalizedTextProps> = ({
  text,
  fallback,
  as: Component = "span",
  className = "",
  showLanguageIndicator = false,
  values,
  language: overrideLanguage,
  children,
  ...props
}) => {
  const { t, language: currentLanguage } = useTranslation();

  const activeLanguage = overrideLanguage || currentLanguage;

  const getLocalizedText = (): string => {
    // If text is a translation key (string)
    if (typeof text === "string") {
      return t(text, values);
    }

    // If text is an object with language-specific text
    if (typeof text === "object" && text !== null) {
      // Try to get text for current language
      if (text[activeLanguage]) {
        return interpolateValues(text[activeLanguage], values);
      }

      // Fallback to English if available
      if (text.en) {
        return interpolateValues(text.en, values);
      }

      // Fallback to first available language
      const firstAvailable = Object.values(text)[0];
      if (firstAvailable) {
        return interpolateValues(firstAvailable, values);
      }
    }

    // Final fallback
    return fallback || text?.toString() || "";
  };

  const interpolateValues = (
    template: string,
    valueMap?: Record<string, string | number>
  ): string => {
    if (!valueMap) return template;

    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return valueMap[key]?.toString() || match;
    });
  };

  const localizedText = getLocalizedText();

  const content = (
    <>
      {localizedText}
      {showLanguageIndicator && (
        <span className="ml-1 text-xs text-gray-400 font-mono">
          [{activeLanguage.toUpperCase()}]
        </span>
      )}
      {children}
    </>
  );

  return React.createElement(Component, { className, ...props }, content);
};

// Specialized components for common use cases
export const LocalizedHeading: React.FC<
  Omit<LocalizedTextProps, "as"> & { level?: 1 | 2 | 3 | 4 | 5 | 6 }
> = ({ level = 1, className = "", ...props }) => {
  const headingClasses = {
    1: "text-3xl font-bold",
    2: "text-2xl font-semibold",
    3: "text-xl font-semibold",
    4: "text-lg font-medium",
    5: "text-base font-medium",
    6: "text-sm font-medium",
  };

  return (
    <LocalizedText
      as={`h${level}` as keyof JSX.IntrinsicElements}
      className={`${headingClasses[level]} ${className}`}
      {...props}
    />
  );
};

export const LocalizedParagraph: React.FC<Omit<LocalizedTextProps, "as">> = ({
  className = "",
  ...props
}) => (
  <LocalizedText
    as="p"
    className={`text-base leading-relaxed ${className}`}
    {...props}
  />
);

export const LocalizedLabel: React.FC<
  Omit<LocalizedTextProps, "as"> & { htmlFor?: string; required?: boolean }
> = ({ className = "", required = false, ...props }) => (
  <LocalizedText
    as="label"
    className={`block text-sm font-medium text-gray-700 ${className}`}
    {...props}
  >
    {required && <span className="text-red-500 ml-1">*</span>}
  </LocalizedText>
);

export const LocalizedButton: React.FC<
  Omit<LocalizedTextProps, "as"> & React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({
  className = "",
  text,
  fallback,
  showLanguageIndicator,
  values,
  language,
  children,
  ...buttonProps
}) => {
  const { getLocalizedText } = useLocalizedText();
  const buttonText = getLocalizedText(text, fallback, values);

  return (
    <button
      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${className}`}
      {...buttonProps}
    >
      {buttonText}
      {showLanguageIndicator && (
        <span className="ml-1 text-xs text-gray-400 font-mono">
          [{language?.toUpperCase()}]
        </span>
      )}
      {children}
    </button>
  );
};

// Hook for getting localized text values
export const useLocalizedText = () => {
  const { t, language } = useTranslation();

  const getLocalizedText = (
    text: TranslationKey | Record<Language, string>,
    fallback?: string,
    values?: Record<string, string | number>
  ): string => {
    if (typeof text === "string") {
      return t(text, values);
    }

    if (typeof text === "object" && text !== null) {
      if (text[language]) {
        return interpolateValues(text[language], values);
      }

      if (text.en) {
        return interpolateValues(text.en, values);
      }

      const firstAvailable = Object.values(text)[0];
      if (firstAvailable) {
        return interpolateValues(firstAvailable, values);
      }
    }

    return fallback || text?.toString() || "";
  };

  const interpolateValues = (
    template: string,
    valueMap?: Record<string, string | number>
  ): string => {
    if (!valueMap) return template;

    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return valueMap[key]?.toString() || match;
    });
  };

  return { getLocalizedText, language };
};

export default LocalizedText;
