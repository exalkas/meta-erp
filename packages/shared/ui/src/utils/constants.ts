// UI and Business Constants for Greek ERP/CRM System

// Maritime Theme Colors
export const COLORS = {
  primary: "#0066CC",
  accent: "#FFF700",
  secondary: "#2563EB",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  muted: "#6B7280",
  background: "#F9FAFB",
  surface: "#FFFFFF",
  border: "#E5E7EB",
} as const;

// Greek Business Constants
export const GREEK_BUSINESS = {
  AFM_LENGTH: 9,
  AFM_PATTERN: /^\d{9}$/,
  PHONE_PATTERN: /^(\+30|0030|30)?[0-9]{10}$/,
  MOBILE_PATTERN: /^(\+30|0030|30)?69[0-9]{8}$/,
  POSTAL_CODE_PATTERN: /^\d{5}$/,
  IBAN_PATTERN: /^GR\d{2}[0-9]{23}$/,
  VAT_RATES: {
    STANDARD: 0.24,
    REDUCED: 0.13,
    SUPER_REDUCED: 0.06,
    ISLANDS: 0.17,
    ISLANDS_REDUCED: 0.09,
    ISLANDS_SUPER_REDUCED: 0.04,
  },
} as const;

// UI Component Sizes
export const SIZES = {
  xs: "text-xs px-2 py-1",
  sm: "text-sm px-3 py-1.5",
  md: "text-base px-4 py-2",
  lg: "text-lg px-6 py-3",
  xl: "text-xl px-8 py-4",
} as const;

// Form Field Types
export const FORM_FIELD_TYPES = {
  TEXT: "text",
  EMAIL: "email",
  PASSWORD: "password",
  NUMBER: "number",
  TEL: "tel",
  URL: "url",
  TEXTAREA: "textarea",
  SELECT: "select",
  CHECKBOX: "checkbox",
  RADIO: "radio",
  DATE: "date",
  DATETIME: "datetime-local",
  TIME: "time",
  AFM: "afm",
  GREEK_PHONE: "greek-phone",
  IBAN: "iban",
} as const;

// Greek Regions for VAT Zone Detection
export const GREEK_VAT_ZONES = {
  MAINLAND: "mainland",
  ISLANDS: "islands",
  AEGEAN: "aegean",
  DODECANESE: "dodecanese",
  CYCLADES: "cyclades",
  IONIAN: "ionian",
  NORTH_AEGEAN: "north_aegean",
  CRETE: "crete",
} as const;

// Animation Durations
export const ANIMATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// Breakpoints (matching Tailwind)
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

// Z-Index Scale
export const Z_INDEX = {
  DROPDOWN: 1000,
  MODAL: 1200,
  TOOLTIP: 1300,
  TOAST: 1400,
  OVERLAY: 1500,
} as const;

// Greek Date Formats
export const DATE_FORMATS = {
  GREEK_SHORT: "dd/MM/yyyy",
  GREEK_LONG: "dd MMMM yyyy",
  GREEK_WITH_TIME: "dd/MM/yyyy HH:mm",
  ISO: "yyyy-MM-dd",
} as const;

// Common Greek Business Messages
export const GREEK_MESSAGES = {
  REQUIRED: "required",
  INVALID_AFM: "invalid_afm",
  INVALID_PHONE: "invalid_phone",
  INVALID_EMAIL: "invalid_email",
  INVALID_IBAN: "invalid_iban",
  INVALID_POSTAL_CODE: "invalid_postal_code",
  LOADING: "loading",
  SAVE: "save",
  CANCEL: "cancel",
  DELETE: "delete",
  EDIT: "edit",
  CREATE: "create",
  UPDATE: "update",
  CONFIRM: "confirm",
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
} as const;

export type FormFieldType =
  (typeof FORM_FIELD_TYPES)[keyof typeof FORM_FIELD_TYPES];
export type Size = keyof typeof SIZES;
export type Color = keyof typeof COLORS;
export type GreekVATZone =
  (typeof GREEK_VAT_ZONES)[keyof typeof GREEK_VAT_ZONES];
export type DateFormat = (typeof DATE_FORMATS)[keyof typeof DATE_FORMATS];

// Export all constants as a single object for convenient access
export const constants = {
  COLORS,
  GREEK_BUSINESS,
  SIZES,
  FORM_FIELD_TYPES,
  GREEK_VAT_ZONES,
  ANIMATIONS,
  BREAKPOINTS,
  Z_INDEX,
  DATE_FORMATS,
  GREEK_MESSAGES,
} as const;
