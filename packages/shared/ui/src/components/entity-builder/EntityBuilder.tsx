"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader } from "../ui/Card";
import { Button, LoadingButton } from "../ui/Button";
import { Input } from "../ui/Input";
import {
  ModernSelect as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/Select";
import { Badge } from "../ui/Badge";
import { useTranslation } from "../../contexts/TranslationContext";
import {
  DynamicEntity,
  EntityDefinition,
  EntityCreationResult,
  createEntityManager,
  ENTITY_CATEGORIES,
  CUSTOMIZATION_LEVELS,
  GREEK_COMPLIANCE_LEVELS,
  getEntityCategoryLabel,
} from "@erp/dynamic-entities";
import {
  Building2,
  Plus,
  Settings,
  Shield,
  Palette,
  Eye,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Info,
  Layers,
  Globe,
} from "lucide-react";

export interface EntityBuilderProps {
  entityId?: string;
  template?: Partial<EntityDefinition>;
  onSave?: (entity: DynamicEntity) => void;
  onCancel?: () => void;
  showGreekFeatures?: boolean;
  allowAdvanced?: boolean;
  className?: string;
}

interface EntityFormData {
  name: string;
  pluralName: string;
  labelSingular: string;
  labelPlural: string;
  labelSingularGreek: string;
  labelPluralGreek: string;
  icon: string;
  color: string;
  description: string;
  descriptionGreek: string;
  module: string;
  category: string;
  customizationLevel: string;
  aadeReporting: boolean;
  taxRelevant: boolean;
  personalData: boolean;
  complianceLevel: string;
}

const ENTITY_ICONS = [
  { value: "building2", label: "Building", icon: Building2 },
  { value: "users", label: "Users", icon: Building2 },
  { value: "package", label: "Package", icon: Building2 },
  { value: "file-text", label: "Document", icon: Building2 },
  { value: "calendar", label: "Calendar", icon: Building2 },
  { value: "chart-bar", label: "Analytics", icon: Building2 },
  { value: "settings", label: "Settings", icon: Settings },
  { value: "shield", label: "Security", icon: Shield },
];

const ENTITY_COLORS = [
  { value: "#3B82F6", label: "Blue", class: "bg-blue-500" },
  { value: "#10B981", label: "Green", class: "bg-green-500" },
  { value: "#F59E0B", label: "Yellow", class: "bg-yellow-500" },
  { value: "#EF4444", label: "Red", class: "bg-red-500" },
  { value: "#8B5CF6", label: "Purple", class: "bg-purple-500" },
  { value: "#06B6D4", label: "Cyan", class: "bg-cyan-500" },
  { value: "#F97316", label: "Orange", class: "bg-orange-500" },
  { value: "#84CC16", label: "Lime", class: "bg-lime-500" },
];

const MODULES = [
  { value: "crm", label: "CRM", labelGreek: "CRM" },
  { value: "erp", label: "ERP", labelGreek: "ERP" },
  { value: "financial", label: "Financial", labelGreek: "Οικονομικά" },
  { value: "inventory", label: "Inventory", labelGreek: "Αποθέματα" },
  { value: "hr", label: "Human Resources", labelGreek: "Ανθρώπινο Δυναμικό" },
  { value: "custom", label: "Custom", labelGreek: "Προσαρμοσμένο" },
];

export const EntityBuilder: React.FC<EntityBuilderProps> = ({
  entityId,
  template,
  onSave,
  onCancel,
  showGreekFeatures = true,
  allowAdvanced = true,
  className = "",
}) => {
  const { t, language } = useTranslation();
  const [formData, setFormData] = useState<EntityFormData>({
    name: template?.name || "",
    pluralName: template?.pluralName || "",
    labelSingular: template?.labelSingular || "",
    labelPlural: template?.labelPlural || "",
    labelSingularGreek: template?.labelSingularGreek || "",
    labelPluralGreek: template?.labelPluralGreek || "",
    icon: template?.icon || "building2",
    color: template?.color || "#3B82F6",
    description: template?.description || "",
    descriptionGreek: template?.descriptionGreek || "",
    module: template?.module || "custom",
    category: template?.category || "custom",
    customizationLevel: template?.customizationLevel || "custom",
    aadeReporting: template?.greekCompliance?.aadeReporting || false,
    taxRelevant: template?.greekCompliance?.taxRelevant || false,
    personalData: template?.greekCompliance?.personalData || false,
    complianceLevel: template?.greekCompliance?.complianceLevel || "basic",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState(false);

  // Auto-generate plurals when singular changes
  useEffect(() => {
    if (formData.labelSingular && !formData.labelPlural) {
      setFormData((prev) => ({
        ...prev,
        labelPlural: formData.labelSingular.endsWith("s")
          ? formData.labelSingular + "es"
          : formData.labelSingular + "s",
      }));
    }
  }, [formData.labelSingular]);

  // Auto-generate name from label
  useEffect(() => {
    if (formData.labelSingular && !formData.name) {
      const name = formData.labelSingular
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "");

      setFormData((prev) => ({
        ...prev,
        name,
        pluralName: name + "s",
      }));
    }
  }, [formData.labelSingular]);

  const handleInputChange = useCallback(
    (field: keyof EntityFormData, value: string | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setErrors([]);
    },
    []
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: string[] = [];
    const newWarnings: string[] = [];

    // Required field validation
    if (!formData.name.trim()) {
      newErrors.push(
        t("entity_name_required", {
          ns: "validation",
          defaultValue: "Entity name is required",
        })
      );
    }

    if (!formData.labelSingular.trim()) {
      newErrors.push(
        t("singular_label_required", {
          ns: "validation",
          defaultValue: "Singular label is required",
        })
      );
    }

    if (!formData.labelPlural.trim()) {
      newErrors.push(
        t("plural_label_required", {
          ns: "validation",
          defaultValue: "Plural label is required",
        })
      );
    }

    // Name format validation
    if (formData.name && !/^[a-z][a-z0-9_]*$/.test(formData.name)) {
      newErrors.push(
        t("invalid_entity_name", {
          ns: "validation",
          defaultValue:
            "Entity name must start with a letter and contain only lowercase letters, numbers, and underscores",
        })
      );
    }

    // Greek compliance warnings
    if (showGreekFeatures) {
      if (!formData.labelSingularGreek && language === "el") {
        newWarnings.push(
          t("greek_label_recommended", {
            ns: "validation",
            defaultValue:
              "Greek labels are recommended for better localization",
          })
        );
      }

      if (formData.aadeReporting && !formData.taxRelevant) {
        newWarnings.push(
          t("aade_without_tax", {
            ns: "validation",
            defaultValue:
              "AADE reporting is enabled but entity is not marked as tax relevant",
          })
        );
      }

      if (formData.personalData && formData.complianceLevel === "basic") {
        newWarnings.push(
          t("gdpr_requires_advanced", {
            ns: "validation",
            defaultValue:
              "Personal data handling requires advanced compliance level",
          })
        );
      }
    }

    setErrors(newErrors);
    setWarnings(newWarnings);
    return newErrors.length === 0;
  }, [formData, t, language, showGreekFeatures]);

  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const entityManager = createEntityManager();

      const entityDefinition: EntityDefinition = {
        name: formData.name,
        pluralName: formData.pluralName,
        labelSingular: formData.labelSingular,
        labelPlural: formData.labelPlural,
        labelSingularGreek: formData.labelSingularGreek || undefined,
        labelPluralGreek: formData.labelPluralGreek || undefined,
        icon: formData.icon,
        color: formData.color,
        description: formData.description || undefined,
        descriptionGreek: formData.descriptionGreek || undefined,
        module: formData.module,
        category: formData.category as any,
        customizationLevel: formData.customizationLevel as any,
        greekCompliance: showGreekFeatures
          ? {
              aadeReporting: formData.aadeReporting,
              taxRelevant: formData.taxRelevant,
              personalData: formData.personalData,
              complianceLevel: formData.complianceLevel as any,
            }
          : undefined,
      };

      const result: EntityCreationResult =
        await entityManager.createEntity(entityDefinition);

      if (result.warnings.length > 0) {
        setWarnings(result.warnings);
      }

      console.log("Entity created successfully:", result.entity.name);
      onSave?.(result.entity);
    } catch (error) {
      console.error("Failed to create entity:", error);
      setErrors([
        error instanceof Error ? error.message : "Failed to create entity",
      ]);
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, onSave, showGreekFeatures]);

  const selectedIcon = ENTITY_ICONS.find(
    (icon) => icon.value === formData.icon
  );
  const selectedColor = ENTITY_COLORS.find(
    (color) => color.value === formData.color
  );
  const IconComponent = selectedIcon?.icon || Building2;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: formData.color }}
          >
            <IconComponent className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {entityId
                ? t("edit_entity", {
                    ns: "entities",
                    defaultValue: "Edit Entity",
                  })
                : t("create_new_entity", {
                    ns: "entities",
                    defaultValue: "Create New Entity",
                  })}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("entity_builder_description", {
                ns: "entities",
                defaultValue:
                  "Design your custom business entity with fields, layouts, and Greek compliance features",
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-medium">
                {t("basic_information", {
                  ns: "entities",
                  defaultValue: "Basic Information",
                })}
              </h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Entity Names */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("singular_label", {
                    ns: "entities",
                    defaultValue: "Singular Label",
                  })}{" "}
                  *
                </label>
                <Input
                  value={formData.labelSingular}
                  onChange={(e) =>
                    handleInputChange("labelSingular", e.target.value)
                  }
                  placeholder={t("e.g. Customer", {
                    ns: "entities",
                    defaultValue: "e.g. Customer",
                  })}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("plural_label", {
                    ns: "entities",
                    defaultValue: "Plural Label",
                  })}{" "}
                  *
                </label>
                <Input
                  value={formData.labelPlural}
                  onChange={(e) =>
                    handleInputChange("labelPlural", e.target.value)
                  }
                  placeholder={t("e.g. Customers", {
                    ns: "entities",
                    defaultValue: "e.g. Customers",
                  })}
                  className="w-full"
                />
              </div>
            </div>

            {/* Greek Labels */}
            {showGreekFeatures && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("singular_label_greek", {
                      ns: "entities",
                      defaultValue: "Singular Label (Greek)",
                    })}
                  </label>
                  <Input
                    value={formData.labelSingularGreek}
                    onChange={(e) =>
                      handleInputChange("labelSingularGreek", e.target.value)
                    }
                    placeholder={t("e.g. Πελάτης", {
                      ns: "entities",
                      defaultValue: "e.g. Πελάτης",
                    })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("plural_label_greek", {
                      ns: "entities",
                      defaultValue: "Plural Label (Greek)",
                    })}
                  </label>
                  <Input
                    value={formData.labelPluralGreek}
                    onChange={(e) =>
                      handleInputChange("labelPluralGreek", e.target.value)
                    }
                    placeholder={t("e.g. Πελάτες", {
                      ns: "entities",
                      defaultValue: "e.g. Πελάτες",
                    })}
                    className="w-full"
                  />
                </div>
              </div>
            )}

            {/* Technical Names */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("entity_name", {
                    ns: "entities",
                    defaultValue: "Entity Name",
                  })}{" "}
                  *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder={t("e.g. customer", {
                    ns: "entities",
                    defaultValue: "e.g. customer",
                  })}
                  className="w-full font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t("entity_name_help", {
                    ns: "entities",
                    defaultValue:
                      "Lowercase, letters, numbers, and underscores only",
                  })}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("entity_plural_name", {
                    ns: "entities",
                    defaultValue: "Plural Name",
                  })}{" "}
                  *
                </label>
                <Input
                  value={formData.pluralName}
                  onChange={(e) =>
                    handleInputChange("pluralName", e.target.value)
                  }
                  placeholder={t("e.g. customers", {
                    ns: "entities",
                    defaultValue: "e.g. customers",
                  })}
                  className="w-full font-mono text-sm"
                />
              </div>
            </div>

            {/* Descriptions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("description", {
                  ns: "common",
                  defaultValue: "Description",
                })}
              </label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder={t("entity_description_placeholder", {
                  ns: "entities",
                  defaultValue: "Brief description of this entity...",
                })}
                className="w-full"
              />
            </div>

            {showGreekFeatures && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("description_greek", {
                    ns: "entities",
                    defaultValue: "Description (Greek)",
                  })}
                </label>
                <Input
                  value={formData.descriptionGreek}
                  onChange={(e) =>
                    handleInputChange("descriptionGreek", e.target.value)
                  }
                  placeholder={t("entity_description_greek_placeholder", {
                    ns: "entities",
                    defaultValue: "Σύντομη περιγραφή αυτής της οντότητας...",
                  })}
                  className="w-full"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Visual & Classification */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Palette className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-medium">
                {t("visual_classification", {
                  ns: "entities",
                  defaultValue: "Visual & Classification",
                })}
              </h3>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Icon and Color */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("icon", { ns: "entities", defaultValue: "Icon" })}
                </label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) => handleInputChange("icon", value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTITY_ICONS.map((icon) => {
                      const IconComp = icon.icon;
                      return (
                        <SelectItem key={icon.value} value={icon.value}>
                          <div className="flex items-center space-x-2">
                            <IconComp className="w-4 h-4" />
                            <span>{icon.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("color", { ns: "entities", defaultValue: "Color" })}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {ENTITY_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => handleInputChange("color", color.value)}
                      className={`w-10 h-10 rounded-lg ${color.class} ${
                        formData.color === color.value
                          ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-600"
                          : ""
                      }`}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Module and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("module", { ns: "entities", defaultValue: "Module" })}
                </label>
                <Select
                  value={formData.module}
                  onValueChange={(value) => handleInputChange("module", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODULES.map((module) => (
                      <SelectItem key={module.value} value={module.value}>
                        {language === "el" ? module.labelGreek : module.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("category", { ns: "entities", defaultValue: "Category" })}
                </label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    handleInputChange("category", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENTITY_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {language === "el"
                          ? category.labelGreek
                          : category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Customization Level */}
            {allowAdvanced && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("customization_level", {
                    ns: "entities",
                    defaultValue: "Customization Level",
                  })}
                </label>
                <Select
                  value={formData.customizationLevel}
                  onValueChange={(value) =>
                    handleInputChange("customizationLevel", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CUSTOMIZATION_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        <div>
                          <div className="font-medium">
                            {language === "el" ? level.labelGreek : level.label}
                          </div>
                          <div className="text-xs text-gray-500">
                            {language === "el"
                              ? level.descriptionGreek
                              : level.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Greek Compliance Section */}
      {showGreekFeatures && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-medium">
                {t("greek_compliance", {
                  ns: "entities",
                  defaultValue: "Greek Compliance",
                })}
              </h3>
              <Badge variant="secondary" className="text-xs">
                {t("required_for_greek_business", {
                  ns: "entities",
                  defaultValue: "Required for Greek Business",
                })}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Compliance Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("compliance_level", {
                  ns: "entities",
                  defaultValue: "Compliance Level",
                })}
              </label>
              <Select
                value={formData.complianceLevel}
                onValueChange={(value) =>
                  handleInputChange("complianceLevel", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GREEK_COMPLIANCE_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      <div>
                        <div className="font-medium">
                          {language === "el" ? level.labelGreek : level.label}
                        </div>
                        <div className="text-xs text-gray-500">
                          {language === "el"
                            ? level.descriptionGreek
                            : level.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Compliance Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.aadeReporting}
                  onChange={(e) =>
                    handleInputChange("aadeReporting", e.target.checked)
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("aade_reporting", {
                      ns: "entities",
                      defaultValue: "AADE Reporting",
                    })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {t("aade_reporting_help", {
                      ns: "entities",
                      defaultValue: "Automatic tax authority reporting",
                    })}
                  </div>
                </div>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.taxRelevant}
                  onChange={(e) =>
                    handleInputChange("taxRelevant", e.target.checked)
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("tax_relevant", {
                      ns: "entities",
                      defaultValue: "Tax Relevant",
                    })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {t("tax_relevant_help", {
                      ns: "entities",
                      defaultValue: "Affects tax calculations",
                    })}
                  </div>
                </div>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.personalData}
                  onChange={(e) =>
                    handleInputChange("personalData", e.target.checked)
                  }
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("personal_data", {
                      ns: "entities",
                      defaultValue: "Personal Data",
                    })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {t("personal_data_help", {
                      ns: "entities",
                      defaultValue: "GDPR compliance required",
                    })}
                  </div>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex items-center space-x-2"
        >
          <X className="w-4 h-4" />
          <span>{t("cancel", { ns: "common", defaultValue: "Cancel" })}</span>
        </Button>

        <LoadingButton
          onClick={handleSave}
          loading={loading}
          disabled={loading || errors.length > 0}
          className="flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>
            {entityId
              ? t("update_entity", {
                  ns: "entities",
                  defaultValue: "Update Entity",
                })
              : t("create_entity", {
                  ns: "entities",
                  defaultValue: "Create Entity",
                })}
          </span>
        </LoadingButton>
      </div>
    </div>
  );
};
