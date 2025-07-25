"use client";

import React, { useState } from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import {
  File,
  Image,
  Video,
  Music,
  Archive,
  FileText,
  Download,
  Share,
  Star,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Copy,
  Move,
  Lock,
  Calendar,
  User,
  Tag,
  Folder,
} from "lucide-react";

export interface FileCardData {
  id: string;
  name: string;
  type: "file" | "folder";
  size?: number;
  mimeType?: string;
  extension?: string;
  thumbnail?: string;
  createdAt: Date;
  modifiedAt: Date;
  owner: {
    id: string;
    name: string;
    avatar?: string;
  };
  isShared?: boolean;
  isStarred?: boolean;
  isLocked?: boolean;
  downloadUrl?: string;
  tags?: string[];
  version?: number;
  permissions: {
    read: boolean;
    write: boolean;
    delete: boolean;
    share: boolean;
  };
}

export interface FileCardProps {
  file: FileCardData;
  variant?: "grid" | "list" | "compact";
  selected?: boolean;
  showActions?: boolean;
  showMetadata?: boolean;
  showThumbnail?: boolean;
  className?: string;
  onClick?: () => void;
  onSelect?: (selected: boolean) => void;
  onDownload?: () => void;
  onShare?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleStar?: () => void;
  onTagClick?: (tag: string) => void;
}

export const FileCard: React.FC<FileCardProps> = ({
  file,
  variant = "grid",
  selected = false,
  showActions = true,
  showMetadata = true,
  showThumbnail = true,
  className = "",
  onClick,
  onSelect,
  onDownload,
  onShare,
  onEdit,
  onDelete,
  onToggleStar,
  onTagClick,
}) => {
  const { t } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);

  const getFileIcon = (size: "sm" | "md" | "lg" = "md") => {
    const sizeClasses = {
      sm: "w-4 h-4",
      md: "w-6 h-6",
      lg: "w-12 h-12",
    };

    const iconSize = sizeClasses[size];

    if (file.type === "folder") {
      return <Folder className={`${iconSize} text-blue-500`} />;
    }

    const type = file.mimeType?.split("/")[0];
    const extension = file.extension?.toLowerCase();

    if (type === "image")
      return <Image className={`${iconSize} text-blue-500`} />;
    if (type === "video")
      return <Video className={`${iconSize} text-purple-500`} />;
    if (type === "audio")
      return <Music className={`${iconSize} text-green-500`} />;

    if (extension) {
      if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) {
        return <Archive className={`${iconSize} text-orange-500`} />;
      }
      if (["pdf", "doc", "docx", "txt", "rtf"].includes(extension)) {
        return <FileText className={`${iconSize} text-red-500`} />;
      }
    }

    return <File className={`${iconSize} text-gray-500`} />;
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

  const handleCardClick = (e: React.MouseEvent) => {
    if (
      e.target instanceof HTMLElement &&
      (e.target.closest("button") || e.target.closest(".dropdown"))
    ) {
      return;
    }
    onClick?.();
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelect?.(e.target.checked);
  };

  if (variant === "list") {
    return (
      <div
        className={`
          file-card-list flex items-center p-3 rounded-lg transition-colors cursor-pointer group
          ${
            selected
              ? "bg-blue-50 ring-2 ring-blue-200"
              : "bg-white hover:bg-gray-50"
          }
          ${className}
        `}
        onClick={handleCardClick}
      >
        {/* Checkbox */}
        {onSelect && (
          <div className="flex-shrink-0 mr-3">
            <input
              type="checkbox"
              checked={selected}
              onChange={handleSelectChange}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Thumbnail/Icon */}
        <div className="flex-shrink-0 mr-3">
          {showThumbnail && file.thumbnail ? (
            <img
              src={file.thumbnail}
              alt={file.name}
              className="w-10 h-10 object-cover rounded"
            />
          ) : (
            getFileIcon("md")
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {file.name}
            </h3>

            {file.isLocked && <Lock className="w-3 h-3 text-gray-400" />}
            {file.isShared && <Share className="w-3 h-3 text-blue-500" />}
            {file.isStarred && (
              <Star className="w-3 h-3 text-yellow-500 fill-current" />
            )}
          </div>

          {showMetadata && (
            <div className="text-xs text-gray-500 mt-1">
              {file.type === "file" &&
                file.size &&
                `${formatFileSize(file.size)} • `}
              {file.owner.name} • {formatDate(file.modifiedAt)}
            </div>
          )}
        </div>

        {/* Tags */}
        {file.tags && file.tags.length > 0 && (
          <div className="flex-shrink-0 mx-3">
            <div className="flex space-x-1">
              {file.tags.slice(0, 2).map((tag, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTagClick?.(tag);
                  }}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
                >
                  {tag}
                </button>
              ))}
              {file.tags.length > 2 && (
                <span className="px-2 py-1 text-xs text-gray-500">
                  +{file.tags.length - 2}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex-shrink-0 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {file.permissions.read && onDownload && file.downloadUrl && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload();
                }}
                className="p-1 text-gray-400 hover:text-blue-600 rounded"
                title={t("fileCard.download")}
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            {file.permissions.share && onShare && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShare();
                }}
                className="p-1 text-gray-400 hover:text-green-600 rounded"
                title={t("fileCard.share")}
              >
                <Share className="w-4 h-4" />
              </button>
            )}

            {onToggleStar && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStar();
                }}
                className={`p-1 rounded ${
                  file.isStarred
                    ? "text-yellow-500"
                    : "text-gray-400 hover:text-yellow-500"
                }`}
                title={t("fileCard.toggleStar")}
              >
                <Star
                  className={`w-4 h-4 ${file.isStarred ? "fill-current" : ""}`}
                />
              </button>
            )}

            <div className="relative dropdown">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDropdown(!showDropdown);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showDropdown && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        onClick?.();
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {t("fileCard.open")}
                    </button>

                    {file.permissions.write && onEdit && (
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          onEdit();
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        {t("fileCard.rename")}
                      </button>
                    )}

                    <button className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                      <Copy className="w-4 h-4 mr-2" />
                      {t("fileCard.copy")}
                    </button>

                    <button className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center">
                      <Move className="w-4 h-4 mr-2" />
                      {t("fileCard.move")}
                    </button>

                    {file.permissions.delete && onDelete && (
                      <>
                        <div className="border-t border-gray-200 my-1"></div>
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            onDelete();
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {t("fileCard.delete")}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div
        className={`
          file-card-compact flex items-center p-2 rounded transition-colors cursor-pointer
          ${
            selected
              ? "bg-blue-50 ring-1 ring-blue-200"
              : "bg-white hover:bg-gray-50"
          }
          ${className}
        `}
        onClick={handleCardClick}
      >
        <div className="flex-shrink-0 mr-2">{getFileIcon("sm")}</div>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {file.name}
          </div>
        </div>

        {file.type === "file" && file.size && (
          <div className="flex-shrink-0 text-xs text-gray-500">
            {formatFileSize(file.size)}
          </div>
        )}
      </div>
    );
  }

  // Grid variant (default)
  return (
    <div
      className={`
        file-card-grid bg-white border rounded-lg p-4 transition-all cursor-pointer group
        ${
          selected
            ? "ring-2 ring-blue-500 bg-blue-50"
            : "hover:shadow-md hover:border-gray-300"
        }
        ${className}
      `}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {onSelect && (
            <input
              type="checkbox"
              checked={selected}
              onChange={handleSelectChange}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          )}

          {file.isStarred && (
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
          )}
          {file.isShared && <Share className="w-4 h-4 text-blue-500" />}
          {file.isLocked && <Lock className="w-4 h-4 text-gray-400" />}
        </div>

        {showActions && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Thumbnail/Icon */}
      <div className="flex justify-center mb-3">
        {showThumbnail && file.thumbnail ? (
          <img
            src={file.thumbnail}
            alt={file.name}
            className="w-16 h-16 object-cover rounded"
          />
        ) : (
          getFileIcon("lg")
        )}
      </div>

      {/* File Name */}
      <h3 className="text-sm font-medium text-gray-900 text-center truncate mb-2">
        {file.name}
      </h3>

      {/* Metadata */}
      {showMetadata && (
        <div className="text-xs text-gray-500 text-center space-y-1">
          {file.type === "file" && file.size && (
            <div>{formatFileSize(file.size)}</div>
          )}
          <div>{formatDate(file.modifiedAt)}</div>
          {file.version && (
            <div>
              {t("fileCard.version")} {file.version}
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {file.tags && file.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1 justify-center">
          {file.tags.slice(0, 3).map((tag, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                onTagClick?.(tag);
              }}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
            >
              {tag}
            </button>
          ))}
          {file.tags.length > 3 && (
            <span className="px-2 py-1 text-xs text-gray-500">
              +{file.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Quick Actions */}
      {showActions && (
        <div className="mt-3 flex justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {file.permissions.read && onDownload && file.downloadUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload();
              }}
              className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50"
              title={t("fileCard.download")}
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {file.permissions.share && onShare && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare();
              }}
              className="p-2 text-gray-400 hover:text-green-600 rounded-full hover:bg-green-50"
              title={t("fileCard.share")}
            >
              <Share className="w-4 h-4" />
            </button>
          )}

          {onToggleStar && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleStar();
              }}
              className={`p-2 rounded-full ${
                file.isStarred
                  ? "text-yellow-500 hover:bg-yellow-50"
                  : "text-gray-400 hover:text-yellow-500 hover:bg-yellow-50"
              }`}
              title={t("fileCard.toggleStar")}
            >
              <Star
                className={`w-4 h-4 ${file.isStarred ? "fill-current" : ""}`}
              />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FileCard;
