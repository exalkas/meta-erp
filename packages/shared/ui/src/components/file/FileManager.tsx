"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import {
  Folder,
  File,
  Upload,
  Download,
  Trash2,
  Search,
  Filter,
  Grid,
  List,
  MoreHorizontal,
  Plus,
  Home,
  ChevronRight,
  RefreshCw,
  Star,
  Clock,
  Eye,
  Share,
  Copy,
  Move,
  Edit,
  Settings,
  Users,
  Lock,
} from "lucide-react";

export interface FileItem {
  id: string;
  name: string;
  type: "file" | "folder";
  size?: number;
  mimeType?: string;
  extension?: string;
  createdAt: Date;
  modifiedAt: Date;
  owner: {
    id: string;
    name: string;
    avatar?: string;
  };
  permissions: {
    read: boolean;
    write: boolean;
    delete: boolean;
    share: boolean;
  };
  isShared?: boolean;
  isStarred?: boolean;
  parentId?: string;
  path: string;
  thumbnail?: string;
  version?: number;
  tags?: string[];
}

export interface FileManagerProps {
  files: FileItem[];
  currentPath?: string;
  viewMode?: "grid" | "list" | "table";
  allowUpload?: boolean;
  allowMultiSelect?: boolean;
  allowFolderCreation?: boolean;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
  onFileSelect?: (files: FileItem[]) => void;
  onFileUpload?: (files: File[], path: string) => Promise<void>;
  onFileDelete?: (files: FileItem[]) => Promise<void>;
  onFileMove?: (files: FileItem[], destination: string) => Promise<void>;
  onFileCopy?: (files: FileItem[], destination: string) => Promise<void>;
  onFileRename?: (file: FileItem, newName: string) => Promise<void>;
  onFolderCreate?: (name: string, path: string) => Promise<void>;
  onPathChange?: (path: string) => void;
}

export const FileManager: React.FC<FileManagerProps> = ({
  files,
  currentPath = "/",
  viewMode: initialViewMode = "grid",
  allowUpload = true,
  allowMultiSelect = true,
  allowFolderCreation = true,
  maxFileSize = 100,
  acceptedTypes = [],
  className = "",
  onFileSelect,
  onFileUpload,
  onFileDelete,
  onFileMove,
  onFileCopy,
  onFileRename,
  onFolderCreate,
  onPathChange,
}) => {
  const { t } = useTranslation();

  const [viewMode, setViewMode] = useState(initialViewMode);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "size" | "date" | "type">(
    "name"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showHidden, setShowHidden] = useState(false);
  const [filterType, setFilterType] = useState<
    "all" | "images" | "documents" | "videos" | "audio"
  >("all");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // Filter and sort files
  const filteredFiles = useMemo(() => {
    let filtered = files.filter((file) => {
      // Path filter
      if (file.parentId !== (currentPath === "/" ? null : currentPath))
        return false;

      // Search filter
      if (
        searchQuery &&
        !file.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Type filter
      if (filterType !== "all" && file.type === "file") {
        switch (filterType) {
          case "images":
            return file.mimeType?.startsWith("image/") || false;
          case "documents":
            return (
              file.mimeType?.includes("document") ||
              file.mimeType?.includes("pdf") ||
              file.mimeType?.includes("text") ||
              false
            );
          case "videos":
            return file.mimeType?.startsWith("video/") || false;
          case "audio":
            return file.mimeType?.startsWith("audio/") || false;
        }
      }

      return true;
    });

    // Sort files
    filtered.sort((a, b) => {
      // Folders first
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
      }

      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "size":
          comparison = (a.size || 0) - (b.size || 0);
          break;
        case "date":
          comparison = a.modifiedAt.getTime() - b.modifiedAt.getTime();
          break;
        case "type":
          comparison = (a.extension || "").localeCompare(b.extension || "");
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [files, currentPath, searchQuery, filterType, sortBy, sortOrder]);

  // Build breadcrumb path
  const breadcrumbs = useMemo(() => {
    if (currentPath === "/")
      return [{ name: t("fileManager.home"), path: "/" }];

    const parts = currentPath.split("/").filter(Boolean);
    const crumbs = [{ name: t("fileManager.home"), path: "/" }];

    parts.forEach((part, index) => {
      const path = "/" + parts.slice(0, index + 1).join("/");
      crumbs.push({ name: part, path });
    });

    return crumbs;
  }, [currentPath, t]);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleFileSelect = (file: FileItem, isCtrlClick = false) => {
    if (!allowMultiSelect) {
      setSelectedFiles(new Set([file.id]));
      onFileSelect?.([file]);
      return;
    }

    const newSelected = new Set(selectedFiles);

    if (isCtrlClick) {
      if (newSelected.has(file.id)) {
        newSelected.delete(file.id);
      } else {
        newSelected.add(file.id);
      }
    } else {
      newSelected.clear();
      newSelected.add(file.id);
    }

    setSelectedFiles(newSelected);

    const selectedFileItems = files.filter((f) => newSelected.has(f.id));
    onFileSelect?.(selectedFileItems);
  };

  const handleFolderCreate = async () => {
    if (!newFolderName.trim() || !onFolderCreate) return;

    try {
      await onFolderCreate(newFolderName.trim(), currentPath);
      setNewFolderName("");
      setIsCreatingFolder(false);
    } catch (error) {
      console.error("Failed to create folder:", error);
    }
  };

  const handleBulkAction = async (
    action: "delete" | "move" | "copy" | "download"
  ) => {
    const selectedFileItems = files.filter((f) => selectedFiles.has(f.id));
    if (selectedFileItems.length === 0) return;

    try {
      switch (action) {
        case "delete":
          await onFileDelete?.(selectedFileItems);
          break;
        case "download":
          // Handle download
          break;
      }
      setSelectedFiles(new Set());
    } catch (error) {
      console.error(`Failed to ${action} files:`, error);
    }
  };

  return (
    <div className={`file-manager bg-white rounded-lg border ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("fileManager.title")}
          </h2>

          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded ${
                  viewMode === "grid" ? "bg-white shadow-sm" : "text-gray-600"
                }`}
                title={t("fileManager.gridView")}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded ${
                  viewMode === "list" ? "bg-white shadow-sm" : "text-gray-600"
                }`}
                title={t("fileManager.listView")}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Actions */}
            {allowUpload && (
              <button
                onClick={() => {
                  /* Handle upload */
                }}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Upload className="w-4 h-4 mr-2" />
                {t("fileManager.upload")}
              </button>
            )}

            {allowFolderCreation && (
              <button
                onClick={() => setIsCreatingFolder(true)}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t("fileManager.newFolder")}
              </button>
            )}
          </div>
        </div>

        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm mb-4">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.path}>
              {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
              <button
                onClick={() => onPathChange?.(crumb.path)}
                className={`hover:text-blue-600 ${
                  index === breadcrumbs.length - 1
                    ? "text-gray-900 font-medium"
                    : "text-gray-600"
                }`}
              >
                {index === 0 && <Home className="w-4 h-4 inline mr-1" />}
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </nav>

        {/* Filters and Search */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t("fileManager.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t("fileManager.allFiles")}</option>
            <option value="images">{t("fileManager.images")}</option>
            <option value="documents">{t("fileManager.documents")}</option>
            <option value="videos">{t("fileManager.videos")}</option>
            <option value="audio">{t("fileManager.audio")}</option>
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sort, order] = e.target.value.split("-");
              setSortBy(sort as any);
              setSortOrder(order as any);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="name-asc">{t("fileManager.sortNameAsc")}</option>
            <option value="name-desc">{t("fileManager.sortNameDesc")}</option>
            <option value="date-desc">{t("fileManager.sortDateDesc")}</option>
            <option value="date-asc">{t("fileManager.sortDateAsc")}</option>
            <option value="size-desc">{t("fileManager.sortSizeDesc")}</option>
            <option value="size-asc">{t("fileManager.sortSizeAsc")}</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedFiles.size > 0 && (
        <div className="px-4 py-3 bg-blue-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedFiles.size} {t("fileManager.itemsSelected")}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction("download")}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Download className="w-3 h-3 mr-1 inline" />
                {t("fileManager.download")}
              </button>
              <button
                onClick={() => handleBulkAction("delete")}
                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
              >
                <Trash2 className="w-3 h-3 mr-1 inline" />
                {t("fileManager.delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Grid/List */}
      <div className="p-4">
        {/* New Folder Input */}
        {isCreatingFolder && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Folder className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder={t("fileManager.folderName")}
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === "Enter") handleFolderCreate();
                  if (e.key === "Escape") setIsCreatingFolder(false);
                }}
              />
              <button
                onClick={handleFolderCreate}
                className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                {t("fileManager.create")}
              </button>
              <button
                onClick={() => setIsCreatingFolder(false)}
                className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                {t("fileManager.cancel")}
              </button>
            </div>
          </div>
        )}

        {/* Files Display */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                onClick={(e) => handleFileSelect(file, e.ctrlKey || e.metaKey)}
                className={`
                  p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md
                  ${
                    selectedFiles.has(file.id)
                      ? "ring-2 ring-blue-500 bg-blue-50"
                      : "bg-white hover:bg-gray-50"
                  }
                `}
              >
                <div className="text-center">
                  <div className="mx-auto mb-2 flex justify-center">
                    {file.type === "folder" ? (
                      <Folder className="w-8 h-8 text-blue-500" />
                    ) : file.thumbnail ? (
                      <img
                        src={file.thumbnail}
                        alt={file.name}
                        className="w-8 h-8 object-cover rounded"
                      />
                    ) : (
                      <File className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div className="text-xs font-medium text-gray-900 truncate">
                    {file.name}
                  </div>
                  {file.type === "file" && (
                    <div className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                onClick={(e) => handleFileSelect(file, e.ctrlKey || e.metaKey)}
                className={`
                  flex items-center p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-50
                  ${
                    selectedFiles.has(file.id)
                      ? "bg-blue-50 ring-1 ring-blue-200"
                      : "bg-white"
                  }
                `}
              >
                <div className="flex-shrink-0 mr-3">
                  {file.type === "folder" ? (
                    <Folder className="w-5 h-5 text-blue-500" />
                  ) : (
                    <File className="w-5 h-5 text-gray-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {file.owner.name} • {file.modifiedAt.toLocaleDateString()}
                    {file.type === "file" && ` • ${formatFileSize(file.size)}`}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {file.isStarred && (
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  )}
                  {file.isShared && <Share className="w-4 h-4 text-blue-500" />}
                  <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredFiles.length === 0 && (
          <div className="text-center py-12">
            <Folder className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t("fileManager.emptyFolder")}
            </h3>
            <p className="text-gray-500">
              {t("fileManager.emptyFolderDescription")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileManager;
