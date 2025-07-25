// Greek Business Formatting Utilities

import { DATE_FORMATS, GREEK_BUSINESS } from "./constants";

/**
 * Formats Greek currency (Euro) with proper localization
 */
export function formatCurrency(
  amount: number,
  currency: string = "EUR",
  locale: string = "el-GR"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formats Greek VAT amount with percentage
 */
export function formatVAT(rate: number, amount?: number): string {
  const percentage = (rate * 100).toFixed(0) + "%";
  if (amount !== undefined) {
    return `${formatCurrency(amount)} (${percentage})`;
  }
  return percentage;
}

/**
 * Formats Greek phone number for display
 */
export function formatGreekPhone(phone: string): string {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, "");

  // Handle different input formats
  let normalized = cleaned;
  if (normalized.startsWith("0030")) {
    normalized = normalized.substring(4);
  } else if (normalized.startsWith("30")) {
    normalized = normalized.substring(2);
  } else if (normalized.startsWith("0")) {
    normalized = normalized.substring(1);
  }

  // Format based on number type
  if (normalized.length === 10) {
    // Mobile or landline
    if (normalized.startsWith("69")) {
      // Mobile: 69X XXX XXXX
      return `+30 ${normalized.substring(0, 3)} ${normalized.substring(
        3,
        6
      )} ${normalized.substring(6)}`;
    } else {
      // Landline: 21X XXX XXXX (Athens) or similar
      return `+30 ${normalized.substring(0, 3)} ${normalized.substring(
        3,
        6
      )} ${normalized.substring(6)}`;
    }
  }

  return `+30 ${normalized}`;
}

/**
 * Formats Greek IBAN for display
 */
export function formatGreekIBAN(iban: string): string {
  // Remove spaces and convert to uppercase
  const cleaned = iban.replace(/\s/g, "").toUpperCase();

  // Add spaces every 4 characters
  return cleaned.replace(/(.{4})/g, "$1 ").trim();
}

/**
 * Formats Greek AFM for display
 */
export function formatAFM(afm: string): string {
  // Remove spaces and format as XXX XXX XXX
  const cleaned = afm.replace(/\s/g, "");
  if (cleaned.length === 9) {
    return `${cleaned.substring(0, 3)} ${cleaned.substring(
      3,
      6
    )} ${cleaned.substring(6)}`;
  }
  return cleaned;
}

/**
 * Formats Greek date based on specified format
 */
export function formatGreekDate(
  date: Date | string,
  format: keyof typeof DATE_FORMATS = "GREEK_SHORT"
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Europe/Athens",
  };

  switch (format) {
    case "GREEK_SHORT":
      options.day = "2-digit";
      options.month = "2-digit";
      options.year = "numeric";
      return new Intl.DateTimeFormat("el-GR", options).format(dateObj);

    case "GREEK_LONG":
      options.day = "numeric";
      options.month = "long";
      options.year = "numeric";
      return new Intl.DateTimeFormat("el-GR", options).format(dateObj);

    case "GREEK_WITH_TIME":
      options.day = "2-digit";
      options.month = "2-digit";
      options.year = "numeric";
      options.hour = "2-digit";
      options.minute = "2-digit";
      options.hour12 = false;
      return new Intl.DateTimeFormat("el-GR", options).format(dateObj);

    case "ISO":
      return dateObj.toISOString().split("T")[0];

    default:
      return new Intl.DateTimeFormat("el-GR").format(dateObj);
  }
}

/**
 * Formats Greek time for display
 */
export function formatGreekTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  return new Intl.DateTimeFormat("el-GR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Athens",
  }).format(dateObj);
}

/**
 * Formats numbers with Greek locale
 */
export function formatNumber(
  number: number,
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat("el-GR", options).format(number);
}

/**
 * Formats percentage with Greek locale
 */
export function formatPercentage(
  value: number,
  minimumFractionDigits: number = 1,
  maximumFractionDigits: number = 2
): string {
  return new Intl.NumberFormat("el-GR", {
    style: "percent",
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
}

/**
 * Formats Greek postal code
 */
export function formatPostalCode(code: string): string {
  const cleaned = code.replace(/\s/g, "");
  if (cleaned.length === 5) {
    return `${cleaned.substring(0, 3)} ${cleaned.substring(3)}`;
  }
  return cleaned;
}

/**
 * Formats file size in bytes to human readable format
 */
export function formatFileSize(bytes: number): string {
  const sizes = ["Bytes", "KB", "MB", "GB"];
  if (bytes === 0) return "0 Bytes";

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const formattedSize = (bytes / Math.pow(1024, i)).toFixed(2);

  return `${formattedSize} ${sizes[i]}`;
}

/**
 * Formats Greek business entity name with legal form
 */
export function formatBusinessName(name: string, legalForm?: string): string {
  if (!legalForm) return name;

  // Common Greek legal forms
  const shortForms: Record<string, string> = {
    "ΑΝΩΝΥΜΗ ΕΤΑΙΡΕΙΑ": "Α.Ε.",
    "ΕΤΑΙΡΕΙΑ ΠΕΡΙΟΡΙΣΜΕΝΗΣ ΕΥΘΥΝΗΣ": "Ε.Π.Ε.",
    "ΟΜΟΡΡΥΘΜΗ ΕΤΑΙΡΕΙΑ": "Ο.Ε.",
    "ΕΤΕΡΟΡΡΥΘΜΗ ΕΤΑΙΡΕΙΑ": "Ε.Ε.",
    "ΙΔΙΩΤΙΚΗ ΚΕΦΑΛΑΙΟΥΧΙΚΗ ΕΤΑΙΡΕΙΑ": "Ι.Κ.Ε.",
    "ΑΤΟΜΙΚΗ ΕΠΙΧΕΙΡΗΣΗ": "Α.Τ.",
  };

  const shortForm = shortForms[legalForm.toUpperCase()] || legalForm;
  return `${name} ${shortForm}`;
}

/**
 * Truncates text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

/**
 * Capitalizes first letter of each word (proper case)
 */
export function toProperCase(text: string): string {
  return text.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

/**
 * Formats Greek address for display
 */
export function formatGreekAddress(address: {
  street?: string;
  number?: string;
  city?: string;
  postalCode?: string;
  region?: string;
}): string {
  const parts: string[] = [];

  if (address.street) {
    let streetPart = address.street;
    if (address.number) {
      streetPart += ` ${address.number}`;
    }
    parts.push(streetPart);
  }

  if (address.postalCode || address.city) {
    let cityPart = "";
    if (address.postalCode) {
      cityPart += formatPostalCode(address.postalCode);
    }
    if (address.city) {
      cityPart += (cityPart ? " " : "") + address.city;
    }
    parts.push(cityPart);
  }

  if (address.region) {
    parts.push(address.region);
  }

  return parts.join(", ");
}

// Export formatters object for easy access
export const formatters = {
  currency: formatCurrency,
  vat: formatVAT,
  phone: formatGreekPhone,
  iban: formatGreekIBAN,
  afm: formatAFM,
  date: formatGreekDate,
  time: formatGreekTime,
  number: formatNumber,
  percentage: formatPercentage,
  postalCode: formatPostalCode,
  fileSize: formatFileSize,
  businessName: formatBusinessName,
  truncate: truncateText,
  properCase: toProperCase,
  address: formatGreekAddress,
} as const;
