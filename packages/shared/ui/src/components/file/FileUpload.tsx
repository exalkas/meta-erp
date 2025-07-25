"use client";

import React, { useState, useRef, useCallback } from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import {
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  File,
  Paperclip,
  Loader2,
} from "lucide-react";

export interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
  preview?: string;
}

export interface FileUploadProps {
  multiple?: boolean;
  accept?: string[];
  maxFileSize?: number; // in MB
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  variant?: "button" | "dropzone" | "inline";
  showPreview?: boolean;
  autoUpload?: boolean;
  onFileSelect?: (files: File[]) => void;
  onUpload?: (files: File[]) => Promise<void>;
  onProgress?: (file: File, progress: number) => void;
  onComplete?: (file: File, response?: any) => void;
  onError?: (file: File, error: string) => void;
  onRemove?: (file: File) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  multiple = false,
  accept = [],
  maxFileSize = 10,
  maxFiles = 5,
  disabled = false,
  className = "",
  variant = "button",
  showPreview = true,
  autoUpload = false,
  onFileSelect,
  onUpload,
  onProgress,
  onComplete,
  onError,
  onRemove,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const getFileIcon = (file: File) => {
    const type = file.type.split("/")[0];
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (type === "image") return <Image className="w-5 h-5 text-blue-500" />;
    if (type === "video") return <Video className="w-5 h-5 text-purple-500" />;
    if (type === "audio") return <Music className="w-5 h-5 text-green-500" />;
    if (extension && ["zip", "rar", "7z", "tar", "gz"].includes(extension)) {
      return <Archive className="w-5 h-5 text-orange-500" />;
    }
    if (extension && ["pdf", "doc", "docx", "txt", "rtf"].includes(extension)) {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (maxFileSize && file.size > maxFileSize * 1024 * 1024) {
      return t("fileUpload.errors.fileTooBig", {
        variables: { max: maxFileSize },
      });
    }

    if (accept.length > 0) {
      const fileType = file.type;
      const fileName = file.name.toLowerCase();
      const isValid = accept.some((acceptType) => {
        if (acceptType.startsWith(".")) {
          return fileName.endsWith(acceptType.toLowerCase());
        }
        if (acceptType.includes("*")) {
          const [type] = acceptType.split("/");
          return fileType.startsWith(type);
        }
        return fileType === acceptType;
      });

      if (!isValid) {
        return t("fileUpload.errors.invalidType", {
          variables: { types: accept.join(", ") },
        });
      }
    }

    return null;
  };

  const createPreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith("image/")) {
        resolve(undefined);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(file);
    });
  };

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);

    // Check max files limit
    if (maxFiles && uploadFiles.length + fileArray.length > maxFiles) {
      onError?.(
        fileArray[0],
        t("fileUpload.errors.tooManyFiles", { variables: { max: maxFiles } })
      );
      return;
    }

    const newUploadFiles: UploadFile[] = [];

    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        onError?.(file, error);
        continue;
      }

      const preview = showPreview ? await createPreview(file) : undefined;

      newUploadFiles.push({
        id: generateId(),
        file,
        progress: 0,
        status: "pending",
        preview,
      });
    }

    if (newUploadFiles.length === 0) return;

    setUploadFiles((prev) => [...prev, ...newUploadFiles]);

    const validFiles = newUploadFiles.map((uf) => uf.file);
    onFileSelect?.(validFiles);

    if (autoUpload && onUpload) {
      handleUpload(validFiles);
    }
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input value to allow selecting the same file again
    event.target.value = "";
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleUpload = async (files?: File[]) => {
    if (!onUpload) return;

    const filesToUpload = files || uploadFiles.map((uf) => uf.file);

    try {
      await onUpload(filesToUpload);

      setUploadFiles((prev) =>
        prev.map((uf) =>
          filesToUpload.includes(uf.file)
            ? { ...uf, status: "completed", progress: 100 }
            : uf
        )
      );

      filesToUpload.forEach((file) => onComplete?.(file));
    } catch (error) {
      setUploadFiles((prev) =>
        prev.map((uf) =>
          filesToUpload.includes(uf.file)
            ? {
                ...uf,
                status: "error",
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : uf
        )
      );

      filesToUpload.forEach((file) =>
        onError?.(
          file,
          error instanceof Error ? error.message : "Upload failed"
        )
      );
    }
  };

  const handleRemoveFile = (uploadFile: UploadFile) => {
    setUploadFiles((prev) => prev.filter((uf) => uf.id !== uploadFile.id));
    onRemove?.(uploadFile.file);
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const hasFiles = uploadFiles.length > 0;
  const canUpload =
    hasFiles &&
    uploadFiles.some((uf) => uf.status === "pending") &&
    onUpload &&
    !autoUpload;

  if (variant === "dropzone") {
    return (
      <div className={`file-upload-dropzone ${className}`}>
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={openFileDialog}
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${
              isDragOver
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t("fileUpload.dropzone.title")}
          </h3>
          <p className="text-gray-600 mb-4">
            {t("fileUpload.dropzone.description")}
          </p>
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            disabled={disabled}
          >
            {t("fileUpload.selectFiles")}
          </button>

          <div className="mt-4 text-sm text-gray-500">
            {accept.length > 0 && (
              <p>
                {t("fileUpload.acceptedTypes")}: {accept.join(", ")}
              </p>
            )}
            {maxFileSize && (
              <p>
                {t("fileUpload.maxSize")}: {maxFileSize}MB
              </p>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept.join(",")}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        {/* File List */}
        {hasFiles && (
          <div className="mt-4 space-y-2">
            {uploadFiles.map((uploadFile) => (
              <div
                key={uploadFile.id}
                className="flex items-center p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-shrink-0 mr-3">
                  {uploadFile.preview ? (
                    <img
                      src={uploadFile.preview}
                      alt={uploadFile.file.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    getFileIcon(uploadFile.file)
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {uploadFile.file.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatFileSize(uploadFile.file.size)}
                  </div>

                  {uploadFile.status === "uploading" && (
                    <div className="mt-1">
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div
                          className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${uploadFile.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {uploadFile.error && (
                    <div className="text-xs text-red-600 mt-1">
                      {uploadFile.error}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {uploadFile.status === "completed" && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {uploadFile.status === "error" && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  {uploadFile.status === "uploading" && (
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  )}

                  <button
                    onClick={() => handleRemoveFile(uploadFile)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                    disabled={uploadFile.status === "uploading"}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {canUpload && (
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => handleUpload()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {t("fileUpload.uploadAll")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className={`file-upload-inline ${className}`}>
        <div className="flex items-center space-x-2">
          <button
            onClick={openFileDialog}
            disabled={disabled}
            className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Paperclip className="w-4 h-4 mr-2" />
            {t("fileUpload.attach")}
          </button>

          {hasFiles && (
            <span className="text-sm text-gray-600">
              {uploadFiles.length} {t("fileUpload.filesSelected")}
            </span>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept.join(",")}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />
      </div>
    );
  }

  // Default button variant
  return (
    <div className={`file-upload-button ${className}`}>
      <button
        onClick={openFileDialog}
        disabled={disabled}
        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        <Upload className="w-4 h-4 mr-2" />
        {multiple ? t("fileUpload.selectFiles") : t("fileUpload.selectFile")}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept.join(",")}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
};

export default FileUpload;
