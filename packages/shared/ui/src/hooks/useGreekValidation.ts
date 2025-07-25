import { useCallback } from "react";

export interface AFMValidationResult {
  isValid: boolean;
  error?: string;
  type?: "individual" | "business";
}

export interface PhoneValidationResult {
  isValid: boolean;
  error?: string;
  formatted?: string;
  type?: "mobile" | "landline" | "international";
}

export const useGreekValidation = () => {
  // AFM (Tax Registration Number) validation
  const validateAFM = useCallback((afm: string): AFMValidationResult => {
    // Remove spaces and convert to string
    const cleanAfm = afm.replace(/\s/g, "");

    // Check if it's 9 digits
    if (!/^\d{9}$/.test(cleanAfm)) {
      return { isValid: false, error: "AFM must be 9 digits" };
    }

    // Calculate checksum
    const digits = cleanAfm.split("").map(Number);
    let sum = 0;

    for (let i = 0; i < 8; i++) {
      sum += digits[i] * Math.pow(2, 8 - i);
    }

    const remainder = sum % 11;
    const expectedChecksum = remainder < 2 ? remainder : 11 - remainder;

    if (digits[8] !== expectedChecksum) {
      return { isValid: false, error: "Invalid AFM checksum" };
    }

    // Determine type based on first digit
    const type = cleanAfm.startsWith("0") ? "individual" : "business";

    return { isValid: true, type };
  }, []);

  // Greek postal code validation
  const validateGreekPostalCode = useCallback((code: string): boolean => {
    return /^[0-9]{5}$/.test(code.replace(/\s/g, ""));
  }, []);

  // Greek phone number validation
  const validateGreekPhone = useCallback(
    (phone: string): PhoneValidationResult => {
      // Remove spaces, dashes, and parentheses
      const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");

      // Check for international format
      if (cleanPhone.startsWith("+30")) {
        const nationalNumber = cleanPhone.substring(3);
        return validateNationalNumber(nationalNumber);
      }

      // Check for national format starting with 0030
      if (cleanPhone.startsWith("0030")) {
        const nationalNumber = cleanPhone.substring(4);
        return validateNationalNumber(nationalNumber);
      }

      // National format validation
      return validateNationalNumber(cleanPhone);
    },
    []
  );

  const validateNationalNumber = (number: string): PhoneValidationResult => {
    // Mobile numbers: 69XXXXXXXX (10 digits)
    if (/^69\d{8}$/.test(number)) {
      return {
        isValid: true,
        type: "mobile",
        formatted: `+30 ${number.substring(0, 2)} ${number.substring(
          2,
          5
        )} ${number.substring(5, 8)} ${number.substring(8)}`,
      };
    }

    // Landline Athens: 21XXXXXXXX (10 digits)
    if (/^21\d{8}$/.test(number)) {
      return {
        isValid: true,
        type: "landline",
        formatted: `+30 ${number.substring(0, 2)} ${number.substring(
          2,
          5
        )} ${number.substring(5, 9)}`,
      };
    }

    // Landline Thessaloniki: 231XXXXXXX (10 digits)
    if (/^231\d{7}$/.test(number)) {
      return {
        isValid: true,
        type: "landline",
        formatted: `+30 ${number.substring(0, 3)} ${number.substring(
          3,
          6
        )} ${number.substring(6, 10)}`,
      };
    }

    // Other landlines: 2XXXXXXXXX (10 digits)
    if (/^2\d{9}$/.test(number)) {
      return {
        isValid: true,
        type: "landline",
        formatted: `+30 ${number.substring(0, 2)} ${number.substring(
          2,
          5
        )} ${number.substring(5, 9)}`,
      };
    }

    return { isValid: false, error: "Invalid Greek phone number format" };
  };

  // DOY (Tax Office) validation
  const validateDOY = useCallback((doy: string): boolean => {
    // DOY codes are typically 4 digits
    return /^\d{4}$/.test(doy.replace(/\s/g, ""));
  }, []);

  // Greek ID/Passport validation
  const validateGreekID = useCallback((id: string): boolean => {
    // Greek ID: 2 letters + 6 digits
    return /^[A-Z]{2}\d{6}$/.test(id.replace(/\s/g, "").toUpperCase());
  }, []);

  // Greek IBAN validation
  const validateGreekIBAN = useCallback((iban: string): boolean => {
    const cleanIban = iban.replace(/\s/g, "").toUpperCase();

    // Greek IBAN: GR + 2 check digits + 7 bank code + 16 account number = 27 chars
    if (!/^GR\d{25}$/.test(cleanIban)) {
      return false;
    }

    // Move first 4 characters to end and convert letters to numbers
    const rearranged = cleanIban.substring(4) + cleanIban.substring(0, 4);
    const numericString = rearranged.replace(/[A-Z]/g, (char) =>
      (char.charCodeAt(0) - 55).toString()
    );

    // Calculate mod 97
    let remainder = 0;
    for (let i = 0; i < numericString.length; i++) {
      remainder = (remainder * 10 + parseInt(numericString[i])) % 97;
    }

    return remainder === 1;
  }, []);

  // Greek VAT number validation (same as AFM but with 'EL' prefix)
  const validateGreekVAT = useCallback(
    (vat: string): boolean => {
      const cleanVat = vat.replace(/\s/g, "").toUpperCase();

      // Check if it starts with EL
      if (!cleanVat.startsWith("EL")) {
        return false;
      }

      // Extract AFM part and validate
      const afmPart = cleanVat.substring(2);
      return validateAFM(afmPart).isValid;
    },
    [validateAFM]
  );

  return {
    validateAFM,
    validateGreekPostalCode,
    validateGreekPhone,
    validateDOY,
    validateGreekID,
    validateGreekIBAN,
    validateGreekVAT,
  };
};
