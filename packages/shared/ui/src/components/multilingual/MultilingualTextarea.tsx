import React, { useState } from "react";
import { LanguageSelector } from "./LanguageSelector";
import { useTranslation } from "../../contexts/TranslationContext";
import { Language } from "../../types";

export interface MultilingualTextareaProps
  extends Omit<
    React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    "value" | "onChange"
  > {
  /** Values for each language */
  value?: Record<Language, string>;
  /** Callback when any language value changes */
  onChange: (values: Record<Language, string>) => void;
  /** Languages to support */
  supportedLanguages?: Language[];
  /** Show language tabs instead of dropdown */
  showLanguageTabs?: boolean;
  /** Require all languages to be filled */
  requireAllLanguages?: boolean;
  /** Show validation status for each language */
  showLanguageValidation?: boolean;
  /** Minimum length for each language */
  minLength?: number;
  /** Maximum length for each language */
  maxLength?: number;
  /** Label for the textarea */
  label?: string;
  /** Error message */
  error?: string;
  /** Helper text */
  helperText?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Show character count */
  showCharacterCount?: boolean;
}

export const MultilingualTextarea: React.FC<MultilingualTextareaProps> = ({
  value = {},
  onChange,
  supportedLanguages = ["el", "en"],
  showLanguageTabs = true,
  requireAllLanguages = false,
  showLanguageValidation = true,
  minLength,
  maxLength,
  label,
  required,
  error,
  helperText,
  showCharacterCount = true,
  className = "",
  ...textareaProps
}) => {
  const { t, language: currentLanguage } = useTranslation();
  const [activeLanguage, setActiveLanguage] = useState<Language>(
    supportedLanguages.includes(currentLanguage)
      ? currentLanguage
      : supportedLanguages[0]
  );

  const handleLanguageChange = (newLanguage: Language) => {
    setActiveLanguage(newLanguage);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const updatedValues: Record<Language, string> = {
      el: value?.el || "",
      en: value?.en || "",
      [activeLanguage]: newValue,
    };
    onChange(updatedValues);
  };

  const getLanguageValidation = (
    lang: Language
  ): { isValid: boolean; error?: string } => {
    const langValue = value[lang] || "";

    if (requireAllLanguages && !langValue.trim()) {
      return { isValid: false, error: t("required") };
    }

    if (minLength && langValue.length < minLength) {
      return { isValid: false, error: t("min_length_error") };
    }

    if (maxLength && langValue.length > maxLength) {
      return { isValid: false, error: t("max_length_error") };
    }

    return { isValid: true };
  };

  const getOverallValidation = (): { isValid: boolean; error?: string } => {
    if (requireAllLanguages) {
      const missingLanguages = supportedLanguages.filter(
        (lang) => !value[lang]?.trim()
      );
      if (missingLanguages.length > 0) {
        return {
          isValid: false,
          error: t("missing_languages") + ": " + missingLanguages.join(", "),
        };
      }
    }

    // Check if at least one language is filled
    const hasContent = supportedLanguages.some((lang) => value[lang]?.trim());
    if (required && !hasContent) {
      return { isValid: false, error: t("required") };
    }

    return { isValid: true };
  };

  const currentValidation = getLanguageValidation(activeLanguage);
  const overallValidation = getOverallValidation();
  const displayError =
    error || (!currentValidation.isValid ? currentValidation.error : undefined);

  const getLanguageLabel = (lang: Language): string => {
    const labels = {
      el: "Ελληνικά",
      en: "English",
    };
    return labels[lang] || lang.toUpperCase();
  };

  const getLanguageCompletionStatus = (
    lang: Language
  ): "complete" | "partial" | "empty" => {
    const langValue = value[lang] || "";
    if (!langValue.trim()) return "empty";

    const validation = getLanguageValidation(lang);
    return validation.isValid ? "complete" : "partial";
  };

  const currentValue = value[activeLanguage] || "";
  const characterCount = currentValue.length;

  const LanguageTab: React.FC<{ lang: Language }> = ({ lang }) => {
    const isActive = lang === activeLanguage;
    const status = getLanguageCompletionStatus(lang);

    const activeColors = isActive
      ? "border-blue-500 text-blue-600 bg-blue-50"
      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300";

    return (
      <button
        type="button"
        onClick={() => handleLanguageChange(lang)}
        className={`
          flex items-center space-x-2 px-3 py-2 border-b-2 font-medium text-sm
          transition-colors focus:outline-none
          ${
            isActive
              ? activeColors
              : `border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300`
          }
        `}
      >
        <span>{getLanguageLabel(lang)}</span>
        {showLanguageValidation && (
          <div
            className={`w-2 h-2 rounded-full ${
              status === "complete"
                ? "bg-green-500"
                : status === "partial"
                ? "bg-yellow-500"
                : "bg-gray-300"
            }`}
          />
        )}
      </button>
    );
  };

  const baseTextareaClasses = `
    w-full px-3 py-2 border rounded-md transition-colors resize-y
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    disabled:opacity-50 disabled:cursor-not-allowed
    ${displayError ? "border-red-500" : "border-gray-300"}
    ${className}
  `;

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Language Selection */}
      {showLanguageTabs ? (
        <div className="flex border-b border-gray-200">
          {supportedLanguages.map((lang) => (
            <LanguageTab key={lang} lang={lang} />
          ))}
        </div>
      ) : (
        <LanguageSelector
          variant="dropdown"
          size="sm"
          onLanguageChange={handleLanguageChange}
          className="w-32"
        />
      )}

      {/* Textarea Field */}
      <div className="relative">
        <textarea
          {...textareaProps}
          value={currentValue}
          onChange={handleTextareaChange}
          className={baseTextareaClasses}
          placeholder={
            t("enter_text_in") + " " + getLanguageLabel(activeLanguage)
          }
        />

        {/* Character Count */}
        {showCharacterCount && (
          <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white px-1">
            {characterCount}
            {maxLength && `/${maxLength}`}
          </div>
        )}
      </div>

      {/* Helper Text */}
      {helperText && !displayError && (
        <div className="text-sm text-gray-500">{helperText}</div>
      )}

      {/* Language Status Summary */}
      {showLanguageValidation && supportedLanguages.length > 1 && (
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          {supportedLanguages.map((lang) => {
            const status = getLanguageCompletionStatus(lang);
            const hasContent = Boolean(value[lang]?.trim());
            const langCharCount = value[lang]?.length || 0;

            return (
              <div key={lang} className="flex items-center space-x-1">
                <span>{getLanguageLabel(lang)}:</span>
                <div
                  className={`w-2 h-2 rounded-full ${
                    status === "complete"
                      ? "bg-green-500"
                      : status === "partial"
                      ? "bg-yellow-500"
                      : "bg-gray-300"
                  }`}
                />
                {hasContent && (
                  <span className="text-xs">({langCharCount})</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Error Message */}
      {displayError && (
        <div className="text-sm text-red-600">{displayError}</div>
      )}

      {/* Overall Error */}
      {!overallValidation.isValid && overallValidation.error && (
        <div className="text-sm text-red-600">{overallValidation.error}</div>
      )}
    </div>
  );
};

export default MultilingualTextarea;
