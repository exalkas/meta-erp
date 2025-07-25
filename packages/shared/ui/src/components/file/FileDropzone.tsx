"use client";

import React, { useState, useRef, useCallback } from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import {
  Upload,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";

export interface FileDropzoneProps {
  onFileDrop?: (files: File[]) => void;
  onFileReject?: (files: File[], errors: string[]) => void;
  accept?: string[];
  maxFiles?: number;
  maxFileSize?: number; // in MB
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  showFileList?: boolean;
  autoProcess?: boolean;
}

interface RejectedFile {
  file: File;
  error: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFileDrop,
  onFileReject,
  accept = [],
  maxFiles = 10,
  maxFileSize = 10,
  multiple = true,
  disabled = false,
  className = "",
  children,
  showFileList = true,
  autoProcess = true,
}) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isDragAccept, setIsDragAccept] = useState(false);
  const [isDragReject, setIsDragReject] = useState(false);
  const [acceptedFiles, setAcceptedFiles] = useState<File[]>([]);
  const [rejectedFiles, setRejectedFiles] = useState<RejectedFile[]>([]);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (maxFileSize && file.size > maxFileSize * 1024 * 1024) {
      return t("fileDropzone.errors.fileTooBig", {
        variables: {
          fileName: file.name,
          maxSize: maxFileSize,
        },
      });
    }

    // Check file type
    if (accept.length > 0) {
      const fileType = file.type;
      const fileName = file.name.toLowerCase();

      const isAccepted = accept.some((acceptType) => {
        if (acceptType.startsWith(".")) {
          return fileName.endsWith(acceptType.toLowerCase());
        }
        if (acceptType.includes("*")) {
          const [type] = acceptType.split("/");
          return fileType.startsWith(type);
        }
        return fileType === acceptType;
      });

      if (!isAccepted) {
        return t("fileDropzone.errors.invalidFileType", {
          variables: {
            fileName: file.name,
            acceptedTypes: accept.join(", "),
          },
        });
      }
    }

    return null;
  };

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);

      if (!multiple && fileArray.length > 1) {
        onFileReject?.(fileArray, [
          t("fileDropzone.errors.multipleNotAllowed"),
        ]);
        return;
      }

      if (maxFiles && fileArray.length > maxFiles) {
        onFileReject?.(fileArray, [
          t("fileDropzone.errors.tooManyFiles", { variables: { maxFiles } }),
        ]);
        return;
      }

      const accepted: File[] = [];
      const rejected: RejectedFile[] = [];

      fileArray.forEach((file) => {
        const error = validateFile(file);
        if (error) {
          rejected.push({ file, error });
        } else {
          accepted.push(file);
        }
      });

      if (autoProcess) {
        setAcceptedFiles((prev) => [...prev, ...accepted]);
        setRejectedFiles((prev) => [...prev, ...rejected]);
      }

      if (accepted.length > 0) {
        onFileDrop?.(accepted);
      }

      if (rejected.length > 0) {
        onFileReject?.(
          rejected.map((r) => r.file),
          rejected.map((r) => r.error)
        );
      }
    },
    [
      accept,
      maxFiles,
      maxFileSize,
      multiple,
      onFileDrop,
      onFileReject,
      autoProcess,
      t,
    ]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      setIsDragActive(false);
      setIsDragAccept(false);
      setIsDragReject(false);

      if (disabled) return;

      const { files } = event.dataTransfer;
      processFiles(files);
    },
    [disabled, processFiles]
  );

  const handleDragEnter = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (disabled) return;

      setIsDragActive(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      // Only set drag state to false if we're leaving the dropzone entirely
      if (!event.currentTarget.contains(event.relatedTarget as Node)) {
        setIsDragActive(false);
        setIsDragAccept(false);
        setIsDragReject(false);
      }
    },
    []
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      if (disabled) return;

      const { items } = event.dataTransfer;
      const hasFiles = Array.from(items).some((item) => item.kind === "file");

      if (hasFiles) {
        setIsDragAccept(true);
        setIsDragReject(false);
      } else {
        setIsDragAccept(false);
        setIsDragReject(true);
      }
    },
    [disabled]
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { files } = event.target;
      if (files) {
        processFiles(files);
      }
      // Reset input value
      event.target.value = "";
    },
    [processFiles]
  );

  const openFileDialog = useCallback(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.click();
    }
  }, [disabled]);

  const removeAcceptedFile = useCallback((index: number) => {
    setAcceptedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const removeRejectedFile = useCallback((index: number) => {
    setRejectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const getFileIcon = (file: File) => {
    const type = file.type.split("/")[0];
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (type === "image") return <Image className="w-4 h-4 text-blue-500" />;
    if (type === "video") return <Video className="w-4 h-4 text-purple-500" />;
    if (type === "audio") return <Music className="w-4 h-4 text-green-500" />;
    if (extension && ["zip", "rar", "7z", "tar", "gz"].includes(extension)) {
      return <Archive className="w-4 h-4 text-orange-500" />;
    }
    return <FileText className="w-4 h-4 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getBorderColor = () => {
    if (isDragReject) return "border-red-400 bg-red-50";
    if (isDragAccept) return "border-green-400 bg-green-50";
    if (isDragActive) return "border-blue-400 bg-blue-50";
    return "border-gray-300 hover:border-gray-400";
  };

  const getTextColor = () => {
    if (isDragReject) return "text-red-600";
    if (isDragAccept) return "text-green-600";
    if (isDragActive) return "text-blue-600";
    return "text-gray-600";
  };

  return (
    <div className={`file-dropzone ${className}`}>
      <div
        onDrop={handleDrop}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onClick={openFileDialog}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200
          ${getBorderColor()}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept.join(",")}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />

        {children || (
          <>
            <Upload className={`w-12 h-12 mx-auto mb-4 ${getTextColor()}`} />

            <div className={`text-lg font-medium mb-2 ${getTextColor()}`}>
              {isDragActive
                ? isDragAccept
                  ? t("fileDropzone.dropToUpload")
                  : t("fileDropzone.filesNotSupported")
                : t("fileDropzone.dragDropFiles")}
            </div>

            <p className="text-gray-500 mb-4">
              {t("fileDropzone.orClickToSelect")}
            </p>

            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation();
                openFileDialog();
              }}
            >
              {multiple
                ? t("fileDropzone.selectFiles")
                : t("fileDropzone.selectFile")}
            </button>

            {(accept.length > 0 || maxFileSize) && (
              <div className="mt-4 text-sm text-gray-500 space-y-1">
                {accept.length > 0 && (
                  <p>
                    {t("fileDropzone.acceptedTypes")}: {accept.join(", ")}
                  </p>
                )}
                {maxFileSize && (
                  <p>
                    {t("fileDropzone.maxFileSize")}: {maxFileSize}MB
                  </p>
                )}
                {maxFiles && multiple && (
                  <p>
                    {t("fileDropzone.maxFiles")}: {maxFiles}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* File Lists */}
      {showFileList &&
        (acceptedFiles.length > 0 || rejectedFiles.length > 0) && (
          <div className="mt-4 space-y-4">
            {/* Accepted Files */}
            {acceptedFiles.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  {t("fileDropzone.acceptedFiles")} ({acceptedFiles.length})
                </h4>
                <div className="space-y-2">
                  {acceptedFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div className="flex-shrink-0 mr-3">
                        {getFileIcon(file)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </div>
                      </div>
                      <button
                        onClick={() => removeAcceptedFile(index)}
                        className="ml-2 p-1 text-gray-400 hover:text-red-600 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rejected Files */}
            {rejectedFiles.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                  <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                  {t("fileDropzone.rejectedFiles")} ({rejectedFiles.length})
                </h4>
                <div className="space-y-2">
                  {rejectedFiles.map(({ file, error }, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <div className="flex-shrink-0 mr-3">
                        {getFileIcon(file)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </div>
                        <div className="text-xs text-red-600">{error}</div>
                      </div>
                      <button
                        onClick={() => removeRejectedFile(index)}
                        className="ml-2 p-1 text-gray-400 hover:text-red-600 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
    </div>
  );
};

export default FileDropzone;
