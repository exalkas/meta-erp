import { useState, useCallback, useEffect, useMemo } from "react";
import { useAudit } from "../contexts/AuditContext";
import { useCompany } from "../contexts/CompanyContext";
import { useNotification } from "../contexts/NotificationContext";
import { useGreekValidation } from "./useGreekValidation";

interface CustomFieldsOptions {
  enableValidation?: boolean;
  enableAuditLog?: boolean;
  enableGreekCompliance?: boolean;
  enableConditionalLogic?: boolean;
  enableCalculatedFields?: boolean;
  autoSave?: boolean;
  apiEndpoint?: string;
  complianceLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

interface CustomFieldDefinition {
  id: string;
  name: string;
  label: string;
  description?: string;
  type: FieldType;
  entityType: string;
  category: FieldCategory;
  order: number;
  isRequired: boolean;
  isActive: boolean;
  isSystem: boolean;
  isGreekSpecific: boolean;

  // Validation
  validation: FieldValidation;

  // UI Configuration
  ui: FieldUIConfig;

  // Business Logic
  businessRules: BusinessRule[];
  conditionalLogic: ConditionalRule[];
  calculations: CalculationRule[];

  // Greek Compliance
  greekCompliance?: GreekFieldCompliance;

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  version: number;
  tags: string[];
}

interface FieldValue {
  fieldId: string;
  entityId: string;
  entityType: string;
  value: any;
  displayValue?: string;
  metadata: FieldValueMetadata;
  history: FieldValueHistory[];
  validation: FieldValidationResult;
  auditInfo: FieldAuditInfo;
}

interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  format?: string;
  customValidator?: string;
  greekValidator?: GreekValidationType;
  dependencies?: FieldDependency[];
  uniqueConstraint?: boolean;
}

interface FieldUIConfig {
  component: UIComponent;
  placeholder?: string;
  helpText?: string;
  tooltip?: string;
  icon?: string;
  size: "small" | "medium" | "large";
  width: string;
  visibility: VisibilityRule[];
  styling: FieldStyling;
  options?: FieldOption[];
  grouping?: FieldGrouping;
}

interface BusinessRule {
  id: string;
  name: string;
  condition: string;
  action: BusinessRuleAction;
  priority: number;
  isActive: boolean;
  description?: string;
}

interface ConditionalRule {
  id: string;
  condition: string;
  actions: ConditionalAction[];
  dependencies: string[];
  isActive: boolean;
}

interface CalculationRule {
  id: string;
  formula: string;
  dependencies: string[];
  resultType: FieldType;
  precision?: number;
  isActive: boolean;
}

interface GreekFieldCompliance {
  type: GreekComplianceType;
  mandatory: boolean;
  validationLevel: "basic" | "enhanced" | "strict";
  aadeReporting: boolean;
  retentionPeriod?: number; // years
  personalDataCategory?: PersonalDataCategory;
  legalBasis?: string;
}

interface FieldValueMetadata {
  companyId: string;
  userId: string;
  source: "manual" | "calculated" | "imported" | "api" | "system";
  confidence?: number;
  lastValidated?: string;
  validationContext?: Record<string, any>;
  enrichmentData?: Record<string, any>;
}

interface FieldValueHistory {
  id: string;
  oldValue: any;
  newValue: any;
  changedBy: string;
  changedAt: string;
  reason?: string;
  source: string;
  validationPassed: boolean;
}

interface FieldValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
  confidence: number;
  lastValidated: string;
}

interface FieldAuditInfo {
  accessCount: number;
  lastAccessed: string;
  modificationCount: number;
  lastModified: string;
  encryptionStatus?: "encrypted" | "plain" | "hashed";
  complianceFlags: string[];
}

type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "decimal"
  | "currency"
  | "percentage"
  | "date"
  | "datetime"
  | "time"
  | "boolean"
  | "select"
  | "multiselect"
  | "radio"
  | "checkbox"
  | "file"
  | "image"
  | "url"
  | "email"
  | "phone"
  | "address"
  | "coordinates"
  | "json"
  | "calculated"
  | "lookup"
  | "reference"
  | "greek_afm"
  | "greek_doy"
  | "greek_phone"
  | "greek_postal_code"
  | "greek_iban"
  | "greek_amka";

type FieldCategory =
  | "basic"
  | "contact"
  | "financial"
  | "legal"
  | "compliance"
  | "greek_specific"
  | "custom"
  | "system";

type GreekValidationType =
  | "afm"
  | "doy"
  | "phone"
  | "postal_code"
  | "iban"
  | "amka"
  | "vat_number"
  | "tax_id";

type UIComponent =
  | "input"
  | "textarea"
  | "select"
  | "multiselect"
  | "checkbox"
  | "radio"
  | "slider"
  | "rating"
  | "color"
  | "date_picker"
  | "time_picker"
  | "file_upload"
  | "rich_text"
  | "signature"
  | "map"
  | "barcode"
  | "qr_code"
  | "greek_address"
  | "greek_entity_selector";

type BusinessRuleAction =
  | "set_value"
  | "clear_value"
  | "show_field"
  | "hide_field"
  | "require_field"
  | "disable_field"
  | "validate_field"
  | "calculate_field"
  | "trigger_workflow"
  | "send_notification"
  | "log_audit"
  | "greek_validate";

type ConditionalAction =
  | "show"
  | "hide"
  | "enable"
  | "disable"
  | "require"
  | "optional"
  | "set_value"
  | "clear_value"
  | "set_options"
  | "validate"
  | "calculate";

type GreekComplianceType =
  | "tax_data"
  | "personal_data"
  | "financial_data"
  | "legal_entity"
  | "aade_required"
  | "gdpr_sensitive"
  | "bank_data"
  | "insurance_data";

type PersonalDataCategory =
  | "basic"
  | "sensitive"
  | "special"
  | "financial"
  | "health"
  | "biometric";

interface FieldDependency {
  fieldId: string;
  condition: string;
  value: any;
}

interface VisibilityRule {
  condition: string;
  visible: boolean;
  roles?: string[];
  permissions?: string[];
}

interface FieldStyling {
  className?: string;
  style?: Record<string, any>;
  theme?: string;
  responsive?: ResponsiveConfig;
}

interface ResponsiveConfig {
  mobile?: Partial<FieldUIConfig>;
  tablet?: Partial<FieldUIConfig>;
  desktop?: Partial<FieldUIConfig>;
}

interface FieldOption {
  value: any;
  label: string;
  description?: string;
  icon?: string;
  disabled?: boolean;
  group?: string;
  metadata?: Record<string, any>;
}

interface FieldGrouping {
  groupId: string;
  groupLabel: string;
  collapsible: boolean;
  collapsed: boolean;
  order: number;
}

interface ValidationError {
  code: string;
  message: string;
  field: string;
  severity: "error" | "warning";
  context?: Record<string, any>;
}

interface ValidationWarning {
  code: string;
  message: string;
  field: string;
  suggestion?: string;
}

interface ValidationSuggestion {
  type: "correction" | "enhancement" | "alternative";
  message: string;
  value?: any;
  confidence: number;
}

interface CustomFieldsState {
  definitions: CustomFieldDefinition[];
  values: Record<string, FieldValue[]>; // entityId -> FieldValue[]
  currentEntity: string | null;
  currentEntityType: string | null;
  isLoading: boolean;
  isSaving: boolean;
  isValidating: boolean;
  error: string | null;
  validationResults: Record<string, FieldValidationResult>;
  calculatedValues: Record<string, any>;
  conditionalStates: Record<string, ConditionalState>;
  fieldGroups: FieldGroup[];
}

interface ConditionalState {
  visible: boolean;
  enabled: boolean;
  required: boolean;
  value?: any;
  options?: FieldOption[];
}

interface FieldGroup {
  id: string;
  label: string;
  fields: string[];
  collapsed: boolean;
  order: number;
  conditions?: ConditionalRule[];
}

interface CustomFieldsResult extends CustomFieldsState {
  // Definition management
  createFieldDefinition: (
    definition: Omit<CustomFieldDefinition, "id" | "createdAt" | "updatedAt">
  ) => Promise<CustomFieldDefinition>;
  updateFieldDefinition: (
    id: string,
    definition: Partial<CustomFieldDefinition>
  ) => Promise<CustomFieldDefinition>;
  deleteFieldDefinition: (id: string) => Promise<void>;
  duplicateFieldDefinition: (
    id: string,
    newName: string
  ) => Promise<CustomFieldDefinition>;

  // Value management
  getFieldValues: (
    entityId: string,
    entityType: string
  ) => Promise<FieldValue[]>;
  setFieldValue: (
    fieldId: string,
    entityId: string,
    value: any,
    source?: string
  ) => Promise<FieldValue>;
  setMultipleValues: (
    values: Array<{ fieldId: string; value: any }>,
    entityId: string
  ) => Promise<FieldValue[]>;
  clearFieldValue: (fieldId: string, entityId: string) => Promise<void>;

  // Validation
  validateField: (
    fieldId: string,
    value: any,
    context?: Record<string, any>
  ) => Promise<FieldValidationResult>;
  validateAllFields: (
    entityId: string
  ) => Promise<Record<string, FieldValidationResult>>;
  validateGreekField: (
    fieldId: string,
    value: any
  ) => Promise<FieldValidationResult>;

  // Calculations
  calculateField: (fieldId: string, entityId: string) => Promise<any>;
  recalculateAllFields: (entityId: string) => Promise<Record<string, any>>;

  // Conditional logic
  evaluateConditionalLogic: (
    entityId: string
  ) => Promise<Record<string, ConditionalState>>;
  updateConditionalStates: (entityId: string) => Promise<void>;

  // Field queries
  getFieldsByEntity: (entityType: string) => CustomFieldDefinition[];
  getFieldsByCategory: (category: FieldCategory) => CustomFieldDefinition[];
  getGreekFields: () => CustomFieldDefinition[];
  getRequiredFields: (entityType: string) => CustomFieldDefinition[];

  // Import/Export
  exportFieldDefinitions: (format: "json" | "xml" | "csv") => Promise<string>;
  importFieldDefinitions: (
    data: string,
    format: "json" | "xml" | "csv"
  ) => Promise<CustomFieldDefinition[]>;
  exportFieldValues: (
    entityId: string,
    format: "json" | "xml" | "csv"
  ) => Promise<string>;

  // Greek specific
  validateGreekCompliance: (entityId: string) => Promise<GreekComplianceResult>;
  generateAADEReport: (entityId: string) => Promise<string>;
  checkPersonalDataCompliance: (
    entityId: string
  ) => Promise<PersonalDataComplianceResult>;

  // Utilities
  setCurrentEntity: (entityId: string, entityType: string) => void;
  refresh: (entityId?: string) => Promise<void>;
  clearValidationResults: () => void;
  resetFieldValues: (entityId: string) => Promise<void>;

  // Search and filtering
  searchFields: (query: string) => CustomFieldDefinition[];
  filterFields: (filters: FieldFilter) => CustomFieldDefinition[];

  // Groups and organization
  createFieldGroup: (group: Omit<FieldGroup, "id">) => Promise<FieldGroup>;
  updateFieldGroup: (
    id: string,
    group: Partial<FieldGroup>
  ) => Promise<FieldGroup>;
  deleteFieldGroup: (id: string) => Promise<void>;
  reorderFields: (fieldIds: string[], groupId?: string) => Promise<void>;
}

interface GreekComplianceResult {
  isCompliant: boolean;
  issues: GreekComplianceIssue[];
  score: number;
  recommendations: string[];
  lastChecked: string;
}

interface GreekComplianceIssue {
  fieldId: string;
  type: "missing" | "invalid" | "incomplete" | "outdated";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  solution?: string;
}

interface PersonalDataComplianceResult {
  gdprCompliant: boolean;
  personalDataFields: string[];
  consentRequired: string[];
  retentionIssues: string[];
  anonymizationSuggestions: string[];
}

interface FieldFilter {
  entityType?: string;
  category?: FieldCategory;
  type?: FieldType;
  isRequired?: boolean;
  isActive?: boolean;
  isGreekSpecific?: boolean;
  tags?: string[];
  createdBy?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * Enhanced custom fields hook for dynamic form management
 * Provides complete field management with Greek business compliance and validation
 */
export function useCustomFields(
  options: CustomFieldsOptions = {}
): CustomFieldsResult {
  const { logAction } = useAudit();
  const { state: companyState } = useCompany();
  const { addNotification } = useNotification();
  const {
    validateAFM,
    validateDOY,
    validateGreekPhone,
    validateGreekPostalCode,
    validateGreekIBAN,
  } = useGreekValidation();

  const {
    enableValidation = true,
    enableAuditLog = true,
    enableGreekCompliance = true,
    enableConditionalLogic = true,
    enableCalculatedFields = true,
    autoSave = true,
    apiEndpoint = "/api/custom-fields",
    complianceLevel = "HIGH",
  } = options;

  const [state, setState] = useState<CustomFieldsState>({
    definitions: [],
    values: {},
    currentEntity: null,
    currentEntityType: null,
    isLoading: false,
    isSaving: false,
    isValidating: false,
    error: null,
    validationResults: {},
    calculatedValues: {},
    conditionalStates: {},
    fieldGroups: [],
  });

  // API helper
  const apiCall = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      const response = await fetch(`${apiEndpoint}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "X-Company-ID": companyState.currentCompany?.id || "",
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`Custom Fields API Error: ${response.statusText}`);
      }

      return response.json();
    },
    [apiEndpoint, companyState.currentCompany?.id]
  );

  // Audit logging helper
  const auditFieldOperation = useCallback(
    (operation: string, data?: any, error?: Error) => {
      if (!enableAuditLog) return;

      logAction({
        userId: "current_user",
        userEmail: "user@example.com",
        companyId: companyState.currentCompany?.id || "unknown",
        sessionId: "current_session",
        action: `custom_fields.${operation}`,
        module: "forms",
        feature: "custom_fields",
        resource: "custom_field",
        resourceId: data?.fieldId || data?.id || "unknown",
        details: {
          method: operation.includes("delete")
            ? "DELETE"
            : operation.includes("create") || operation.includes("set")
            ? "CREATE"
            : operation.includes("update")
            ? "UPDATE"
            : "READ",
          outcome: error ? "FAILURE" : "SUCCESS",
          errorMessage: error?.message,
          metadata: {
            operation,
            entityType: data?.entityType,
            fieldType: data?.type,
            isGreekSpecific: data?.isGreekSpecific,
          },
        },
        ipAddress: "127.0.0.1",
        userAgent: navigator.userAgent,
        compliance: {
          level: complianceLevel,
          category: "BUSINESS",
          requiresRetention: true,
          personalDataInvolved:
            data?.greekCompliance?.personalDataCategory !== undefined,
          financialDataInvolved: data?.category === "financial",
        },
        risk: {
          score:
            complianceLevel === "CRITICAL"
              ? 60
              : complianceLevel === "HIGH"
              ? 40
              : 20,
          factors: ["form_data", "custom_fields"],
          flagged: !!error || data?.greekCompliance?.type === "gdpr_sensitive",
          requiresReview:
            complianceLevel === "CRITICAL" ||
            data?.greekCompliance?.type === "gdpr_sensitive",
        },
      });
    },
    [
      enableAuditLog,
      logAction,
      companyState.currentCompany?.id,
      complianceLevel,
    ]
  );

  // Greek validation helper
  const validateGreekFieldValue = useCallback(
    async (
      fieldDefinition: CustomFieldDefinition,
      value: any
    ): Promise<FieldValidationResult> => {
      const errors: ValidationError[] = [];
      const warnings: ValidationWarning[] = [];
      const suggestions: ValidationSuggestion[] = [];

      if (!value && fieldDefinition.isRequired) {
        errors.push({
          code: "REQUIRED_FIELD",
          message: "Το πεδίο είναι υποχρεωτικό",
          field: fieldDefinition.id,
          severity: "error",
        });
      }

      if (value && fieldDefinition.validation.greekValidator) {
        const validator = fieldDefinition.validation.greekValidator;
        let isValid = false;
        let errorMessage = "";

        switch (validator) {
          case "afm":
            isValid = validateAFM(value).isValid;
            errorMessage = "Μη έγκυρο ΑΦΜ";
            break;
          case "doy":
            isValid = validateDOY(value);
            errorMessage = "Μη έγκυρος κωδικός ΔΟΥ";
            break;
          case "phone":
            isValid = validateGreekPhone(value).isValid;
            errorMessage = "Μη έγκυρος αριθμός τηλεφώνου";
            break;
          case "postal_code":
            isValid = validateGreekPostalCode(value);
            errorMessage = "Μη έγκυρος ταχυδρομικός κώδικας";
            break;
          case "iban":
            isValid = validateGreekIBAN(value);
            errorMessage = "Μη έγκυρος IBAN";
            break;
        }

        if (!isValid) {
          errors.push({
            code: `INVALID_${validator.toUpperCase()}`,
            message: errorMessage,
            field: fieldDefinition.id,
            severity: "error",
          });
        }
      }

      // Business rule validation
      if (enableGreekCompliance && fieldDefinition.greekCompliance) {
        const compliance = fieldDefinition.greekCompliance;

        if (compliance.mandatory && !value) {
          errors.push({
            code: "GREEK_COMPLIANCE_REQUIRED",
            message:
              "Το πεδίο είναι υποχρεωτικό για συμμόρφωση με την ελληνική νομοθεσία",
            field: fieldDefinition.id,
            severity: "error",
          });
        }

        if (compliance.validationLevel === "strict" && value) {
          // Additional strict validation for Greek compliance
          warnings.push({
            code: "STRICT_VALIDATION",
            message: "Αυξημένος έλεγχος συμμόρφωσης ενεργός",
            field: fieldDefinition.id,
            suggestion: "Βεβαιωθείτε ότι τα δεδομένα είναι ακριβή",
          });
        }
      }

      const confidence =
        errors.length === 0 ? (warnings.length === 0 ? 1.0 : 0.8) : 0.3;

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        suggestions,
        confidence,
        lastValidated: new Date().toISOString(),
      };
    },
    [
      validateAFM,
      validateDOY,
      validateGreekPhone,
      validateGreekPostalCode,
      validateGreekIBAN,
      enableGreekCompliance,
    ]
  );

  // Field value management
  const setFieldValue = useCallback(
    async (
      fieldId: string,
      entityId: string,
      value: any,
      source: string = "manual"
    ): Promise<FieldValue> => {
      setState((prev) => ({ ...prev, isSaving: true, error: null }));

      try {
        const fieldDefinition = state.definitions.find((d) => d.id === fieldId);
        if (!fieldDefinition) {
          throw new Error("Field definition not found");
        }

        // Validate if enabled
        let validationResult: FieldValidationResult = {
          isValid: true,
          errors: [],
          warnings: [],
          suggestions: [],
          confidence: 1.0,
          lastValidated: new Date().toISOString(),
        };

        if (enableValidation) {
          validationResult = await validateGreekFieldValue(
            fieldDefinition,
            value
          );
        }

        const fieldValue: FieldValue = {
          fieldId,
          entityId,
          entityType: state.currentEntityType || "",
          value,
          displayValue: formatDisplayValue(value, fieldDefinition),
          metadata: {
            companyId: companyState.currentCompany?.id || "",
            userId: "current_user",
            source: source as
              | "manual"
              | "calculated"
              | "imported"
              | "api"
              | "system",
            confidence: validationResult.confidence,
            lastValidated: validationResult.lastValidated,
          },
          history: [],
          validation: validationResult,
          auditInfo: {
            accessCount: 1,
            lastAccessed: new Date().toISOString(),
            modificationCount: 1,
            lastModified: new Date().toISOString(),
            complianceFlags: fieldDefinition.greekCompliance
              ? [fieldDefinition.greekCompliance.type]
              : [],
          },
        };

        // Save to API
        const savedValue = await apiCall(`/values`, {
          method: "POST",
          body: JSON.stringify(fieldValue),
        });

        // Update local state
        setState((prev) => ({
          ...prev,
          values: {
            ...prev.values,
            [entityId]: [
              ...(prev.values[entityId] || []).filter(
                (v) => v.fieldId !== fieldId
              ),
              savedValue,
            ],
          },
          validationResults: {
            ...prev.validationResults,
            [fieldId]: validationResult,
          },
          isSaving: false,
        }));

        auditFieldOperation("set_value", {
          fieldId,
          entityId,
          value,
          validation: validationResult,
        });

        // Trigger conditional logic and calculations if enabled
        if (enableConditionalLogic) {
          await updateConditionalStates(entityId);
        }

        if (enableCalculatedFields) {
          await recalculateAllFields(entityId);
        }

        return savedValue;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isSaving: false,
          error: (error as Error).message,
        }));
        auditFieldOperation(
          "set_value",
          { fieldId, entityId, value },
          error as Error
        );
        throw error;
      }
    },
    [
      state.definitions,
      state.currentEntityType,
      enableValidation,
      validateGreekFieldValue,
      companyState.currentCompany?.id,
      apiCall,
      auditFieldOperation,
      enableConditionalLogic,
      enableCalculatedFields,
    ]
  );

  // Format display value based on field type
  const formatDisplayValue = useCallback(
    (value: any, fieldDefinition: CustomFieldDefinition): string => {
      if (value === null || value === undefined) return "";

      switch (fieldDefinition.type) {
        case "currency":
          return new Intl.NumberFormat("el-GR", {
            style: "currency",
            currency: "EUR",
          }).format(value);
        case "percentage":
          return `${value}%`;
        case "date":
          return new Date(value).toLocaleDateString("el-GR");
        case "datetime":
          return new Date(value).toLocaleString("el-GR");
        case "greek_afm":
          return value.toString().replace(/(\d{9})/, "$1");
        case "greek_phone":
          return value.toString().replace(/(\d{4})(\d{3})(\d{4})/, "$1 $2 $3");
        case "greek_postal_code":
          return value.toString().replace(/(\d{3})(\d{2})/, "$1 $2");
        default:
          return value.toString();
      }
    },
    []
  );

  // Conditional logic evaluation
  const evaluateConditionalLogic = useCallback(
    async (entityId: string): Promise<Record<string, ConditionalState>> => {
      const entityValues = state.values[entityId] || [];
      const conditionalStates: Record<string, ConditionalState> = {};

      for (const definition of state.definitions) {
        const currentValue = entityValues.find(
          (v) => v.fieldId === definition.id
        )?.value;

        let visible = true;
        let enabled = true;
        let required = definition.isRequired;

        // Evaluate visibility rules
        for (const rule of definition.ui.visibility) {
          try {
            const conditionResult = evaluateCondition(
              rule.condition,
              entityValues
            );
            if (!conditionResult) {
              visible = rule.visible;
            }
          } catch (error) {
            console.warn("Error evaluating visibility condition:", error);
          }
        }

        // Evaluate conditional rules
        for (const rule of definition.conditionalLogic) {
          if (!rule.isActive) continue;

          try {
            const conditionResult = evaluateCondition(
              rule.condition,
              entityValues
            );
            if (conditionResult) {
              for (const action of rule.actions) {
                switch (action) {
                  case "show":
                    visible = true;
                    break;
                  case "hide":
                    visible = false;
                    break;
                  case "enable":
                    enabled = true;
                    break;
                  case "disable":
                    enabled = false;
                    break;
                  case "require":
                    required = true;
                    break;
                  case "optional":
                    required = false;
                    break;
                }
              }
            }
          } catch (error) {
            console.warn("Error evaluating conditional rule:", error);
          }
        }

        conditionalStates[definition.id] = {
          visible,
          enabled,
          required,
          value: currentValue,
        };
      }

      return conditionalStates;
    },
    [state.values, state.definitions]
  );

  // Simple condition evaluator (would be more sophisticated in production)
  const evaluateCondition = useCallback(
    (condition: string, values: FieldValue[]): boolean => {
      try {
        // Simple condition parsing - replace with proper expression parser
        const valueMap = values.reduce((acc, val) => {
          acc[val.fieldId] = val.value;
          return acc;
        }, {} as Record<string, any>);

        // Replace field references with actual values
        let evaluableCondition = condition;
        Object.entries(valueMap).forEach(([fieldId, value]) => {
          evaluableCondition = evaluableCondition.replace(
            new RegExp(`\\b${fieldId}\\b`, "g"),
            JSON.stringify(value)
          );
        });

        // Simple evaluation (use a proper expression evaluator in production)
        return new Function(`return ${evaluableCondition}`)();
      } catch {
        return false;
      }
    },
    []
  );

  // Calculate field values
  const calculateField = useCallback(
    async (fieldId: string, entityId: string): Promise<any> => {
      const fieldDefinition = state.definitions.find((d) => d.id === fieldId);
      if (!fieldDefinition || fieldDefinition.type !== "calculated") {
        return null;
      }

      const entityValues = state.values[entityId] || [];
      const calculationRule = fieldDefinition.calculations.find(
        (r) => r.isActive
      );

      if (!calculationRule) {
        return null;
      }

      try {
        // Get dependency values
        const dependencies = calculationRule.dependencies.reduce(
          (acc, depId) => {
            const depValue = entityValues.find(
              (v) => v.fieldId === depId
            )?.value;
            acc[depId] = depValue || 0;
            return acc;
          },
          {} as Record<string, any>
        );

        // Simple formula evaluation (replace with proper math parser)
        let formula = calculationRule.formula;
        Object.entries(dependencies).forEach(([fieldId, value]) => {
          formula = formula.replace(
            new RegExp(`\\b${fieldId}\\b`, "g"),
            value.toString()
          );
        });

        const result = new Function(`return ${formula}`)();

        // Apply precision if specified
        if (calculationRule.precision !== undefined) {
          return Number(result.toFixed(calculationRule.precision));
        }

        return result;
      } catch (error) {
        console.error("Error calculating field:", error);
        return null;
      }
    },
    [state.definitions, state.values]
  );

  // Recalculate all calculated fields
  const recalculateAllFields = useCallback(
    async (entityId: string): Promise<Record<string, any>> => {
      const calculatedValues: Record<string, any> = {};

      const calculatedFields = state.definitions.filter(
        (d) => d.type === "calculated"
      );

      for (const field of calculatedFields) {
        try {
          const result = await calculateField(field.id, entityId);
          if (result !== null) {
            calculatedValues[field.id] = result;

            // Auto-save calculated value if enabled
            if (autoSave) {
              await setFieldValue(field.id, entityId, result, "calculated");
            }
          }
        } catch (error) {
          console.error(`Error calculating field ${field.id}:`, error);
        }
      }

      setState((prev) => ({
        ...prev,
        calculatedValues: {
          ...prev.calculatedValues,
          ...calculatedValues,
        },
      }));

      return calculatedValues;
    },
    [state.definitions, calculateField, autoSave, setFieldValue]
  );

  // Update conditional states
  const updateConditionalStates = useCallback(
    async (entityId: string): Promise<void> => {
      try {
        const conditionalStates = await evaluateConditionalLogic(entityId);
        setState((prev) => ({
          ...prev,
          conditionalStates,
        }));
      } catch (error) {
        console.error("Error updating conditional states:", error);
      }
    },
    [evaluateConditionalLogic]
  );

  // Greek compliance validation
  const validateGreekCompliance = useCallback(
    async (entityId: string): Promise<GreekComplianceResult> => {
      const entityValues = state.values[entityId] || [];
      const greekFields = state.definitions.filter(
        (d) => d.isGreekSpecific || d.greekCompliance
      );

      const issues: GreekComplianceIssue[] = [];
      let score = 100;

      for (const field of greekFields) {
        const value = entityValues.find((v) => v.fieldId === field.id);

        if (field.greekCompliance?.mandatory && !value?.value) {
          issues.push({
            fieldId: field.id,
            type: "missing",
            severity: "high",
            message: `Το υποχρεωτικό πεδίο "${field.label}" δεν έχει συμπληρωθεί`,
            solution: "Συμπληρώστε το πεδίο για συμμόρφωση",
          });
          score -= 20;
        }

        if (value?.validation && !value.validation.isValid) {
          issues.push({
            fieldId: field.id,
            type: "invalid",
            severity: "medium",
            message: `Το πεδίο "${field.label}" περιέχει μη έγκυρα δεδομένα`,
            solution:
              "Διορθώστε τα δεδομένα σύμφωνα με τους κανόνες επικύρωσης",
          });
          score -= 10;
        }
      }

      return {
        isCompliant:
          issues.filter(
            (i) => i.severity === "high" || i.severity === "critical"
          ).length === 0,
        issues,
        score: Math.max(0, score),
        recommendations: issues.map((i) => i.solution || "Ελέγξτε το πεδίο"),
        lastChecked: new Date().toISOString(),
      };
    },
    [state.values, state.definitions]
  );

  // Load field definitions on mount
  useEffect(() => {
    const loadDefinitions = async () => {
      try {
        setState((prev) => ({ ...prev, isLoading: true }));

        const definitions = await apiCall("/definitions");
        const groups = await apiCall("/groups");

        setState((prev) => ({
          ...prev,
          definitions,
          fieldGroups: groups,
          isLoading: false,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: (error as Error).message,
        }));
      }
    };

    loadDefinitions();
  }, [apiCall]);

  // Memoized field queries
  const fieldsByEntity = useMemo(() => {
    return (entityType: string) =>
      state.definitions.filter(
        (d) => d.entityType === entityType && d.isActive
      );
  }, [state.definitions]);

  const fieldsByCategory = useMemo(() => {
    return (category: FieldCategory) =>
      state.definitions.filter((d) => d.category === category && d.isActive);
  }, [state.definitions]);

  const greekFields = useMemo(() => {
    return state.definitions.filter((d) => d.isGreekSpecific && d.isActive);
  }, [state.definitions]);

  const requiredFields = useMemo(() => {
    return (entityType: string) =>
      state.definitions.filter(
        (d) => d.entityType === entityType && d.isRequired && d.isActive
      );
  }, [state.definitions]);

  return {
    ...state,
    createFieldDefinition: async (definition) => {
      const newDefinition = await apiCall("/definitions", {
        method: "POST",
        body: JSON.stringify({
          ...definition,
          createdBy: "current_user",
          createdAt: new Date().toISOString(),
          version: 1,
        }),
      });

      setState((prev) => ({
        ...prev,
        definitions: [...prev.definitions, newDefinition],
      }));

      return newDefinition;
    },
    updateFieldDefinition: async (id, definition) => {
      const updated = await apiCall(`/definitions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(definition),
      });

      setState((prev) => ({
        ...prev,
        definitions: prev.definitions.map((d) => (d.id === id ? updated : d)),
      }));

      return updated;
    },
    deleteFieldDefinition: async (id) => {
      await apiCall(`/definitions/${id}`, { method: "DELETE" });
      setState((prev) => ({
        ...prev,
        definitions: prev.definitions.filter((d) => d.id !== id),
      }));
    },
    duplicateFieldDefinition: async (id, newName) => {
      const original = state.definitions.find((d) => d.id === id);
      if (!original) throw new Error("Field definition not found");

      const duplicate = {
        ...original,
        id: undefined,
        name: newName,
        label: `${original.label} (Copy)`,
      };

      return await apiCall("/definitions", {
        method: "POST",
        body: JSON.stringify(duplicate),
      });
    },
    getFieldValues: async (entityId, entityType) => {
      const values = await apiCall(
        `/values?entityId=${entityId}&entityType=${entityType}`
      );
      setState((prev) => ({
        ...prev,
        values: { ...prev.values, [entityId]: values },
      }));
      return values;
    },
    setFieldValue,
    setMultipleValues: async (values, entityId) => {
      const results = [];
      for (const { fieldId, value } of values) {
        try {
          const result = await setFieldValue(fieldId, entityId, value);
          results.push(result);
        } catch (error) {
          console.error(`Failed to set value for field ${fieldId}:`, error);
        }
      }
      return results;
    },
    clearFieldValue: async (fieldId, entityId) => {
      await apiCall(`/values/${fieldId}?entityId=${entityId}`, {
        method: "DELETE",
      });
      setState((prev) => ({
        ...prev,
        values: {
          ...prev.values,
          [entityId]: (prev.values[entityId] || []).filter(
            (v) => v.fieldId !== fieldId
          ),
        },
      }));
    },
    validateField: async (fieldId, value, context) => {
      const fieldDefinition = state.definitions.find((d) => d.id === fieldId);
      if (!fieldDefinition) {
        throw new Error("Field definition not found");
      }
      return await validateGreekFieldValue(fieldDefinition, value);
    },
    validateAllFields: async (entityId) => {
      const entityValues = state.values[entityId] || [];
      const results: Record<string, FieldValidationResult> = {};

      for (const value of entityValues) {
        const fieldDefinition = state.definitions.find(
          (d) => d.id === value.fieldId
        );
        if (fieldDefinition) {
          results[value.fieldId] = await validateGreekFieldValue(
            fieldDefinition,
            value.value
          );
        }
      }

      setState((prev) => ({
        ...prev,
        validationResults: { ...prev.validationResults, ...results },
      }));

      return results;
    },
    validateGreekField: async (fieldId, value) => {
      const fieldDefinition = state.definitions.find((d) => d.id === fieldId);
      if (!fieldDefinition || !fieldDefinition.isGreekSpecific) {
        throw new Error("Not a Greek-specific field");
      }
      return await validateGreekFieldValue(fieldDefinition, value);
    },
    calculateField,
    recalculateAllFields,
    evaluateConditionalLogic,
    updateConditionalStates,
    getFieldsByEntity: fieldsByEntity,
    getFieldsByCategory: fieldsByCategory,
    getGreekFields: () => greekFields,
    getRequiredFields: requiredFields,
    exportFieldDefinitions: async (format) => {
      return await apiCall(`/export/definitions?format=${format}`);
    },
    importFieldDefinitions: async (data, format) => {
      return await apiCall("/import/definitions", {
        method: "POST",
        body: JSON.stringify({ data, format }),
      });
    },
    exportFieldValues: async (entityId, format) => {
      return await apiCall(
        `/export/values?entityId=${entityId}&format=${format}`
      );
    },
    validateGreekCompliance,
    generateAADEReport: async (entityId) => {
      return await apiCall(`/reports/aade?entityId=${entityId}`);
    },
    checkPersonalDataCompliance: async (entityId) => {
      return await apiCall(`/compliance/personal-data?entityId=${entityId}`);
    },
    setCurrentEntity: (entityId, entityType) => {
      setState((prev) => ({
        ...prev,
        currentEntity: entityId,
        currentEntityType: entityType,
      }));
    },
    refresh: async (entityId) => {
      if (entityId) {
        await apiCall(`/values?entityId=${entityId}`);
      } else {
        const definitions = await apiCall("/definitions");
        setState((prev) => ({ ...prev, definitions }));
      }
    },
    clearValidationResults: () => {
      setState((prev) => ({ ...prev, validationResults: {} }));
    },
    resetFieldValues: async (entityId) => {
      await apiCall(`/values/reset?entityId=${entityId}`, { method: "POST" });
      setState((prev) => ({
        ...prev,
        values: { ...prev.values, [entityId]: [] },
      }));
    },
    searchFields: (query) => {
      return state.definitions.filter(
        (d) =>
          d.name.toLowerCase().includes(query.toLowerCase()) ||
          d.label.toLowerCase().includes(query.toLowerCase()) ||
          d.description?.toLowerCase().includes(query.toLowerCase())
      );
    },
    filterFields: (filters) => {
      return state.definitions.filter((d) => {
        if (filters.entityType && d.entityType !== filters.entityType)
          return false;
        if (filters.category && d.category !== filters.category) return false;
        if (filters.type && d.type !== filters.type) return false;
        if (
          filters.isRequired !== undefined &&
          d.isRequired !== filters.isRequired
        )
          return false;
        if (filters.isActive !== undefined && d.isActive !== filters.isActive)
          return false;
        if (
          filters.isGreekSpecific !== undefined &&
          d.isGreekSpecific !== filters.isGreekSpecific
        )
          return false;
        if (filters.tags && !filters.tags.some((tag) => d.tags.includes(tag)))
          return false;
        if (filters.createdBy && d.createdBy !== filters.createdBy)
          return false;
        return true;
      });
    },
    createFieldGroup: async (group) => {
      const newGroup = await apiCall("/groups", {
        method: "POST",
        body: JSON.stringify(group),
      });
      setState((prev) => ({
        ...prev,
        fieldGroups: [...prev.fieldGroups, newGroup],
      }));
      return newGroup;
    },
    updateFieldGroup: async (id, group) => {
      const updated = await apiCall(`/groups/${id}`, {
        method: "PATCH",
        body: JSON.stringify(group),
      });
      setState((prev) => ({
        ...prev,
        fieldGroups: prev.fieldGroups.map((g) => (g.id === id ? updated : g)),
      }));
      return updated;
    },
    deleteFieldGroup: async (id) => {
      await apiCall(`/groups/${id}`, { method: "DELETE" });
      setState((prev) => ({
        ...prev,
        fieldGroups: prev.fieldGroups.filter((g) => g.id !== id),
      }));
    },
    reorderFields: async (fieldIds, groupId) => {
      await apiCall("/reorder", {
        method: "POST",
        body: JSON.stringify({ fieldIds, groupId }),
      });
    },
  };
}

export default useCustomFields;
