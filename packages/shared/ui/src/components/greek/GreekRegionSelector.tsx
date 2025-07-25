import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import { useGreekLocalization } from "../../hooks/useGreekLocalization";
import { GREEK_VAT_ZONES } from "../../utils/constants";

export interface GreekRegion {
  id: string;
  name: string;
  name_en: string;
  code: string;
  vat_zone: string;
  is_island: boolean;
  is_active: boolean;
  prefectures: string[];
  major_cities: string[];
}

export interface GreekRegionSelectorProps {
  value?: string;
  onChange: (value: string, regionData: GreekRegion | null) => void;
  placeholder?: string;
  error?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  showVATZone?: boolean;
  showEnglishName?: boolean;
  filterByVATZone?: string;
  onVATZoneChange?: (vatZone: string) => void;
  fullWidth?: boolean;
  className?: string;
}

export const GreekRegionSelector: React.FC<GreekRegionSelectorProps> = ({
  value,
  onChange,
  placeholder,
  error,
  label,
  required = false,
  disabled = false,
  showVATZone = true,
  showEnglishName = false,
  filterByVATZone,
  onVATZoneChange,
  fullWidth = true,
  className = "",
}) => {
  const { t } = useTranslation();
  const { language } = useGreekLocalization();
  const [selectedRegion, setSelectedRegion] = useState<GreekRegion | null>(
    null
  );

  // Mock Greek regions data with VAT zones
  const greekRegions: GreekRegion[] = [
    {
      id: "1",
      name: "Αττική",
      name_en: "Attica",
      code: "ATT",
      vat_zone: GREEK_VAT_ZONES.MAINLAND,
      is_island: false,
      is_active: true,
      prefectures: ["Αθήνα", "Πειραιάς", "Ανατολική Αττική", "Δυτική Αττική"],
      major_cities: ["Αθήνα", "Πειραιάς", "Αχαρνές", "Περιστέρι"],
    },
    {
      id: "2",
      name: "Κεντρική Μακεδονία",
      name_en: "Central Macedonia",
      code: "CMA",
      vat_zone: GREEK_VAT_ZONES.MAINLAND,
      is_island: false,
      is_active: true,
      prefectures: ["Θεσσαλονίκη", "Σέρρες", "Κιλκίς", "Πέλλα"],
      major_cities: ["Θεσσαλονίκη", "Σέρρες", "Κατερίνη", "Βέροια"],
    },
    {
      id: "3",
      name: "Κρήτη",
      name_en: "Crete",
      code: "CRT",
      vat_zone: GREEK_VAT_ZONES.CRETE,
      is_island: true,
      is_active: true,
      prefectures: ["Ηράκλειο", "Χανιά", "Ρέθυμνο", "Λασίθι"],
      major_cities: ["Ηράκλειο", "Χανιά", "Ρέθυμνο", "Άγιος Νικόλαος"],
    },
    {
      id: "4",
      name: "Νότιο Αιγαίο",
      name_en: "South Aegean",
      code: "SAE",
      vat_zone: GREEK_VAT_ZONES.AEGEAN,
      is_island: true,
      is_active: true,
      prefectures: ["Κυκλάδες", "Δωδεκάνησα"],
      major_cities: ["Σύρος", "Ρόδος", "Κως", "Μύκονος"],
    },
    {
      id: "5",
      name: "Βόρειο Αιγαίο",
      name_en: "North Aegean",
      code: "NAE",
      vat_zone: GREEK_VAT_ZONES.NORTH_AEGEAN,
      is_island: true,
      is_active: true,
      prefectures: ["Λέσβος", "Χίος", "Σάμος", "Λήμνος"],
      major_cities: ["Μυτιλήνη", "Χίος", "Σάμος", "Μύρινα"],
    },
    {
      id: "6",
      name: "Ιόνια Νησιά",
      name_en: "Ionian Islands",
      code: "ION",
      vat_zone: GREEK_VAT_ZONES.IONIAN,
      is_island: true,
      is_active: true,
      prefectures: ["Κέρκυρα", "Ζάκυνθος", "Κεφαλονιά", "Λευκάδα"],
      major_cities: ["Κέρκυρα", "Ζάκυνθος", "Αργοστόλι", "Λευκάδα"],
    },
  ];

  // Filter regions by VAT zone if specified
  const filteredRegions = useMemo(() => {
    if (!filterByVATZone) return greekRegions;
    return greekRegions.filter((region) => region.vat_zone === filterByVATZone);
  }, [filterByVATZone]);

  // Find selected region by value
  useEffect(() => {
    if (value) {
      const selected = greekRegions.find(
        (region) => region.id === value || region.code === value
      );
      setSelectedRegion(selected || null);

      if (selected && onVATZoneChange) {
        onVATZoneChange(selected.vat_zone);
      }
    } else {
      setSelectedRegion(null);
    }
  }, [value, onVATZoneChange]);

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const regionId = e.target.value;
    const selected = greekRegions.find((region) => region.id === regionId);

    setSelectedRegion(selected || null);
    onChange(regionId, selected || null);

    if (selected && onVATZoneChange) {
      onVATZoneChange(selected.vat_zone);
    }
  };

  const getDisplayName = (region: GreekRegion) => {
    if (showEnglishName && language === "en") {
      return region.name_en;
    }
    return region.name;
  };

  const getVATZoneDisplay = (vatZone: string) => {
    const zoneLabels: Record<string, string> = {
      [GREEK_VAT_ZONES.MAINLAND]: t("vat_zone_mainland"),
      [GREEK_VAT_ZONES.ISLANDS]: t("vat_zone_islands"),
      [GREEK_VAT_ZONES.AEGEAN]: t("vat_zone_aegean"),
      [GREEK_VAT_ZONES.DODECANESE]: t("vat_zone_dodecanese"),
      [GREEK_VAT_ZONES.CYCLADES]: t("vat_zone_cyclades"),
      [GREEK_VAT_ZONES.IONIAN]: t("vat_zone_ionian"),
      [GREEK_VAT_ZONES.NORTH_AEGEAN]: t("vat_zone_north_aegean"),
      [GREEK_VAT_ZONES.CRETE]: t("vat_zone_crete"),
    };

    return zoneLabels[vatZone] || vatZone;
  };

  const getVATRateInfo = (vatZone: string) => {
    const rates: Record<
      string,
      { standard: number; reduced: number; super_reduced: number }
    > = {
      [GREEK_VAT_ZONES.MAINLAND]: {
        standard: 24,
        reduced: 13,
        super_reduced: 6,
      },
      [GREEK_VAT_ZONES.ISLANDS]: { standard: 17, reduced: 9, super_reduced: 4 },
      [GREEK_VAT_ZONES.AEGEAN]: { standard: 17, reduced: 9, super_reduced: 4 },
      [GREEK_VAT_ZONES.DODECANESE]: {
        standard: 17,
        reduced: 9,
        super_reduced: 4,
      },
      [GREEK_VAT_ZONES.CYCLADES]: {
        standard: 17,
        reduced: 9,
        super_reduced: 4,
      },
      [GREEK_VAT_ZONES.IONIAN]: { standard: 17, reduced: 9, super_reduced: 4 },
      [GREEK_VAT_ZONES.NORTH_AEGEAN]: {
        standard: 17,
        reduced: 9,
        super_reduced: 4,
      },
      [GREEK_VAT_ZONES.CRETE]: { standard: 17, reduced: 9, super_reduced: 4 },
    };

    return rates[vatZone] || rates[GREEK_VAT_ZONES.MAINLAND];
  };

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    return t("select_region");
  };

  return (
    <div className={`${fullWidth ? "w-full" : ""} ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <select
        value={value || ""}
        onChange={handleSelect}
        disabled={disabled}
        className={`
          w-full px-3 py-2 border rounded-md transition-colors
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? "border-red-500" : "border-gray-300"}
          ${fullWidth ? "w-full" : ""}
        `}
      >
        <option value="">{getPlaceholder()}</option>
        {filteredRegions.map((region) => (
          <option key={region.id} value={region.id}>
            {getDisplayName(region)}
            {showVATZone && ` (${getVATZoneDisplay(region.vat_zone)})`}
          </option>
        ))}
      </select>

      {/* VAT Zone Information */}
      {selectedRegion && showVATZone && (
        <div className="mt-2 p-2 bg-blue-50 rounded-md">
          <div className="flex items-center text-sm text-blue-800">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-medium">
              {t("vat_zone")}: {getVATZoneDisplay(selectedRegion.vat_zone)}
            </span>
          </div>
          <div className="mt-1 text-xs text-blue-600">
            {(() => {
              const rates = getVATRateInfo(selectedRegion.vat_zone);
              return `${t("vat_rates")}: ${rates.standard}% / ${
                rates.reduced
              }% / ${rates.super_reduced}%`;
            })()}
          </div>
        </div>
      )}

      {error && <div className="mt-1 text-sm text-red-600">{error}</div>}
    </div>
  );
};

export default GreekRegionSelector;
