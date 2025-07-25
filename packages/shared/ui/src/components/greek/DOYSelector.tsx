import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import { useGreekLocalization } from "../../hooks/useGreekLocalization";
import { useAuth } from "../../contexts/AuthenticationContext";

export interface DOYOption {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  region: string;
  postal_code: string;
  phone?: string;
  email?: string;
  is_active: boolean;
}

export interface DOYSelectorProps {
  value?: string;
  onChange: (value: string, doyData: DOYOption | null) => void;
  placeholder?: string;
  error?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  regionFilter?: string; // Filter by region
  searchPlaceholder?: string;
  showCode?: boolean;
  showAddress?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export const DOYSelector: React.FC<DOYSelectorProps> = ({
  value,
  onChange,
  placeholder,
  error,
  label,
  required = false,
  disabled = false,
  regionFilter,
  searchPlaceholder,
  showCode = true,
  showAddress = false,
  fullWidth = true,
  className = "",
}) => {
  const { t } = useTranslation();
  const { tokens } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [doyOptions, setDoyOptions] = useState<DOYOption[]>([]);
  const [selectedDOY, setSelectedDOY] = useState<DOYOption | null>(null);
  const [loading, setLoading] = useState(false);

  // Load DOY options
  useEffect(() => {
    const loadDOYOptions = async () => {
      if (!tokens?.accessToken) {
        console.warn(
          "No authentication token available for DOY data, using fallback"
        );
        // Use fallback data if no authentication
        const fallbackDOYData: DOYOption[] = [
          {
            id: "1",
            code: "A001",
            name: "Α' Δ.Ο.Υ. ΑΘΗΝΩΝ",
            address: "Πειραιώς 10",
            city: "Αθήνα",
            region: "Αττική",
            postal_code: "10552",
            phone: "213 1234567",
            email: "a001@aade.gr",
            is_active: true,
          },
          {
            id: "2",
            code: "Β' 002",
            name: "Β' Δ.Ο.Υ. ΑΘΗΝΩΝ",
            address: "Σταδίου 29",
            city: "Αθήνα",
            region: "Αττική",
            postal_code: "10564",
            phone: "213 1234568",
            email: "b002@aade.gr",
            is_active: true,
          },
          {
            id: "3",
            code: "A003",
            name: "Α' Δ.Ο.Υ. ΘΕΣΣΑΛΟΝΙΚΗΣ",
            address: "Τσιμισκή 15",
            city: "Θεσσαλονίκη",
            region: "Κεντρική Μακεδονία",
            postal_code: "54624",
            phone: "2310 123456",
            email: "a003@aade.gr",
            is_active: true,
          },
          {
            id: "4",
            code: "A004",
            name: "Δ.Ο.Υ. ΠΑΤΡΩΝ",
            address: "Κολοκοτρώνη 25",
            city: "Πάτρα",
            region: "Δυτική Ελλάδα",
            postal_code: "26221",
            phone: "2610 123456",
            email: "patras@aade.gr",
            is_active: true,
          },
          {
            id: "5",
            code: "A005",
            name: "Δ.Ο.Υ. ΗΡΑΚΛΕΙΟΥ",
            address: "25ης Αυγούστου 15",
            city: "Ηράκλειο",
            region: "Κρήτη",
            postal_code: "71202",
            phone: "2810 123456",
            email: "heraklion@aade.gr",
            is_active: true,
          },
        ];

        let filteredData = fallbackDOYData;
        if (regionFilter) {
          filteredData = fallbackDOYData.filter((doy) =>
            doy.region.toLowerCase().includes(regionFilter.toLowerCase())
          );
        }
        setDoyOptions(filteredData);
        return;
      }

      setLoading(true);
      try {
        // Try to fetch from API first
        const response = await fetch("/api/v1/greek-reference-data", {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          const data = await response.json();

          // Check if DOY data exists in response
          if (data.doy_offices && Array.isArray(data.doy_offices)) {
            // Transform API data to DOYOption format
            const doyData: DOYOption[] = data.doy_offices.map(
              (doy: any, index: number) => ({
                id: (index + 1).toString(),
                code: doy.code || `DOY_${index + 1}`,
                name: doy.name,
                address: doy.address || "Δεν διατίθεται διεύθυνση",
                city: doy.city || "Δεν διατίθεται πόλη",
                region: doy.region || "Δεν διατίθεται περιφέρεια",
                postal_code: doy.postal_code || "",
                phone: doy.phone,
                email: doy.email,
                is_active: true,
              })
            );

            let filteredData = doyData;

            if (regionFilter) {
              filteredData = doyData.filter((doy) =>
                doy.region.toLowerCase().includes(regionFilter.toLowerCase())
              );
            }

            setDoyOptions(filteredData);
            return;
          }
        }

        // If API fails or doesn't have data, use fallback data
        console.warn("API failed or no DOY data, using fallback data");
        const fallbackDOYData: DOYOption[] = [
          {
            id: "1",
            code: "A001",
            name: "Α' Δ.Ο.Υ. ΑΘΗΝΩΝ",
            address: "Πειραιώς 10",
            city: "Αθήνα",
            region: "Αττική",
            postal_code: "10552",
            phone: "213 1234567",
            email: "a001@aade.gr",
            is_active: true,
          },
          {
            id: "2",
            code: "Β' 002",
            name: "Β' Δ.Ο.Υ. ΑΘΗΝΩΝ",
            address: "Σταδίου 29",
            city: "Αθήνα",
            region: "Αττική",
            postal_code: "10564",
            phone: "213 1234568",
            email: "b002@aade.gr",
            is_active: true,
          },
          {
            id: "3",
            code: "A003",
            name: "Α' Δ.Ο.Υ. ΘΕΣΣΑΛΟΝΙΚΗΣ",
            address: "Τσιμισκή 15",
            city: "Θεσσαλονίκη",
            region: "Κεντρική Μακεδονία",
            postal_code: "54624",
            phone: "2310 123456",
            email: "a003@aade.gr",
            is_active: true,
          },
          {
            id: "4",
            code: "A004",
            name: "Δ.Ο.Υ. ΠΑΤΡΩΝ",
            address: "Κολοκοτρώνη 25",
            city: "Πάτρα",
            region: "Δυτική Ελλάδα",
            postal_code: "26221",
            phone: "2610 123456",
            email: "patras@aade.gr",
            is_active: true,
          },
          {
            id: "5",
            code: "A005",
            name: "Δ.Ο.Υ. ΗΡΑΚΛΕΙΟΥ",
            address: "25ης Αυγούστου 15",
            city: "Ηράκλειο",
            region: "Κρήτη",
            postal_code: "71202",
            phone: "2810 123456",
            email: "heraklion@aade.gr",
            is_active: true,
          },
        ];

        let filteredData = fallbackDOYData;

        if (regionFilter) {
          filteredData = fallbackDOYData.filter((doy) =>
            doy.region.toLowerCase().includes(regionFilter.toLowerCase())
          );
        }

        setDoyOptions(filteredData);
      } catch (error) {
        console.error("Error loading DOY data:", error);
        // Use minimal fallback data on error
        const minimalDOYData: DOYOption[] = [
          {
            id: "1",
            code: "A001",
            name: "Α' Δ.Ο.Υ. ΑΘΗΝΩΝ",
            address: "Πειραιώς 10",
            city: "Αθήνα",
            region: "Αττική",
            postal_code: "10552",
            is_active: true,
          },
        ];
        setDoyOptions(minimalDOYData);
      } finally {
        setLoading(false);
      }
    };

    loadDOYOptions();
  }, [regionFilter, tokens?.accessToken]);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return doyOptions;

    const term = searchTerm.toLowerCase();
    return doyOptions.filter(
      (doy) =>
        doy.name.toLowerCase().includes(term) ||
        doy.code.toLowerCase().includes(term) ||
        doy.city.toLowerCase().includes(term) ||
        doy.address.toLowerCase().includes(term)
    );
  }, [doyOptions, searchTerm]);

  // Find selected DOY by value
  useEffect(() => {
    if (value) {
      const selected = doyOptions.find(
        (doy) => doy.id === value || doy.code === value
      );
      setSelectedDOY(selected || null);
    } else {
      setSelectedDOY(null);
    }
  }, [value, doyOptions]);

  const handleSelect = (doy: DOYOption) => {
    setSelectedDOY(doy);
    onChange(doy.id, doy);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputBlur = () => {
    // Delay closing to allow for option selection
    setTimeout(() => setIsOpen(false), 200);
  };

  const getDisplayValue = () => {
    if (!selectedDOY) return "";

    let display = selectedDOY.name;
    if (showCode) {
      display = `${selectedDOY.code} - ${display}`;
    }
    if (showAddress) {
      display += ` (${selectedDOY.city})`;
    }

    return display;
  };

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    return t("doy_selector_placeholder", { ns: "greek" });
  };

  const getSearchPlaceholder = () => {
    if (searchPlaceholder) return searchPlaceholder;
    return t("doy_search_placeholder", { ns: "greek" });
  };

  return (
    <div className={`relative ${fullWidth ? "w-full" : ""} ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:bg-gray-800 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          value={isOpen ? searchTerm : getDisplayValue()}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={isOpen ? getSearchPlaceholder() : getPlaceholder()}
          disabled={disabled}
          className={`
            w-full px-3 py-2 border rounded-md transition-colors
            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:opacity-50 disabled:cursor-not-allowed
            ${
              error
                ? "border-red-500 dark:border-red-400"
                : "border-gray-300 dark:border-gray-600"
            }
            ${fullWidth ? "w-full" : ""}
          `}
        />

        {/* Dropdown arrow */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Dropdown options */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              {t("loading", { ns: "common" })}...
            </div>
          ) : filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              {t("no_results_found", { ns: "common" })}
            </div>
          ) : (
            filteredOptions.map((doy) => (
              <div
                key={doy.id}
                onClick={() => handleSelect(doy)}
                className={`
                  px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 text-sm
                  text-gray-900 dark:text-gray-100
                  ${
                    selectedDOY?.id === doy.id
                      ? "bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                      : ""
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium">
                      {showCode && (
                        <span className="text-gray-500 text-xs mr-2">
                          {doy.code}
                        </span>
                      )}
                      {doy.name}
                    </div>
                    {showAddress && (
                      <div className="text-xs text-gray-500 mt-1">
                        {doy.address}, {doy.city}
                      </div>
                    )}
                  </div>
                  {selectedDOY?.id === doy.id && (
                    <svg
                      className="w-4 h-4 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {error && <div className="mt-1 text-sm text-red-600">{error}</div>}
    </div>
  );
};

export default DOYSelector;
