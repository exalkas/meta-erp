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
  BarChart,
  LineChart,
  PieChart,
  Activity,
  Users,
  DollarSign,
  ShoppingCart,
  Calendar,
  MessageSquare,
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Globe,
  Shield,
  Plus,
  Trash2,
  Edit,
  Eye,
  Settings,
  Grip,
  Copy,
  Save,
  X,
  Layout,
  Layers,
  Palette,
  Monitor,
  Smartphone,
  Tablet,
  AlertCircle,
  Info,
  CheckCircle,
  Zap,
  Database,
  Filter,
  RefreshCw,
} from "lucide-react";

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  titleGreek?: string;
  description?: string;
  descriptionGreek?: string;
  size: WidgetSize;
  position: WidgetPosition;
  configuration: WidgetConfiguration;
  dataSource: WidgetDataSource;
  permissions: WidgetPermissions;
  isGreekSpecific: boolean;
  refreshInterval: number; // in seconds, 0 = no auto-refresh
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  isActive: boolean;
}

export type WidgetType =
  | "metric"
  | "chart_bar"
  | "chart_line"
  | "chart_pie"
  | "chart_doughnut"
  | "table"
  | "list"
  | "calendar"
  | "kanban"
  | "activity_feed"
  | "quick_actions"
  | "recent_items"
  | "progress_tracker"
  | "goal_tracker"
  | "weather"
  | "clock"
  | "iframe"
  | "greek_vat_summary"
  | "greek_tax_calendar"
  | "aade_status"
  | "greek_compliance_checker"
  | "custom_html";

export type WidgetSize =
  | "small" // 1x1
  | "medium" // 2x1
  | "large" // 2x2
  | "wide" // 3x1
  | "tall" // 1x3
  | "extra_large"; // 3x3

export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WidgetConfiguration {
  colors?: string[];
  chartType?: string;
  showLegend?: boolean;
  showLabels?: boolean;
  animationEnabled?: boolean;
  customCSS?: string;
  refreshOnLoad?: boolean;
  autoRefresh?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  borderRadius?: number;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  [key: string]: any;
}

export interface WidgetDataSource {
  type: "api" | "entity" | "static" | "calculated" | "external";
  endpoint?: string;
  entityName?: string;
  filters?: Record<string, any>;
  aggregation?: "count" | "sum" | "avg" | "min" | "max";
  groupBy?: string;
  sortBy?: string;
  limit?: number;
  staticData?: any;
  calculation?: string;
  externalUrl?: string;
}

export interface WidgetPermissions {
  view: string[];
  edit: string[];
  delete: string[];
}

export interface DashboardLayout {
  id: string;
  name: string;
  nameGreek?: string;
  description?: string;
  descriptionGreek?: string;
  widgets: Widget[];
  gridColumns: number;
  gridRows: number;
  isDefault: boolean;
  isGreekOptimized: boolean;
  permissions: WidgetPermissions;
  responsiveBreakpoints: ResponsiveBreakpoints;
  theme: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface ResponsiveBreakpoints {
  mobile: { columns: number; hideWidgets: string[] };
  tablet: { columns: number; hideWidgets: string[] };
  desktop: { columns: number; hideWidgets: string[] };
  largeDesktop: { columns: number; hideWidgets: string[] };
}

export interface WidgetBuilderProps {
  dashboardId?: string;
  widgetId?: string;
  initialWidget?: Partial<Widget>;
  availableEntities?: string[];
  onSave?: (widget: Widget) => void;
  onCancel?: () => void;
  showGreekFeatures?: boolean;
  className?: string;
}

const WIDGET_TYPES = [
  {
    type: "metric" as WidgetType,
    label: "Metric Card",
    labelGreek: "Κάρτα Μετρήματος",
    icon: Activity,
    description: "Display key metrics and KPIs",
    descriptionGreek: "Εμφάνιση βασικών μετρήσεων και KPI",
    category: "data",
    isGreekSpecific: false,
  },
  {
    type: "chart_bar" as WidgetType,
    label: "Bar Chart",
    labelGreek: "Γράφημα Ράβδων",
    icon: BarChart,
    description: "Visualize data with bar charts",
    descriptionGreek: "Οπτικοποίηση δεδομένων με γραφήματα ράβδων",
    category: "charts",
    isGreekSpecific: false,
  },
  {
    type: "chart_line" as WidgetType,
    label: "Line Chart",
    labelGreek: "Γράφημα Γραμμής",
    icon: LineChart,
    description: "Show trends over time",
    descriptionGreek: "Εμφάνιση τάσεων στο χρόνο",
    category: "charts",
    isGreekSpecific: false,
  },
  {
    type: "chart_pie" as WidgetType,
    label: "Pie Chart",
    labelGreek: "Κυκλικό Γράφημα",
    icon: PieChart,
    description: "Display data distribution",
    descriptionGreek: "Εμφάνιση κατανομής δεδομένων",
    category: "charts",
    isGreekSpecific: false,
  },
  {
    type: "table" as WidgetType,
    label: "Data Table",
    labelGreek: "Πίνακας Δεδομένων",
    icon: FileText,
    description: "Display data in table format",
    descriptionGreek: "Εμφάνιση δεδομένων σε μορφή πίνακα",
    category: "data",
    isGreekSpecific: false,
  },
  {
    type: "list" as WidgetType,
    label: "List View",
    labelGreek: "Προβολή Λίστας",
    icon: FileText,
    description: "Simple list of items",
    descriptionGreek: "Απλή λίστα στοιχείων",
    category: "data",
    isGreekSpecific: false,
  },
  {
    type: "calendar" as WidgetType,
    label: "Calendar",
    labelGreek: "Ημερολόγιο",
    icon: Calendar,
    description: "Calendar view for events",
    descriptionGreek: "Προβολή ημερολογίου για γεγονότα",
    category: "productivity",
    isGreekSpecific: false,
  },
  {
    type: "activity_feed" as WidgetType,
    label: "Activity Feed",
    labelGreek: "Ροή Δραστηριότητας",
    icon: MessageSquare,
    description: "Recent activities and updates",
    descriptionGreek: "Πρόσφατες δραστηριότητες και ενημερώσεις",
    category: "productivity",
    isGreekSpecific: false,
  },
  {
    type: "quick_actions" as WidgetType,
    label: "Quick Actions",
    labelGreek: "Γρήγορες Ενέργειες",
    icon: Zap,
    description: "Shortcut buttons for common tasks",
    descriptionGreek: "Κουμπιά συντόμευσης για κοινές εργασίες",
    category: "productivity",
    isGreekSpecific: false,
  },
  {
    type: "progress_tracker" as WidgetType,
    label: "Progress Tracker",
    labelGreek: "Παρακολούθηση Προόδου",
    icon: Target,
    description: "Track progress towards goals",
    descriptionGreek: "Παρακολούθηση προόδου προς στόχους",
    category: "productivity",
    isGreekSpecific: false,
  },

  // Greek-Specific Widgets
  {
    type: "greek_vat_summary" as WidgetType,
    label: "Greek VAT Summary",
    labelGreek: "Περίληψη ΦΠΑ",
    icon: Shield,
    description: "VAT summary for Greek tax compliance",
    descriptionGreek: "Περίληψη ΦΠΑ για ελληνική φορολογική συμμόρφωση",
    category: "greek",
    isGreekSpecific: true,
  },
  {
    type: "greek_tax_calendar" as WidgetType,
    label: "Greek Tax Calendar",
    labelGreek: "Φορολογικό Ημερολόγιο",
    icon: Calendar,
    description: "Important Greek tax dates and deadlines",
    descriptionGreek:
      "Σημαντικές ελληνικές φορολογικές ημερομηνίες και προθεσμίες",
    category: "greek",
    isGreekSpecific: true,
  },
  {
    type: "aade_status" as WidgetType,
    label: "AADE Status",
    labelGreek: "Κατάσταση AADE",
    icon: Globe,
    description: "AADE connection and submission status",
    descriptionGreek: "Κατάσταση σύνδεσης και υποβολής AADE",
    category: "greek",
    isGreekSpecific: true,
  },
  {
    type: "greek_compliance_checker" as WidgetType,
    label: "Compliance Checker",
    labelGreek: "Έλεγχος Συμμόρφωσης",
    icon: CheckCircle,
    description: "Check Greek business compliance status",
    descriptionGreek:
      "Έλεγχος κατάστασης ελληνικής επιχειρηματικής συμμόρφωσης",
    category: "greek",
    isGreekSpecific: true,
  },
];

const WIDGET_CATEGORIES = [
  {
    value: "data",
    label: "Data & Analytics",
    labelGreek: "Δεδομένα & Αναλυτικά",
  },
  { value: "charts", label: "Charts", labelGreek: "Γραφήματα" },
  {
    value: "productivity",
    label: "Productivity",
    labelGreek: "Παραγωγικότητα",
  },
  {
    value: "greek",
    label: "Greek Compliance",
    labelGreek: "Ελληνική Συμμόρφωση",
  },
];

const WIDGET_SIZES = [
  {
    value: "small",
    label: "Small (1x1)",
    labelGreek: "Μικρό (1x1)",
    width: 1,
    height: 1,
  },
  {
    value: "medium",
    label: "Medium (2x1)",
    labelGreek: "Μεσαίο (2x1)",
    width: 2,
    height: 1,
  },
  {
    value: "large",
    label: "Large (2x2)",
    labelGreek: "Μεγάλο (2x2)",
    width: 2,
    height: 2,
  },
  {
    value: "wide",
    label: "Wide (3x1)",
    labelGreek: "Φαρδύ (3x1)",
    width: 3,
    height: 1,
  },
  {
    value: "tall",
    label: "Tall (1x3)",
    labelGreek: "Ψηλό (1x3)",
    width: 1,
    height: 3,
  },
  {
    value: "extra_large",
    label: "Extra Large (3x3)",
    labelGreek: "Πολύ Μεγάλο (3x3)",
    width: 3,
    height: 3,
  },
];

const DATA_SOURCE_TYPES = [
  { value: "entity", label: "Entity Data", labelGreek: "Δεδομένα Οντότητας" },
  { value: "api", label: "API Endpoint", labelGreek: "API Endpoint" },
  { value: "static", label: "Static Data", labelGreek: "Στατικά Δεδομένα" },
  { value: "calculated", label: "Calculated", labelGreek: "Υπολογιζόμενα" },
  { value: "external", label: "External Source", labelGreek: "Εξωτερική Πηγή" },
];

const AGGREGATION_TYPES = [
  { value: "count", label: "Count", labelGreek: "Πλήθος" },
  { value: "sum", label: "Sum", labelGreek: "Άθροισμα" },
  { value: "avg", label: "Average", labelGreek: "Μέσος Όρος" },
  { value: "min", label: "Minimum", labelGreek: "Ελάχιστο" },
  { value: "max", label: "Maximum", labelGreek: "Μέγιστο" },
];

export const WidgetBuilder: React.FC<WidgetBuilderProps> = ({
  dashboardId,
  widgetId,
  initialWidget,
  availableEntities = [],
  onSave,
  onCancel,
  showGreekFeatures = true,
  className = "",
}) => {
  const { t, language } = useTranslation();

  const [selectedType, setSelectedType] = useState<WidgetType | null>(
    initialWidget?.type || null
  );

  const [formData, setFormData] = useState({
    title: initialWidget?.title || "",
    titleGreek: initialWidget?.titleGreek || "",
    description: initialWidget?.description || "",
    descriptionGreek: initialWidget?.descriptionGreek || "",
    size: initialWidget?.size || ("medium" as WidgetSize),
    refreshInterval: initialWidget?.refreshInterval || 0,
    showHeader: true,
    showFooter: false,
    backgroundColor: "#ffffff",
    textColor: "#000000",
    borderRadius: 8,
  });

  const [dataSourceConfig, setDataSourceConfig] = useState({
    type: "entity" as "api" | "entity" | "static" | "calculated" | "external",
    entityName: "",
    endpoint: "",
    filters: {},
    aggregation: "count" as "count" | "sum" | "avg" | "min" | "max",
    groupBy: "",
    sortBy: "",
    limit: 10,
    staticData: "",
  });

  const [activeTab, setActiveTab] = useState("type");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState(false);

  // Filter widget types based on features
  const availableWidgetTypes = useMemo(() => {
    return WIDGET_TYPES.filter((widget) => {
      if (widget.isGreekSpecific && !showGreekFeatures) return false;
      return true;
    });
  }, [showGreekFeatures]);

  // Group widget types by category
  const widgetTypesByCategory = useMemo(() => {
    const grouped: Record<string, typeof WIDGET_TYPES> = {};
    availableWidgetTypes.forEach((widget) => {
      if (!grouped[widget.category]) {
        grouped[widget.category] = [];
      }
      grouped[widget.category].push(widget);
    });
    return grouped;
  }, [availableWidgetTypes]);

  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors([]);
  }, []);

  const handleDataSourceChange = useCallback((field: string, value: any) => {
    setDataSourceConfig((prev) => ({ ...prev, [field]: value }));
    setErrors([]);
  }, []);

  const handleTypeSelect = useCallback((type: WidgetType) => {
    setSelectedType(type);

    // Set sensible defaults based on widget type
    const widgetType = WIDGET_TYPES.find((w) => w.type === type);
    if (widgetType) {
      setFormData((prev) => ({
        ...prev,
        title: widgetType.label,
        titleGreek: widgetType.labelGreek,
        description: widgetType.description,
        descriptionGreek: widgetType.descriptionGreek,
      }));
    }

    setActiveTab("configuration");
  }, []);

  const validateWidget = useCallback((): boolean => {
    const newErrors: string[] = [];
    const newWarnings: string[] = [];

    // Required field validation
    if (!formData.title.trim()) {
      newErrors.push(
        t("widget_title_required", {
          ns: "validation",
          defaultValue: "Widget title is required",
        })
      );
    }

    if (!selectedType) {
      newErrors.push(
        t("widget_type_required", {
          ns: "validation",
          defaultValue: "Widget type is required",
        })
      );
    }

    // Data source validation
    if (dataSourceConfig.type === "entity" && !dataSourceConfig.entityName) {
      newErrors.push(
        t("entity_name_required", {
          ns: "validation",
          defaultValue: "Entity name is required for entity data source",
        })
      );
    }

    if (dataSourceConfig.type === "api" && !dataSourceConfig.endpoint) {
      newErrors.push(
        t("api_endpoint_required", {
          ns: "validation",
          defaultValue: "API endpoint is required for API data source",
        })
      );
    }

    // Greek widget warnings
    if (showGreekFeatures && selectedType?.startsWith("greek_")) {
      if (!formData.titleGreek) {
        newWarnings.push(
          t("greek_title_recommended", {
            ns: "validation",
            defaultValue:
              "Greek title is recommended for Greek-specific widgets",
          })
        );
      }
    }

    setErrors(newErrors);
    setWarnings(newWarnings);
    return newErrors.length === 0;
  }, [formData, selectedType, dataSourceConfig, t, showGreekFeatures]);

  const handleSave = useCallback(async () => {
    if (!validateWidget() || !selectedType) {
      return;
    }

    setLoading(true);

    try {
      const widget: Widget = {
        id: widgetId || `widget_${Date.now()}`,
        type: selectedType,
        title: formData.title,
        titleGreek: formData.titleGreek || undefined,
        description: formData.description || undefined,
        descriptionGreek: formData.descriptionGreek || undefined,
        size: formData.size,
        position: { x: 0, y: 0, width: 2, height: 1 }, // Default position
        configuration: {
          showHeader: formData.showHeader,
          showFooter: formData.showFooter,
          backgroundColor: formData.backgroundColor,
          textColor: formData.textColor,
          borderRadius: formData.borderRadius,
          autoRefresh: formData.refreshInterval > 0,
        },
        dataSource: {
          type: dataSourceConfig.type,
          entityName: dataSourceConfig.entityName || undefined,
          endpoint: dataSourceConfig.endpoint || undefined,
          filters: dataSourceConfig.filters,
          aggregation: dataSourceConfig.aggregation,
          groupBy: dataSourceConfig.groupBy || undefined,
          sortBy: dataSourceConfig.sortBy || undefined,
          limit: dataSourceConfig.limit,
          staticData: dataSourceConfig.staticData || undefined,
        },
        permissions: {
          view: ["admin", "manager", "user"],
          edit: ["admin", "manager"],
          delete: ["admin"],
        },
        isGreekSpecific: selectedType.startsWith("greek_"),
        refreshInterval: formData.refreshInterval,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "system", // TODO: Get from auth context
        isActive: true,
      };

      console.log("Widget created successfully:", widget.title);
      onSave?.(widget);
    } catch (error) {
      console.error("Failed to create widget:", error);
      setErrors([
        error instanceof Error ? error.message : "Failed to create widget",
      ]);
    } finally {
      setLoading(false);
    }
  }, [
    formData,
    selectedType,
    dataSourceConfig,
    validateWidget,
    onSave,
    widgetId,
  ]);

  const renderTypeSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {t("select_widget_type", {
            ns: "widgets",
            defaultValue: "Select Widget Type",
          })}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("choose_widget_type_description", {
            ns: "widgets",
            defaultValue:
              "Choose the type of widget you want to add to your dashboard",
          })}
        </p>
      </div>

      {WIDGET_CATEGORIES.map((category) => {
        const categoryWidgets = widgetTypesByCategory[category.value] || [];
        if (categoryWidgets.length === 0) return null;

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
                    ns: "widgets",
                    defaultValue: "Greek Specific",
                  })}
                </Badge>
              )}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categoryWidgets.map((widget) => {
                const IconComponent = widget.icon;
                const isSelected = selectedType === widget.type;

                return (
                  <Card
                    key={widget.type}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected
                        ? "ring-2 ring-blue-500 dark:ring-blue-400 bg-blue-50 dark:bg-blue-900/10"
                        : "hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                    onClick={() => handleTypeSelect(widget.type)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div
                          className={`p-2 rounded-lg ${
                            widget.isGreekSpecific
                              ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                              : "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                          }`}
                        >
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {language === "el"
                                ? widget.labelGreek
                                : widget.label}
                            </h5>
                            {widget.isGreekSpecific && (
                              <Shield className="w-3 h-3 text-green-600" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {language === "el"
                              ? widget.descriptionGreek
                              : widget.description}
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

  const renderConfiguration = () => (
    <div className="space-y-6">
      {/* Basic Configuration */}
      <Card>
        <CardHeader>
          <h4 className="text-lg font-medium flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>
              {t("basic_configuration", {
                ns: "widgets",
                defaultValue: "Basic Configuration",
              })}
            </span>
          </h4>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Widget Names */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="widget-title" className="text-sm font-medium">
                {t("widget_title", {
                  ns: "widgets",
                  defaultValue: "Widget Title",
                })}{" "}
                *
              </Label>
              <Input
                id="widget-title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder={t("e.g. Sales Overview", {
                  ns: "widgets",
                  defaultValue: "e.g. Sales Overview",
                })}
                className="mt-1"
              />
            </div>

            {showGreekFeatures && (
              <div>
                <Label
                  htmlFor="widget-title-greek"
                  className="text-sm font-medium"
                >
                  {t("widget_title_greek", {
                    ns: "widgets",
                    defaultValue: "Widget Title (Greek)",
                  })}
                </Label>
                <Input
                  id="widget-title-greek"
                  value={formData.titleGreek}
                  onChange={(e) =>
                    handleInputChange("titleGreek", e.target.value)
                  }
                  placeholder={t("e.g. Επισκόπηση Πωλήσεων", {
                    ns: "widgets",
                    defaultValue: "e.g. Επισκόπηση Πωλήσεων",
                  })}
                  className="mt-1"
                />
              </div>
            )}
          </div>

          {/* Widget Size */}
          <div>
            <Label className="text-sm font-medium">
              {t("widget_size", { ns: "widgets", defaultValue: "Widget Size" })}
            </Label>
            <Select
              value={formData.size}
              onValueChange={(value: string) =>
                handleInputChange("size", value as WidgetSize)
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WIDGET_SIZES.map((size) => (
                  <SelectItem key={size.value} value={size.value}>
                    {language === "el" ? size.labelGreek : size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Refresh Interval */}
          <div>
            <Label htmlFor="refresh-interval" className="text-sm font-medium">
              {t("refresh_interval", {
                ns: "widgets",
                defaultValue: "Auto Refresh (seconds)",
              })}
            </Label>
            <Input
              id="refresh-interval"
              type="number"
              min="0"
              value={formData.refreshInterval}
              onChange={(e) =>
                handleInputChange(
                  "refreshInterval",
                  parseInt(e.target.value) || 0
                )
              }
              placeholder="0 = No auto-refresh"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t("refresh_interval_help", {
                ns: "widgets",
                defaultValue: "Set to 0 to disable auto-refresh",
              })}
            </p>
          </div>

          {/* Display Options */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="show-header"
                checked={formData.showHeader}
                onChange={(e) =>
                  handleInputChange("showHeader", e.target.checked)
                }
              />
              <Label htmlFor="show-header" className="text-sm">
                {t("show_header", {
                  ns: "widgets",
                  defaultValue: "Show Header",
                })}
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="show-footer"
                checked={formData.showFooter}
                onChange={(e) =>
                  handleInputChange("showFooter", e.target.checked)
                }
              />
              <Label htmlFor="show-footer" className="text-sm">
                {t("show_footer", {
                  ns: "widgets",
                  defaultValue: "Show Footer",
                })}
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Source Configuration */}
      <Card>
        <CardHeader>
          <h4 className="text-lg font-medium flex items-center space-x-2">
            <Database className="w-5 h-5 text-green-600" />
            <span>
              {t("data_source", { ns: "widgets", defaultValue: "Data Source" })}
            </span>
          </h4>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Data Source Type */}
          <div>
            <Label className="text-sm font-medium">
              {t("data_source_type", {
                ns: "widgets",
                defaultValue: "Data Source Type",
              })}
            </Label>
            <Select
              value={dataSourceConfig.type}
              onValueChange={(value: any) =>
                handleDataSourceChange("type", value)
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATA_SOURCE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {language === "el" ? type.labelGreek : type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Entity Data Source */}
          {dataSourceConfig.type === "entity" && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">
                  {t("entity_name", {
                    ns: "widgets",
                    defaultValue: "Entity Name",
                  })}
                </Label>
                <Select
                  value={dataSourceConfig.entityName}
                  onValueChange={(value) =>
                    handleDataSourceChange("entityName", value)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue
                      placeholder={t("select_entity", {
                        ns: "widgets",
                        defaultValue: "Select entity...",
                      })}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableEntities.map((entity) => (
                      <SelectItem key={entity} value={entity}>
                        {entity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">
                    {t("aggregation", {
                      ns: "widgets",
                      defaultValue: "Aggregation",
                    })}
                  </Label>
                  <Select
                    value={dataSourceConfig.aggregation}
                    onValueChange={(value: any) =>
                      handleDataSourceChange("aggregation", value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AGGREGATION_TYPES.map((agg) => (
                        <SelectItem key={agg.value} value={agg.value}>
                          {language === "el" ? agg.labelGreek : agg.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="limit" className="text-sm font-medium">
                    {t("limit", { ns: "widgets", defaultValue: "Limit" })}
                  </Label>
                  <Input
                    id="limit"
                    type="number"
                    min="1"
                    max="1000"
                    value={dataSourceConfig.limit}
                    onChange={(e) =>
                      handleDataSourceChange(
                        "limit",
                        parseInt(e.target.value) || 10
                      )
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* API Data Source */}
          {dataSourceConfig.type === "api" && (
            <div>
              <Label htmlFor="api-endpoint" className="text-sm font-medium">
                {t("api_endpoint", {
                  ns: "widgets",
                  defaultValue: "API Endpoint",
                })}
              </Label>
              <Input
                id="api-endpoint"
                value={dataSourceConfig.endpoint}
                onChange={(e) =>
                  handleDataSourceChange("endpoint", e.target.value)
                }
                placeholder="/api/v1/entities/customers"
                className="mt-1"
              />
            </div>
          )}

          {/* Static Data Source */}
          {dataSourceConfig.type === "static" && (
            <div>
              <Label htmlFor="static-data" className="text-sm font-medium">
                {t("static_data", {
                  ns: "widgets",
                  defaultValue: "Static Data (JSON)",
                })}
              </Label>
              <textarea
                id="static-data"
                value={dataSourceConfig.staticData}
                onChange={(e) =>
                  handleDataSourceChange("staticData", e.target.value)
                }
                placeholder='{"labels": ["Jan", "Feb", "Mar"], "values": [10, 20, 30]}'
                className="mt-1 w-full p-2 border rounded-md text-sm font-mono"
                rows={4}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderStyling = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h4 className="text-lg font-medium flex items-center space-x-2">
            <Palette className="w-5 h-5 text-purple-600" />
            <span>
              {t("styling_appearance", {
                ns: "widgets",
                defaultValue: "Styling & Appearance",
              })}
            </span>
          </h4>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Colors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bg-color" className="text-sm font-medium">
                {t("background_color", {
                  ns: "widgets",
                  defaultValue: "Background Color",
                })}
              </Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input
                  id="bg-color"
                  type="color"
                  value={formData.backgroundColor}
                  onChange={(e) =>
                    handleInputChange("backgroundColor", e.target.value)
                  }
                  className="w-16 h-8"
                />
                <Input
                  value={formData.backgroundColor}
                  onChange={(e) =>
                    handleInputChange("backgroundColor", e.target.value)
                  }
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="text-color" className="text-sm font-medium">
                {t("text_color", { ns: "widgets", defaultValue: "Text Color" })}
              </Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input
                  id="text-color"
                  type="color"
                  value={formData.textColor}
                  onChange={(e) =>
                    handleInputChange("textColor", e.target.value)
                  }
                  className="w-16 h-8"
                />
                <Input
                  value={formData.textColor}
                  onChange={(e) =>
                    handleInputChange("textColor", e.target.value)
                  }
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Border Radius */}
          <div>
            <Label htmlFor="border-radius" className="text-sm font-medium">
              {t("border_radius", {
                ns: "widgets",
                defaultValue: "Border Radius (px)",
              })}
            </Label>
            <Input
              id="border-radius"
              type="number"
              min="0"
              max="50"
              value={formData.borderRadius}
              onChange={(e) =>
                handleInputChange("borderRadius", parseInt(e.target.value) || 0)
              }
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPreview = () => {
    if (!selectedType) return null;

    const selectedWidget = WIDGET_TYPES.find((w) => w.type === selectedType);
    if (!selectedWidget) return null;

    const IconComponent = selectedWidget.icon;

    return (
      <Card className="bg-gray-50 dark:bg-gray-800/50">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-medium">
              {t("widget_preview", {
                ns: "widgets",
                defaultValue: "Widget Preview",
              })}
            </h4>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Widget Preview */}
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: formData.backgroundColor,
                color: formData.textColor,
                borderRadius: `${formData.borderRadius}px`,
              }}
            >
              {formData.showHeader && (
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex items-center space-x-2">
                    <IconComponent className="w-4 h-4" />
                    <h5 className="text-sm font-medium">
                      {language === "el" && formData.titleGreek
                        ? formData.titleGreek
                        : formData.title}
                    </h5>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                      <RefreshCw className="w-3 h-3" />
                    </button>
                    <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Settings className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              {/* Mock Content */}
              <div className="space-y-2">
                {selectedType === "metric" && (
                  <div className="text-center">
                    <div className="text-2xl font-bold">1,234</div>
                    <div className="text-sm text-gray-500">
                      {formData.description || "Sample Metric"}
                    </div>
                  </div>
                )}

                {selectedType.startsWith("chart_") && (
                  <div className="h-32 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                    <IconComponent className="w-8 h-8 text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">
                      Chart Preview
                    </span>
                  </div>
                )}

                {selectedType === "table" && (
                  <div className="space-y-1">
                    <div className="grid grid-cols-3 gap-2 text-xs font-medium border-b pb-1">
                      <div>Name</div>
                      <div>Value</div>
                      <div>Status</div>
                    </div>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="grid grid-cols-3 gap-2 text-xs">
                        <div>Item {i}</div>
                        <div>${i * 100}</div>
                        <div>
                          <Badge variant="outline" className="text-xs">
                            Active
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedType.startsWith("greek_") && (
                  <div className="text-center p-4 border-2 border-dashed border-green-300 rounded">
                    <Shield className="w-6 h-6 mx-auto mb-2 text-green-600" />
                    <div className="text-sm font-medium text-green-700">
                      {t("greek_widget_preview", {
                        ns: "widgets",
                        defaultValue: "Greek Compliance Widget",
                      })}
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      {language === "el"
                        ? selectedWidget.descriptionGreek
                        : selectedWidget.description}
                    </div>
                  </div>
                )}
              </div>

              {formData.showFooter && (
                <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500">
                  {t("last_updated", {
                    ns: "widgets",
                    defaultValue: "Last updated",
                  })}
                  : {new Date().toLocaleTimeString()}
                </div>
              )}
            </div>

            {/* Widget Info */}
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>
                  {t("type", { ns: "widgets", defaultValue: "Type" })}:
                </span>
                <span>
                  {language === "el"
                    ? selectedWidget.labelGreek
                    : selectedWidget.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span>
                  {t("size", { ns: "widgets", defaultValue: "Size" })}:
                </span>
                <span>
                  {WIDGET_SIZES.find((s) => s.value === formData.size)?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span>
                  {t("data_source", {
                    ns: "widgets",
                    defaultValue: "Data Source",
                  })}
                  :
                </span>
                <span>
                  {
                    DATA_SOURCE_TYPES.find(
                      (ds) => ds.value === dataSourceConfig.type
                    )?.label
                  }
                </span>
              </div>
              {formData.refreshInterval > 0 && (
                <div className="flex justify-between">
                  <span>
                    {t("refresh_interval", {
                      ns: "widgets",
                      defaultValue: "Refresh",
                    })}
                    :
                  </span>
                  <span>{formData.refreshInterval}s</span>
                </div>
              )}
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
            {widgetId
              ? t("edit_widget", { ns: "widgets", defaultValue: "Edit Widget" })
              : t("create_widget", {
                  ns: "widgets",
                  defaultValue: "Create Widget",
                })}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {selectedType
              ? `${t("configuring", {
                  ns: "widgets",
                  defaultValue: "Configuring",
                })} ${
                  WIDGET_TYPES.find((w) => w.type === selectedType)?.label
                } ${t("widget", { ns: "widgets", defaultValue: "widget" })}`
              : t("widget_builder_description", {
                  ns: "widgets",
                  defaultValue:
                    "Create custom dashboard widgets to visualize your business data",
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
            renderTypeSelection()
          ) : (
            <Card>
              <CardHeader>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="configuration">
                      {t("configuration", {
                        ns: "widgets",
                        defaultValue: "Configuration",
                      })}
                    </TabsTrigger>
                    <TabsTrigger value="styling">
                      {t("styling", { ns: "widgets", defaultValue: "Styling" })}
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
                  <TabsContent value="configuration">
                    {renderConfiguration()}
                  </TabsContent>
                  <TabsContent value="styling">{renderStyling()}</TabsContent>
                  <TabsContent value="advanced">
                    <div className="text-center py-8 text-gray-500">
                      <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>
                        {t("advanced_settings_coming_soon", {
                          ns: "widgets",
                          defaultValue: "Advanced settings coming soon",
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
                  ns: "widgets",
                  defaultValue: "Change Type",
                })}
              </span>
            </Button>
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
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
            <Save className="w-4 h-4" />
            <span>
              {widgetId
                ? t("update_widget", {
                    ns: "widgets",
                    defaultValue: "Update Widget",
                  })
                : t("create_widget", {
                    ns: "widgets",
                    defaultValue: "Create Widget",
                  })}
            </span>
          </LoadingButton>
        </div>
      )}
    </div>
  );
};
