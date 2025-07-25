"use client";

import { useState } from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Checkbox } from "../ui/Checkbox";
import { Input } from "../ui/Input";
import { Slider } from "../ui/Slider";
import {
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Code,
  Folder,
  Calendar,
  User,
  Tag,
  Star,
  Share2,
  Lock,
  Clock,
  HardDrive,
  Zap,
  RotateCcw,
  Bookmark,
  Globe,
  Eye,
  Download,
  Edit,
  Trash2,
} from "lucide-react";

// Simple utility function for className concatenation
const cn = (...classes: (string | undefined | null | boolean)[]) => {
  return classes.filter(Boolean).join(" ");
};

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
  color?: string;
}

export interface FilterGroup {
  id: string;
  label: string;
  type: "single" | "multiple" | "range" | "date" | "boolean";
  options?: FilterOption[];
  min?: number;
  max?: number;
  unit?: string;
  isCollapsed?: boolean;
  isQuickFilter?: boolean;
  icon?: React.ReactNode;
}

export interface QuickFilter {
  id: string;
  label: string;
  icon: React.ReactNode;
  filters: Record<string, any>;
  isActive: boolean;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: Record<string, any>;
  isDefault?: boolean;
  isPublic?: boolean;
  createdBy?: string;
  createdAt?: Date;
}

interface FileFilterProps {
  filterGroups: FilterGroup[];
  quickFilters?: QuickFilter[];
  presets?: FilterPreset[];
  activeFilters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  onQuickFilterToggle?: (quickFilterId: string) => void;
  onPresetLoad?: (preset: FilterPreset) => void;
  onPresetSave?: (name: string, filters: Record<string, any>) => void;
  onPresetDelete?: (presetId: string) => void;
  resultCount?: number;
  totalCount?: number;
  loading?: boolean;
  showQuickFilters?: boolean;
  showPresets?: boolean;
  showResultCount?: boolean;
  compact?: boolean;
  className?: string;
}

const defaultQuickFilters: QuickFilter[] = [
  {
    id: "recent",
    label: "Recent",
    icon: <Clock className="h-4 w-4" />,
    filters: { modified: "last_7_days" },
    isActive: false,
  },
  {
    id: "starred",
    label: "Starred",
    icon: <Star className="h-4 w-4" />,
    filters: { starred: true },
    isActive: false,
  },
  {
    id: "shared",
    label: "Shared",
    icon: <Share2 className="h-4 w-4" />,
    filters: { shared: true },
    isActive: false,
  },
  {
    id: "images",
    label: "Images",
    icon: <Image className="h-4 w-4" />,
    filters: { type: ["image"] },
    isActive: false,
  },
  {
    id: "documents",
    label: "Documents",
    icon: <FileText className="h-4 w-4" />,
    filters: { type: ["document"] },
    isActive: false,
  },
];

const defaultFilterGroups: FilterGroup[] = [
  {
    id: "type",
    label: "File Type",
    type: "multiple",
    icon: <FileText className="h-4 w-4" />,
    options: [
      {
        value: "document",
        label: "Documents",
        count: 145,
        icon: <FileText className="h-4 w-4" />,
      },
      {
        value: "image",
        label: "Images",
        count: 87,
        icon: <Image className="h-4 w-4" />,
      },
      {
        value: "video",
        label: "Videos",
        count: 23,
        icon: <Video className="h-4 w-4" />,
      },
      {
        value: "audio",
        label: "Audio",
        count: 12,
        icon: <Music className="h-4 w-4" />,
      },
      {
        value: "archive",
        label: "Archives",
        count: 34,
        icon: <Archive className="h-4 w-4" />,
      },
      {
        value: "code",
        label: "Code",
        count: 56,
        icon: <Code className="h-4 w-4" />,
      },
      {
        value: "folder",
        label: "Folders",
        count: 78,
        icon: <Folder className="h-4 w-4" />,
      },
    ],
  },
  {
    id: "size",
    label: "File Size",
    type: "range",
    icon: <HardDrive className="h-4 w-4" />,
    min: 0,
    max: 1024 * 1024 * 1024, // 1GB
    unit: "bytes",
  },
  {
    id: "modified",
    label: "Modified",
    type: "single",
    icon: <Calendar className="h-4 w-4" />,
    options: [
      { value: "today", label: "Today" },
      { value: "yesterday", label: "Yesterday" },
      { value: "last_7_days", label: "Last 7 days" },
      { value: "last_30_days", label: "Last 30 days" },
      { value: "last_year", label: "Last year" },
      { value: "custom", label: "Custom range" },
    ],
  },
  {
    id: "owner",
    label: "Owner",
    type: "single",
    icon: <User className="h-4 w-4" />,
    options: [
      { value: "me", label: "Me" },
      { value: "shared_with_me", label: "Shared with me" },
      { value: "public", label: "Public" },
    ],
  },
  {
    id: "properties",
    label: "Properties",
    type: "multiple",
    icon: <Tag className="h-4 w-4" />,
    options: [
      {
        value: "starred",
        label: "Starred",
        icon: <Star className="h-4 w-4" />,
      },
      {
        value: "shared",
        label: "Shared",
        icon: <Share2 className="h-4 w-4" />,
      },
      { value: "locked", label: "Locked", icon: <Lock className="h-4 w-4" /> },
      {
        value: "has_comments",
        label: "Has comments",
        icon: <Edit className="h-4 w-4" />,
      },
      {
        value: "has_versions",
        label: "Has versions",
        icon: <Clock className="h-4 w-4" />,
      },
    ],
  },
];

const formatFileSize = (bytes: number) => {
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

export const FileFilter = ({
  filterGroups = defaultFilterGroups,
  quickFilters = defaultQuickFilters,
  presets = [],
  activeFilters,
  onFiltersChange,
  onQuickFilterToggle,
  onPresetLoad,
  onPresetSave,
  onPresetDelete,
  resultCount,
  totalCount,
  loading = false,
  showQuickFilters = true,
  showPresets = true,
  showResultCount = true,
  compact = false,
  className,
}: FileFilterProps) => {
  const { t } = useTranslation();
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [customDateRange, setCustomDateRange] = useState<[Date?, Date?]>([
    undefined,
    undefined,
  ]);

  const handleFilterChange = (groupId: string, value: any) => {
    const newFilters = { ...activeFilters };
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      delete newFilters[groupId];
    } else {
      newFilters[groupId] = value;
    }
    onFiltersChange(newFilters);
  };

  const handleQuickFilterToggle = (quickFilterId: string) => {
    const quickFilter = quickFilters.find((f) => f.id === quickFilterId);
    if (quickFilter && onQuickFilterToggle) {
      onQuickFilterToggle(quickFilterId);
    }
  };

  const handleClearAll = () => {
    onFiltersChange({});
  };

  const handleGroupToggle = (groupId: string) => {
    setCollapsedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleSavePreset = () => {
    if (onPresetSave && presetName.trim()) {
      onPresetSave(presetName, activeFilters);
      setPresetName("");
      setShowSavePreset(false);
    }
  };

  const renderFilterInput = (group: FilterGroup) => {
    const value = activeFilters[group.id];

    switch (group.type) {
      case "single":
        return (
          <div className="space-y-2">
            {group.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`${group.id}-${option.value}`}
                  name={group.id}
                  checked={value === option.value}
                  onChange={() => handleFilterChange(group.id, option.value)}
                  className="h-4 w-4"
                />
                <label
                  htmlFor={`${group.id}-${option.value}`}
                  className="flex items-center gap-2 flex-1"
                >
                  {option.icon}
                  <span>{option.label}</span>
                  {option.count && (
                    <Badge variant="secondary" className="ml-auto">
                      {option.count}
                    </Badge>
                  )}
                </label>
              </div>
            ))}
            {group.id === "modified" && value === "custom" && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="text-xs">{t("files.filter.from")}</label>
                  <input
                    type="date"
                    value={
                      customDateRange[0]?.toISOString().split("T")[0] || ""
                    }
                    onChange={(e) =>
                      setCustomDateRange([
                        new Date(e.target.value),
                        customDateRange[1],
                      ])
                    }
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs">{t("files.filter.to")}</label>
                  <input
                    type="date"
                    value={
                      customDateRange[1]?.toISOString().split("T")[0] || ""
                    }
                    onChange={(e) =>
                      setCustomDateRange([
                        customDateRange[0],
                        new Date(e.target.value),
                      ])
                    }
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        );

      case "multiple":
        return (
          <div className="space-y-2">
            {group.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${group.id}-${option.value}`}
                  checked={(value || []).includes(option.value)}
                  onChange={(e) => {
                    const currentValue = value || [];
                    const checked = e.target.checked;
                    if (checked) {
                      handleFilterChange(group.id, [
                        ...currentValue,
                        option.value,
                      ]);
                    } else {
                      handleFilterChange(
                        group.id,
                        currentValue.filter((v: string) => v !== option.value)
                      );
                    }
                  }}
                />
                <label
                  htmlFor={`${group.id}-${option.value}`}
                  className="flex items-center gap-2 flex-1"
                >
                  {option.icon}
                  <span>{option.label}</span>
                  {option.count && (
                    <Badge variant="secondary" className="ml-auto">
                      {option.count}
                    </Badge>
                  )}
                </label>
              </div>
            ))}
          </div>
        );

      case "range":
        const rangeValue = value || [group.min || 0, group.max || 100];
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>
                {group.unit === "bytes"
                  ? formatFileSize(rangeValue[0])
                  : rangeValue[0]}
              </span>
              <span>
                {group.unit === "bytes"
                  ? formatFileSize(rangeValue[1])
                  : rangeValue[1]}
              </span>
            </div>
            <Slider
              value={rangeValue}
              onChange={(val) => handleFilterChange(group.id, val)}
              max={group.max}
              min={group.min}
              step={group.unit === "bytes" ? 1024 : 1}
              className="w-full"
            />
          </div>
        );

      case "date":
        return (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs">{t("files.filter.from")}</label>
              <input
                type="date"
                value={value?.[0]?.toISOString().split("T")[0] || ""}
                onChange={(e) =>
                  handleFilterChange(group.id, [
                    new Date(e.target.value),
                    value?.[1],
                  ])
                }
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
            <div>
              <label className="text-xs">{t("files.filter.to")}</label>
              <input
                type="date"
                value={value?.[1]?.toISOString().split("T")[0] || ""}
                onChange={(e) =>
                  handleFilterChange(group.id, [
                    value?.[0],
                    new Date(e.target.value),
                  ])
                }
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
          </div>
        );

      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={group.id}
              checked={value || false}
              onChange={(e) => handleFilterChange(group.id, e.target.checked)}
            />
            <label htmlFor={group.id}>{group.label}</label>
          </div>
        );

      default:
        return null;
    }
  };

  const activeFilterCount = Object.keys(activeFilters).length;
  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className={cn("w-full", className)}>
      {/* Quick Filters */}
      {showQuickFilters && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {quickFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => handleQuickFilterToggle(filter.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1 rounded border text-sm",
                  filter.isActive
                    ? "bg-blue-50 border-blue-200 text-blue-700"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                )}
              >
                {filter.icon}
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Result Count */}
      {showResultCount && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {loading ? (
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3 animate-spin" />
                  {t("files.filter.loading")}
                </span>
              ) : (
                t("files.filter.results", {
                  variables: {
                    current: resultCount || 0,
                    total: totalCount || 0,
                  },
                })
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                {t("files.filter.clearAll")}
              </Button>
            )}
            {showPresets && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSavePreset(true)}
                  disabled={!hasActiveFilters}
                  className="flex items-center gap-1"
                >
                  <Bookmark className="h-3 w-3" />
                  {t("files.filter.savePreset")}
                </Button>
                {presets.length > 0 && (
                  <div className="relative">
                    <Button variant="ghost" size="sm">
                      {t("files.filter.presets")}
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                    <div className="absolute right-0 top-full mt-1 w-64 bg-white border rounded-lg shadow-lg z-10 hidden">
                      <div className="p-2 space-y-2">
                        {presets.map((preset) => (
                          <div
                            key={preset.id}
                            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                            onClick={() => onPresetLoad?.(preset)}
                          >
                            <div className="flex items-center gap-2">
                              <Bookmark className="h-3 w-3" />
                              <span className="text-sm">{preset.name}</span>
                              {preset.isDefault && (
                                <Badge variant="secondary" className="text-xs">
                                  {t("files.filter.default")}
                                </Badge>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onPresetDelete?.(preset.id);
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filter Groups */}
      <div className="space-y-4">
        {filterGroups.map((group) => {
          const isCollapsed = collapsedGroups.includes(group.id);
          const hasValue = activeFilters[group.id] !== undefined;

          return (
            <Card key={group.id} className={cn(hasValue && "border-blue-200")}>
              <div className="p-4">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => handleGroupToggle(group.id)}
                >
                  <div className="flex items-center gap-2">
                    {group.icon}
                    <span className="font-medium">{group.label}</span>
                    {hasValue && (
                      <Badge variant="secondary" className="text-xs">
                        {Array.isArray(activeFilters[group.id])
                          ? activeFilters[group.id].length
                          : 1}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {hasValue && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFilterChange(group.id, undefined);
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                    {isCollapsed ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="mt-3">{renderFilterInput(group)}</div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Save Preset Dialog */}
      {showSavePreset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <h3 className="font-medium mb-4">
                {t("files.filter.savePreset")}
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="preset-name">
                    {t("files.filter.presetName")}
                  </label>
                  <Input
                    id="preset-name"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder={t("files.filter.presetNamePlaceholder")}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowSavePreset(false)}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    onClick={handleSavePreset}
                    disabled={!presetName.trim()}
                  >
                    {t("files.filter.save")}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
