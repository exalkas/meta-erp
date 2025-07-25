"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import {
  MapPin,
  Building,
  Home,
  Briefcase,
  Search,
  Check,
  X,
} from "lucide-react";

export interface GreekAddress {
  street: string;
  number: string;
  floor?: string;
  apartment?: string;
  postalCode: string;
  city: string;
  region: string;
  addressType?: "home" | "business" | "billing" | "shipping" | "other";
  landmark?: string;
  notes?: string;
}

export interface GreekAddressInputProps {
  value?: Partial<GreekAddress>;
  onChange: (address: Partial<GreekAddress>) => void;
  onValidationChange?: (isValid: boolean) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  layout?: "vertical" | "horizontal" | "compact";
  showAddressType?: boolean;
  showOptionalFields?: boolean;
  validateOnBlur?: boolean;
  autoComplete?: boolean;
}

// Greek postal code patterns by region
const POSTAL_CODE_PATTERNS = {
  ΑΤΤΙΚΗ: /^1[0-9]{4}$/,
  ΘΕΣΣΑΛΟΝΙΚΗ: /^5[0-9]{4}$/,
  ΠΑΤΡΑ: /^26[0-9]{3}$/,
  ΗΡΑΚΛΕΙΟ: /^7[0-9]{4}$/,
  ΛΑΡΙΣΑ: /^41[0-9]{3}$/,
  ΒΟΛΟΣ: /^38[0-9]{3}$/,
  ΙΩΑΝΝΙΝΑ: /^45[0-9]{3}$/,
  ΚΑΒΑΛΑ: /^65[0-9]{3}$/,
  ΣΕΡΡΕΣ: /^62[0-9]{3}$/,
  ΚΟΜΟΤΗΝΗ: /^69[0-9]{3}$/,
  ΔΡΑΜΑ: /^66[0-9]{3}$/,
  ΚΟΖΑΝΗ: /^50[0-9]{3}$/,
  ΚΑΣΤΟΡΙΑ: /^52[0-9]{3}$/,
  ΦΛΩΡΙΝΑ: /^53[0-9]{3}$/,
  ΓΡΕΒΕΝΑ: /^51[0-9]{3}$/,
  ΚΑΛΑΜΑΤΑ: /^24[0-9]{3}$/,
  ΤΡΙΠΟΛΗ: /^22[0-9]{3}$/,
  ΣΠΑΡΤΗ: /^23[0-9]{3}$/,
  ΚΟΡΙΝΘΟΣ: /^20[0-9]{3}$/,
  ΑΡΓΟΣ: /^21[0-9]{3}$/,
  ΝΑΥΠΛΙΟ: /^21[0-9]{3}$/,
};

// Major Greek cities with postal code validation
const GREEK_CITIES = [
  { name: "ΑΘΗΝΑ", region: "ΑΤΤΙΚΗ", postalRange: "10000-19999" },
  {
    name: "ΘΕΣΣΑΛΟΝΙΚΗ",
    region: "ΚΕΝΤΡΙΚΗ ΜΑΚΕΔΟΝΙΑ",
    postalRange: "50000-59999",
  },
  { name: "ΠΑΤΡΑ", region: "ΔΥΤΙΚΗ ΕΛΛΑΔΑ", postalRange: "26000-26999" },
  { name: "ΗΡΑΚΛΕΙΟ", region: "ΚΡΗΤΗ", postalRange: "70000-79999" },
  { name: "ΛΑΡΙΣΑ", region: "ΘΕΣΣΑΛΙΑ", postalRange: "41000-41999" },
  { name: "ΒΟΛΟΣ", region: "ΘΕΣΣΑΛΙΑ", postalRange: "38000-38999" },
  { name: "ΙΩΑΝΝΙΝΑ", region: "ΗΠΕΙΡΟΣ", postalRange: "45000-45999" },
  {
    name: "ΚΑΒΑΛΑ",
    region: "ΑΝΑΤΟΛΙΚΗ ΜΑΚΕΔΟΝΙΑ ΚΑΙ ΘΡΑΚΗ",
    postalRange: "65000-65999",
  },
  { name: "ΣΕΡΡΕΣ", region: "ΚΕΝΤΡΙΚΗ ΜΑΚΕΔΟΝΙΑ", postalRange: "62000-62999" },
  {
    name: "ΚΟΜΟΤΗΝΗ",
    region: "ΑΝΑΤΟΛΙΚΗ ΜΑΚΕΔΟΝΙΑ ΚΑΙ ΘΡΑΚΗ",
    postalRange: "69000-69999",
  },
];

export const GreekAddressInput: React.FC<GreekAddressInputProps> = ({
  value = {},
  onChange,
  onValidationChange,
  required = false,
  disabled = false,
  className = "",
  layout = "vertical",
  showAddressType = true,
  showOptionalFields = false,
  validateOnBlur = true,
  autoComplete = true,
}) => {
  const { t } = useTranslation();

  const validateGreekPostalCode = (code: string) => {
    return /^[0-9]{5}$/.test(code);
  };

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [suggestions, setSuggestions] = useState<typeof GREEK_CITIES>([]);

  const validateField = useCallback(
    (field: string, fieldValue: string) => {
      const newErrors = { ...errors };

      switch (field) {
        case "street":
          if (required && !fieldValue.trim()) {
            newErrors.street = t("validation.streetRequired", {
              ns: "greekAddress",
            });
          } else if (fieldValue.length < 3) {
            newErrors.street = t("validation.streetTooShort", {
              ns: "greekAddress",
            });
          } else {
            delete newErrors.street;
          }
          break;

        case "number":
          if (required && !fieldValue.trim()) {
            newErrors.number = t("validation.numberRequired", {
              ns: "greekAddress",
            });
          } else if (fieldValue && !/^[0-9]+[Α-Ω]?$/.test(fieldValue)) {
            newErrors.number = t("validation.numberInvalid", {
              ns: "greekAddress",
            });
          } else {
            delete newErrors.number;
          }
          break;

        case "postalCode":
          if (required && !fieldValue.trim()) {
            newErrors.postalCode = t("validation.postalCodeRequired", {
              ns: "greekAddress",
            });
          } else if (fieldValue && !validateGreekPostalCode(fieldValue)) {
            newErrors.postalCode = t("validation.postalCodeInvalid", {
              ns: "greekAddress",
            });
          } else if (fieldValue && value.city) {
            // Validate postal code matches city
            const city = GREEK_CITIES.find((c) => c.name === value.city);
            if (city) {
              const [min, max] = city.postalRange.split("-").map(Number);
              const code = parseInt(fieldValue);
              if (code < min || code > max) {
                newErrors.postalCode = t("validation.postalCodeMismatch", {
                  ns: "greekAddress",
                });
              } else {
                delete newErrors.postalCode;
              }
            }
          } else {
            delete newErrors.postalCode;
          }
          break;

        case "city":
          if (required && !fieldValue.trim()) {
            newErrors.city = t("validation.cityRequired", {
              ns: "greekAddress",
            });
          } else {
            delete newErrors.city;
          }
          break;

        case "region":
          if (required && !fieldValue.trim()) {
            newErrors.region = t("validation.regionRequired", {
              ns: "greekAddress",
            });
          } else {
            delete newErrors.region;
          }
          break;
      }

      setErrors(newErrors);

      // Check overall validation
      const isValid =
        Object.keys(newErrors).length === 0 &&
        (!required ||
          (!!value.street &&
            !!value.number &&
            !!value.postalCode &&
            !!value.city &&
            !!value.region));

      onValidationChange?.(isValid);
    },
    [errors, required, value, validateGreekPostalCode, t, onValidationChange]
  );

  const handleFieldChange = (field: keyof GreekAddress, fieldValue: string) => {
    const newValue = { ...value, [field]: fieldValue };
    onChange(newValue);

    if (validateOnBlur && touched[field]) {
      validateField(field, fieldValue);
    }

    // Auto-suggest cities based on postal code
    if (field === "postalCode" && fieldValue.length === 5) {
      const matchingCities = GREEK_CITIES.filter((city) => {
        const [min, max] = city.postalRange.split("-").map(Number);
        const code = parseInt(fieldValue);
        return code >= min && code <= max;
      });
      setSuggestions(matchingCities);

      if (matchingCities.length === 1) {
        onChange({
          ...newValue,
          city: matchingCities[0].name,
          region: matchingCities[0].region,
        });
      }
    }
  };

  const handleFieldBlur = (field: keyof GreekAddress) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (validateOnBlur) {
      validateField(field, value[field] || "");
    }
  };

  const formatAddress = (address: Partial<GreekAddress>) => {
    const parts = [];

    if (address.street && address.number) {
      parts.push(`${address.street} ${address.number}`);
    }

    if (address.floor || address.apartment) {
      const details = [];
      if (address.floor)
        details.push(`${t("greekAddress.floor")} ${address.floor}`);
      if (address.apartment)
        details.push(`${t("greekAddress.apartment")} ${address.apartment}`);
      parts.push(details.join(", "));
    }

    if (address.postalCode && address.city) {
      parts.push(`${address.postalCode} ${address.city}`);
    }

    if (address.region) {
      parts.push(address.region);
    }

    return parts.join("\n");
  };

  const getAddressTypeIcon = (type?: string) => {
    switch (type) {
      case "home":
        return <Home className="w-4 h-4" />;
      case "business":
        return <Briefcase className="w-4 h-4" />;
      case "billing":
      case "shipping":
        return <Building className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const isCompact = layout === "compact";
  const isHorizontal = layout === "horizontal";

  return (
    <div className={`greek-address-input ${className}`}>
      {showAddressType && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t("addressType", { ns: "greekAddress" })}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {["home", "business", "billing", "shipping"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleFieldChange("addressType", type)}
                disabled={disabled}
                className={`
                  flex items-center justify-center px-3 py-2 text-sm rounded-lg border transition-colors
                  ${
                    value.addressType === type
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-400 text-blue-700 dark:text-blue-300"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }
                  ${
                    disabled
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }
                `}
              >
                {getAddressTypeIcon(type)}
                <span className="ml-2">
                  {t(`types.${type}`, { ns: "greekAddress" })}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        className={`grid gap-4 ${
          isCompact
            ? "grid-cols-1"
            : isHorizontal
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-1"
        }`}
      >
        {/* Street Address */}
        <div className={isHorizontal ? "col-span-2" : ""}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t("street", { ns: "greekAddress" })}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            value={value.street || ""}
            onChange={(e) => handleFieldChange("street", e.target.value)}
            onBlur={() => handleFieldBlur("street")}
            disabled={disabled}
            placeholder={t("streetPlaceholder", { ns: "greekAddress" })}
            autoComplete={autoComplete ? "address-line1" : "off"}
            className={`
              w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              text-gray-900 dark:text-gray-100
              ${
                errors.street
                  ? "border-red-300 dark:border-red-400 bg-red-50 dark:bg-red-900/20"
                  : "border-gray-300 dark:border-gray-600"
              }
              ${
                disabled
                  ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                  : "bg-white dark:bg-gray-800"
              }
            `}
          />
          {errors.street && touched.street && (
            <p className="mt-1 text-xs text-red-600">{errors.street}</p>
          )}
        </div>

        {/* Street Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t("number", { ns: "greekAddress" })}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            value={value.number || ""}
            onChange={(e) => handleFieldChange("number", e.target.value)}
            onBlur={() => handleFieldBlur("number")}
            disabled={disabled}
            placeholder="123Α"
            autoComplete={autoComplete ? "address-line2" : "off"}
            className={`
              w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              text-gray-900 dark:text-gray-100
              ${
                errors.number
                  ? "border-red-300 dark:border-red-400 bg-red-50 dark:bg-red-900/20"
                  : "border-gray-300 dark:border-gray-600"
              }
              ${
                disabled
                  ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                  : "bg-white dark:bg-gray-800"
              }
            `}
          />
          {errors.number && touched.number && (
            <p className="mt-1 text-xs text-red-600">{errors.number}</p>
          )}
        </div>

        {/* Optional Fields */}
        {showOptionalFields && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("floor", { ns: "greekAddress" })}
              </label>
              <input
                type="text"
                value={value.floor || ""}
                onChange={(e) => handleFieldChange("floor", e.target.value)}
                disabled={disabled}
                placeholder="1ος"
                className={`
                  w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  text-gray-900 dark:text-gray-100
                  ${
                    disabled
                      ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                      : "bg-white dark:bg-gray-800"
                  }
                `}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("apartment", { ns: "greekAddress" })}
              </label>
              <input
                type="text"
                value={value.apartment || ""}
                onChange={(e) => handleFieldChange("apartment", e.target.value)}
                disabled={disabled}
                placeholder="12"
                className={`
                  w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  text-gray-900 dark:text-gray-100
                  ${
                    disabled
                      ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                      : "bg-white dark:bg-gray-800"
                  }
                `}
              />
            </div>
          </>
        )}

        {/* Postal Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t("postalCode", { ns: "greekAddress" })}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            value={value.postalCode || ""}
            onChange={(e) => handleFieldChange("postalCode", e.target.value)}
            onBlur={() => handleFieldBlur("postalCode")}
            disabled={disabled}
            placeholder="12345"
            maxLength={5}
            autoComplete={autoComplete ? "postal-code" : "off"}
            className={`
              w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              text-gray-900 dark:text-gray-100
              ${
                errors.postalCode
                  ? "border-red-300 dark:border-red-400 bg-red-50 dark:bg-red-900/20"
                  : "border-gray-300 dark:border-gray-600"
              }
              ${
                disabled
                  ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                  : "bg-white dark:bg-gray-800"
              }
            `}
          />
          {errors.postalCode && touched.postalCode && (
            <p className="mt-1 text-xs text-red-600">{errors.postalCode}</p>
          )}
        </div>

        {/* City */}
        <div className={isHorizontal ? "col-span-1" : ""}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t("city", { ns: "greekAddress" })}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="relative">
            <input
              type="text"
              value={value.city || ""}
              onChange={(e) => handleFieldChange("city", e.target.value)}
              onBlur={() => handleFieldBlur("city")}
              disabled={disabled}
              placeholder={t("cityPlaceholder", { ns: "greekAddress" })}
              autoComplete={autoComplete ? "address-level2" : "off"}
              className={`
                w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                text-gray-900 dark:text-gray-100
                ${
                  errors.city
                    ? "border-red-300 dark:border-red-400 bg-red-50 dark:bg-red-900/20"
                    : "border-gray-300 dark:border-gray-600"
                }
                ${
                  disabled
                    ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                    : "bg-white dark:bg-gray-800"
                }
              `}
            />
            {suggestions.length > 0 && value.postalCode && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
                {suggestions.map((city, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      handleFieldChange("city", city.name);
                      handleFieldChange("region", city.region);
                      setSuggestions([]);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg text-gray-900 dark:text-gray-100"
                  >
                    <div className="font-medium">{city.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {city.region}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {errors.city && touched.city && (
            <p className="mt-1 text-xs text-red-600">{errors.city}</p>
          )}
        </div>

        {/* Region */}
        <div className={isHorizontal ? "col-span-1" : ""}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t("region", { ns: "greekAddress" })}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            value={value.region || ""}
            onChange={(e) => handleFieldChange("region", e.target.value)}
            onBlur={() => handleFieldBlur("region")}
            disabled={disabled}
            placeholder={t("regionPlaceholder", { ns: "greekAddress" })}
            autoComplete={autoComplete ? "address-level1" : "off"}
            className={`
              w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              text-gray-900 dark:text-gray-100
              ${
                errors.region
                  ? "border-red-300 dark:border-red-400 bg-red-50 dark:bg-red-900/20"
                  : "border-gray-300 dark:border-gray-600"
              }
              ${
                disabled
                  ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                  : "bg-white dark:bg-gray-800"
              }
            `}
          />
          {errors.region && touched.region && (
            <p className="mt-1 text-xs text-red-600">{errors.region}</p>
          )}
        </div>

        {/* Landmark/Notes */}
        {showOptionalFields && (
          <div className={isHorizontal ? "col-span-full" : ""}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("landmark", { ns: "greekAddress" })}
            </label>
            <input
              type="text"
              value={value.landmark || ""}
              onChange={(e) => handleFieldChange("landmark", e.target.value)}
              disabled={disabled}
              placeholder={t("landmarkPlaceholder", { ns: "greekAddress" })}
              className={`
                w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                text-gray-900 dark:text-gray-100
                ${
                  disabled
                    ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                    : "bg-white dark:bg-gray-800"
                }
              `}
            />
          </div>
        )}
      </div>

      {/* Address Preview */}
      {(value.street || value.city) && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-700 whitespace-pre-line">
              {formatAddress(value)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GreekAddressInput;
