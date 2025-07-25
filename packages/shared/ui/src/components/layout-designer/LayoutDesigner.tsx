"use client";

import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
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
  Separator,
} from "../..";
import { useTranslation } from "../../contexts/TranslationContext";
import {
  DynamicEntity,
  DynamicField,
  EntityLayout,
  LayoutType,
  LayoutSection,
  LayoutField,
  LAYOUT_TYPES,
  getLayoutTypeLabel,
  isGreekSpecificFieldType,
} from "@erp/dynamic-entities";
import {
  Layout,
  Grip,
  Plus,
  Trash2,
  Edit,
  Eye,
  Settings,
  Smartphone,
  Tablet,
  Monitor,
  Columns,
  ChevronDown,
  ChevronRight,
  Move,
  Copy,
  Save,
  X,
  AlertCircle,
  Info,
  Palette,
  Grid,
  Layers,
  FileText,
  Calendar,
  BarChart,
  Globe,
  Shield,
  CheckCircle,
} from "lucide-react";

export interface LayoutDesignerProps {
  entity: DynamicEntity;
  layoutId?: string;
  layoutType: LayoutType;
  initialLayout?: EntityLayout;
  onSave?: (layout: EntityLayout) => void;
  onCancel?: () => void;
  showGreekFeatures?: boolean;
  className?: string;
}

interface LayoutFormData {
  name: string;
  nameGreek: string;
  type: LayoutType;
  isDefault: boolean;
  isGreekOptimized: boolean;
  columns: number;
  spacing: "compact" | "normal" | "spacious";
  showSectionHeaders: boolean;
  showFieldLabels: boolean;
  enableDragAndDrop: boolean;
  enableInlineEditing: boolean;
  theme: "light" | "dark" | "auto" | "greek_traditional";
}

interface DragState {
  isDragging: boolean;
  draggedItem: {
    type: "field" | "section";
    id: string;
    sourceSection?: string;
  } | null;
  dragOverSection: string | null;
  dragOverPosition: number | null;
}

const LAYOUT_THEMES = [
  {
    value: "light",
    label: "Light",
    labelGreek: "Φωτεινό",
    description: "Clean light theme",
    descriptionGreek: "Καθαρό φωτεινό θέμα",
  },
  {
    value: "dark",
    label: "Dark",
    labelGreek: "Σκούρο",
    description: "Modern dark theme",
    descriptionGreek: "Μοντέρνο σκούρο θέμα",
  },
  {
    value: "auto",
    label: "Auto",
    labelGreek: "Αυτόματο",
    description: "Follows system preference",
    descriptionGreek: "Ακολουθεί τις προτιμήσεις συστήματος",
  },
  {
    value: "greek_traditional",
    label: "Greek Traditional",
    labelGreek: "Ελληνικό Παραδοσιακό",
    description: "Traditional Greek business theme",
    descriptionGreek: "Παραδοσιακό ελληνικό επιχειρηματικό θέμα",
  },
];

const SPACING_OPTIONS = [
  { value: "compact", label: "Compact", labelGreek: "Συμπαγές" },
  { value: "normal", label: "Normal", labelGreek: "Κανονικό" },
  { value: "spacious", label: "Spacious", labelGreek: "Ευρύχωρο" },
];

const RESPONSIVE_BREAKPOINTS = [
  {
    key: "mobile",
    label: "Mobile",
    labelGreek: "Κινητό",
    icon: Smartphone,
    width: "320px",
  },
  {
    key: "tablet",
    label: "Tablet",
    labelGreek: "Tablet",
    icon: Tablet,
    width: "768px",
  },
  {
    key: "desktop",
    label: "Desktop",
    labelGreek: "Desktop",
    icon: Monitor,
    width: "1024px",
  },
  {
    key: "largeDesktop",
    label: "Large Desktop",
    labelGreek: "Μεγάλο Desktop",
    icon: Monitor,
    width: "1440px",
  },
];

const LAYOUT_TEMPLATES = [
  {
    id: "standard_form",
    name: "Standard Form",
    nameGreek: "Τυπική Φόρμα",
    type: "form" as LayoutType,
    icon: FileText,
    description: "Two-column form layout with sections",
    descriptionGreek: "Διάταξη φόρμας δύο στηλών με ενότητες",
    sections: [
      {
        name: "General Information",
        nameGreek: "Γενικές Πληροφορίες",
        columns: 2,
        order: 1,
      },
      {
        name: "Contact Details",
        nameGreek: "Στοιχεία Επικοινωνίας",
        columns: 2,
        order: 2,
      },
      {
        name: "Additional Information",
        nameGreek: "Επιπλέον Πληροφορίες",
        columns: 1,
        order: 3,
      },
    ],
  },
  {
    id: "single_column",
    name: "Single Column",
    nameGreek: "Μία Στήλη",
    type: "form" as LayoutType,
    icon: Layout,
    description: "Simple single-column layout",
    descriptionGreek: "Απλή διάταξη μίας στήλης",
    sections: [
      { name: "Information", nameGreek: "Πληροφορίες", columns: 1, order: 1 },
    ],
  },
  {
    id: "greek_invoice",
    name: "Greek Invoice Layout",
    nameGreek: "Διάταξη Ελληνικού Τιμολογίου",
    type: "greek_invoice" as LayoutType,
    icon: Shield,
    description: "AADE-compliant invoice layout",
    descriptionGreek: "Διάταξη τιμολογίου συμβατή με AADE",
    sections: [
      {
        name: "Invoice Header",
        nameGreek: "Κεφαλίδα Τιμολογίου",
        columns: 2,
        order: 1,
      },
      {
        name: "Customer Information",
        nameGreek: "Στοιχεία Πελάτη",
        columns: 2,
        order: 2,
      },
      {
        name: "Invoice Items",
        nameGreek: "Είδη Τιμολογίου",
        columns: 1,
        order: 3,
      },
      {
        name: "Tax Summary",
        nameGreek: "Φορολογική Περίληψη",
        columns: 2,
        order: 4,
      },
    ],
  },
  {
    id: "dashboard_layout",
    name: "Dashboard Layout",
    nameGreek: "Διάταξη Dashboard",
    type: "detail" as LayoutType,
    icon: BarChart,
    description: "Multi-section dashboard view",
    descriptionGreek: "Προβολή dashboard πολλαπλών ενοτήτων",
    sections: [
      {
        name: "Key Metrics",
        nameGreek: "Βασικά Μετρήματα",
        columns: 3,
        order: 1,
      },
      {
        name: "Recent Activity",
        nameGreek: "Πρόσφατη Δραστηριότητα",
        columns: 2,
        order: 2,
      },
      { name: "Details", nameGreek: "Λεπτομέρειες", columns: 1, order: 3 },
    ],
  },
];

export const LayoutDesigner: React.FC<LayoutDesignerProps> = ({
  entity,
  layoutId,
  layoutType,
  initialLayout,
  onSave,
  onCancel,
  showGreekFeatures = true,
  className = "",
}) => {
  const { t, language } = useTranslation();
  const dragRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<LayoutFormData>({
    name: initialLayout?.name || "",
    nameGreek: initialLayout?.nameGreek || "",
    type: initialLayout?.type || layoutType,
    isDefault: initialLayout?.isDefault || false,
    isGreekOptimized: initialLayout?.isGreekOptimized || false,
    columns: initialLayout?.configuration.columns || 2,
    spacing: initialLayout?.configuration.spacing || "normal",
    showSectionHeaders: initialLayout?.configuration.showSectionHeaders ?? true,
    showFieldLabels: initialLayout?.configuration.showFieldLabels ?? true,
    enableDragAndDrop: initialLayout?.configuration.enableDragAndDrop ?? true,
    enableInlineEditing:
      initialLayout?.configuration.enableInlineEditing ?? false,
    theme: initialLayout?.configuration.theme || "light",
  });

  const [sections, setSections] = useState<LayoutSection[]>(
    initialLayout?.sections || []
  );

  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("design");
  const [activeBreakpoint, setActiveBreakpoint] = useState("desktop");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set()
  );
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedItem: null,
    dragOverSection: null,
    dragOverPosition: null,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState(false);

  // Available fields that haven't been used in the layout yet
  const availableFields = useMemo(() => {
    const usedFieldIds = new Set(
      sections.flatMap((section) =>
        section.fields.map((field) => field.fieldId)
      )
    );
    return entity.fields.filter((field) => !usedFieldIds.has(field.id));
  }, [entity.fields, sections]);

  const handleInputChange = useCallback(
    (field: keyof LayoutFormData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setErrors([]);
    },
    []
  );

  const addSection = useCallback(
    (template?: { name: string; nameGreek: string; columns: number }) => {
      const newSection: LayoutSection = {
        id: `section_${Date.now()}`,
        name: template?.name || "New Section",
        nameGreek: template?.nameGreek || "Νέα Ενότητα",
        order: sections.length + 1,
        columns: template?.columns || formData.columns,
        isCollapsible: true,
        isCollapsed: false,
        fields: [],
        customSettings: {},
      };

      setSections((prev) => [...prev, newSection]);
      setSelectedSection(newSection.id);
    },
    [sections.length, formData.columns]
  );

  const updateSection = useCallback(
    (sectionId: string, updates: Partial<LayoutSection>) => {
      setSections((prev) =>
        prev.map((section) =>
          section.id === sectionId ? { ...section, ...updates } : section
        )
      );
    },
    []
  );

  const deleteSection = useCallback(
    (sectionId: string) => {
      setSections((prev) => prev.filter((section) => section.id !== sectionId));
      if (selectedSection === sectionId) {
        setSelectedSection(null);
      }
    },
    [selectedSection]
  );

  const addFieldToSection = useCallback(
    (sectionId: string, fieldId: string) => {
      const field = entity.fields.find((f) => f.id === fieldId);
      if (!field) return;

      const layoutField: LayoutField = {
        fieldId: fieldId,
        order: 0, // Will be updated based on position
        isVisible: true,
        isReadonly: false,
        displaySettings: {
          width: "medium",
          alignment: "left",
          labelPosition: "top",
          showBorder: true,
          showBackground: false,
        },
      };

      setSections((prev) =>
        prev.map((section) => {
          if (section.id === sectionId) {
            const newFields = [...section.fields, layoutField];
            // Update order based on position
            newFields.forEach((field, index) => {
              field.order = index + 1;
            });
            return { ...section, fields: newFields };
          }
          return section;
        })
      );
    },
    [entity.fields]
  );

  const removeFieldFromSection = useCallback(
    (sectionId: string, fieldId: string) => {
      setSections((prev) =>
        prev.map((section) => {
          if (section.id === sectionId) {
            const newFields = section.fields.filter(
              (field) => field.fieldId !== fieldId
            );
            // Update order
            newFields.forEach((field, index) => {
              field.order = index + 1;
            });
            return { ...section, fields: newFields };
          }
          return section;
        })
      );
    },
    []
  );

  const applyTemplate = useCallback(
    (template: (typeof LAYOUT_TEMPLATES)[0]) => {
      setFormData((prev) => ({
        ...prev,
        name: template.name,
        nameGreek: template.nameGreek,
        type: template.type,
      }));

      const newSections: LayoutSection[] = template.sections.map(
        (sectionTemplate, index) => ({
          id: `section_${Date.now()}_${index}`,
          name: sectionTemplate.name,
          nameGreek: sectionTemplate.nameGreek,
          order: sectionTemplate.order,
          columns: sectionTemplate.columns,
          isCollapsible: true,
          isCollapsed: false,
          fields: [],
          customSettings: {},
        })
      );

      setSections(newSections);
      setSelectedSection(newSections[0]?.id || null);
    },
    []
  );

  const toggleSectionCollapse = useCallback((sectionId: string) => {
    setCollapsedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  // Drag and Drop handlers
  const handleDragStart = useCallback(
    (
      e: React.DragEvent,
      type: "field" | "section",
      id: string,
      sourceSection?: string
    ) => {
      setDragState({
        isDragging: true,
        draggedItem: { type, id, sourceSection },
        dragOverSection: null,
        dragOverPosition: null,
      });

      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", ""); // For Firefox
    },
    []
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, sectionId: string, position?: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      setDragState((prev) => ({
        ...prev,
        dragOverSection: sectionId,
        dragOverPosition: position ?? null,
      }));
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, targetSectionId: string, position?: number) => {
      e.preventDefault();

      const { draggedItem } = dragState;
      if (!draggedItem) return;

      if (draggedItem.type === "field") {
        if (draggedItem.sourceSection) {
          // Moving from another section
          removeFieldFromSection(draggedItem.sourceSection, draggedItem.id);
        }
        addFieldToSection(targetSectionId, draggedItem.id);
      }

      setDragState({
        isDragging: false,
        draggedItem: null,
        dragOverSection: null,
        dragOverPosition: null,
      });
    },
    [dragState, addFieldToSection, removeFieldFromSection]
  );

  const validateLayout = useCallback((): boolean => {
    const newErrors: string[] = [];
    const newWarnings: string[] = [];

    // Required field validation
    if (!formData.name.trim()) {
      newErrors.push(
        t("layout_name_required", {
          ns: "validation",
          defaultValue: "Layout name is required",
        })
      );
    }

    // Section validation
    if (sections.length === 0) {
      newErrors.push(
        t("at_least_one_section_required", {
          ns: "validation",
          defaultValue: "At least one section is required",
        })
      );
    }

    // Field validation
    const totalFields = sections.reduce(
      (sum, section) => sum + section.fields.length,
      0
    );
    if (totalFields === 0) {
      newWarnings.push(
        t("no_fields_in_layout", {
          ns: "validation",
          defaultValue: "No fields have been added to the layout",
        })
      );
    }

    // Greek compliance warnings
    if (showGreekFeatures) {
      if (formData.isGreekOptimized && !formData.nameGreek) {
        newWarnings.push(
          t("greek_name_recommended_for_optimized", {
            ns: "validation",
            defaultValue:
              "Greek name is recommended for Greek-optimized layouts",
          })
        );
      }

      if (formData.type === "greek_invoice" && sections.length < 3) {
        newWarnings.push(
          t("greek_invoice_needs_sections", {
            ns: "validation",
            defaultValue:
              "Greek invoice layouts should have at least 3 sections",
          })
        );
      }
    }

    setErrors(newErrors);
    setWarnings(newWarnings);
    return newErrors.length === 0;
  }, [formData, sections, t, showGreekFeatures]);

  const handleSave = useCallback(async () => {
    if (!validateLayout()) {
      return;
    }

    setLoading(true);

    try {
      const layout: EntityLayout = {
        id: layoutId || `layout_${Date.now()}`,
        entityId: entity.id,
        name: formData.name,
        nameGreek: formData.nameGreek || undefined,
        type: formData.type,
        isDefault: formData.isDefault,
        isGreekOptimized: formData.isGreekOptimized,
        configuration: {
          columns: formData.columns,
          spacing: formData.spacing,
          showSectionHeaders: formData.showSectionHeaders,
          showFieldLabels: formData.showFieldLabels,
          enableDragAndDrop: formData.enableDragAndDrop,
          enableInlineEditing: formData.enableInlineEditing,
          theme: formData.theme,
        },
        sections: sections,
        permissions: [
          {
            role: "admin",
            canView: true,
            canEdit: true,
            canCustomize: true,
          },
        ],
        responsiveSettings: {
          mobile: { columnsPerRow: 1, hideFields: [], collapsesSections: [] },
          tablet: { columnsPerRow: 2, hideFields: [], collapsesSections: [] },
          desktop: {
            columnsPerRow: formData.columns,
            hideFields: [],
            collapsesSections: [],
          },
          largeDesktop: {
            columnsPerRow: formData.columns,
            hideFields: [],
            collapsesSections: [],
          },
        },
        customSettings: {},
        version: "1.0.0",
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "system",
      };

      console.log("Layout created successfully:", layout.name);
      onSave?.(layout);
    } catch (error) {
      console.error("Failed to create layout:", error);
      setErrors([
        error instanceof Error ? error.message : "Failed to create layout",
      ]);
    } finally {
      setLoading(false);
    }
  }, [formData, sections, validateLayout, onSave, layoutId, entity.id]);

  const renderTemplateSelection = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {t("choose_layout_template", {
            ns: "layouts",
            defaultValue: "Choose Layout Template",
          })}
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("template_description", {
            ns: "layouts",
            defaultValue:
              "Start with a pre-built template or create from scratch",
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {LAYOUT_TEMPLATES.filter(
          (template) =>
            template.type === layoutType ||
            (layoutType === "form" &&
              ["form", "detail"].includes(template.type))
        ).map((template) => {
          const IconComponent = template.icon;

          return (
            <Card
              key={template.id}
              className="cursor-pointer transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600"
              onClick={() => applyTemplate(template)}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {language === "el" ? template.nameGreek : template.name}
                    </h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {language === "el"
                        ? template.descriptionGreek
                        : template.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {template.sections.map((section, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {language === "el" ? section.nameGreek : section.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Blank Template */}
        <Card
          className="cursor-pointer transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600"
          onClick={() => addSection()}
        >
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                <Plus className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {t("blank_layout", {
                    ns: "layouts",
                    defaultValue: "Blank Layout",
                  })}
                </h5>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t("blank_layout_description", {
                    ns: "layouts",
                    defaultValue:
                      "Start with an empty layout and build from scratch",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderDesignTab = () => (
    <div className="space-y-6">
      {/* Layout Configuration */}
      <Card>
        <CardHeader>
          <h4 className="text-lg font-medium flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>
              {t("layout_configuration", {
                ns: "layouts",
                defaultValue: "Layout Configuration",
              })}
            </span>
          </h4>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="layout-name" className="text-sm font-medium">
                {t("layout_name", {
                  ns: "layouts",
                  defaultValue: "Layout Name",
                })}{" "}
                *
              </Label>
              <Input
                id="layout-name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder={t("e.g. Customer Form", {
                  ns: "layouts",
                  defaultValue: "e.g. Customer Form",
                })}
                className="mt-1"
              />
            </div>

            {showGreekFeatures && (
              <div>
                <Label
                  htmlFor="layout-name-greek"
                  className="text-sm font-medium"
                >
                  {t("layout_name_greek", {
                    ns: "layouts",
                    defaultValue: "Layout Name (Greek)",
                  })}
                </Label>
                <Input
                  id="layout-name-greek"
                  value={formData.nameGreek}
                  onChange={(e) =>
                    handleInputChange("nameGreek", e.target.value)
                  }
                  placeholder={t("e.g. Φόρμα Πελάτη", {
                    ns: "layouts",
                    defaultValue: "e.g. Φόρμα Πελάτη",
                  })}
                  className="mt-1"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium">
                {t("columns", { ns: "layouts", defaultValue: "Columns" })}
              </Label>
              <Select
                value={formData.columns.toString()}
                onValueChange={(value) =>
                  handleInputChange("columns", parseInt(value))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Column</SelectItem>
                  <SelectItem value="2">2 Columns</SelectItem>
                  <SelectItem value="3">3 Columns</SelectItem>
                  <SelectItem value="4">4 Columns</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">
                {t("spacing", { ns: "layouts", defaultValue: "Spacing" })}
              </Label>
              <Select
                value={formData.spacing}
                onValueChange={(value: any) =>
                  handleInputChange("spacing", value)
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPACING_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {language === "el" ? option.labelGreek : option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">
                {t("theme", { ns: "layouts", defaultValue: "Theme" })}
              </Label>
              <Select
                value={formData.theme}
                onValueChange={(value: any) =>
                  handleInputChange("theme", value)
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LAYOUT_THEMES.map((theme) => (
                    <SelectItem key={theme.value} value={theme.value}>
                      <div>
                        <div className="font-medium">
                          {language === "el" ? theme.labelGreek : theme.label}
                        </div>
                        <div className="text-xs text-gray-500">
                          {language === "el"
                            ? theme.descriptionGreek
                            : theme.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Layout Options */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="default-layout"
                checked={formData.isDefault}
                onChange={(e) =>
                  handleInputChange("isDefault", e.target.checked)
                }
              />
              <Label htmlFor="default-layout" className="text-sm">
                {t("default_layout", {
                  ns: "layouts",
                  defaultValue: "Default Layout",
                })}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="show-headers"
                checked={formData.showSectionHeaders}
                onChange={(e) =>
                  handleInputChange("showSectionHeaders", e.target.checked)
                }
              />
              <Label htmlFor="show-headers" className="text-sm">
                {t("show_section_headers", {
                  ns: "layouts",
                  defaultValue: "Section Headers",
                })}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="show-labels"
                checked={formData.showFieldLabels}
                onChange={(e) =>
                  handleInputChange("showFieldLabels", e.target.checked)
                }
              />
              <Label htmlFor="show-labels" className="text-sm">
                {t("show_field_labels", {
                  ns: "layouts",
                  defaultValue: "Field Labels",
                })}
              </Label>
            </div>

            {showGreekFeatures && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="greek-optimized"
                  checked={formData.isGreekOptimized}
                  onChange={(e) =>
                    handleInputChange("isGreekOptimized", e.target.checked)
                  }
                />
                <Label htmlFor="greek-optimized" className="text-sm">
                  {t("greek_optimized", {
                    ns: "layouts",
                    defaultValue: "Greek Optimized",
                  })}
                </Label>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sections Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium flex items-center space-x-2">
              <Layers className="w-5 h-5 text-green-600" />
              <span>
                {t("layout_sections", {
                  ns: "layouts",
                  defaultValue: "Layout Sections",
                })}
              </span>
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => addSection()}
              className="flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>
                {t("add_section", {
                  ns: "layouts",
                  defaultValue: "Add Section",
                })}
              </span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sections.map((section) => {
              const isCollapsed = collapsedSections.has(section.id);
              const isSelected = selectedSection === section.id;

              return (
                <Card
                  key={section.id}
                  className={`transition-all ${
                    isSelected
                      ? "ring-2 ring-blue-500 dark:ring-blue-400 bg-blue-50 dark:bg-blue-900/10"
                      : "hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <CardHeader
                    className="p-3 cursor-pointer"
                    onClick={() => setSelectedSection(section.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSectionCollapse(section.id);
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {isCollapsed ? (
                            <ChevronRight className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                        <Grip className="w-4 h-4 text-gray-400" />
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {language === "el" && section.nameGreek
                              ? section.nameGreek
                              : section.name}
                          </h5>
                          <p className="text-xs text-gray-500">
                            {section.fields.length}{" "}
                            {t("fields", {
                              ns: "layouts",
                              defaultValue: "fields",
                            })}{" "}
                            •{section.columns}{" "}
                            {t("columns", {
                              ns: "layouts",
                              defaultValue: "columns",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSection(section.id);
                          }}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSection(section.id);
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {!isCollapsed && (
                    <CardContent className="p-3 pt-0">
                      {/* Section Fields */}
                      <div
                        className="space-y-2"
                        onDragOver={(e) => handleDragOver(e, section.id)}
                        onDrop={(e) => handleDrop(e, section.id)}
                      >
                        {section.fields.map((layoutField) => {
                          const field = entity.fields.find(
                            (f) => f.id === layoutField.fieldId
                          );
                          if (!field) return null;

                          return (
                            <div
                              key={layoutField.fieldId}
                              draggable
                              onDragStart={(e) =>
                                handleDragStart(
                                  e,
                                  "field",
                                  layoutField.fieldId,
                                  section.id
                                )
                              }
                              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded border cursor-move hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <div className="flex items-center space-x-2">
                                <Grip className="w-3 h-3 text-gray-400" />
                                <span className="text-sm text-gray-900 dark:text-gray-100">
                                  {language === "el" && field.labelGreek
                                    ? field.labelGreek
                                    : field.label}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {field.type}
                                </Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  removeFieldFromSection(
                                    section.id,
                                    layoutField.fieldId
                                  )
                                }
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          );
                        })}

                        {section.fields.length === 0 && (
                          <div className="text-center py-6 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded">
                            <Layers className="w-6 h-6 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">
                              {t("no_fields_in_section", {
                                ns: "layouts",
                                defaultValue: "No fields in this section",
                              })}
                            </p>
                            <p className="text-xs">
                              {t("drag_fields_here", {
                                ns: "layouts",
                                defaultValue:
                                  "Drag fields here from the right panel",
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}

            {sections.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {t("no_sections_yet", {
                    ns: "layouts",
                    defaultValue: "No sections added yet",
                  })}
                </p>
                <p className="text-xs">
                  {t("click_add_section", {
                    ns: "layouts",
                    defaultValue: 'Click "Add Section" to get started',
                  })}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFieldsTab = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {t("available_fields", {
            ns: "layouts",
            defaultValue: "Available Fields",
          })}
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("drag_fields_description", {
            ns: "layouts",
            defaultValue:
              "Drag and drop fields into sections to build your layout",
          })}
        </p>
      </div>

      <div className="space-y-2">
        {availableFields.map((field) => (
          <div
            key={field.id}
            draggable
            onDragStart={(e) => handleDragStart(e, "field", field.id)}
            className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border cursor-move hover:shadow-md transition-all"
          >
            <div className="flex items-center space-x-3">
              <Grip className="w-4 h-4 text-gray-400" />
              <div>
                <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {language === "el" && field.labelGreek
                    ? field.labelGreek
                    : field.label}
                </h5>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {field.type}
                  </Badge>
                  {field.required && (
                    <Badge variant="secondary" className="text-xs">
                      {t("required", {
                        ns: "fields",
                        defaultValue: "Required",
                      })}
                    </Badge>
                  )}
                  {isGreekSpecificFieldType(field.type) && (
                    <Badge variant="default" className="text-xs">
                      <Globe className="w-3 h-3 mr-1" />
                      {t("greek", { ns: "common", defaultValue: "Greek" })}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500">{field.description}</div>
          </div>
        ))}

        {availableFields.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {t("all_fields_used", {
                ns: "layouts",
                defaultValue: "All fields have been added to the layout",
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const renderResponsiveTab = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {t("responsive_design", {
            ns: "layouts",
            defaultValue: "Responsive Design",
          })}
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("responsive_description", {
            ns: "layouts",
            defaultValue:
              "Configure how your layout appears on different screen sizes",
          })}
        </p>
      </div>

      <div className="flex justify-center space-x-2">
        {RESPONSIVE_BREAKPOINTS.map((breakpoint) => {
          const IconComponent = breakpoint.icon;
          const isActive = activeBreakpoint === breakpoint.key;

          return (
            <Button
              key={breakpoint.key}
              variant={isActive ? "primary" : "outline"}
              size="sm"
              onClick={() => setActiveBreakpoint(breakpoint.key)}
              className="flex items-center space-x-2"
            >
              <IconComponent className="w-4 h-4" />
              <span>
                {language === "el" ? breakpoint.labelGreek : breakpoint.label}
              </span>
            </Button>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            {(() => {
              const breakpoint = RESPONSIVE_BREAKPOINTS.find(
                (bp) => bp.key === activeBreakpoint
              );
              const IconComponent = breakpoint?.icon || Monitor;
              return <IconComponent className="w-5 h-5 text-blue-600" />;
            })()}
            <h4 className="text-lg font-medium">
              {(() => {
                const breakpoint = RESPONSIVE_BREAKPOINTS.find(
                  (bp) => bp.key === activeBreakpoint
                );
                return language === "el"
                  ? breakpoint?.labelGreek
                  : breakpoint?.label;
              })()}{" "}
              {t("settings", { ns: "layouts", defaultValue: "Settings" })}
            </h4>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {t("responsive_settings_coming_soon", {
                ns: "layouts",
                defaultValue: "Responsive settings configuration coming soon",
              })}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPreview = () => (
    <Card className="bg-gray-50 dark:bg-gray-800/50">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Eye className="w-4 h-4 text-blue-600" />
          <h4 className="text-sm font-medium">
            {t("layout_preview", {
              ns: "layouts",
              defaultValue: "Layout Preview",
            })}
          </h4>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Layout Info */}
          <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border">
            <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {formData.name ||
                t("layout_name_placeholder", {
                  ns: "layouts",
                  defaultValue: "Layout Name",
                })}
            </h5>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {getLayoutTypeLabel(formData.type, language)}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {formData.columns}{" "}
                {t("columns", { ns: "layouts", defaultValue: "columns" })}
              </Badge>
              {formData.isGreekOptimized && (
                <Badge variant="default" className="text-xs">
                  <Globe className="w-3 h-3 mr-1" />
                  {t("greek_optimized", {
                    ns: "layouts",
                    defaultValue: "Greek Optimized",
                  })}
                </Badge>
              )}
            </div>
          </div>

          {/* Sections Preview */}
          <div className="space-y-3">
            {sections.map((section) => (
              <div
                key={section.id}
                className="p-3 bg-white dark:bg-gray-900 rounded-lg border"
              >
                {formData.showSectionHeaders && (
                  <h6 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {language === "el" && section.nameGreek
                      ? section.nameGreek
                      : section.name}
                  </h6>
                )}
                <div
                  className={`grid gap-2 ${
                    section.columns === 1
                      ? "grid-cols-1"
                      : section.columns === 2
                        ? "grid-cols-2"
                        : section.columns === 3
                          ? "grid-cols-3"
                          : "grid-cols-4"
                  }`}
                >
                  {section.fields.map((layoutField) => {
                    const field = entity.fields.find(
                      (f) => f.id === layoutField.fieldId
                    );
                    if (!field) return null;

                    return (
                      <div
                        key={layoutField.fieldId}
                        className="p-2 bg-gray-50 dark:bg-gray-800 rounded border"
                      >
                        {formData.showFieldLabels && (
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {language === "el" && field.labelGreek
                              ? field.labelGreek
                              : field.label}
                            {field.required && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </label>
                        )}
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded text-xs flex items-center px-2 text-gray-500">
                          {field.type}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {section.fields.length === 0 && (
                  <div className="text-center py-4 text-gray-400 text-xs">
                    {t("empty_section", {
                      ns: "layouts",
                      defaultValue: "Empty section",
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {sections.length === 0 && (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <Layout className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p className="text-xs">
                {t("no_sections_to_preview", {
                  ns: "layouts",
                  defaultValue: "No sections to preview",
                })}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {layoutId
              ? t("edit_layout", { ns: "layouts", defaultValue: "Edit Layout" })
              : t("create_layout", {
                  ns: "layouts",
                  defaultValue: "Create Layout",
                })}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("layout_designer_description", {
              ns: "layouts",
              defaultValue:
                "Design custom layouts for forms, lists, and detail views with drag-and-drop simplicity",
            })}
          </p>
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

      {/* Template Selection (if no sections) */}
      {sections.length === 0 && !initialLayout && (
        <Card>
          <CardContent className="p-6">{renderTemplateSelection()}</CardContent>
        </Card>
      )}

      {/* Main Content */}
      {(sections.length > 0 || initialLayout) && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="design">
                      {t("design", { ns: "layouts", defaultValue: "Design" })}
                    </TabsTrigger>
                    <TabsTrigger value="fields">
                      {t("fields", { ns: "layouts", defaultValue: "Fields" })}
                    </TabsTrigger>
                    <TabsTrigger value="responsive">
                      {t("responsive", {
                        ns: "layouts",
                        defaultValue: "Responsive",
                      })}
                    </TabsTrigger>
                    <TabsTrigger value="advanced">
                      {t("advanced", {
                        ns: "common",
                        defaultValue: "Advanced",
                      })}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab}>
                  <TabsContent value="design">{renderDesignTab()}</TabsContent>
                  <TabsContent value="fields">{renderFieldsTab()}</TabsContent>
                  <TabsContent value="responsive">
                    {renderResponsiveTab()}
                  </TabsContent>
                  <TabsContent value="advanced">
                    <div className="text-center py-8 text-gray-500">
                      <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>
                        {t("advanced_settings_coming_soon", {
                          ns: "layouts",
                          defaultValue: "Advanced settings coming soon",
                        })}
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-1">{renderPreview()}</div>
        </div>
      )}

      {/* Action Buttons */}
      {(sections.length > 0 || initialLayout) && (
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
              {layoutId
                ? t("update_layout", {
                    ns: "layouts",
                    defaultValue: "Update Layout",
                  })
                : t("create_layout", {
                    ns: "layouts",
                    defaultValue: "Create Layout",
                  })}
            </span>
          </LoadingButton>
        </div>
      )}
    </div>
  );
};
