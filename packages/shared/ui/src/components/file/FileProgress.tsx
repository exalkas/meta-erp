"use client";

import React from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import {
  Upload,
  Download,
  File,
  CheckCircle,
  AlertCircle,
  X,
  Pause,
  Play,
  RotateCcw,
  Clock,
  Loader2,
} from "lucide-react";

export interface FileProgressItem {
  id: string;
  name: string;
  size: number;
  progress: number; // 0-100
  speed?: number; // bytes per second
  status:
    | "pending"
    | "uploading"
    | "downloading"
    | "paused"
    | "completed"
    | "error"
    | "cancelled";
  type: "upload" | "download";
  error?: string;
  estimatedTime?: number; // seconds remaining
  startTime?: Date;
  completedTime?: Date;
}

export interface FileProgressProps {
  items: FileProgressItem[];
  showDetails?: boolean;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
  onPause?: (item: FileProgressItem) => void;
  onResume?: (item: FileProgressItem) => void;
  onCancel?: (item: FileProgressItem) => void;
  onRetry?: (item: FileProgressItem) => void;
  onRemove?: (item: FileProgressItem) => void;
  onClearCompleted?: () => void;
}

export const FileProgress: React.FC<FileProgressProps> = ({
  items,
  showDetails = true,
  showActions = true,
  compact = false,
  className = "",
  onPause,
  onResume,
  onCancel,
  onRetry,
  onRemove,
  onClearCompleted,
}) => {
  const { t } = useTranslation();

  const formatFileSize = (bytes: number) => {
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number) => {
    return formatFileSize(bytesPerSecond) + "/s";
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStatusIcon = (item: FileProgressItem) => {
    switch (item.status) {
      case "uploading":
      case "downloading":
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case "paused":
        return <Pause className="w-4 h-4 text-yellow-500" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "cancelled":
        return <X className="w-4 h-4 text-gray-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-gray-400" />;
      default:
        return <File className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "uploading":
      case "downloading":
        return "bg-blue-500";
      case "paused":
        return "bg-yellow-500";
      case "completed":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "cancelled":
        return "bg-gray-500";
      default:
        return "bg-gray-300";
    }
  };

  const getTypeIcon = (type: string) => {
    return type === "upload" ? (
      <Upload className="w-4 h-4 text-gray-500" />
    ) : (
      <Download className="w-4 h-4 text-gray-500" />
    );
  };

  const completedItems = items.filter((item) => item.status === "completed");
  const activeItems = items.filter((item) =>
    ["pending", "uploading", "downloading", "paused", "error"].includes(
      item.status
    )
  );

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={`file-progress ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {t("fileProgress.title")}
        </h3>

        {completedItems.length > 0 && onClearCompleted && (
          <button
            onClick={onClearCompleted}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            {t("fileProgress.clearCompleted")} ({completedItems.length})
          </button>
        )}
      </div>

      {/* Progress Items */}
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`
              bg-white border rounded-lg p-3 transition-all
              ${
                item.status === "error"
                  ? "border-red-200 bg-red-50"
                  : "border-gray-200"
              }
              ${compact ? "p-2" : ""}
            `}
          >
            <div className="flex items-start space-x-3">
              {/* Type Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {getTypeIcon(item.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* File Info */}
                <div className="flex items-center space-x-2 mb-2">
                  <div className="flex-shrink-0">{getStatusIcon(item)}</div>

                  <div className="flex-1 min-w-0">
                    <h4
                      className={`font-medium text-gray-900 truncate ${
                        compact ? "text-sm" : ""
                      }`}
                    >
                      {item.name}
                    </h4>

                    {showDetails && !compact && (
                      <div className="text-xs text-gray-500 mt-1">
                        {formatFileSize(item.size)}
                        {item.speed &&
                          item.status ===
                            (item.type === "upload"
                              ? "uploading"
                              : "downloading") && (
                            <> • {formatSpeed(item.speed)}</>
                          )}
                        {item.estimatedTime &&
                          item.status ===
                            (item.type === "upload"
                              ? "uploading"
                              : "downloading") && (
                            <>
                              {" "}
                              • {formatTime(item.estimatedTime)}{" "}
                              {t("fileProgress.remaining")}
                            </>
                          )}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div
                      className={`text-sm font-medium ${
                        compact ? "text-xs" : ""
                      }`}
                    >
                      {item.progress}%
                    </div>
                    {item.status === "completed" &&
                      item.completedTime &&
                      showDetails && (
                        <div className="text-xs text-gray-500">
                          {new Intl.DateTimeFormat("el-GR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(item.completedTime)}
                        </div>
                      )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getStatusColor(
                        item.status
                      )}`}
                      style={{
                        width: `${Math.max(0, Math.min(100, item.progress))}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Error Message */}
                {item.error && (
                  <div className="text-sm text-red-600 mb-2">{item.error}</div>
                )}

                {/* Status Text */}
                <div className="text-xs text-gray-600">
                  {t(`fileProgress.status.${item.status}`)}
                  {item.status === "completed" &&
                    item.startTime &&
                    item.completedTime && (
                      <span className="ml-2">
                        (
                        {formatTime(
                          (item.completedTime.getTime() -
                            item.startTime.getTime()) /
                            1000
                        )}
                        )
                      </span>
                    )}
                </div>
              </div>

              {/* Actions */}
              {showActions && (
                <div className="flex-shrink-0 flex items-center space-x-1">
                  {item.status === "uploading" ||
                  item.status === "downloading" ? (
                    <button
                      onClick={() => onPause?.(item)}
                      className="p-1 text-gray-400 hover:text-yellow-600 rounded"
                      title={t("fileProgress.pause")}
                    >
                      <Pause className="w-4 h-4" />
                    </button>
                  ) : item.status === "paused" ? (
                    <button
                      onClick={() => onResume?.(item)}
                      className="p-1 text-gray-400 hover:text-blue-600 rounded"
                      title={t("fileProgress.resume")}
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  ) : null}

                  {item.status === "error" && onRetry && (
                    <button
                      onClick={() => onRetry(item)}
                      className="p-1 text-gray-400 hover:text-green-600 rounded"
                      title={t("fileProgress.retry")}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}

                  {(item.status === "pending" ||
                    item.status === "uploading" ||
                    item.status === "downloading" ||
                    item.status === "paused") &&
                    onCancel && (
                      <button
                        onClick={() => onCancel(item)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        title={t("fileProgress.cancel")}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}

                  {(item.status === "completed" ||
                    item.status === "error" ||
                    item.status === "cancelled") &&
                    onRemove && (
                      <button
                        onClick={() => onRemove(item)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        title={t("fileProgress.remove")}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      {showDetails && activeItems.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            {activeItems.length} {t("fileProgress.activeTransfers")}
            {activeItems.some((item) => item.speed) && (
              <>
                {" • "}
                {t("fileProgress.totalSpeed")}:{" "}
                {formatSpeed(
                  activeItems.reduce(
                    (total, item) => total + (item.speed || 0),
                    0
                  )
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileProgress;
