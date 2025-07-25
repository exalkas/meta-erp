"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  LoadingButton,
  Input,
  Label,
  ModernSelect as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Badge,
  ModernTabs as Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../..";
import { useTranslation } from "../../contexts/TranslationContext";
import {
  DynamicField,
  FieldDefinition,
  FieldCreationResult,
  FieldType,
  FIELD_TYPES,
  FIELD_CATEGORIES,
  getFieldTypesByCategory,
  getFieldTypeLabel,
  isGreekSpecificFieldType,
} from "@erp/dynamic-entities";
import {
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  Link,
  FileText,
  Settings,
  Eye,
  Plus,
  Trash2,
  AlertCircle,
  Info,
  CheckCircle,
  Globe,
  Shield,
  Wand2,
  Copy,
} from "lucide-react";

export interface FieldBuilderProps {
  entityId: string;
  fieldId?: string;
  initialData?: Partial<FieldDefinition>;
  onSave?: (field: DynamicField) => void;
  onCancel?: () => void;
  showGreekFeatures?: boolean;
  showAdvanced?: boolean;
  className?: string;
}

interface FieldFormData {
  name: string;
  label: string;
  labelGreek: string;
  type: FieldType;
  description: string;
  descriptionGreek: string;
  helpText: string;
  helpTextGreek: string;
  required: boolean;
  unique: boolean;
  indexed: boolean;
  searchable: boolean;
  defaultValue: string;
  minValue: string;
  maxValue: string;
  minLength: string;
  maxLength: string;
  pattern: string;
  options: Array<{
    value: string;
    label: string;
    labelGreek: string;
    isDefault: boolean;
  }>;
}

interface FieldTypeOption {
  value: FieldType;
  label: string;
  labelGreek: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  descriptionGreek: string;
  isGreekSpecific: boolean;
  isPremium: boolean;
}

const FIELD_TYPE_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  // Basic Types
  text: Type,
  textarea: FileText,
  email: Type,
  phone: Type,
  url: Link,

  // Numeric Types
  number: Hash,
  decimal: Hash,
  currency: Hash,
  percentage: Hash,

  // Date & Time
  date: Calendar,
  datetime: Calendar,
  time: Calendar,

  // Selection Types
  boolean: ToggleLeft,
  checkbox: ToggleLeft,
  dropdown: ToggleLeft,
  multiselect: ToggleLeft,
  radio: ToggleLeft,
  tags: ToggleLeft,

  // Relationships
  lookup: Link,
  multilookup: Link,

  // Rich Content
  richtext: FileText,
  markdown: FileText,
  code: FileText,
  file: FileText,
  image: FileText,
  document: FileText,

  // Greek-Specific
  greek_afm: Shield,
  greek_amka: Shield,
  greek_iban: Shield,
  greek_phone: Shield,
  greek_postal_code: Shield,
  greek_doy_selector: Shield,
  greek_municipality: Shield,
  greek_address: Shield,

  // Advanced
  json: Settings,
  array: Settings,
  composite: Settings,
  calculated: Wand2,
  formula: Wand2,
  aggregation: Wand2,
  signature: Settings,
  location: Settings,
  barcode: Settings,
  rating: Settings,
  progress: Settings,
  status_indicator: Settings,
};

export const FieldBuilder: React.FC<FieldBuilderProps> = ({
  entityId,
  fieldId,
  initialData,
  onSave,
  onCancel,
  showGreekFeatures = true,
  showAdvanced = true,
  className = "",
}) => {
  const { t, language } = useTranslation();

  const [selectedType, setSelectedType] = useState<FieldType | null>(
    initialData?.type || null
  );
  const [formData, setFormData] = useState<FieldFormData>({
    name: initialData?.name || "",
    label: initialData?.label || "",
    labelGreek: initialData?.labelGreek || "",
    type: initialData?.type || "text",
    description: initialData?.description || "",
    descriptionGreek: initialData?.descriptionGreek || "",
    helpText: initialData?.helpText || "",
    helpTextGreek: initialData?.helpTextGreek || "",
    required: initialData?.required || false,
    unique: initialData?.unique || false,
    indexed: initialData?.indexed || false,
    searchable: initialData?.searchable ?? true,
    defaultValue: (initialData?.defaultValue as string) || "",
    minValue: "",
    maxValue: "",
    minLength: "",
    maxLength: "",
    pattern: "",
    options:
      initialData?.options?.map((opt) => ({
        value: opt.value,
        label: opt.label,
        labelGreek: opt.labelGreek || "",
        isDefault: false,
      })) || [],
  });

  const [activeTab, setActiveTab] = useState("basic");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState(false);

  // Prepare field type options with metadata
  const fieldTypeOptions: FieldTypeOption[] = useMemo(() => {
    return FIELD_TYPES.map((fieldType) => ({
      value: fieldType.value as FieldType,
      label: fieldType.label,
      labelGreek: fieldType.labelGreek,
      category: fieldType.category,
      icon: FIELD_TYPE_ICONS[fieldType.value] || Type,
      description: `Advanced ${fieldType.label.toLowerCase()} field with validation and Greek compliance`,
      descriptionGreek: `Προχωρημένο πεδίο ${fieldType.labelGreek.toLowerCase()} με επικύρωση και ελληνική συμμόρφωση`,
      isGreekSpecific: isGreekSpecificFieldType(fieldType.value),
      isPremium: ["calculated", "formula", "aggregation", "composite"].includes(
        fieldType.value
      ),
    }));
  }, []);

  // Filter field types based on features
  const availableFieldTypes = useMemo(() => {
    return fieldTypeOptions.filter((option) => {
      if (option.isGreekSpecific && !showGreekFeatures) return false;
      if (option.isPremium && !showAdvanced) return false;
      return true;
    });
  }, [fieldTypeOptions, showGreekFeatures, showAdvanced]);

  // Group field types by category
  const fieldTypesByCategory = useMemo(() => {
    const grouped: Record<string, FieldTypeOption[]> = {};
    availableFieldTypes.forEach((option) => {
      if (!grouped[option.category]) {
        grouped[option.category] = [];
      }
      grouped[option.category].push(option);
    });
    return grouped;
  }, [availableFieldTypes]);

  // Auto-generate field name from label
  useEffect(() => {
    if (formData.label && !formData.name) {
      const name = formData.label
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "");

      setFormData((prev) => ({ ...prev, name }));
    }
  }, [formData.label]);

  const handleInputChange = useCallback(
    (field: keyof FieldFormData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setErrors([]);
    },
    []
  );

  const handleTypeSelect = useCallback((type: FieldType) => {
    setSelectedType(type);
    setFormData((prev) => ({
      ...prev,
      type,
      // Reset type-specific fields
      options: [],
      defaultValue: "",
      minValue: "",
      maxValue: "",
      minLength: "",
      maxLength: "",
      pattern: "",
    }));
    setActiveTab("basic");
  }, []);

  const addOption = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      options: [
        ...prev.options,
        { value: "", label: "", labelGreek: "", isDefault: false },
      ],
    }));
  }, []);

  const updateOption = useCallback(
    (index: number, field: string, value: string | boolean) => {
      setFormData((prev) => ({
        ...prev,
        options: prev.options.map((option, i) =>
          i === index ? { ...option, [field]: value } : option
        ),
      }));
    },
    []
  );

  const removeOption = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: string[] = [];
    const newWarnings: string[] = [];

    // Required field validation
    if (!formData.name.trim()) {
      newErrors.push(
        t("field_name_required", {
          ns: "validation",
          defaultValue: "Field name is required",
        })
      );
    }

    if (!formData.label.trim()) {
      newErrors.push(
        t("field_label_required", {
          ns: "validation",
          defaultValue: "Field label is required",
        })
      );
    }

    // Name format validation
    if (formData.name && !/^[a-z][a-z0-9_]*$/.test(formData.name)) {
      newErrors.push(
        t("invalid_field_name", {
          ns: "validation",
          defaultValue:
            "Field name must start with a letter and contain only lowercase letters, numbers, and underscores",
        })
      );
    }

    // Type-specific validation
    if (
      selectedType === "dropdown" ||
      selectedType === "multiselect" ||
      selectedType === "radio"
    ) {
      if (formData.options.length === 0) {
        newErrors.push(
          t("options_required", {
            ns: "validation",
            defaultValue:
              "At least one option is required for selection fields",
          })
        );
      }

      const emptyOptions = formData.options.filter(
        (opt) => !opt.value.trim() || !opt.label.trim()
      );
      if (emptyOptions.length > 0) {
        newErrors.push(
          t("empty_options_not_allowed", {
            ns: "validation",
            defaultValue: "All options must have both value and label",
          })
        );
      }
    }

    // Greek compliance warnings
    if (showGreekFeatures) {
      if (isGreekSpecificFieldType(selectedType!) && !formData.labelGreek) {
        newWarnings.push(
          t("greek_label_recommended_for_greek_field", {
            ns: "validation",
            defaultValue:
              "Greek label is recommended for Greek-specific fields",
          })
        );
      }

      if (selectedType === "greek_afm" && !formData.unique) {
        newWarnings.push(
          t("afm_should_be_unique", {
            ns: "validation",
            defaultValue: "AFM fields should typically be unique",
          })
        );
      }
    }

    setErrors(newErrors);
    setWarnings(newWarnings);
    return newErrors.length === 0;
  }, [formData, selectedType, t, showGreekFeatures]);

  const handleSave = useCallback(async () => {
    if (!validateForm() || !selectedType) {
      return;
    }

    setLoading(true);

    try {
      // Create field definition
      const fieldDefinition: FieldDefinition = {
        name: formData.name,
        label: formData.label,
        labelGreek: formData.labelGreek || undefined,
        type: selectedType,
        description: formData.description || undefined,
        descriptionGreek: formData.descriptionGreek || undefined,
        helpText: formData.helpText || undefined,
        helpTextGreek: formData.helpTextGreek || undefined,
        required: formData.required,
        unique: formData.unique,
        indexed: formData.indexed,
        searchable: formData.searchable,
        defaultValue: formData.defaultValue || undefined,
        options: formData.options.length > 0 ? formData.options : undefined,
        validation: {
          rules: [],
        },
      };

      // Add type-specific validation
      if (formData.minValue) {
        fieldDefinition.validation!.rules!.push({
          type: "min",
          value: parseFloat(formData.minValue),
          message: `Value must be at least ${formData.minValue}`,
        });
      }

      if (formData.maxValue) {
        fieldDefinition.validation!.rules!.push({
          type: "max",
          value: parseFloat(formData.maxValue),
          message: `Value must be at most ${formData.maxValue}`,
        });
      }

      if (formData.pattern) {
        fieldDefinition.validation!.rules!.push({
          type: "pattern",
          value: formData.pattern,
          message: "Value does not match the required format",
        });
      }

      // TODO: Use actual DynamicEntityManager when integrated with backend
      console.log("Field definition created:", fieldDefinition);

      // Mock successful creation for now - TODO: Fix type alignment
      // const mockField: DynamicField = { ... };

      console.log("Field created successfully:", fieldDefinition.name);
      // onSave?.(mockField); // TODO: Uncomment when types are aligned
    } catch (error) {
      console.error("Failed to create field:", error);
      setErrors([
        error instanceof Error ? error.message : "Failed to create field",
      ]);
    } finally {
      setLoading(false);
    }
  }, [formData, selectedType, validateForm, onSave]);

  const renderFieldTypeSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {t("select_field_type", {
            ns: "fields",
            defaultValue: "Select Field Type",
          })}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("choose_field_type_description", {
            ns: "fields",
            defaultValue:
              "Choose the type of field you want to add to your entity",
          })}
        </p>
      </div>

      {FIELD_CATEGORIES.map((category) => {
        const categoryFields = fieldTypesByCategory[category.value] || [];
        if (categoryFields.length === 0) return null;

        return (
          <div key={category.value}>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center space-x-2">
              <span>
                {language === "el" ? category.labelGreek : category.label}
              </span>
              {category.value === "greek" && (
                <Badge variant="secondary" className="text-xs">
                  <Globe className="w-3 h-3 mr-1" />
                  {t("greek_specific", {
                    ns: "fields",
                    defaultValue: "Greek Specific",
                  })}
                </Badge>
              )}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categoryFields.map((fieldType) => {
                const IconComponent = fieldType.icon;
                const isSelected = selectedType === fieldType.value;

                return (
                  <Card
                    key={fieldType.value}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected
                        ? "ring-2 ring-blue-500 dark:ring-blue-400 bg-blue-50 dark:bg-blue-900/10"
                        : "hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                    onClick={() => handleTypeSelect(fieldType.value)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div
                          className={`p-2 rounded-lg ${
                            fieldType.isGreekSpecific
                              ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                              : fieldType.isPremium
                                ? "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                        >
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {language === "el"
                                ? fieldType.labelGreek
                                : fieldType.label}
                            </h5>
                            {fieldType.isGreekSpecific && (
                              <Shield className="w-3 h-3 text-green-600" />
                            )}
                            {fieldType.isPremium && (
                              <Wand2 className="w-3 h-3 text-purple-600" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {language === "el"
                              ? fieldType.descriptionGreek
                              : fieldType.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderBasicConfiguration = () => (
    <div className="space-y-6">
      {/* Field Names */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="field-label" className="text-sm font-medium">
            {t("field_label", { ns: "fields", defaultValue: "Field Label" })} *
          </Label>
          <Input
            id="field-label"
            value={formData.label}
            onChange={(e) => handleInputChange("label", e.target.value)}
            placeholder={t("e.g. Customer Name", {
              ns: "fields",
              defaultValue: "e.g. Customer Name",
            })}
            className="mt-1"
          />
        </div>

        {showGreekFeatures && (
          <div>
            <Label htmlFor="field-label-greek" className="text-sm font-medium">
              {t("field_label_greek", {
                ns: "fields",
                defaultValue: "Field Label (Greek)",
              })}
            </Label>
            <Input
              id="field-label-greek"
              value={formData.labelGreek}
              onChange={(e) => handleInputChange("labelGreek", e.target.value)}
              placeholder={t("e.g. Όνομα Πελάτη", {
                ns: "fields",
                defaultValue: "e.g. Όνομα Πελάτη",
              })}
              className="mt-1"
            />
          </div>
        )}
      </div>

      {/* Technical Name */}
      <div>
        <Label htmlFor="field-name" className="text-sm font-medium">
          {t("field_name", { ns: "fields", defaultValue: "Field Name" })} *
        </Label>
        <Input
          id="field-name"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          placeholder={t("e.g. customer_name", {
            ns: "fields",
            defaultValue: "e.g. customer_name",
          })}
          className="mt-1 font-mono text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          {t("field_name_help", {
            ns: "fields",
            defaultValue: "Lowercase, letters, numbers, and underscores only",
          })}
        </p>
      </div>

      {/* Descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="field-description" className="text-sm font-medium">
            {t("description", { ns: "common", defaultValue: "Description" })}
          </Label>
          <Input
            id="field-description"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder={t("field_description_placeholder", {
              ns: "fields",
              defaultValue: "Brief description of this field...",
            })}
            className="mt-1"
          />
        </div>

        {showGreekFeatures && (
          <div>
            <Label
              htmlFor="field-description-greek"
              className="text-sm font-medium"
            >
              {t("description_greek", {
                ns: "fields",
                defaultValue: "Description (Greek)",
              })}
            </Label>
            <Input
              id="field-description-greek"
              value={formData.descriptionGreek}
              onChange={(e) =>
                handleInputChange("descriptionGreek", e.target.value)
              }
              placeholder={t("field_description_greek_placeholder", {
                ns: "fields",
                defaultValue: "Σύντομη περιγραφή αυτού του πεδίου...",
              })}
              className="mt-1"
            />
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="field-help" className="text-sm font-medium">
            {t("help_text", { ns: "fields", defaultValue: "Help Text" })}
          </Label>
          <Input
            id="field-help"
            value={formData.helpText}
            onChange={(e) => handleInputChange("helpText", e.target.value)}
            placeholder={t("help_text_placeholder", {
              ns: "fields",
              defaultValue: "Help text shown to users...",
            })}
            className="mt-1"
          />
        </div>

        {showGreekFeatures && (
          <div>
            <Label htmlFor="field-help-greek" className="text-sm font-medium">
              {t("help_text_greek", {
                ns: "fields",
                defaultValue: "Help Text (Greek)",
              })}
            </Label>
            <Input
              id="field-help-greek"
              value={formData.helpTextGreek}
              onChange={(e) =>
                handleInputChange("helpTextGreek", e.target.value)
              }
              placeholder={t("help_text_greek_placeholder", {
                ns: "fields",
                defaultValue:
                  "Κείμενο βοήθειας που εμφανίζεται στους χρήστες...",
              })}
              className="mt-1"
            />
          </div>
        )}
      </div>

      {/* Field Properties */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="required"
            checked={formData.required}
            onChange={(e) => handleInputChange("required", e.target.checked)}
          />
          <Label htmlFor="required" className="text-sm">
            {t("required", { ns: "fields", defaultValue: "Required" })}
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="unique"
            checked={formData.unique}
            onChange={(e) => handleInputChange("unique", e.target.checked)}
          />
          <Label htmlFor="unique" className="text-sm">
            {t("unique", { ns: "fields", defaultValue: "Unique" })}
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="indexed"
            checked={formData.indexed}
            onChange={(e) => handleInputChange("indexed", e.target.checked)}
          />
          <Label htmlFor="indexed" className="text-sm">
            {t("indexed", { ns: "fields", defaultValue: "Indexed" })}
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="searchable"
            checked={formData.searchable}
            onChange={(e) => handleInputChange("searchable", e.target.checked)}
          />
          <Label htmlFor="searchable" className="text-sm">
            {t("searchable", { ns: "fields", defaultValue: "Searchable" })}
          </Label>
        </div>
      </div>
    </div>
  );

  const renderAdvancedConfiguration = () => (
    <div className="space-y-6">
      {/* Default Value */}
      <div>
        <Label htmlFor="default-value" className="text-sm font-medium">
          {t("default_value", { ns: "fields", defaultValue: "Default Value" })}
        </Label>
        <Input
          id="default-value"
          value={formData.defaultValue}
          onChange={(e) => handleInputChange("defaultValue", e.target.value)}
          placeholder={t("default_value_placeholder", {
            ns: "fields",
            defaultValue: "Enter default value...",
          })}
          className="mt-1"
        />
      </div>

      {/* Numeric Constraints */}
      {["number", "decimal", "currency", "percentage"].includes(
        selectedType!
      ) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="min-value" className="text-sm font-medium">
              {t("minimum_value", {
                ns: "fields",
                defaultValue: "Minimum Value",
              })}
            </Label>
            <Input
              id="min-value"
              type="number"
              value={formData.minValue}
              onChange={(e) => handleInputChange("minValue", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="max-value" className="text-sm font-medium">
              {t("maximum_value", {
                ns: "fields",
                defaultValue: "Maximum Value",
              })}
            </Label>
            <Input
              id="max-value"
              type="number"
              value={formData.maxValue}
              onChange={(e) => handleInputChange("maxValue", e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      )}

      {/* Text Constraints */}
      {["text", "textarea", "email", "url"].includes(selectedType!) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="min-length" className="text-sm font-medium">
              {t("minimum_length", {
                ns: "fields",
                defaultValue: "Minimum Length",
              })}
            </Label>
            <Input
              id="min-length"
              type="number"
              value={formData.minLength}
              onChange={(e) => handleInputChange("minLength", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="max-length" className="text-sm font-medium">
              {t("maximum_length", {
                ns: "fields",
                defaultValue: "Maximum Length",
              })}
            </Label>
            <Input
              id="max-length"
              type="number"
              value={formData.maxLength}
              onChange={(e) => handleInputChange("maxLength", e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      )}

      {/* Pattern Validation */}
      {["text", "email", "phone"].includes(selectedType!) && (
        <div>
          <Label htmlFor="pattern" className="text-sm font-medium">
            {t("validation_pattern", {
              ns: "fields",
              defaultValue: "Validation Pattern (Regex)",
            })}
          </Label>
          <Input
            id="pattern"
            value={formData.pattern}
            onChange={(e) => handleInputChange("pattern", e.target.value)}
            placeholder={t("pattern_placeholder", {
              ns: "fields",
              defaultValue: "e.g. ^[A-Z]{2}[0-9]{6}$",
            })}
            className="mt-1 font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            {t("pattern_help", {
              ns: "fields",
              defaultValue: "Regular expression for validation",
            })}
          </p>
        </div>
      )}
    </div>
  );

  const renderOptionsConfiguration = () => {
    if (!["dropdown", "multiselect", "radio", "tags"].includes(selectedType!)) {
      return null;
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            {t("field_options", {
              ns: "fields",
              defaultValue: "Field Options",
            })}
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addOption}
            className="flex items-center space-x-1"
          >
            <Plus className="w-3 h-3" />
            <span>
              {t("add_option", { ns: "fields", defaultValue: "Add Option" })}
            </span>
          </Button>
        </div>

        <div className="space-y-3">
          {formData.options.map((option, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-3">
                <Label className="text-xs text-gray-500">
                  {t("value", { ns: "fields", defaultValue: "Value" })}
                </Label>
                <Input
                  value={option.value}
                  onChange={(e) => updateOption(index, "value", e.target.value)}
                  placeholder="value"
                  className="text-sm"
                />
              </div>
              <div className="col-span-3">
                <Label className="text-xs text-gray-500">
                  {t("label", { ns: "fields", defaultValue: "Label" })}
                </Label>
                <Input
                  value={option.label}
                  onChange={(e) => updateOption(index, "label", e.target.value)}
                  placeholder="Label"
                  className="text-sm"
                />
              </div>
              {showGreekFeatures && (
                <div className="col-span-3">
                  <Label className="text-xs text-gray-500">
                    {t("label_greek", {
                      ns: "fields",
                      defaultValue: "Label (Greek)",
                    })}
                  </Label>
                  <Input
                    value={option.labelGreek}
                    onChange={(e) =>
                      updateOption(index, "labelGreek", e.target.value)
                    }
                    placeholder="Ετικέτα"
                    className="text-sm"
                  />
                </div>
              )}
              <div
                className={`${
                  showGreekFeatures ? "col-span-2" : "col-span-5"
                } flex items-center space-x-2`}
              >
                <label className="flex items-center space-x-1 text-xs text-gray-500">
                  <input
                    type="checkbox"
                    checked={option.isDefault}
                    onChange={(e) =>
                      updateOption(index, "isDefault", e.target.checked)
                    }
                    className="rounded border-gray-300"
                  />
                  <span>
                    {t("default", { ns: "fields", defaultValue: "Default" })}
                  </span>
                </label>
              </div>
              <div className="col-span-1 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOption(index)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {formData.options.length === 0 && (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            <Type className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {t("no_options_yet", {
                ns: "fields",
                defaultValue: "No options added yet",
              })}
            </p>
            <p className="text-xs">
              {t("click_add_option", {
                ns: "fields",
                defaultValue: 'Click "Add Option" to get started',
              })}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderPreview = () => {
    if (!selectedType) return null;

    const selectedFieldType = fieldTypeOptions.find(
      (ft) => ft.value === selectedType
    );
    if (!selectedFieldType) return null;

    const IconComponent = selectedFieldType.icon;

    return (
      <Card className="bg-gray-50 dark:bg-gray-800/50">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-medium">
              {t("field_preview", {
                ns: "fields",
                defaultValue: "Field Preview",
              })}
            </h4>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Field Type Info */}
            <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-900 rounded-lg border">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                <IconComponent className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {language === "el"
                    ? selectedFieldType.labelGreek
                    : selectedFieldType.label}
                </h5>
                <p className="text-xs text-gray-500">
                  {formData.name ||
                    t("field_name_placeholder", {
                      ns: "fields",
                      defaultValue: "field_name",
                    })}
                </p>
              </div>
              <div className="ml-auto">
                <Badge
                  variant={
                    selectedFieldType.isGreekSpecific ? "default" : "secondary"
                  }
                >
                  {selectedFieldType.isGreekSpecific
                    ? t("greek_compliant", {
                        ns: "fields",
                        defaultValue: "Greek Compliant",
                      })
                    : t("standard_field", {
                        ns: "fields",
                        defaultValue: "Standard Field",
                      })}
                </Badge>
              </div>
            </div>

            {/* Mock Field Render */}
            <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {formData.label ||
                  t("sample_label", {
                    ns: "fields",
                    defaultValue: "Sample Label",
                  })}
                {formData.required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>

              {/* Render different input types */}
              {selectedType === "text" && (
                <Input
                  value={formData.defaultValue}
                  placeholder={
                    formData.helpText ||
                    t("enter_value", {
                      ns: "fields",
                      defaultValue: "Enter value...",
                    })
                  }
                  disabled
                  className="bg-gray-50 dark:bg-gray-800"
                />
              )}

              {selectedType === "textarea" && (
                <textarea
                  value={formData.defaultValue}
                  placeholder={
                    formData.helpText ||
                    t("enter_text", {
                      ns: "fields",
                      defaultValue: "Enter text...",
                    })
                  }
                  disabled
                  className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-800 text-sm resize-none"
                  rows={3}
                />
              )}

              {selectedType === "dropdown" && (
                <select
                  disabled
                  className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-800 text-sm"
                >
                  <option>
                    {t("select_option", {
                      ns: "fields",
                      defaultValue: "Select an option...",
                    })}
                  </option>
                  {formData.options.map((option, index) => (
                    <option key={index} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}

              {selectedType === "boolean" && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    disabled
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formData.helpText ||
                      t("boolean_help", {
                        ns: "fields",
                        defaultValue: "Enable this option",
                      })}
                  </span>
                </div>
              )}

              {formData.helpText && (
                <p className="text-xs text-gray-500 mt-1">
                  {formData.helpText}
                </p>
              )}
            </div>

            {/* Field Properties Summary */}
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex flex-wrap gap-2">
                {formData.required && (
                  <Badge variant="outline" className="text-xs">
                    {t("required", { ns: "fields", defaultValue: "Required" })}
                  </Badge>
                )}
                {formData.unique && (
                  <Badge variant="outline" className="text-xs">
                    {t("unique", { ns: "fields", defaultValue: "Unique" })}
                  </Badge>
                )}
                {formData.indexed && (
                  <Badge variant="outline" className="text-xs">
                    {t("indexed", { ns: "fields", defaultValue: "Indexed" })}
                  </Badge>
                )}
                {formData.searchable && (
                  <Badge variant="outline" className="text-xs">
                    {t("searchable", {
                      ns: "fields",
                      defaultValue: "Searchable",
                    })}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {fieldId
              ? t("edit_field", { ns: "fields", defaultValue: "Edit Field" })
              : t("create_new_field", {
                  ns: "fields",
                  defaultValue: "Create New Field",
                })}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {selectedType
              ? `${t("configuring", {
                  ns: "fields",
                  defaultValue: "Configuring",
                })} ${getFieldTypeLabel(selectedType, language)} ${t("field", {
                  ns: "fields",
                  defaultValue: "field",
                })}`
              : t("field_builder_description", {
                  ns: "fields",
                  defaultValue:
                    "Add custom fields to capture the data you need for your business",
                })}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {selectedType && (
            <Button
              variant="outline"
              onClick={() => setPreviewMode(!previewMode)}
              className="flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>
                {t("preview", { ns: "common", defaultValue: "Preview" })}
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* Error and Warning Messages */}
      {errors.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                  {t("validation_errors", {
                    ns: "validation",
                    defaultValue: "Validation Errors",
                  })}
                </h4>
                <ul className="mt-1 text-sm text-red-700 dark:text-red-300">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {warnings.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/10">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  {t("warnings", {
                    ns: "validation",
                    defaultValue: "Warnings",
                  })}
                </h4>
                <ul className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                  {warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {!selectedType ? (
            renderFieldTypeSelection()
          ) : (
            <Card>
              <CardHeader>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic">
                      {t("basic", { ns: "common", defaultValue: "Basic" })}
                    </TabsTrigger>
                    <TabsTrigger value="advanced">
                      {t("advanced", {
                        ns: "common",
                        defaultValue: "Advanced",
                      })}
                    </TabsTrigger>
                    <TabsTrigger
                      value="options"
                      disabled={
                        !["dropdown", "multiselect", "radio", "tags"].includes(
                          selectedType
                        )
                      }
                    >
                      {t("options", { ns: "fields", defaultValue: "Options" })}
                    </TabsTrigger>
                    <TabsTrigger value="permissions">
                      {t("permissions", {
                        ns: "common",
                        defaultValue: "Permissions",
                      })}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab}>
                  <TabsContent value="basic">
                    {renderBasicConfiguration()}
                  </TabsContent>
                  <TabsContent value="advanced">
                    {renderAdvancedConfiguration()}
                  </TabsContent>
                  <TabsContent value="options">
                    {renderOptionsConfiguration()}
                  </TabsContent>
                  <TabsContent value="permissions">
                    <div className="text-center py-8 text-gray-500">
                      <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>
                        {t("permissions_coming_soon", {
                          ns: "fields",
                          defaultValue: "Permissions configuration coming soon",
                        })}
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-1">{selectedType && renderPreview()}</div>
      </div>

      {/* Action Buttons */}
      {selectedType && (
        <div className="flex justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setSelectedType(null)}
              className="flex items-center space-x-2"
            >
              <Copy className="w-4 h-4" />
              <span>
                {t("change_type", {
                  ns: "fields",
                  defaultValue: "Change Type",
                })}
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>
                {t("cancel", { ns: "common", defaultValue: "Cancel" })}
              </span>
            </Button>
          </div>

          <LoadingButton
            onClick={handleSave}
            loading={loading}
            disabled={loading || errors.length > 0}
            className="flex items-center space-x-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>
              {fieldId
                ? t("update_field", {
                    ns: "fields",
                    defaultValue: "Update Field",
                  })
                : t("create_field", {
                    ns: "fields",
                    defaultValue: "Create Field",
                  })}
            </span>
          </LoadingButton>
        </div>
      )}
    </div>
  );
};
