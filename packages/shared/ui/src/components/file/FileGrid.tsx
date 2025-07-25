"use client";

import React from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import { FileCard, FileCardData } from "./FileCard";

export interface FileGridProps {
  files: FileCardData[];
  selectedFiles?: Set<string>;
  columns?: 2 | 3 | 4 | 5 | 6;
  gap?: "sm" | "md" | "lg";
  showActions?: boolean;
  showMetadata?: boolean;
  showThumbnails?: boolean;
  allowSelection?: boolean;
  className?: string;
  onFileClick?: (file: FileCardData) => void;
  onFileSelect?: (file: FileCardData, selected: boolean) => void;
  onFileDownload?: (file: FileCardData) => void;
  onFileShare?: (file: FileCardData) => void;
  onFileEdit?: (file: FileCardData) => void;
  onFileDelete?: (file: FileCardData) => void;
  onToggleStar?: (file: FileCardData) => void;
  onTagClick?: (tag: string) => void;
}

export const FileGrid: React.FC<FileGridProps> = ({
  files,
  selectedFiles = new Set(),
  columns = 4,
  gap = "md",
  showActions = true,
  showMetadata = true,
  showThumbnails = true,
  allowSelection = true,
  className = "",
  onFileClick,
  onFileSelect,
  onFileDownload,
  onFileShare,
  onFileEdit,
  onFileDelete,
  onToggleStar,
  onTagClick,
}) => {
  const { t } = useTranslation();

  const getGridClasses = () => {
    const colClasses = {
      2: "grid-cols-2",
      3: "grid-cols-2 md:grid-cols-3",
      4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
      5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
      6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6",
    };

    const gapClasses = {
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6",
    };

    return `grid ${colClasses[columns]} ${gapClasses[gap]}`;
  };

  if (files.length === 0) {
    return (
      <div className={`file-grid-empty text-center py-12 ${className}`}>
        <div className="text-gray-500 mb-2">{t("fileGrid.noFiles")}</div>
        <div className="text-sm text-gray-400">
          {t("fileGrid.noFilesDescription")}
        </div>
      </div>
    );
  }

  return (
    <div className={`file-grid ${className}`}>
      <div className={getGridClasses()}>
        {files.map((file) => (
          <FileCard
            key={file.id}
            file={file}
            variant="grid"
            selected={selectedFiles.has(file.id)}
            showActions={showActions}
            showMetadata={showMetadata}
            showThumbnail={showThumbnails}
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
    </div>
  );
};

export default FileGrid;
