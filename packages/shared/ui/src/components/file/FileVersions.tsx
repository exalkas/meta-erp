"use client";

import { useState } from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Tooltip } from "../ui/Tooltip";
import {
  History,
  Download,
  RotateCcw,
  Eye,
  GitCompare,
  MoreHorizontal,
  Clock,
  User,
  FileText,
  Tag,
  Calendar,
  HardDrive,
  Trash2,
  Star,
  Copy,
  Share2,
  Lock,
  AlertCircle,
  CheckCircle,
  Zap,
} from "lucide-react";

// Simple utility function for className concatenation
const cn = (...classes: (string | undefined | null | boolean)[]) => {
  return classes.filter(Boolean).join(" ");
};

export interface FileVersion {
  id: string;
  version: number;
  name: string;
  size: number;
  createdAt: Date;
  createdBy: string;
  createdByEmail: string;
  comment?: string;
  tags?: string[];
  isStarred?: boolean;
  isCurrent?: boolean;
  isDeleted?: boolean;
  changeType?: "created" | "updated" | "renamed" | "moved" | "restored";
  checksumMd5?: string;
  checksumSha256?: string;
  downloadUrl?: string;
  previewUrl?: string;
  diff?: {
    additions: number;
    deletions: number;
    changes: number;
  };
  metadata?: {
    [key: string]: any;
  };
}

interface FileVersionsProps {
  fileId: string;
  fileName: string;
  versions: FileVersion[];
  currentVersion?: string;
  onVersionAction?: (action: string, version: FileVersion) => void;
  onVersionCompare?: (version1: FileVersion, version2: FileVersion) => void;
  onVersionRestore?: (version: FileVersion) => void;
  onVersionDelete?: (version: FileVersion) => void;
  onVersionDownload?: (version: FileVersion) => void;
  onVersionPreview?: (version: FileVersion) => void;
  maxVersions?: number;
  showDiffs?: boolean;
  showMetadata?: boolean;
  showActions?: boolean;
  loading?: boolean;
  error?: string;
  className?: string;
}

const formatFileSize = (bytes: number) => {
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat("el-GR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getChangeTypeIcon = (changeType?: string) => {
  switch (changeType) {
    case "created":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "updated":
      return <Zap className="h-4 w-4 text-blue-500" />;
    case "renamed":
      return <FileText className="h-4 w-4 text-yellow-500" />;
    case "moved":
      return <Copy className="h-4 w-4 text-purple-500" />;
    case "restored":
      return <RotateCcw className="h-4 w-4 text-green-500" />;
    default:
      return <FileText className="h-4 w-4 text-gray-500" />;
  }
};

const getChangeTypeLabel = (t: any, changeType?: string) => {
  switch (changeType) {
    case "created":
      return t("files.versions.created");
    case "updated":
      return t("files.versions.updated");
    case "renamed":
      return t("files.versions.renamed");
    case "moved":
      return t("files.versions.moved");
    case "restored":
      return t("files.versions.restored");
    default:
      return t("files.versions.modified");
  }
};

export const FileVersions = ({
  fileId,
  fileName,
  versions,
  currentVersion,
  onVersionAction,
  onVersionCompare,
  onVersionRestore,
  onVersionDelete,
  onVersionDownload,
  onVersionPreview,
  maxVersions = 50,
  showDiffs = true,
  showMetadata = false,
  showActions = true,
  loading = false,
  error,
  className,
}: FileVersionsProps) => {
  const { t } = useTranslation();
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [expandedVersions, setExpandedVersions] = useState<string[]>([]);

  const sortedVersions = [...versions]
    .sort((a, b) => b.version - a.version)
    .slice(0, maxVersions);

  const handleVersionSelect = (versionId: string) => {
    setSelectedVersions((prev) => {
      if (prev.includes(versionId)) {
        return prev.filter((id) => id !== versionId);
      } else if (prev.length < 2) {
        return [...prev, versionId];
      } else {
        return [prev[1], versionId];
      }
    });
  };

  const handleVersionExpand = (versionId: string) => {
    setExpandedVersions((prev) => {
      if (prev.includes(versionId)) {
        return prev.filter((id) => id !== versionId);
      } else {
        return [...prev, versionId];
      }
    });
  };

  const handleCompareVersions = () => {
    if (selectedVersions.length === 2) {
      const version1 = versions.find((v) => v.id === selectedVersions[0]);
      const version2 = versions.find((v) => v.id === selectedVersions[1]);
      if (version1 && version2) {
        onVersionCompare?.(version1, version2);
      }
    }
  };

  const handleVersionAction = (action: string, version: FileVersion) => {
    switch (action) {
      case "download":
        onVersionDownload?.(version);
        break;
      case "preview":
        onVersionPreview?.(version);
        break;
      case "restore":
        onVersionRestore?.(version);
        break;
      case "compare":
        handleVersionSelect(version.id);
        break;
      case "delete":
        onVersionDelete?.(version);
        break;
      default:
        onVersionAction?.(action, version);
    }
  };

  if (loading) {
    return (
      <Card className={cn("w-full", className)}>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <History className="h-5 w-5" />
            <h3 className="text-lg font-semibold">
              {t("files.versions.title")}
            </h3>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 border rounded-lg"
              >
                <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <History className="h-5 w-5" />
            <h3 className="text-lg font-semibold">
              {t("files.versions.title")}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <h3 className="text-lg font-semibold">
              {t("files.versions.title")}
            </h3>
            <Badge variant="secondary">{versions.length}</Badge>
          </div>
          {selectedVersions.length === 2 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCompareVersions}
              className="flex items-center gap-2"
            >
              <GitCompare className="h-4 w-4" />
              {t("files.versions.compare")}
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          <div className="space-y-2">
            {sortedVersions.map((version, index) => (
              <div
                key={version.id}
                className={cn(
                  "border rounded-lg p-3 transition-colors",
                  version.isCurrent && "bg-blue-50 border-blue-200",
                  version.isDeleted && "bg-red-50 border-red-200 opacity-75",
                  selectedVersions.includes(version.id) &&
                    "bg-yellow-50 border-yellow-200"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Version Avatar */}
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          v{version.version}
                        </span>
                      </div>
                    </div>

                    {/* Version Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getChangeTypeIcon(version.changeType)}
                        <span className="text-sm font-medium">
                          {getChangeTypeLabel(t, version.changeType)}
                        </span>
                        {version.isCurrent && (
                          <Badge variant="default" className="text-xs">
                            {t("files.versions.current")}
                          </Badge>
                        )}
                        {version.isStarred && (
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {version.createdBy}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(version.createdAt)}
                        </div>
                        <div className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {formatFileSize(version.size)}
                        </div>
                      </div>

                      {version.comment && (
                        <p className="text-sm text-gray-700 mb-2">
                          {version.comment}
                        </p>
                      )}

                      {showDiffs && version.diff && (
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                          <span className="text-green-600">
                            +{version.diff.additions} additions
                          </span>
                          <span className="text-red-600">
                            -{version.diff.deletions} deletions
                          </span>
                          <span className="text-blue-600">
                            {version.diff.changes} changes
                          </span>
                        </div>
                      )}

                      {version.tags && version.tags.length > 0 && (
                        <div className="flex items-center gap-1 mb-2">
                          <Tag className="h-3 w-3 text-gray-400" />
                          <div className="flex flex-wrap gap-1">
                            {version.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {showMetadata &&
                        version.metadata &&
                        expandedVersions.includes(version.id) && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(version.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Actions */}
                  {showActions && (
                    <div className="flex items-center gap-1">
                      <Tooltip content={t("files.versions.selectForCompare")}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleVersionSelect(version.id)}
                          disabled={version.isDeleted}
                        >
                          <input
                            type="checkbox"
                            checked={selectedVersions.includes(version.id)}
                            onChange={() => {}}
                            className="h-3 w-3"
                          />
                        </Button>
                      </Tooltip>

                      <div className="flex items-center gap-1">
                        <Tooltip content={t("files.versions.download")}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() =>
                              handleVersionAction("download", version)
                            }
                            disabled={!version.downloadUrl}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </Tooltip>

                        <Tooltip content={t("files.versions.preview")}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() =>
                              handleVersionAction("preview", version)
                            }
                            disabled={!version.previewUrl}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Tooltip>

                        <Tooltip content={t("files.versions.restore")}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() =>
                              handleVersionAction("restore", version)
                            }
                            disabled={version.isCurrent || version.isDeleted}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </Tooltip>

                        <Tooltip content={t("files.versions.delete")}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() =>
                              handleVersionAction("delete", version)
                            }
                            disabled={version.isCurrent || version.isDeleted}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </Tooltip>

                        {showMetadata && version.metadata && (
                          <Tooltip
                            content={
                              expandedVersions.includes(version.id)
                                ? t("files.versions.hideMetadata")
                                : t("files.versions.showMetadata")
                            }
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleVersionExpand(version.id)}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Connection Line */}
                {index < sortedVersions.length - 1 && (
                  <div className="ml-4 mt-2 border-l-2 border-gray-200 h-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {versions.length > maxVersions && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              {t("files.versions.loadMore")}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
