import React, { useState, useRef, useCallback } from "react";
import { useTranslation } from "../../contexts/TranslationContext";

interface FileUploadProps {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "filled" | "outlined";
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
  accept?: string;
  multiple?: boolean;
  maxFileSize?: number; // in bytes
  maxFiles?: number;
  onFilesChange?: (files: File[]) => void;
  onFileUpload?: (file: File, progress: number) => void;
  onUploadComplete?: (file: File, response?: any) => void;
  onUploadError?: (file: File, error: string) => void;
  uploadUrl?: string;
  showProgress?: boolean;
  showPreview?: boolean;
  dragDropText?: string;
  browseText?: string;
  dropText?: string;
  removeText?: string;
  allowedTypes?: string[];
  customValidator?: (file: File) => string | null;
}

interface FileWithProgress {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
  preview?: string;
}

const FileIcon: React.FC<{ type: string; className?: string }> = ({
  type,
  className,
}) => {
  if (type.startsWith("image/")) {
    return (
      <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    );
  }
  if (type.includes("pdf")) {
    return (
      <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    );
  }
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
};

const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
    />
  </svg>
);

const RemoveIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  error,
  helperText,
  fullWidth = false,
  size = "md",
  variant = "default",
  disabled = false,
  required = false,
  className = "",
  id,
  accept,
  multiple = false,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 5,
  onFilesChange,
  onFileUpload,
  onUploadComplete,
  onUploadError,
  uploadUrl,
  showProgress = true,
  showPreview = true,
  dragDropText,
  browseText,
  dropText,
  removeText,
  allowedTypes = [],
  customValidator,
}) => {
  const { t } = useTranslation();
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: "min-h-32 text-sm",
    md: "min-h-40 text-base",
    lg: "min-h-48 text-lg",
  };

  const variantClasses = {
    default: "border-2 border-dashed border-gray-300 bg-white",
    filled: "border-2 border-dashed border-gray-300 bg-gray-50",
    outlined: "border-2 border-dashed border-gray-400 bg-transparent",
  };

  const validateFile = useCallback(
    (file: File): string | null => {
      if (customValidator) {
        const customError = customValidator(file);
        if (customError) return customError;
      }

      if (maxFileSize && file.size > maxFileSize) {
        return t("file_too_large", {
          size: (maxFileSize / 1024 / 1024).toFixed(1),
        });
      }

      if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
        return t("file_type_not_allowed");
      }

      return null;
    },
    [customValidator, maxFileSize, allowedTypes, t]
  );

  const createFilePreview = useCallback(
    (file: File): Promise<string | undefined> => {
      return new Promise((resolve) => {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        } else {
          resolve(undefined);
        }
      });
    },
    []
  );

  const addFiles = useCallback(
    async (newFiles: File[]) => {
      const validFiles: FileWithProgress[] = [];

      for (const file of newFiles) {
        if (files.length + validFiles.length >= maxFiles) {
          break;
        }

        const validationError = validateFile(file);
        if (validationError) {
          onUploadError?.(file, validationError);
          continue;
        }

        const preview = showPreview ? await createFilePreview(file) : undefined;

        validFiles.push({
          file,
          progress: 0,
          status: "pending",
          preview,
        });
      }

      if (validFiles.length > 0) {
        const updatedFiles = [...files, ...validFiles];
        setFiles(updatedFiles);
        onFilesChange?.(updatedFiles.map((f) => f.file));
      }
    },
    [
      files,
      maxFiles,
      validateFile,
      showPreview,
      createFilePreview,
      onFilesChange,
      onUploadError,
    ]
  );

  const removeFile = useCallback(
    (index: number) => {
      const updatedFiles = files.filter((_, i) => i !== index);
      setFiles(updatedFiles);
      onFilesChange?.(updatedFiles.map((f) => f.file));
    },
    [files, onFilesChange]
  );

  const uploadFile = useCallback(
    async (fileWithProgress: FileWithProgress, index: number) => {
      if (!uploadUrl) return;

      const formData = new FormData();
      formData.append("file", fileWithProgress.file);

      const updatedFiles = [...files];
      updatedFiles[index] = { ...fileWithProgress, status: "uploading" };
      setFiles(updatedFiles);

      try {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            updatedFiles[index] = { ...updatedFiles[index], progress };
            setFiles([...updatedFiles]);
            onFileUpload?.(fileWithProgress.file, progress);
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            updatedFiles[index] = {
              ...updatedFiles[index],
              status: "completed",
              progress: 100,
            };
            setFiles([...updatedFiles]);
            onUploadComplete?.(fileWithProgress.file, response);
          } else {
            throw new Error(xhr.responseText || "Upload failed");
          }
        };

        xhr.onerror = () => {
          throw new Error("Upload failed");
        };

        xhr.open("POST", uploadUrl);
        xhr.send(formData);
      } catch (error) {
        updatedFiles[index] = {
          ...updatedFiles[index],
          status: "error",
          error: error instanceof Error ? error.message : "Upload failed",
        };
        setFiles([...updatedFiles]);
        onUploadError?.(
          fileWithProgress.file,
          error instanceof Error ? error.message : "Upload failed"
        );
      }
    },
    [files, uploadUrl, onFileUpload, onUploadComplete, onUploadError]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (disabled) return;

      const droppedFiles = Array.from(e.dataTransfer.files);
      addFiles(droppedFiles);
    },
    [disabled, addFiles]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
      addFiles(selectedFiles);

      // Reset input value to allow re-selecting same file
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [addFiles]
  );

  const handleBrowseClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "pending":
        return "text-gray-500";
      case "uploading":
        return "text-blue-500";
      case "completed":
        return "text-green-500";
      case "error":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className={`${fullWidth ? "w-full" : ""} ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className={`block text-sm font-medium text-gray-700 mb-1 ${
            required ? "after:content-['*'] after:text-red-500 after:ml-1" : ""
          }`}
        >
          {label}
        </label>
      )}

      <div
        className={`
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${isDragOver ? "border-blue-500 bg-blue-50" : ""}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${error ? "border-red-500" : ""}
          ${fullWidth ? "w-full" : ""}
          rounded-lg transition-colors duration-200
          flex flex-col items-center justify-center p-6
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
        role="button"
        aria-label={label || t("upload_files")}
        tabIndex={disabled ? -1 : 0}
      >
        <input
          ref={fileInputRef}
          type="file"
          id={id}
          accept={accept}
          multiple={multiple}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        <UploadIcon className="w-12 h-12 text-gray-400 mb-4" />

        <div className="text-center">
          <p className="text-gray-600 mb-2">
            {isDragOver
              ? dropText || t("drop_files_here")
              : dragDropText || t("drag_drop_files_here")}
          </p>
          <p className="text-sm text-gray-500">
            {t("or")}{" "}
            <span className="text-blue-500 underline">
              {browseText || t("browse_files")}
            </span>
          </p>
          {(maxFileSize || allowedTypes.length > 0) && (
            <p className="text-xs text-gray-400 mt-2">
              {maxFileSize &&
                `${t("max_file_size")}: ${formatFileSize(maxFileSize)}`}
              {maxFileSize && allowedTypes.length > 0 && " | "}
              {allowedTypes.length > 0 &&
                `${t("accepted_types")}: ${allowedTypes.join(", ")}`}
            </p>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((fileWithProgress, index) => (
            <div
              key={`${fileWithProgress.file.name}-${index}`}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                {showPreview && fileWithProgress.preview ? (
                  <img
                    src={fileWithProgress.preview}
                    alt={fileWithProgress.file.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <FileIcon
                    type={fileWithProgress.file.type}
                    className="w-8 h-8 text-gray-400"
                  />
                )}

                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {fileWithProgress.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(fileWithProgress.file.size)}
                  </p>
                  {fileWithProgress.error && (
                    <p className="text-xs text-red-500 mt-1">
                      {fileWithProgress.error}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {showProgress && fileWithProgress.status === "uploading" && (
                  <div className="w-24">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${fileWithProgress.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round(fileWithProgress.progress)}%
                    </p>
                  </div>
                )}

                <span
                  className={`text-xs ${getStatusColor(
                    fileWithProgress.status
                  )}`}
                >
                  {t(fileWithProgress.status)}
                </span>

                {uploadUrl && fileWithProgress.status === "pending" && (
                  <button
                    type="button"
                    onClick={() => uploadFile(fileWithProgress, index)}
                    className="text-blue-500 hover:text-blue-700 text-sm"
                  >
                    {t("upload")}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                  aria-label={removeText || t("remove_file")}
                >
                  <RemoveIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-600">{helperText}</p>
      )}
    </div>
  );
};

export default FileUpload;
