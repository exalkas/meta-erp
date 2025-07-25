// Greek ERP/CRM - Shared Utilities

// Basic utility functions
export const formatCurrency = (amount: number, currency = "EUR"): string => {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency,
  }).format(amount);
};

export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Greek business utilities
export const validateAFM = (afm: string): boolean => {
  // Basic AFM validation - Greek tax number
  return /^\d{9}$/.test(afm);
};
