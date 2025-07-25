"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";
import { Checkbox } from "../ui/Checkbox";
import { Slider } from "../ui/Slider";
import { Tooltip } from "../ui/Tooltip";
import {
  Search,
  Filter,
  X,
  Calendar,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Code,
  Folder,
  User,
  Tag,
  Clock,
  HardDrive,
  Star,
  Share2,
  Lock,
  Globe,
  SortAsc,
  SortDesc,
  ChevronDown,
  History,
  BookmarkPlus,
  Settings,
  Zap,
} from "lucide-react";

// Simple utility function for className concatenation
const cn = (...classes: (string | undefined | null | boolean)[]) => {
  return classes.filter(Boolean).join(" ");
};

export interface SearchFilter {
  id: string;
  label: string;
  type:
    | "text"
    | "select"
    | "multiselect"
    | "date"
    | "daterange"
    | "size"
    | "boolean";
  options?: Array<{ value: string; label: string; count?: number }>;
  placeholder?: string;
  value?: any;
  min?: number;
  max?: number;
  unit?: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: Record<string, any>;
  createdAt: Date;
  isPublic: boolean;
  useCount: number;
}

export interface SearchResult {
  id: string;
  name: string;
  type: "file" | "folder";
  path: string;
  size?: number;
  mimeType?: string;
  modifiedAt: Date;
  modifiedBy: string;
  relevanceScore: number;
  highlights?: {
    field: string;
    value: string;
  }[];
  preview?: string;
  thumbnail?: string;
}

interface FileSearchProps {
  onSearch: (query: string, filters: Record<string, any>) => void;
  onSaveSearch?: (
    search: Omit<SavedSearch, "id" | "createdAt" | "useCount">
  ) => void;
  onLoadSearch?: (search: SavedSearch) => void;
  onDeleteSearch?: (searchId: string) => void;
  filters?: SearchFilter[];
  savedSearches?: SavedSearch[];
  results?: SearchResult[];
  suggestions?: string[];
  recentSearches?: string[];
  loading?: boolean;
  error?: string;
  placeholder?: string;
  showAdvancedFilters?: boolean;
  showSavedSearches?: boolean;
  showRecentSearches?: boolean;
  showSuggestions?: boolean;
  autoFocus?: boolean;
  className?: string;
}

const defaultFilters: SearchFilter[] = [
  {
    id: "type",
    label: "File Type",
    type: "multiselect",
    options: [
      { value: "document", label: "Documents", count: 145 },
      { value: "image", label: "Images", count: 87 },
      { value: "video", label: "Videos", count: 23 },
      { value: "audio", label: "Audio", count: 12 },
      { value: "archive", label: "Archives", count: 34 },
      { value: "code", label: "Code", count: 56 },
      { value: "folder", label: "Folders", count: 78 },
    ],
  },
  {
    id: "size",
    label: "File Size",
    type: "size",
    min: 0,
    max: 1024 * 1024 * 1024, // 1GB
    unit: "bytes",
  },
  {
    id: "modified",
    label: "Modified Date",
    type: "daterange",
  },
  {
    id: "owner",
    label: "Owner",
    type: "select",
    options: [
      { value: "me", label: "Me" },
      { value: "shared", label: "Shared with me" },
      { value: "public", label: "Public" },
    ],
  },
  {
    id: "starred",
    label: "Starred",
    type: "boolean",
  },
  {
    id: "shared",
    label: "Shared",
    type: "boolean",
  },
];

const formatFileSize = (bytes: number) => {
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

const getFileTypeIcon = (type: string) => {
  switch (type) {
    case "document":
      return <FileText className="h-4 w-4" />;
    case "image":
      return <Image className="h-4 w-4" />;
    case "video":
      return <Video className="h-4 w-4" />;
    case "audio":
      return <Music className="h-4 w-4" />;
    case "archive":
      return <Archive className="h-4 w-4" />;
    case "code":
      return <Code className="h-4 w-4" />;
    case "folder":
      return <Folder className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

export const FileSearch = ({
  onSearch,
  onSaveSearch,
  onLoadSearch,
  onDeleteSearch,
  filters = defaultFilters,
  savedSearches = [],
  results = [],
  suggestions = [],
  recentSearches = [],
  loading = false,
  error,
  placeholder,
  showAdvancedFilters = true,
  showSavedSearches = true,
  showRecentSearches = true,
  showSuggestions = true,
  autoFocus = false,
  className,
}: FileSearchProps) => {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState("");
  const [saveSearchPublic, setSaveSearchPublic] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSearch = (
    searchQuery?: string,
    searchFilters?: Record<string, any>
  ) => {
    const finalQuery = searchQuery ?? query;
    const finalFilters = searchFilters ?? activeFilters;
    onSearch(finalQuery, finalFilters);
  };

  const handleFilterChange = (filterId: string, value: any) => {
    const newFilters = { ...activeFilters };
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      delete newFilters[filterId];
    } else {
      newFilters[filterId] = value;
    }
    setActiveFilters(newFilters);
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    setQuery("");
  };

  const handleSaveSearch = () => {
    if (onSaveSearch && saveSearchName.trim()) {
      onSaveSearch({
        name: saveSearchName,
        query,
        filters: activeFilters,
        isPublic: saveSearchPublic,
      });
      setSaveSearchName("");
      setSaveSearchPublic(false);
      setShowSaveDialog(false);
    }
  };

  const handleLoadSearch = (search: SavedSearch) => {
    setQuery(search.query);
    setActiveFilters(search.filters);
    handleSearch(search.query, search.filters);
    if (onLoadSearch) {
      onLoadSearch(search);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (selectedSuggestion >= 0 && suggestions[selectedSuggestion]) {
        setQuery(suggestions[selectedSuggestion]);
        setSelectedSuggestion(-1);
      }
      handleSearch();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSuggestion(
        Math.min(selectedSuggestion + 1, suggestions.length - 1)
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSuggestion(Math.max(selectedSuggestion - 1, -1));
    } else if (e.key === "Escape") {
      setSearchFocused(false);
      setSelectedSuggestion(-1);
    }
  };

  const activeFilterCount = Object.keys(activeFilters).length;
  const displaySuggestions =
    showSuggestions &&
    searchFocused &&
    (suggestions.length > 0 || recentSearches.length > 0);

  const renderFilterInput = (filter: SearchFilter) => {
    const value = activeFilters[filter.id];

    switch (filter.type) {
      case "text":
        return (
          <Input
            placeholder={filter.placeholder}
            value={value || ""}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
          />
        );

      case "select":
        return (
          <select
            value={value || ""}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
            className="w-full px-3 py-2 border rounded text-sm"
          >
            <option value="">{filter.placeholder || "Select..."}</option>
            {filter.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
                {option.count && ` (${option.count})`}
              </option>
            ))}
          </select>
        );

      case "multiselect":
        return (
          <div className="space-y-2">
            {filter.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`${filter.id}-${option.value}`}
                  checked={(value || []).includes(option.value)}
                  onChange={(e) => {
                    const currentValue = value || [];
                    const checked = e.target.checked;
                    if (checked) {
                      handleFilterChange(filter.id, [
                        ...currentValue,
                        option.value,
                      ]);
                    } else {
                      handleFilterChange(
                        filter.id,
                        currentValue.filter((v: string) => v !== option.value)
                      );
                    }
                  }}
                />
                <label
                  htmlFor={`${filter.id}-${option.value}`}
                  className="flex items-center gap-2"
                >
                  {getFileTypeIcon(option.value)}
                  <span>{option.label}</span>
                  {option.count && (
                    <Badge variant="secondary">{option.count}</Badge>
                  )}
                </label>
              </div>
            ))}
          </div>
        );

      case "size":
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">
                {formatFileSize(value?.[0] || filter.min || 0)}
              </span>
              <span className="text-sm">
                {formatFileSize(value?.[1] || filter.max || 0)}
              </span>
            </div>
            <Slider
              value={value || [filter.min || 0, filter.max || 0]}
              onChange={(val) => handleFilterChange(filter.id, val)}
              max={filter.max}
              min={filter.min}
              step={1024}
              className="w-full"
            />
          </div>
        );

      case "daterange":
        return (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs">{t("files.search.from")}</label>
              <input
                type="date"
                value={value?.[0]?.toISOString().split("T")[0] || ""}
                onChange={(e) =>
                  handleFilterChange(filter.id, [
                    new Date(e.target.value),
                    value?.[1],
                  ])
                }
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
            <div>
              <label className="text-xs">{t("files.search.to")}</label>
              <input
                type="date"
                value={value?.[1]?.toISOString().split("T")[0] || ""}
                onChange={(e) =>
                  handleFilterChange(filter.id, [
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
              id={filter.id}
              checked={value || false}
              onChange={(e) => handleFilterChange(filter.id, e.target.checked)}
            />
            <label htmlFor={filter.id}>{filter.label}</label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              ref={searchInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
              placeholder={placeholder || t("files.search.placeholder")}
              className="pl-10 pr-32"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              {showAdvancedFilters && (
                <Tooltip content={t("files.search.advancedFilters")}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                      "h-8 w-8 p-0",
                      showFilters && "bg-gray-100",
                      activeFilterCount > 0 && "bg-blue-100 text-blue-600"
                    )}
                  >
                    <Filter className="h-4 w-4" />
                    {activeFilterCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </Tooltip>
              )}
              <Button
                size="sm"
                onClick={() => handleSearch()}
                disabled={loading}
                className="h-8"
              >
                {loading ? (
                  <Zap className="h-4 w-4 animate-spin" />
                ) : (
                  t("files.search.search")
                )}
              </Button>
            </div>
          </div>

          {/* Suggestions & Recent Searches */}
          {displaySuggestions && (
            <Card className="absolute z-10 w-full mt-1 border shadow-lg">
              <div className="p-2">
                <div className="max-h-64 overflow-y-auto">
                  <div className="space-y-1">
                    {suggestions.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-xs font-medium text-gray-500">
                          {t("files.search.suggestions")}
                        </div>
                        {suggestions.map((suggestion, index) => (
                          <div
                            key={suggestion}
                            className={cn(
                              "px-2 py-1 text-sm cursor-pointer rounded",
                              selectedSuggestion === index
                                ? "bg-blue-100"
                                : "hover:bg-gray-100"
                            )}
                            onClick={() => {
                              setQuery(suggestion);
                              setSearchFocused(false);
                              handleSearch(suggestion);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <Search className="h-3 w-3 text-gray-400" />
                              {suggestion}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {showRecentSearches && recentSearches.length > 0 && (
                      <div>
                        {suggestions.length > 0 && (
                          <div className="border-t my-2" />
                        )}
                        <div className="px-2 py-1 text-xs font-medium text-gray-500">
                          {t("files.search.recentSearches")}
                        </div>
                        {recentSearches.map((search) => (
                          <div
                            key={search}
                            className="px-2 py-1 text-sm cursor-pointer rounded hover:bg-gray-100"
                            onClick={() => {
                              setQuery(search);
                              setSearchFocused(false);
                              handleSearch(search);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <History className="h-3 w-3 text-gray-400" />
                              {search}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Active Filters */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500">
              {t("files.search.activeFilters")}:
            </span>
            {Object.entries(activeFilters).map(([filterId, value]) => {
              const filter = filters.find((f) => f.id === filterId);
              if (!filter) return null;

              let displayValue = value;
              if (Array.isArray(value)) {
                displayValue = value.join(", ");
              } else if (filter.type === "size") {
                displayValue = `${formatFileSize(value[0])} - ${formatFileSize(
                  value[1]
                )}`;
              } else if (filter.type === "daterange") {
                displayValue = `${value[0]?.toLocaleDateString()} - ${value[1]?.toLocaleDateString()}`;
              }

              return (
                <Badge
                  key={filterId}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {filter.label}: {displayValue}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleFilterChange(filterId, undefined)}
                  />
                </Badge>
              );
            })}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-6 px-2 text-xs"
            >
              {t("files.search.clearAll")}
            </Button>
          </div>
        )}

        {/* Advanced Filters */}
        {showFilters && (
          <Card>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">
                  {t("files.search.advancedFilters")}
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSaveDialog(true)}
                    className="flex items-center gap-1"
                  >
                    <BookmarkPlus className="h-4 w-4" />
                    {t("files.search.saveSearch")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filters.map((filter) => (
                  <div key={filter.id} className="space-y-2">
                    <label className="text-sm font-medium">
                      {filter.label}
                    </label>
                    {renderFilterInput(filter)}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Saved Searches */}
        {showSavedSearches && savedSearches.length > 0 && (
          <Card>
            <div className="p-4">
              <h3 className="font-medium mb-3">
                {t("files.search.savedSearches")}
              </h3>
              <div className="space-y-2">
                {savedSearches.map((search) => (
                  <div
                    key={search.id}
                    className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleLoadSearch(search)}
                  >
                    <div className="flex items-center gap-2">
                      <BookmarkPlus className="h-4 w-4 text-gray-400" />
                      <div>
                        <div className="font-medium">{search.name}</div>
                        <div className="text-sm text-gray-500">
                          {search.query}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{search.useCount}</Badge>
                      {search.isPublic && (
                        <Globe className="h-3 w-3 text-blue-500" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSearch?.(search.id);
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Save Search Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <h3 className="font-medium mb-4">
                {t("files.search.saveSearch")}
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="search-name">
                    {t("files.search.searchName")}
                  </label>
                  <Input
                    id="search-name"
                    value={saveSearchName}
                    onChange={(e) => setSaveSearchName(e.target.value)}
                    placeholder={t("files.search.searchNamePlaceholder")}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="search-public"
                    checked={saveSearchPublic}
                    onChange={(e) => setSaveSearchPublic(e.target.checked)}
                  />
                  <label htmlFor="search-public">
                    {t("files.search.makePublic")}
                  </label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowSaveDialog(false)}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    onClick={handleSaveSearch}
                    disabled={!saveSearchName.trim()}
                  >
                    {t("files.search.save")}
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
