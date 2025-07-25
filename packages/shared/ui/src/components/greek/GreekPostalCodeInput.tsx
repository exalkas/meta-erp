"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import {
  MapPin,
  Search,
  Check,
  X,
  AlertCircle,
  Navigation,
} from "lucide-react";

export interface PostalCodeInfo {
  code: string;
  city: string;
  region: string;
  prefecture: string;
  municipality?: string;
  geographicArea: "urban" | "suburban" | "rural" | "island";
  vatZone?: "mainland" | "island_special" | "island_remote";
  timezone: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface GreekPostalCodeInputProps {
  value?: string;
  onChange: (code: string, info?: PostalCodeInfo) => void;
  onValidationChange?: (isValid: boolean) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  showSuggestions?: boolean;
  showAreaInfo?: boolean;
  showVATZone?: boolean;
  autoComplete?: boolean;
  formatInput?: boolean;
  validateOnBlur?: boolean;
}

// Greek postal code database (simplified for demo)
const POSTAL_CODE_DATABASE: Record<string, PostalCodeInfo> = {
  "10431": {
    code: "10431",
    city: "ΑΘΗΝΑ",
    region: "ΑΤΤΙΚΗ",
    prefecture: "ΑΘΗΝΩΝ",
    municipality: "ΚΕΝΤΡΟΥ",
    geographicArea: "urban",
    vatZone: "mainland",
    timezone: "Europe/Athens",
    coordinates: { lat: 37.9755, lng: 23.7348 },
  },
  "10432": {
    code: "10432",
    city: "ΑΘΗΝΑ",
    region: "ΑΤΤΙΚΗ",
    prefecture: "ΑΘΗΝΩΝ",
    municipality: "ΚΕΝΤΡΟΥ",
    geographicArea: "urban",
    vatZone: "mainland",
    timezone: "Europe/Athens",
    coordinates: { lat: 37.9748, lng: 23.735 },
  },
  "54630": {
    code: "54630",
    city: "ΘΕΣΣΑΛΟΝΙΚΗ",
    region: "ΚΕΝΤΡΙΚΗ ΜΑΚΕΔΟΝΙΑ",
    prefecture: "ΘΕΣΣΑΛΟΝΙΚΗΣ",
    municipality: "ΘΕΣΣΑΛΟΝΙΚΗΣ",
    geographicArea: "urban",
    vatZone: "mainland",
    timezone: "Europe/Athens",
    coordinates: { lat: 40.6401, lng: 22.9444 },
  },
  "26441": {
    code: "26441",
    city: "ΠΑΤΡΑ",
    region: "ΔΥΤΙΚΗ ΕΛΛΑΔΑ",
    prefecture: "ΑΧΑΙΑΣ",
    municipality: "ΠΑΤΡΕΩΝ",
    geographicArea: "urban",
    vatZone: "mainland",
    timezone: "Europe/Athens",
    coordinates: { lat: 38.2466, lng: 21.7346 },
  },
  "71202": {
    code: "71202",
    city: "ΗΡΑΚΛΕΙΟ",
    region: "ΚΡΗΤΗ",
    prefecture: "ΗΡΑΚΛΕΙΟΥ",
    municipality: "ΗΡΑΚΛΕΙΟΥ",
    geographicArea: "urban",
    vatZone: "island_special",
    timezone: "Europe/Athens",
    coordinates: { lat: 35.3387, lng: 25.1442 },
  },
  "84100": {
    code: "84100",
    city: "ΣΥΡΟΣ",
    region: "ΝΟΤΙΟ ΑΙΓΑΙΟ",
    prefecture: "ΚΥΚΛΑΔΩΝ",
    municipality: "ΣΥΡΟΥ-ΕΡΜΟΥΠΟΛΗΣ",
    geographicArea: "island",
    vatZone: "island_special",
    timezone: "Europe/Athens",
    coordinates: { lat: 37.4467, lng: 24.9425 },
  },
  "84300": {
    code: "84300",
    city: "ΜΥΚΟΝΟΣ",
    region: "ΝΟΤΙΟ ΑΙΓΑΙΟ",
    prefecture: "ΚΥΚΛΑΔΩΝ",
    municipality: "ΜΥΚΟΝΟΥ",
    geographicArea: "island",
    vatZone: "island_remote",
    timezone: "Europe/Athens",
    coordinates: { lat: 37.4467, lng: 25.3289 },
  },
  "81100": {
    code: "81100",
    city: "ΜΥΤΙΛΗΝΗ",
    region: "ΒΟΡΕΙΟ ΑΙΓΑΙΟ",
    prefecture: "ΛΕΣΒΟΥ",
    municipality: "ΛΕΣΒΟΥ",
    geographicArea: "island",
    vatZone: "island_special",
    timezone: "Europe/Athens",
    coordinates: { lat: 39.1036, lng: 26.5586 },
  },
};

// Range-based lookup for postal codes
const POSTAL_CODE_RANGES = [
  { min: 10000, max: 19999, region: "ΑΤΤΙΚΗ", area: "urban" },
  { min: 20000, max: 29999, region: "ΠΕΛΟΠΟΝΝΗΣΟΣ", area: "suburban" },
  { min: 30000, max: 39999, region: "ΣΤΕΡΕΑ ΕΛΛΑΔΑ", area: "suburban" },
  { min: 40000, max: 49999, region: "ΘΕΣΣΑΛΙΑ", area: "suburban" },
  { min: 50000, max: 59999, region: "ΚΕΝΤΡΙΚΗ ΜΑΚΕΔΟΝΙΑ", area: "urban" },
  {
    min: 60000,
    max: 69999,
    region: "ΑΝΑΤΟΛΙΚΗ ΜΑΚΕΔΟΝΙΑ ΚΑΙ ΘΡΑΚΗ",
    area: "suburban",
  },
  { min: 70000, max: 79999, region: "ΚΡΗΤΗ", area: "island" },
  { min: 80000, max: 89999, region: "ΑΙΓΑΙΟ", area: "island" },
  { min: 45000, max: 49999, region: "ΗΠΕΙΡΟΣ", area: "suburban" },
  { min: 26000, max: 30999, region: "ΔΥΤΙΚΗ ΕΛΛΑΔΑ", area: "suburban" },
  { min: 31000, max: 32999, region: "ΔΥΤΙΚΗ ΕΛΛΑΔΑ", area: "suburban" },
];

export const GreekPostalCodeInput: React.FC<GreekPostalCodeInputProps> = ({
  value = "",
  onChange,
  onValidationChange,
  placeholder,
  required = false,
  disabled = false,
  className = "",
  showSuggestions = true,
  showAreaInfo = true,
  showVATZone = false,
  autoComplete = true,
  formatInput = true,
  validateOnBlur = true,
}) => {
  const { t } = useTranslation();

  const validateGreekPostalCode = (code: string) => {
    return /^[0-9]{5}$/.test(code);
  };

  const [inputValue, setInputValue] = useState(value);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string>("");
  const [suggestions, setSuggestions] = useState<PostalCodeInfo[]>([]);
  const [showSuggestionList, setShowSuggestionList] = useState(false);
  const [postalInfo, setPostalInfo] = useState<PostalCodeInfo | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const getPostalCodeInfo = useCallback(
    (code: string): PostalCodeInfo | null => {
      // Direct lookup first
      if (POSTAL_CODE_DATABASE[code]) {
        return POSTAL_CODE_DATABASE[code];
      }

      // Range-based lookup
      const numCode = parseInt(code);
      if (isNaN(numCode) || numCode < 10000 || numCode > 99999) {
        return null;
      }

      const range = POSTAL_CODE_RANGES.find(
        (r) => numCode >= r.min && numCode <= r.max
      );
      if (!range) return null;

      return {
        code,
        city: "",
        region: range.region,
        prefecture: "",
        geographicArea: range.area as PostalCodeInfo["geographicArea"],
        vatZone: range.area === "island" ? "island_special" : "mainland",
        timezone: "Europe/Athens",
      };
    },
    []
  );

  const validateCode = useCallback(
    (code: string) => {
      const trimmedCode = code.trim();

      if (!trimmedCode) {
        if (required) {
          setError(t("greekPostalCode.validation.required"));
          setIsValid(false);
        } else {
          setError("");
          setIsValid(true);
        }
        return;
      }

      if (!validateGreekPostalCode(trimmedCode)) {
        setError(t("greekPostalCode.validation.invalid"));
        setIsValid(false);
        setPostalInfo(null);
        return;
      }

      const info = getPostalCodeInfo(trimmedCode);
      if (!info) {
        setError(t("greekPostalCode.validation.notFound"));
        setIsValid(false);
        setPostalInfo(null);
        return;
      }

      setError("");
      setIsValid(true);
      setPostalInfo(info);
      onChange(trimmedCode, info);
    },
    [required, validateGreekPostalCode, getPostalCodeInfo, onChange, t]
  );

  const searchSuggestions = useCallback((query: string) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    const matches = Object.values(POSTAL_CODE_DATABASE)
      .filter(
        (info) =>
          info.code.startsWith(query) ||
          info.city.toLowerCase().includes(query.toLowerCase()) ||
          info.region.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5);

    setSuggestions(matches);
  }, []);

  useEffect(() => {
    validateCode(inputValue);
    onValidationChange?.(isValid);
  }, [inputValue, validateCode, isValid, onValidationChange]);

  useEffect(() => {
    if (showSuggestions && isFocused) {
      searchSuggestions(inputValue);
      setShowSuggestionList(inputValue.length >= 2 && suggestions.length > 0);
    } else {
      setShowSuggestionList(false);
    }
  }, [
    inputValue,
    isFocused,
    showSuggestions,
    searchSuggestions,
    suggestions.length,
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;

    // Format input: remove non-digits and limit to 5 digits
    newValue = newValue.replace(/\D/g, "").slice(0, 5);

    setInputValue(newValue);
  };

  const handleSuggestionClick = (suggestion: PostalCodeInfo) => {
    setInputValue(suggestion.code);
    setShowSuggestionList(false);
    validateCode(suggestion.code);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setTimeout(() => setShowSuggestionList(false), 200); // Delay to allow click

    if (validateOnBlur) {
      validateCode(inputValue);
    }
  };

  const getGeographicAreaColor = (area: string) => {
    switch (area) {
      case "urban":
        return "bg-blue-100 text-blue-800";
      case "suburban":
        return "bg-green-100 text-green-800";
      case "rural":
        return "bg-yellow-100 text-yellow-800";
      case "island":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getVATZoneColor = (zone?: string) => {
    switch (zone) {
      case "mainland":
        return "bg-green-100 text-green-800";
      case "island_special":
        return "bg-orange-100 text-orange-800";
      case "island_remote":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder || t("greekPostalCode.placeholder")}
          autoComplete={autoComplete ? "postal-code" : "off"}
          maxLength={5}
          className={`
            w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${
              error
                ? "border-red-300 bg-red-50"
                : isValid && inputValue
                ? "border-green-300 bg-green-50"
                : "border-gray-300"
            }
            ${disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"}
            pr-10
          `}
        />

        {/* Status Icon */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {inputValue &&
            (isValid ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : error ? (
              <X className="w-4 h-4 text-red-500" />
            ) : (
              <Search className="w-4 h-4 text-gray-400" />
            ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-1 flex items-center text-xs text-red-600">
          <AlertCircle className="w-3 h-3 mr-1" />
          {error}
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestionList && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg focus:outline-none focus:bg-blue-50"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">
                    {suggestion.code}
                  </div>
                  <div className="text-sm text-gray-500">
                    {suggestion.city} - {suggestion.region}
                  </div>
                </div>
                <MapPin className="w-4 h-4 text-gray-400" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Postal Code Information */}
      {postalInfo && showAreaInfo && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div>
                <div className="font-medium text-gray-900">
                  {postalInfo.city || t("greekPostalCode.unknownCity")}
                </div>
                <div className="text-sm text-gray-600">{postalInfo.region}</div>
                {postalInfo.prefecture && (
                  <div className="text-xs text-gray-500">
                    {postalInfo.prefecture}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getGeographicAreaColor(
                    postalInfo.geographicArea
                  )}`}
                >
                  {t(`greekPostalCode.areas.${postalInfo.geographicArea}`)}
                </span>

                {showVATZone && postalInfo.vatZone && (
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getVATZoneColor(
                      postalInfo.vatZone
                    )}`}
                  >
                    {t(`greekPostalCode.vatZones.${postalInfo.vatZone}`)}
                  </span>
                )}
              </div>

              {postalInfo.coordinates && (
                <div className="text-xs text-gray-500 flex items-center">
                  <Navigation className="w-3 h-3 mr-1" />
                  {postalInfo.coordinates.lat.toFixed(4)},{" "}
                  {postalInfo.coordinates.lng.toFixed(4)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GreekPostalCodeInput;
