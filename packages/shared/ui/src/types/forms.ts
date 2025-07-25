/**
 * Form-related types for the UI component library
 */

// Form field types
export type FormFieldType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "tel"
  | "url"
  | "date"
  | "time"
  | "datetime-local"
  | "textarea"
  | "select"
  | "multiselect"
  | "checkbox"
  | "radio"
  | "switch"
  | "file"
  | "hidden"
  | "afm" // Greek AFM input
  | "doy" // Greek DOY selector
  | "greek_phone" // Greek phone input
  | "greek_address" // Greek address input
  | "postal_code" // Greek postal code
  | "iban" // Greek IBAN input
  | "vat_number"; // Greek VAT number

// Form field validation
export interface ValidationRule {
  type:
    | "required"
    | "email"
    | "min"
    | "max"
    | "pattern"
    | "custom"
    | "greek_validation";
  value?: any;
  message: string;
  validator?: (value: any) => boolean;
}

export interface FormFieldSchema {
  name: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  defaultValue?: any;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  validation?: ValidationRule[];
  options?: FormFieldOption[]; // for select, radio, checkbox
  multiple?: boolean; // for select, file
  accept?: string; // for file inputs
  min?: number | string; // for number, date inputs
  max?: number | string; // for number, date inputs
  step?: number | string; // for number inputs
  rows?: number; // for textarea
  cols?: number; // for textarea
  maxLength?: number; // for text inputs
  minLength?: number; // for text inputs
  pattern?: string; // for text inputs
  autoComplete?: string;
  autoFocus?: boolean;
  tabIndex?: number;
  className?: string;
  style?: React.CSSProperties;
  helpText?: string;
  dependencies?: string[]; // field names this field depends on
  conditionalLogic?: ConditionalLogic;
  greekValidation?: GreekFormFieldValidation;
  translationKey?: string; // for multilingual labels
  namespace?: string; // translation namespace
}

export interface FormFieldOption {
  value: any;
  label: string;
  disabled?: boolean;
  description?: string;
  icon?: string;
  translationKey?: string;
}

export interface ConditionalLogic {
  field: string;
  operator:
    | "equals"
    | "not_equals"
    | "contains"
    | "greater_than"
    | "less_than"
    | "is_empty"
    | "is_not_empty";
  value: any;
  action: "show" | "hide" | "enable" | "disable" | "require" | "optional";
}

export interface GreekFormFieldValidation {
  type: "afm" | "doy" | "phone" | "postal_code" | "iban" | "vat_number";
  strictMode?: boolean;
  allowEmpty?: boolean;
  customMessage?: string;
}

// Form schema
export interface FormSchema {
  id: string;
  title: string;
  description?: string;
  fields: FormFieldSchema[];
  layout?: FormLayout;
  validation?: FormValidation;
  submission?: FormSubmission;
  styling?: FormStyling;
  localization?: FormLocalization;
  greekCompliance?: GreekFormCompliance;
}

export interface FormLayout {
  type: "vertical" | "horizontal" | "grid" | "tabs" | "wizard";
  columns?: number; // for grid layout
  sections?: FormSection[];
  responsive?: boolean;
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: string[]; // field names
  collapsible?: boolean;
  defaultExpanded?: boolean;
  className?: string;
  translationKey?: string;
}

export interface FormValidation {
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  validateOnSubmit?: boolean;
  showErrorSummary?: boolean;
  stopOnFirstError?: boolean;
  customValidators?: Record<
    string,
    (value: any, formData: any) => string | null
  >;
}

export interface FormSubmission {
  method: "POST" | "PUT" | "PATCH";
  url: string;
  headers?: Record<string, string>;
  beforeSubmit?: (data: any) => any;
  afterSubmit?: (response: any) => void;
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
  redirectOnSuccess?: string;
  showSuccessMessage?: boolean;
  successMessage?: string;
  resetOnSuccess?: boolean;
}

export interface FormStyling {
  theme: "default" | "compact" | "spacious" | "greek_government" | "modern";
  primaryColor?: string;
  backgroundColor?: string;
  borderRadius?: string;
  fontSize?: string;
  labelPosition?: "top" | "left" | "right" | "inside";
  spacing?: "tight" | "normal" | "loose";
  className?: string;
}

export interface FormLocalization {
  defaultLanguage: "el" | "en";
  supportedLanguages: ("el" | "en")[];
  translationNamespace: string;
  rtlSupport?: boolean;
  dateLocale?: string;
  numberLocale?: string;
  currencyLocale?: string;
}

export interface GreekFormCompliance {
  aadeCompliant?: boolean;
  gdprCompliant?: boolean;
  accessibilityLevel?: "AA" | "AAA";
  governmentStandards?: boolean;
  requiredDisclosures?: string[];
  privacyPolicy?: string;
  termsOfService?: string;
}

// Form state and handlers
export interface FormFieldState {
  value: any;
  error?: string;
  touched: boolean;
  dirty: boolean;
  focused: boolean;
  valid: boolean;
}

export interface FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  dirty: Record<string, boolean>;
  focused: Record<string, boolean>;
  valid: Record<string, boolean>;
  isSubmitting: boolean;
  isValidating: boolean;
  submitCount: number;
  isValid: boolean;
  isDirty: boolean;
}

export interface FormHandlers {
  handleChange: (field: string, value: any) => void;
  handleBlur: (field: string) => void;
  handleFocus: (field: string) => void;
  handleSubmit: (e?: React.FormEvent) => void;
  handleReset: () => void;
  setFieldValue: (field: string, value: any) => void;
  setFieldError: (field: string, error: string) => void;
  setFieldTouched: (field: string, touched: boolean) => void;
  validateField: (field: string) => Promise<boolean>;
  validateForm: () => Promise<boolean>;
}

// Form builder types
export interface FormBuilderConfig {
  availableFields: FormFieldType[];
  customFields?: Record<string, FormFieldSchema>;
  themes?: string[];
  layouts?: string[];
  validationRules?: string[];
  greekValidationEnabled?: boolean;
  multilingualEnabled?: boolean;
  dragAndDrop?: boolean;
  preview?: boolean;
  export?: boolean;
  import?: boolean;
}

export interface FormBuilderState {
  schema: FormSchema;
  selectedField?: string;
  draggedField?: string;
  previewMode: boolean;
  modified: boolean;
  saved: boolean;
  validationErrors: string[];
}
