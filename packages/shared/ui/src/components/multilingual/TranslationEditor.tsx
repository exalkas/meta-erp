"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  Search,
  Filter,
  Download,
  Upload,
  Globe,
  CheckCircle,
  AlertCircle,
  X,
  Copy,
  MoreHorizontal,
  Languages,
  FileText,
  Eye,
  EyeOff,
} from "lucide-react";

export interface TranslationEntry {
  key: string;
  namespace?: string;
  translations: Record<string, string>;
  description?: string;
  context?: string;
  status: "complete" | "incomplete" | "needs_review" | "approved";
  lastModified: Date;
  author?: string;
  tags?: string[];
}

export interface TranslationEditorProps {
  entries: TranslationEntry[];
  languages: string[];
  defaultLanguage?: string;
  namespaces?: string[];
  onSave: (entries: TranslationEntry[]) => Promise<void>;
  onImport?: (file: File) => Promise<TranslationEntry[]>;
  onExport?: (
    entries: TranslationEntry[],
    format: "json" | "csv" | "xlsx"
  ) => void;
  onAddEntry?: (entry: Omit<TranslationEntry, "lastModified">) => void;
  onDeleteEntry?: (key: string) => void;
  className?: string;
  editable?: boolean;
  showPreview?: boolean;
  bulkEdit?: boolean;
}

export const TranslationEditor: React.FC<TranslationEditorProps> = ({
  entries,
  languages,
  defaultLanguage = "en",
  namespaces = [],
  onSave,
  onImport,
  onExport,
  onAddEntry,
  onDeleteEntry,
  className = "",
  editable = true,
  showPreview = true,
  bulkEdit = true,
}) => {
  const { t } = useTranslation();

  const [editingEntries, setEditingEntries] =
    useState<TranslationEntry[]>(entries);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterNamespace, setFilterNamespace] = useState<string>("all");
  const [filterLanguage, setFilterLanguage] = useState<string>("all");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState<Partial<TranslationEntry>>({});
  const [showNewEntryForm, setShowNewEntryForm] = useState(false);
  const [previewLanguage, setPreviewLanguage] = useState(defaultLanguage);
  const [showPreviewMode, setShowPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const filteredEntries = useMemo(() => {
    return editingEntries.filter((entry) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesKey = entry.key.toLowerCase().includes(query);
        const matchesTranslation = Object.values(entry.translations).some(
          (translation) => translation.toLowerCase().includes(query)
        );
        const matchesDescription = entry.description
          ?.toLowerCase()
          .includes(query);
        if (!matchesKey && !matchesTranslation && !matchesDescription)
          return false;
      }

      // Status filter
      if (filterStatus !== "all" && entry.status !== filterStatus) return false;

      // Namespace filter
      if (filterNamespace !== "all" && entry.namespace !== filterNamespace)
        return false;

      // Language filter (missing translations)
      if (filterLanguage !== "all") {
        if (filterLanguage === "missing") {
          const hasMissingTranslations = languages.some(
            (lang) => !entry.translations[lang]
          );
          if (!hasMissingTranslations) return false;
        } else {
          if (!entry.translations[filterLanguage]) return false;
        }
      }

      return true;
    });
  }, [
    editingEntries,
    searchQuery,
    filterStatus,
    filterNamespace,
    filterLanguage,
    languages,
  ]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSave(editingEntries);
    } finally {
      setSaving(false);
    }
  }, [editingEntries, onSave]);

  const handleUpdateEntry = useCallback(
    (key: string, updates: Partial<TranslationEntry>) => {
      setEditingEntries((prev) =>
        prev.map((entry) =>
          entry.key === key
            ? { ...entry, ...updates, lastModified: new Date() }
            : entry
        )
      );
    },
    []
  );

  const handleDeleteEntry = useCallback(
    (key: string) => {
      setEditingEntries((prev) => prev.filter((entry) => entry.key !== key));
      onDeleteEntry?.(key);
    },
    [onDeleteEntry]
  );

  const handleAddEntry = useCallback(() => {
    if (!newEntry.key) return;

    const entry: TranslationEntry = {
      key: newEntry.key,
      namespace: newEntry.namespace,
      translations: newEntry.translations || {},
      description: newEntry.description,
      context: newEntry.context,
      status: "incomplete",
      lastModified: new Date(),
      tags: newEntry.tags || [],
    };

    setEditingEntries((prev) => [...prev, entry]);
    onAddEntry?.(entry);
    setNewEntry({});
    setShowNewEntryForm(false);
  }, [newEntry, onAddEntry]);

  const handleBulkAction = useCallback(
    (action: "delete" | "approve" | "review" | "export") => {
      const selectedKeys = Array.from(selectedEntries);

      switch (action) {
        case "delete":
          setEditingEntries((prev) =>
            prev.filter((entry) => !selectedKeys.includes(entry.key))
          );
          break;
        case "approve":
          setEditingEntries((prev) =>
            prev.map((entry) =>
              selectedKeys.includes(entry.key)
                ? {
                    ...entry,
                    status: "approved" as const,
                    lastModified: new Date(),
                  }
                : entry
            )
          );
          break;
        case "review":
          setEditingEntries((prev) =>
            prev.map((entry) =>
              selectedKeys.includes(entry.key)
                ? {
                    ...entry,
                    status: "needs_review" as const,
                    lastModified: new Date(),
                  }
                : entry
            )
          );
          break;
        case "export":
          const selectedEntriesToExport = editingEntries.filter((entry) =>
            selectedKeys.includes(entry.key)
          );
          onExport?.(selectedEntriesToExport, "json");
          break;
      }

      setSelectedEntries(new Set());
    },
    [selectedEntries, editingEntries, onExport]
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete":
        return "bg-green-100 text-green-800";
      case "incomplete":
        return "bg-red-100 text-red-800";
      case "needs_review":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "needs_review":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <X className="w-4 h-4" />;
    }
  };

  const getCompletionPercentage = (entry: TranslationEntry) => {
    const totalLanguages = languages.length;
    const completedLanguages = languages.filter((lang) =>
      entry.translations[lang]?.trim()
    ).length;
    return Math.round((completedLanguages / totalLanguages) * 100);
  };

  return (
    <div
      className={`translation-editor bg-white rounded-lg shadow-sm border ${className}`}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Languages className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {t("translationEditor.title")}
            </h2>
            <span className="text-sm text-gray-500">
              ({filteredEntries.length} {t("translationEditor.entries")})
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {showPreview && (
              <button
                onClick={() => setShowPreviewMode(!showPreviewMode)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  showPreviewMode
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {showPreviewMode ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                <span className="ml-1">{t("translationEditor.preview")}</span>
              </button>
            )}

            {editable && (
              <>
                <button
                  onClick={() => setShowNewEntryForm(true)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {t("translationEditor.addEntry")}
                </button>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center"
                >
                  <Save className="w-4 h-4 mr-1" />
                  {saving
                    ? t("translationEditor.saving")
                    : t("translationEditor.save")}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t("translationEditor.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">{t("translationEditor.allStatuses")}</option>
            <option value="complete">{t("translationEditor.complete")}</option>
            <option value="incomplete">
              {t("translationEditor.incomplete")}
            </option>
            <option value="needs_review">
              {t("translationEditor.needsReview")}
            </option>
            <option value="approved">{t("translationEditor.approved")}</option>
          </select>

          {namespaces.length > 0 && (
            <select
              value={filterNamespace}
              onChange={(e) => setFilterNamespace(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">
                {t("translationEditor.allNamespaces")}
              </option>
              {namespaces.map((ns) => (
                <option key={ns} value={ns}>
                  {ns}
                </option>
              ))}
            </select>
          )}

          <select
            value={filterLanguage}
            onChange={(e) => setFilterLanguage(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">{t("translationEditor.allLanguages")}</option>
            <option value="missing">
              {t("translationEditor.missingTranslations")}
            </option>
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Bulk Actions */}
        {bulkEdit && selectedEntries.size > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {selectedEntries.size} {t("translationEditor.entriesSelected")}
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkAction("approve")}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {t("translationEditor.approve")}
                </button>
                <button
                  onClick={() => handleBulkAction("review")}
                  className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  {t("translationEditor.markForReview")}
                </button>
                <button
                  onClick={() => handleBulkAction("export")}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                >
                  {t("translationEditor.export")}
                </button>
                <button
                  onClick={() => handleBulkAction("delete")}
                  className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                >
                  {t("translationEditor.delete")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Entry Form */}
      {showNewEntryForm && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("translationEditor.key")}
              </label>
              <input
                type="text"
                value={newEntry.key || ""}
                onChange={(e) =>
                  setNewEntry((prev) => ({ ...prev, key: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="common.button.save"
              />
            </div>

            {namespaces.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("translationEditor.namespace")}
                </label>
                <select
                  value={newEntry.namespace || ""}
                  onChange={(e) =>
                    setNewEntry((prev) => ({
                      ...prev,
                      namespace: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">
                    {t("translationEditor.selectNamespace")}
                  </option>
                  {namespaces.map((ns) => (
                    <option key={ns} value={ns}>
                      {ns}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("translationEditor.description")}
              </label>
              <input
                type="text"
                value={newEntry.description || ""}
                onChange={(e) =>
                  setNewEntry((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder={t("translationEditor.descriptionPlaceholder")}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={() => setShowNewEntryForm(false)}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              {t("translationEditor.cancel")}
            </button>
            <button
              onClick={handleAddEntry}
              disabled={!newEntry.key}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {t("translationEditor.add")}
            </button>
          </div>
        </div>
      )}

      {/* Entries List */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {bulkEdit && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedEntries.size === filteredEntries.length &&
                      filteredEntries.length > 0
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEntries(
                          new Set(filteredEntries.map((entry) => entry.key))
                        );
                      } else {
                        setSelectedEntries(new Set());
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("translationEditor.key")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("translationEditor.status")}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("translationEditor.progress")}
              </th>
              {languages.map((lang) => (
                <th
                  key={lang}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {lang.toUpperCase()}
                </th>
              ))}
              {editable && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t("translationEditor.actions")}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredEntries.map((entry) => (
              <tr key={entry.key} className="hover:bg-gray-50">
                {bulkEdit && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedEntries.has(entry.key)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedEntries);
                        if (e.target.checked) {
                          newSelected.add(entry.key);
                        } else {
                          newSelected.delete(entry.key);
                        }
                        setSelectedEntries(newSelected);
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                )}

                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-900">
                    {entry.key}
                  </div>
                  {entry.namespace && (
                    <div className="text-xs text-gray-500">
                      {entry.namespace}
                    </div>
                  )}
                  {entry.description && (
                    <div className="text-xs text-gray-600 mt-1">
                      {entry.description}
                    </div>
                  )}
                </td>

                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      entry.status
                    )}`}
                  >
                    {getStatusIcon(entry.status)}
                    <span className="ml-1">
                      {t(`translationEditor.${entry.status}`)}
                    </span>
                  </span>
                </td>

                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${getCompletionPercentage(entry)}%` }}
                      />
                    </div>
                    <span className="ml-2 text-xs text-gray-600">
                      {getCompletionPercentage(entry)}%
                    </span>
                  </div>
                </td>

                {languages.map((lang) => (
                  <td key={lang} className="px-4 py-3">
                    {editable ? (
                      <input
                        type="text"
                        value={entry.translations[lang] || ""}
                        onChange={(e) =>
                          handleUpdateEntry(entry.key, {
                            translations: {
                              ...entry.translations,
                              [lang]: e.target.value,
                            },
                          })
                        }
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        placeholder={t("translationEditor.enterTranslation")}
                      />
                    ) : (
                      <span className="text-sm text-gray-900">
                        {entry.translations[lang] || (
                          <span className="text-gray-400">—</span>
                        )}
                      </span>
                    )}
                  </td>
                ))}

                {editable && (
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          const newStatus =
                            entry.status === "approved"
                              ? "incomplete"
                              : "approved";
                          handleUpdateEntry(entry.key, { status: newStatus });
                        }}
                        className="text-gray-400 hover:text-green-600"
                        title={t("translationEditor.toggleApproval")}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(entry.key)}
                        className="text-gray-400 hover:text-red-600"
                        title={t("translationEditor.deleteEntry")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredEntries.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">
            {t("translationEditor.noEntries")}
          </p>
          <p className="text-sm">
            {t("translationEditor.noEntriesDescription")}
          </p>
        </div>
      )}
    </div>
  );
};

export default TranslationEditor;
