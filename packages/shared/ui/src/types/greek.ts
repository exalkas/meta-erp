/**
 * Greek-specific types for the UI component library
 * Based on the Greek reference data models
 */

// Greek location and geographic types
export type LocationType =
  | "mainland"
  | "aegean_islands"
  | "ionian_islands"
  | "crete"
  | "special_zone";

export type VATZone =
  | "standard"
  | "reduced_island"
  | "special_zone"
  | "vat_exempt";

export type IslandGroup =
  | "cyclades"
  | "dodecanese"
  | "aegean"
  | "ionian"
  | "crete"
  | "other";

export interface GreekRegion {
  id: string;
  regionCode: string;
  regionNameEl: string;
  regionNameEn: string;
  prefectureCode: string;
  prefectureNameEl: string;
  prefectureNameEn: string;
  locationType: LocationType;
  vatZone: VATZone;
  islandGroup?: IslandGroup;
  isTouristArea?: boolean;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
}

export interface GreekTaxOffice {
  id: string;
  doyCode: string;
  doyNameEl: string;
  doyNameEn: string;
  regionId: string;
  region?: GreekRegion;
  city: string;
  address?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  isActive: boolean;
}

export interface GreekVATRate {
  id: string;
  rateCode: string;
  rateNameEl: string;
  rateNameEn: string;
  ratePercentage: number;
  businessType?: string;
  productCategory?: string;
  locationType?: LocationType;
  vatZone: VATZone;
  contextConditions?: Record<string, any>;
  legalReference?: string;
  descriptionEl?: string;
  descriptionEn?: string;
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;
}

export interface GreekBusinessActivity {
  id: string;
  kadCode: string;
  kadNameEl: string;
  kadNameEn: string;
  parentKadId?: string;
  activityLevel: number;
  sectionCode?: string;
  divisionCode?: string;
  groupCode?: string;
  classCode?: string;
  vatImplications?: Record<string, any>;
  taxImplications?: Record<string, any>;
  licenseRequirements?: string[];
  isActive: boolean;
}

export interface GreekLegalForm {
  id: string;
  legalFormCode: string;
  legalFormNameEl: string;
  legalFormNameEn: string;
  descriptionEl?: string;
  descriptionEn?: string;
  minCapital?: number;
  minShareholders?: number;
  maxShareholders?: number;
  liabilityType?: string;
  taxRate?: number;
  dividendTaxRate?: number;
  requiresBoard?: boolean;
  requiresAuditor?: boolean;
  requiresPublication?: boolean;
  isActive: boolean;
}

export interface GreekBank {
  id: string;
  bankCode: string;
  bankNameEl: string;
  bankNameEn: string;
  swiftBic?: string;
  countryCode: string;
  bankType?: string;
  website?: string;
  phone?: string;
  isActive: boolean;
  supportsSepa?: boolean;
  supportsInstantPayments?: boolean;
}

export interface PostalCode {
  id: string;
  postalCode: string;
  areaNameEl: string;
  areaNameEn: string;
  regionId: string;
  region?: GreekRegion;
  municipality?: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
}

// Greek address structure
export interface GreekAddress {
  street: string;
  streetNumber: string;
  city: string;
  postalCode: string;
  regionId: string;
  region?: GreekRegion;
  municipality?: string;
  additionalInfo?: string;
  latitude?: number;
  longitude?: number;
}

// Greek tax information
export interface GreekTaxInfo {
  afm: string; // Greek AFM (tax number)
  doyCode: string; // Tax office code
  doy?: GreekTaxOffice;
  legalFormCode: string;
  legalForm?: GreekLegalForm;
  activityCode: string;
  activity?: GreekBusinessActivity;
  vatRegistered: boolean;
  vatNumber?: string;
  taxExempt: boolean;
  taxExemptionReason?: string;
}

// Greek banking information
export interface GreekBankingInfo {
  bankCode: string;
  bank?: GreekBank;
  accountNumber: string;
  iban: string;
  accountType: "checking" | "savings" | "business";
  accountHolderName: string;
  swiftBic?: string;
  branchCode?: string;
  branchName?: string;
}

// Greek phone number structure
export interface GreekPhoneNumber {
  number: string;
  type: "mobile" | "landline" | "fax";
  areaCode?: string;
  carrierCode?: string;
  formatted: string;
  isValid: boolean;
}

// Greek validation types
export interface AFMValidationResult {
  isValid: boolean;
  checksum: boolean;
  format: boolean;
  errors: string[];
}

export interface DOYValidationResult {
  isValid: boolean;
  exists: boolean;
  isActive: boolean;
  office?: GreekTaxOffice;
  errors: string[];
}

export interface GreekPhoneValidationResult {
  isValid: boolean;
  type: "mobile" | "landline" | "fax" | "unknown";
  carrier?: string;
  region?: string;
  formatted: string;
  errors: string[];
}

export interface IBANValidationResult {
  isValid: boolean;
  countryCode: string;
  checkDigits: string;
  bankCode: string;
  branchCode: string;
  accountNumber: string;
  bank?: GreekBank;
  errors: string[];
}

export interface PostalCodeValidationResult {
  isValid: boolean;
  exists: boolean;
  postalCodeData?: PostalCode;
  errors: string[];
}

// Greek VAT calculation
export interface VATCalculationContext {
  businessType: string;
  businessLocation: GreekRegion;
  customerLocation?: GreekRegion;
  customerType: "individual" | "business";
  productCategory: string;
  transactionType: "sale" | "service" | "rental" | "subscription";
  deliveryMethod: "pickup" | "delivery" | "digital" | "in_person";
  consumptionMethod?: "takeaway" | "dine_in" | "online" | "offline";
  transactionDate: Date;
  season?: "peak" | "off_peak";
  serviceLocation?: GreekRegion;
  deliveryLocation?: GreekRegion;
}

export interface VATCalculationResult {
  applicableRate: number;
  vatAmount: number;
  netAmount: number;
  totalAmount: number;
  rateCode: string;
  rateNameEl: string;
  rateNameEn: string;
  explanation: string;
  legalReference: string;
  contextFactors: string[];
  warnings: string[];
}

// Greek compliance types
export interface GreekComplianceInfo {
  aadeCompliant: boolean;
  aadeRegistered: boolean;
  aadeApiKey?: string;
  myDataEnabled: boolean;
  elektronicBooksEnabled: boolean;
  gdprCompliant: boolean;
  accessibilityCompliant: boolean;
  governmentStandards: boolean;
}

// Greek document types (based on the 16 document types from AADE)
export type GreekDocumentType =
  | "sales_invoice"
  | "service_invoice"
  | "credit_note"
  | "debit_note"
  | "receipt"
  | "payment_voucher"
  | "contract"
  | "delivery_note"
  | "transport_document"
  | "customs_document"
  | "tax_document"
  | "legal_document"
  | "bank_statement"
  | "government_form"
  | "license"
  | "certificate";

// Greek document workflow states
export type DocumentState =
  | "draft"
  | "pending_approval"
  | "approved"
  | "sent"
  | "delivered"
  | "paid"
  | "cancelled"
  | "archived";

// Greek reference data collection
export interface GreekReferenceData {
  regions: GreekRegion[];
  taxOffices: GreekTaxOffice[];
  vatRates: GreekVATRate[];
  businessActivities: GreekBusinessActivity[];
  legalForms: GreekLegalForm[];
  banks: GreekBank[];
  postalCodes: PostalCode[];
  lastUpdated: Date;
}

// Greek localization settings
export interface GreekLocaleSettings {
  language: "el" | "en";
  region: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: {
    decimal: string;
    thousands: string;
    precision: number;
  };
  currencyFormat: Intl.NumberFormatOptions;
  phoneFormat: string;
  postalCodeFormat: string;
  afmFormat: string;
  ibanFormat: string;
  addressFormat: string[];
}

// Greek form validation
export interface GreekFormValidation {
  afmValidation: boolean;
  doyValidation: boolean;
  phoneValidation: boolean;
  postalCodeValidation: boolean;
  ibanValidation: boolean;
  vatNumberValidation: boolean;
  addressValidation: boolean;
  businessActivityValidation: boolean;
  legalFormValidation: boolean;
  strictMode: boolean;
  realTimeValidation: boolean;
}
