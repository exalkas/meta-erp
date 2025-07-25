/**
 * Dynamic Entity System Types
 * Core type definitions for enterprise-grade entity customization
 */

// ============================================================================
// CORE ENTITY TYPES
// ============================================================================

export interface DynamicEntity {
  id: string;
  name: string;
  pluralName: string;
  labelSingular: string;
  labelPlural: string;
  labelSingularGreek?: string;
  labelPluralGreek?: string;
  icon: string;
  color: string;
  description?: string;
  descriptionGreek?: string;

  // Module Configuration
  module: string;
  category: EntityCategory;
  customizationLevel: CustomizationLevel;

  // Schema Definition
  fields: DynamicField[];
  relationships: EntityRelationship[];
  indexes: EntityIndex[];
  constraints: EntityConstraint[];

  // UI Configuration
  layouts: EntityLayout[];
  defaultLayout: string;
  listViewConfig: ListViewConfig;
  searchConfig: SearchConfig;

  // Greek Compliance
  greekCompliance: GreekComplianceConfig;
  aadeIntegration: boolean;
  taxRelevant: boolean;
  gdprRelevant: boolean;

  // Business Rules
  workflows: WorkflowRule[];
  validationRules: ValidationRule[];
  businessRules: BusinessRule[];

  // Permissions & Security
  permissions: EntityPermissions;
  accessControl: AccessControlConfig;

  // Versioning & Audit
  version: string;
  baseEntityId?: string; // For entity extensions
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  updatedAt: Date;
  isActive: boolean;
  isSystemEntity: boolean;
}

// ============================================================================
// FIELD TYPES (15+ FIELD TYPES)
// ============================================================================

export type FieldType =
  // Basic Types
  | "text"
  | "textarea"
  | "email"
  | "phone"
  | "url"
  | "number"
  | "decimal"
  | "currency"
  | "percentage"
  | "date"
  | "datetime"
  | "time"
  | "boolean"
  | "checkbox"

  // Selection Types
  | "dropdown"
  | "multiselect"
  | "radio"
  | "tags"
  | "lookup"           // Reference to other entities
  | "multilookup"      // Multiple references

  // Rich Content
  | "richtext"
  | "markdown"
  | "code"
  | "file"
  | "image"
  | "document"

  // Greek-Specific Types
  | "greek_afm"        // Greek Tax Number
  | "greek_amka"       // Greek Social Security
  | "greek_iban"       // Greek Bank Account
  | "greek_phone"      // Greek Phone Format
  | "greek_postal_code" // Greek Postal Code
  | "greek_doy_selector" // Tax Office Selector
  | "greek_municipality" // Greek Municipality
  | "greek_address"    // Greek Address Format

  // Advanced Types
  | "json"
  | "array"
  | "composite"        // Complex nested fields
  | "calculated"       // Calculated fields
  | "formula"          // Formula-based fields
  | "aggregation"      // Aggregated data
  | "signature"        // Digital signature
  | "location"         // GPS coordinates
  | "barcode"          // Barcode/QR code
  | "rating"           // Star rating
  | "progress"         // Progress bar
  | "status_indicator"; // Status badges

export interface DynamicField {
  id: string;
  name: string;
  label: string;
  labelGreek?: string;
  type: FieldType;
  description?: string;
  descriptionGreek?: string;
  helpText?: string;
  helpTextGreek?: string;

  // Field Configuration
  required: boolean;
  unique: boolean;
  indexed: boolean;
  searchable: boolean;
  sortable: boolean;
  filterable: boolean;
  exportable: boolean;

  // Data Properties
  defaultValue?: any;
  minValue?: number;
  maxValue?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string; // Regex pattern
  options?: FieldOption[]; // For dropdown/select fields

  // Validation Rules
  validation: FieldValidation;
  greekValidation?: GreekFieldValidation;

  // Display Properties
  displayOrder: number;
  gridColumn: boolean;
  gridWidth?: number;
  detailSection: string;
  isInlineEditable: boolean;
  showInList: boolean;
  showInDetail: boolean;
  showInSearch: boolean;

  // Conditional Logic
  conditionalDisplay?: ConditionalDisplayRule[];
  dependentFields?: string[]; // Fields that depend on this field

  // Permissions
  permissions: FieldPermissions;

  // Lookup Configuration (for lookup fields)
  lookupConfig?: LookupFieldConfig;

  // File Configuration (for file fields)
  fileConfig?: FileFieldConfig;

  // Versioning
  version: string;
  customizationId?: string;
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
}

// ============================================================================
// LAYOUT SYSTEM
// ============================================================================

export type LayoutType = 
  | "form"
  | "list"
  | "detail"
  | "search"
  | "print"
  | "mobile"
  | "kanban"
  | "calendar"
  | "timeline"
  | "greek_invoice"
  | "greek_report";

export interface EntityLayout {
  id: string;
  entityId: string;
  name: string;
  nameGreek?: string;
  type: LayoutType;
  isDefault: boolean;
  isGreekOptimized: boolean;

  // Layout Configuration
  configuration: LayoutConfiguration;
  sections: LayoutSection[];
  permissions: LayoutPermission[];
  responsiveSettings: ResponsiveSettings;

  // Customization
  customSettings: Record<string, any>;
  customCSS?: string;

  // Versioning
  version: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface LayoutSection {
  id: string;
  name: string;
  nameGreek?: string;
  order: number;
  columns: number;
  isCollapsible: boolean;
  isCollapsed: boolean;
  icon?: string;
  description?: string;
  descriptionGreek?: string;

  // Fields in this section
  fields: LayoutField[];

  // Styling
  customSettings: Record<string, any>;
  backgroundColor?: string;
  borderColor?: string;
}

export interface LayoutField {
  fieldId: string;
  order: number;
  width?: number; // Percentage or pixels
  height?: number;
  isVisible: boolean;
  isReadonly: boolean;
  isRequired?: boolean; // Override field requirement
  customLabel?: string;
  customLabelGreek?: string;
  placeholder?: string;
  placeholderGreek?: string;

  // Display Settings
  displaySettings: FieldDisplaySettings;
  conditionalDisplay?: ConditionalDisplayRule[];

  // Styling
  customCSS?: string;
  customAttributes?: Record<string, string>;
}

// ============================================================================
// BUSINESS RULES & WORKFLOWS
// ============================================================================

export interface BusinessRule {
  id: string;
  entityId: string;
  name: string;
  nameGreek?: string;
  description?: string;
  descriptionGreek?: string;
  type: BusinessRuleType;
  isActive: boolean;
  isGreekSpecific: boolean;
  greekRuleType?: GreekBusinessRuleType;

  // Rule Definition
  trigger: RuleTrigger;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number;

  // Settings
  customSettings: Record<string, any>;
  
  // Versioning
  version: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export type BusinessRuleType = 
  | "validation"
  | "calculation"
  | "notification"
  | "workflow"
  | "field_update"
  | "approval"
  | "automation";

export type GreekBusinessRuleType = 
  | "vat_calculation"
  | "tax_validation"
  | "aade_compliance"
  | "greek_address_validation"
  | "working_hours_validation"
  | "holiday_scheduling"
  | "afm_validation"
  | "doy_validation";

// ============================================================================
// CUSTOMIZATION LEVELS
// ============================================================================

export type CustomizationLevel = 
  | "platform"    // Core platform features
  | "module"      // Module-level customizations
  | "custom"      // Customer-specific customizations
  | "enterprise"; // Enterprise-level deep customizations

export type EntityCategory = 
  | "core"        // Core business entities
  | "crm"         // CRM-specific entities
  | "erp"         // ERP-specific entities
  | "financial"   // Financial entities
  | "inventory"   // Inventory entities
  | "hr"          // HR entities
  | "greek"       // Greek-specific entities
  | "custom";     // Custom entities

// ============================================================================
// GREEK COMPLIANCE
// ============================================================================

export interface GreekComplianceConfig {
  aadeReporting: boolean;
  taxRelevant: boolean;
  personalData: boolean; // GDPR compliance
  professionalCertification?: string;
  requiredDocuments: string[];
  complianceLevel: "basic" | "standard" | "advanced";
  auditTrail: boolean;
  digitalSignature: boolean;
}

export interface GreekFieldValidation {
  afmValidation?: AFMValidationConfig;
  amkaValidation?: AMKAValidationConfig;
  ibanValidation?: IBANValidationConfig;
  phoneFormat?: "landline" | "mobile" | "both";
  addressValidation?: GreekAddressValidationConfig;
  taxOfficeValidation?: boolean;
  postalCodeValidation?: boolean;
}

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

export interface FieldOption {
  value: string;
  label: string;
  labelGreek?: string;
  color?: string;
  icon?: string;
  isDefault?: boolean;
  isActive: boolean;
}

export interface FieldValidation {
  rules: ValidationRule[];
  customValidation?: string; // JavaScript code
  errorMessage?: string;
  errorMessageGreek?: string;
  asyncValidation?: AsyncValidationConfig;
}

export interface ValidationRule {
  type: "required" | "min" | "max" | "pattern" | "custom" | "greek_specific";
  value?: any;
  message?: string;
  messageGreek?: string;
}

export interface FieldPermissions {
  create: string[]; // Role names that can create
  read: string[];   // Role names that can read
  update: string[]; // Role names that can update
  delete: string[]; // Role names that can delete
}

export interface EntityPermissions {
  create: string[];
  read: string[];
  update: string[];
  delete: string[];
  export: string[];
  import: string[];
  customizeFields: string[];
  customizeLayouts: string[];
  createWorkflows: string[];
}

export interface LookupFieldConfig {
  targetEntity: string;
  displayField: string;
  valueField: string;
  searchFields: string[];
  filters?: Record<string, any>;
  allowMultiple: boolean;
  allowCreation: boolean;
  cascadeDelete: boolean;
}

export interface FileFieldConfig {
  allowedTypes: string[]; // ['pdf', 'doc', 'jpg', etc.]
  maxFileSize: number; // in bytes
  maxFiles: number;
  requireApproval: boolean;
  generateThumbnails: boolean;
  enableVersioning: boolean;
  virusScan: boolean;
}

export interface FieldDisplaySettings {
  width: "small" | "medium" | "large" | "full";
  height?: "small" | "medium" | "large" | "auto";
  alignment: "left" | "center" | "right";
  labelPosition: "top" | "left" | "hidden";
  showBorder: boolean;
  showBackground: boolean;
  customCSS?: string;
}

export interface ConditionalDisplayRule {
  fieldId: string;
  operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "is_empty" | "is_not_empty";
  value: any;
  action: "show" | "hide" | "require" | "disable";
}

// ============================================================================
// WORKFLOW & AUTOMATION
// ============================================================================

export interface WorkflowRule {
  id: string;
  name: string;
  nameGreek?: string;
  isActive: boolean;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  permissions: string[];
}

export interface WorkflowTrigger {
  event: "create" | "update" | "delete" | "field_change" | "status_change" | "schedule";
  conditions?: RuleCondition[];
}

export interface WorkflowStep {
  id: string;
  type: "approval" | "notification" | "field_update" | "automation" | "integration";
  configuration: Record<string, any>;
  order: number;
  isRequired: boolean;
}

// ============================================================================
// RELATIONSHIPS
// ============================================================================

export interface EntityRelationship {
  id: string;
  name: string;
  type: "one_to_one" | "one_to_many" | "many_to_many" | "lookup";
  sourceEntityId: string;
  targetEntityId: string;
  sourceField: string;
  targetField: string;
  cascadeDelete: boolean;
  isRequired: boolean;
  displayInList: boolean;
  displayInDetail: boolean;
}

// ============================================================================
// SEARCH & FILTERING
// ============================================================================

export interface SearchConfig {
  searchableFields: string[];
  quickSearchFields: string[];
  advancedSearchEnabled: boolean;
  fullTextSearch: boolean;
  searchOperators: SearchOperator[];
}

export interface SearchOperator {
  value: string;
  label: string;
  labelGreek?: string;
  applicableTypes: FieldType[];
}

// ============================================================================
// LIST VIEW CONFIGURATION
// ============================================================================

export interface ListViewConfig {
  defaultColumns: string[];
  sortableColumns: string[];
  filterableColumns: string[];
  searchableColumns: string[];
  defaultSortField: string;
  defaultSortDirection: "asc" | "desc";
  pageSize: number;
  allowExport: boolean;
  allowImport: boolean;
  bulkActions: BulkAction[];
}

export interface BulkAction {
  id: string;
  name: string;
  nameGreek?: string;
  icon: string;
  action: string;
  requiresConfirmation: boolean;
  permissions: string[];
}

// ============================================================================
// RESPONSIVE & MOBILE
// ============================================================================

export interface ResponsiveSettings {
  mobile: LayoutBreakpoint;
  tablet: LayoutBreakpoint;
  desktop: LayoutBreakpoint;
  largeDesktop: LayoutBreakpoint;
}

export interface LayoutBreakpoint {
  columnsPerRow: number;
  hideFields: string[];
  collapsesSections: string[];
  customCSS?: string;
}

// ============================================================================
// CONFIGURATION INTERFACES
// ============================================================================

export interface LayoutConfiguration {
  columns: number;
  spacing: "compact" | "normal" | "spacious";
  showSectionHeaders: boolean;
  showFieldLabels: boolean;
  enableDragAndDrop: boolean;
  enableInlineEditing: boolean;
  theme: "light" | "dark" | "auto" | "greek_traditional";
}

export interface LayoutPermission {
  role: string;
  canView: boolean;
  canEdit: boolean;
  canCustomize: boolean;
}

export interface AccessControlConfig {
  companyIsolation: boolean;
  departmentRestrictions: string[];
  roleBasedAccess: boolean;
  fieldLevelSecurity: boolean;
  recordLevelSecurity: boolean;
}

export interface EntityIndex {
  name: string;
  fields: string[];
  unique: boolean;
  type: "btree" | "hash" | "gin" | "gist";
}

export interface EntityConstraint {
  name: string;
  type: "check" | "unique" | "foreign_key" | "not_null";
  definition: string;
  errorMessage?: string;
  errorMessageGreek?: string;
}

// ============================================================================
// ASYNC VALIDATION
// ============================================================================

export interface AsyncValidationConfig {
  endpoint: string;
  method: "GET" | "POST";
  debounceMs: number;
  cacheResults: boolean;
  headers?: Record<string, string>;
}

// ============================================================================
// RULE SYSTEM
// ============================================================================

export interface RuleTrigger {
  event: "create" | "update" | "delete" | "field_change" | "schedule";
  fields?: string[]; // For field_change events
  schedule?: string; // Cron expression for scheduled rules
}

export interface RuleCondition {
  field: string;
  operator: ConditionOperator;
  value: any;
  dataType: FieldType;
  isGreekSpecific?: boolean;
}

export type ConditionOperator = 
  | "equals"
  | "not_equals"
  | "greater_than"
  | "greater_than_or_equal"
  | "less_than"
  | "less_than_or_equal"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "is_empty"
  | "is_not_empty"
  | "in_list"
  | "not_in_list"
  | "between"
  | "matches_pattern";

export interface RuleAction {
  type: ActionType;
  configuration: ActionConfiguration;
  order: number;
  isGreekSpecific?: boolean;
}

export type ActionType = 
  | "set_field_value"
  | "send_notification"
  | "create_record"
  | "update_record"
  | "start_workflow"
  | "send_email"
  | "calculate_greek_vat"
  | "validate_aade"
  | "log_audit"
  | "trigger_integration";

export interface ActionConfiguration {
  [key: string]: any;
}

// ============================================================================
// GREEK-SPECIFIC VALIDATION CONFIGS
// ============================================================================

export interface AFMValidationConfig {
  strict: boolean;
  checkOnline?: boolean; // Validate against AADE database
  allowTemporary?: boolean;
  requireBusinessEntity?: boolean;
}

export interface AMKAValidationConfig {
  strict: boolean;
  checkChecksum: boolean;
  allowForeign?: boolean;
}

export interface IBANValidationConfig {
  requireGreekIBAN: boolean;
  validateBankCode: boolean;
  checkOnline?: boolean;
}

export interface GreekAddressValidationConfig {
  requirePostalCode: boolean;
  validateMunicipality: boolean;
  requireRegion: boolean;
  standardizeFormat: boolean;
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

// Additional type exports will be added here as the system grows 