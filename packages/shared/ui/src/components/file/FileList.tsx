"use client";

import React, { useState, useMemo } from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import { FileCard, FileCardData } from "./FileCard";
import {
  ChevronUp,
  ChevronDown,
  CheckSquare,
  Square,
  Minus,
} from "lucide-react";

export interface FileListProps {
  files: FileCardData[];
  sortBy?: "name" | "size" | "date" | "type" | "owner";
  sortOrder?: "asc" | "desc";
  selectedFiles?: Set<string>;
  showHeaders?: boolean;
  allowSelection?: boolean;
  allowSorting?: boolean;
  className?: string;
  onFileClick?: (file: FileCardData) => void;
  onFileSelect?: (file: FileCardData, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  onSort?: (sortBy: string, sortOrder: "asc" | "desc") => void;
  onFileDownload?: (file: FileCardData) => void;
  onFileShare?: (file: FileCardData) => void;
  onFileEdit?: (file: FileCardData) => void;
  onFileDelete?: (file: FileCardData) => void;
  onToggleStar?: (file: FileCardData) => void;
  onTagClick?: (tag: string) => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  sortBy = "name",
  sortOrder = "asc",
  selectedFiles = new Set(),
  showHeaders = true,
  allowSelection = true,
  allowSorting = true,
  className = "",
  onFileClick,
  onFileSelect,
  onSelectAll,
  onSort,
  onFileDownload,
  onFileShare,
  onFileEdit,
  onFileDelete,
  onToggleStar,
  onTagClick,
}) => {
  const { t } = useTranslation();
  const [currentSortBy, setCurrentSortBy] = useState(sortBy);
  const [currentSortOrder, setCurrentSortOrder] = useState(sortOrder);

  const sortedFiles = useMemo(() => {
    if (!allowSorting) return files;

    return [...files].sort((a, b) => {
      // Folders first
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
      }

      let comparison = 0;

      switch (currentSortBy) {
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
        case "owner":
          comparison = a.owner.name.localeCompare(b.owner.name);
          break;
        default:
          return 0;
      }

      return currentSortOrder === "asc" ? comparison : -comparison;
    });
  }, [files, currentSortBy, currentSortOrder, allowSorting]);

  const handleSort = (column: "name" | "size" | "date" | "type" | "owner") => {
    if (!allowSorting) return;

    let newSortOrder: "asc" | "desc" = "asc";

    if (currentSortBy === column) {
      newSortOrder = currentSortOrder === "asc" ? "desc" : "asc";
    }

    setCurrentSortBy(column);
    setCurrentSortOrder(newSortOrder);
    onSort?.(column, newSortOrder);
  };

  const handleSelectAll = () => {
    if (!allowSelection || !onSelectAll) return;

    const allSelected = sortedFiles.every((file) => selectedFiles.has(file.id));
    onSelectAll(!allSelected);
  };

  const getSelectionState = () => {
    const selectedCount = sortedFiles.filter((file) =>
      selectedFiles.has(file.id)
    ).length;
    const totalCount = sortedFiles.length;

    if (selectedCount === 0) return "none";
    if (selectedCount === totalCount) return "all";
    return "partial";
  };

  const renderSortIcon = (column: string) => {
    if (!allowSorting || currentSortBy !== column) return null;

    return currentSortOrder === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const getSortableHeaderClass = (column: string) => {
    const baseClass =
      "flex items-center space-x-1 cursor-pointer hover:text-gray-900";
    return allowSorting ? baseClass : "flex items-center space-x-1";
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("el-GR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const selectionState = getSelectionState();

  return (
    <div className={`file-list ${className}`}>
      {/* Headers */}
      {showHeaders && (
        <div className="border-b border-gray-200 pb-2 mb-2">
          <div className="grid grid-cols-12 gap-4 px-3 py-2 text-sm font-medium text-gray-500">
            {/* Selection */}
            {allowSelection && (
              <div className="col-span-1">
                <button
                  onClick={handleSelectAll}
                  className="flex items-center"
                  disabled={sortedFiles.length === 0}
                >
                  {selectionState === "all" && (
                    <CheckSquare className="w-4 h-4 text-blue-600" />
                  )}
                  {selectionState === "partial" && (
                    <Minus className="w-4 h-4 text-blue-600" />
                  )}
                  {selectionState === "none" && (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            )}

            {/* Name */}
            <div className={`${allowSelection ? "col-span-4" : "col-span-5"}`}>
              <button
                onClick={() => handleSort("name")}
                className={getSortableHeaderClass("name")}
              >
                <span>{t("fileList.name")}</span>
                {renderSortIcon("name")}
              </button>
            </div>

            {/* Size */}
            <div className="col-span-2">
              <button
                onClick={() => handleSort("size")}
                className={getSortableHeaderClass("size")}
              >
                <span>{t("fileList.size")}</span>
                {renderSortIcon("size")}
              </button>
            </div>

            {/* Owner */}
            <div className="col-span-2">
              <button
                onClick={() => handleSort("owner")}
                className={getSortableHeaderClass("owner")}
              >
                <span>{t("fileList.owner")}</span>
                {renderSortIcon("owner")}
              </button>
            </div>

            {/* Modified */}
            <div className="col-span-2">
              <button
                onClick={() => handleSort("date")}
                className={getSortableHeaderClass("date")}
              >
                <span>{t("fileList.modified")}</span>
                {renderSortIcon("date")}
              </button>
            </div>

            {/* Actions */}
            <div className="col-span-1 text-center">
              <span>{t("fileList.actions")}</span>
            </div>
          </div>
        </div>
      )}

      {/* File List */}
      <div className="space-y-1">
        {sortedFiles.map((file) => (
          <FileCard
            key={file.id}
            file={file}
            variant="list"
            selected={selectedFiles.has(file.id)}
            showActions={true}
            showMetadata={true}
            showThumbnail={true}
            onClick={() => onFileClick?.(file)}
            onSelect={
              allowSelection
                ? (selected) => onFileSelect?.(file, selected)
                : undefined
            }
            onDownload={() => onFileDownload?.(file)}
            onShare={() => onFileShare?.(file)}
            onEdit={() => onFileEdit?.(file)}
            onDelete={() => onFileDelete?.(file)}
            onToggleStar={() => onToggleStar?.(file)}
            onTagClick={onTagClick}
          />
        ))}
      </div>

      {/* Empty State */}
      {sortedFiles.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-2">{t("fileList.noFiles")}</div>
          <div className="text-sm text-gray-400">
            {t("fileList.noFilesDescription")}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileList;
