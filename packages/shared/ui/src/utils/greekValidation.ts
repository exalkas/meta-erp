// Greek Business Validation Utilities

import { GREEK_BUSINESS } from "./constants";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  formatted?: string;
}

/**
 * Validates Greek AFM (Tax Identification Number)
 * Uses the official checksum algorithm
 */
export function validateAFM(afm: string): ValidationResult {
  // Remove spaces and convert to string
  const cleanAFM = afm.replace(/\s/g, "");

  // Check basic format
  if (!GREEK_BUSINESS.AFM_PATTERN.test(cleanAFM)) {
    return {
      isValid: false,
      error: "invalid_afm_format",
    };
  }

  // Calculate checksum
  const digits = cleanAFM.split("").map(Number);
  const weights = [256, 128, 64, 32, 16, 8, 4, 2];

  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += digits[i] * weights[i];
  }

  const checkDigit = sum % 11;
  const expectedCheckDigit = checkDigit >= 10 ? 0 : checkDigit;

  if (digits[8] !== expectedCheckDigit) {
    return {
      isValid: false,
      error: "invalid_afm_checksum",
    };
  }

  return {
    isValid: true,
    formatted: cleanAFM,
  };
}

/**
 * Validates Greek phone numbers (landline and mobile)
 */
export function validateGreekPhone(phone: string): ValidationResult {
  // Remove spaces, dashes, and parentheses
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");

  // Check if it matches Greek phone pattern
  if (!GREEK_BUSINESS.PHONE_PATTERN.test(cleanPhone)) {
    return {
      isValid: false,
      error: "invalid_phone_format",
    };
  }

  // Normalize to international format
  let normalized = cleanPhone;
  if (normalized.startsWith("0030")) {
    normalized = "+30" + normalized.substring(4);
  } else if (normalized.startsWith("30")) {
    normalized = "+30" + normalized.substring(2);
  } else if (normalized.startsWith("0")) {
    normalized = "+30" + normalized.substring(1);
  } else if (!normalized.startsWith("+30")) {
    normalized = "+30" + normalized;
  }

  // Check if it's a valid mobile number
  const isMobile = GREEK_BUSINESS.MOBILE_PATTERN.test(normalized);

  return {
    isValid: true,
    formatted: normalized,
  };
}

/**
 * Validates Greek IBAN
 */
export function validateGreekIBAN(iban: string): ValidationResult {
  // Remove spaces and convert to uppercase
  const cleanIBAN = iban.replace(/\s/g, "").toUpperCase();

  // Check basic format
  if (!GREEK_BUSINESS.IBAN_PATTERN.test(cleanIBAN)) {
    return {
      isValid: false,
      error: "invalid_iban_format",
    };
  }

  // IBAN checksum validation (simplified)
  // In production, you'd want to use a proper IBAN validation library
  const formatted = cleanIBAN.replace(/(.{4})/g, "$1 ").trim();

  return {
    isValid: true,
    formatted,
  };
}

/**
 * Validates Greek postal code
 */
export function validateGreekPostalCode(code: string): ValidationResult {
  const cleanCode = code.replace(/\s/g, "");

  if (!GREEK_BUSINESS.POSTAL_CODE_PATTERN.test(cleanCode)) {
    return {
      isValid: false,
      error: "invalid_postal_code",
    };
  }

  return {
    isValid: true,
    formatted: cleanCode,
  };
}

/**
 * Validates email address
 */
export function validateEmail(email: string): ValidationResult {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    return {
      isValid: false,
      error: "invalid_email",
    };
  }

  return {
    isValid: true,
    formatted: email.toLowerCase(),
  };
}

/**
 * Validates required field
 */
export function validateRequired(
  value: string | number | boolean
): ValidationResult {
  if (value === "" || value === null || value === undefined) {
    return {
      isValid: false,
      error: "required",
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Validates minimum length
 */
export function validateMinLength(
  value: string,
  minLength: number
): ValidationResult {
  if (value.length < minLength) {
    return {
      isValid: false,
      error: "min_length",
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Validates maximum length
 */
export function validateMaxLength(
  value: string,
  maxLength: number
): ValidationResult {
  if (value.length > maxLength) {
    return {
      isValid: false,
      error: "max_length",
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Validates numeric range
 */
export function validateRange(
  value: number,
  min: number,
  max: number
): ValidationResult {
  if (value < min || value > max) {
    return {
      isValid: false,
      error: "out_of_range",
    };
  }

  return {
    isValid: true,
  };
}

// Export validation rules object for easy access
export const greekValidationRules = {
  afm: validateAFM,
  phone: validateGreekPhone,
  iban: validateGreekIBAN,
  postalCode: validateGreekPostalCode,
  email: validateEmail,
  required: validateRequired,
  minLength: validateMinLength,
  maxLength: validateMaxLength,
  range: validateRange,
} as const;

// Common validation patterns
export const VALIDATION_PATTERNS = {
  AFM: GREEK_BUSINESS.AFM_PATTERN,
  PHONE: GREEK_BUSINESS.PHONE_PATTERN,
  MOBILE: GREEK_BUSINESS.MOBILE_PATTERN,
  IBAN: GREEK_BUSINESS.IBAN_PATTERN,
  POSTAL_CODE: GREEK_BUSINESS.POSTAL_CODE_PATTERN,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  STRONG_PASSWORD:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
} as const;
