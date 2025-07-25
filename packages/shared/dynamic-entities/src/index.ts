/**
 * Dynamic Entities Package
 * Enterprise-grade dynamic entity system for Greek ERP/CRM
 * Enables EspoCRM-style customization with Greek compliance
 */

// Core Types
export * from './types';

// Core Engine
export { 
  DynamicEntityManager,
  type EntityDefinition,
  type FieldDefinition,
  type EntityCreationResult,
  type FieldCreationResult
} from './core/DynamicEntityManager';

// Field Types Registry
export const FIELD_TYPES = [
  // Basic Types
  { value: 'text', label: 'Text', labelGreek: 'Κείμενο', category: 'basic' },
  { value: 'textarea', label: 'Long Text', labelGreek: 'Μεγάλο Κείμενο', category: 'basic' },
  { value: 'email', label: 'Email', labelGreek: 'Email', category: 'basic' },
  { value: 'phone', label: 'Phone', labelGreek: 'Τηλέφωνο', category: 'basic' },
  { value: 'url', label: 'Website URL', labelGreek: 'Ιστοσελίδα', category: 'basic' },
  
  // Number Types
  { value: 'number', label: 'Number', labelGreek: 'Αριθμός', category: 'numeric' },
  { value: 'decimal', label: 'Decimal', labelGreek: 'Δεκαδικός', category: 'numeric' },
  { value: 'currency', label: 'Currency', labelGreek: 'Νόμισμα', category: 'numeric' },
  { value: 'percentage', label: 'Percentage', labelGreek: 'Ποσοστό', category: 'numeric' },
  
  // Date & Time
  { value: 'date', label: 'Date', labelGreek: 'Ημερομηνία', category: 'datetime' },
  { value: 'datetime', label: 'Date & Time', labelGreek: 'Ημερομηνία & Ώρα', category: 'datetime' },
  { value: 'time', label: 'Time', labelGreek: 'Ώρα', category: 'datetime' },
  
  // Boolean & Selection
  { value: 'boolean', label: 'Yes/No', labelGreek: 'Ναι/Όχι', category: 'selection' },
  { value: 'checkbox', label: 'Checkbox', labelGreek: 'Κουτάκι Επιλογής', category: 'selection' },
  { value: 'dropdown', label: 'Dropdown', labelGreek: 'Λίστα Επιλογών', category: 'selection' },
  { value: 'multiselect', label: 'Multi-Select', labelGreek: 'Πολλαπλή Επιλογή', category: 'selection' },
  { value: 'radio', label: 'Radio Buttons', labelGreek: 'Κουμπιά Επιλογής', category: 'selection' },
  { value: 'tags', label: 'Tags', labelGreek: 'Ετικέτες', category: 'selection' },
  
  // Relationships
  { value: 'lookup', label: 'Lookup', labelGreek: 'Αναφορά', category: 'relationship' },
  { value: 'multilookup', label: 'Multi-Lookup', labelGreek: 'Πολλαπλή Αναφορά', category: 'relationship' },
  
  // Rich Content
  { value: 'richtext', label: 'Rich Text', labelGreek: 'Μορφοποιημένο Κείμενο', category: 'content' },
  { value: 'markdown', label: 'Markdown', labelGreek: 'Markdown', category: 'content' },
  { value: 'code', label: 'Code', labelGreek: 'Κώδικας', category: 'content' },
  { value: 'file', label: 'File', labelGreek: 'Αρχείο', category: 'content' },
  { value: 'image', label: 'Image', labelGreek: 'Εικόνα', category: 'content' },
  { value: 'document', label: 'Document', labelGreek: 'Έγγραφο', category: 'content' },
  
  // Greek-Specific Fields
  { value: 'greek_afm', label: 'Greek AFM', labelGreek: 'ΑΦΜ', category: 'greek' },
  { value: 'greek_amka', label: 'Greek AMKA', labelGreek: 'ΑΜΚΑ', category: 'greek' },
  { value: 'greek_iban', label: 'Greek IBAN', labelGreek: 'Ελληνικό IBAN', category: 'greek' },
  { value: 'greek_phone', label: 'Greek Phone', labelGreek: 'Ελληνικό Τηλέφωνο', category: 'greek' },
  { value: 'greek_postal_code', label: 'Greek Postal Code', labelGreek: 'Ταχυδρομικός Κώδικας', category: 'greek' },
  { value: 'greek_doy_selector', label: 'Greek DOY', labelGreek: 'ΔΟΥ', category: 'greek' },
  { value: 'greek_municipality', label: 'Greek Municipality', labelGreek: 'Δήμος', category: 'greek' },
  { value: 'greek_address', label: 'Greek Address', labelGreek: 'Ελληνική Διεύθυνση', category: 'greek' },
  
  // Advanced Types
  { value: 'json', label: 'JSON Data', labelGreek: 'Δεδομένα JSON', category: 'advanced' },
  { value: 'array', label: 'Array', labelGreek: 'Πίνακας', category: 'advanced' },
  { value: 'composite', label: 'Composite', labelGreek: 'Σύνθετο', category: 'advanced' },
  { value: 'calculated', label: 'Calculated', labelGreek: 'Υπολογιζόμενο', category: 'advanced' },
  { value: 'formula', label: 'Formula', labelGreek: 'Φόρμουλα', category: 'advanced' },
  { value: 'aggregation', label: 'Aggregation', labelGreek: 'Συγκέντρωση', category: 'advanced' },
  { value: 'signature', label: 'Digital Signature', labelGreek: 'Ψηφιακή Υπογραφή', category: 'advanced' },
  { value: 'location', label: 'GPS Location', labelGreek: 'Τοποθεσία GPS', category: 'advanced' },
  { value: 'barcode', label: 'Barcode/QR', labelGreek: 'Barcode/QR', category: 'advanced' },
  { value: 'rating', label: 'Star Rating', labelGreek: 'Αξιολόγηση', category: 'advanced' },
  { value: 'progress', label: 'Progress Bar', labelGreek: 'Μπάρα Προόδου', category: 'advanced' },
  { value: 'status_indicator', label: 'Status Badge', labelGreek: 'Κατάσταση', category: 'advanced' },
] as const;

// Field Categories
export const FIELD_CATEGORIES = [
  { value: 'basic', label: 'Basic Fields', labelGreek: 'Βασικά Πεδία' },
  { value: 'numeric', label: 'Numbers', labelGreek: 'Αριθμοί' },
  { value: 'datetime', label: 'Date & Time', labelGreek: 'Ημερομηνία & Ώρα' },
  { value: 'selection', label: 'Selection Fields', labelGreek: 'Πεδία Επιλογής' },
  { value: 'relationship', label: 'Relationships', labelGreek: 'Σχέσεις' },
  { value: 'content', label: 'Rich Content', labelGreek: 'Περιεχόμενο' },
  { value: 'greek', label: 'Greek Compliance', labelGreek: 'Ελληνική Συμμόρφωση' },
  { value: 'advanced', label: 'Advanced Types', labelGreek: 'Προχωρημένα' },
] as const;

// Entity Categories
export const ENTITY_CATEGORIES = [
  { value: 'core', label: 'Core Business', labelGreek: 'Βασική Επιχείρηση' },
  { value: 'crm', label: 'CRM', labelGreek: 'CRM' },
  { value: 'erp', label: 'ERP', labelGreek: 'ERP' },
  { value: 'financial', label: 'Financial', labelGreek: 'Οικονομικά' },
  { value: 'inventory', label: 'Inventory', labelGreek: 'Αποθέματα' },
  { value: 'hr', label: 'Human Resources', labelGreek: 'Ανθρώπινο Δυναμικό' },
  { value: 'greek', label: 'Greek Specific', labelGreek: 'Ελληνικά Ειδικά' },
  { value: 'custom', label: 'Custom', labelGreek: 'Προσαρμοσμένα' },
] as const;

// Customization Levels
export const CUSTOMIZATION_LEVELS = [
  { 
    value: 'platform', 
    label: 'Platform Level', 
    labelGreek: 'Επίπεδο Πλατφόρμας',
    description: 'Core platform features available to all',
    descriptionGreek: 'Βασικά χαρακτηριστικά πλατφόρμας διαθέσιμα σε όλους'
  },
  { 
    value: 'module', 
    label: 'Module Level', 
    labelGreek: 'Επίπεδο Μονάδας',
    description: 'Module-specific customizations',
    descriptionGreek: 'Προσαρμογές ειδικές για μονάδες'
  },
  { 
    value: 'custom', 
    label: 'Custom Level', 
    labelGreek: 'Προσαρμοσμένο Επίπεδο',
    description: 'Customer-specific customizations',
    descriptionGreek: 'Προσαρμογές ειδικές για πελάτες'
  },
  { 
    value: 'enterprise', 
    label: 'Enterprise Level', 
    labelGreek: 'Επιχειρηματικό Επίπεδο',
    description: 'Deep enterprise customizations',
    descriptionGreek: 'Βαθιές επιχειρηματικές προσαρμογές'
  },
] as const;

// Layout Types
export const LAYOUT_TYPES = [
  { value: 'form', label: 'Form Layout', labelGreek: 'Διάταξη Φόρμας', icon: 'form' },
  { value: 'list', label: 'List Layout', labelGreek: 'Διάταξη Λίστας', icon: 'list' },
  { value: 'detail', label: 'Detail Layout', labelGreek: 'Διάταξη Λεπτομερειών', icon: 'eye' },
  { value: 'search', label: 'Search Layout', labelGreek: 'Διάταξη Αναζήτησης', icon: 'search' },
  { value: 'kanban', label: 'Kanban Board', labelGreek: 'Πίνακας Kanban', icon: 'columns' },
  { value: 'calendar', label: 'Calendar View', labelGreek: 'Προβολή Ημερολογίου', icon: 'calendar' },
  { value: 'timeline', label: 'Timeline View', labelGreek: 'Προβολή Χρονολογίου', icon: 'clock' },
  { value: 'print', label: 'Print Layout', labelGreek: 'Διάταξη Εκτύπωσης', icon: 'printer' },
  { value: 'mobile', label: 'Mobile Layout', labelGreek: 'Διάταξη Κινητού', icon: 'smartphone' },
  { value: 'greek_invoice', label: 'Greek Invoice', labelGreek: 'Ελληνικό Τιμολόγιο', icon: 'file-text' },
  { value: 'greek_report', label: 'Greek Report', labelGreek: 'Ελληνική Αναφορά', icon: 'bar-chart' },
] as const;

// Greek Compliance Levels
export const GREEK_COMPLIANCE_LEVELS = [
  {
    value: 'basic',
    label: 'Basic Compliance',
    labelGreek: 'Βασική Συμμόρφωση',
    description: 'Basic Greek business rules',
    descriptionGreek: 'Βασικοί ελληνικοί επιχειρηματικοί κανόνες'
  },
  {
    value: 'standard',
    label: 'Standard Compliance',
    labelGreek: 'Τυπική Συμμόρφωση',
    description: 'Standard Greek compliance with AADE integration',
    descriptionGreek: 'Τυπική ελληνική συμμόρφωση με ενσωμάτωση AADE'
  },
  {
    value: 'advanced',
    label: 'Advanced Compliance',
    labelGreek: 'Προχωρημένη Συμμόρφωση',
    description: 'Full Greek compliance with digital signatures and audit trails',
    descriptionGreek: 'Πλήρης ελληνική συμμόρφωση με ψηφιακές υπογραφές και ίχνη ελέγχου'
  },
] as const;

// Utility functions
export const createEntityManager = () => {
  const { DynamicEntityManager } = require('./core/DynamicEntityManager');
  return new DynamicEntityManager();
};

export const getFieldTypesByCategory = (category: string) => {
  return FIELD_TYPES.filter(type => type.category === category);
};

export const getFieldTypeLabel = (type: string, language: 'en' | 'el' = 'en') => {
  const fieldType = FIELD_TYPES.find(t => t.value === type);
  return fieldType ? (language === 'el' ? fieldType.labelGreek : fieldType.label) : type;
};

export const getEntityCategoryLabel = (category: string, language: 'en' | 'el' = 'en') => {
  const entityCategory = ENTITY_CATEGORIES.find(c => c.value === category);
  return entityCategory ? (language === 'el' ? entityCategory.labelGreek : entityCategory.label) : category;
};

export const getLayoutTypeLabel = (type: string, language: 'en' | 'el' = 'en') => {
  const layoutType = LAYOUT_TYPES.find(t => t.value === type);
  return layoutType ? (language === 'el' ? layoutType.labelGreek : layoutType.label) : type;
};

export const isGreekSpecificFieldType = (type: string): boolean => {
  return type.startsWith('greek_');
};

export const requiresGreekCompliance = (fieldTypes: string[]): boolean => {
  return fieldTypes.some(type => isGreekSpecificFieldType(type));
};

// Version info
export const VERSION = '1.0.0';
export const BUILD_DATE = new Date().toISOString(); 