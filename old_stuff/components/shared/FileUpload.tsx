"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  CloudArrowUpIcon,
  DocumentIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  acceptedTypes?: string[];
  maxSizeInMB?: number;
  label?: string;
  description?: string;
  currentFile?: {
    name: string;
    url?: string;
    uploadProgress?: number;
  };
  uploading?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const defaultAcceptedTypes = [".jpg", ".jpeg", ".png", ".pdf"];
const defaultMaxSize = 10; // 10MB

export default function FileUpload({
  onFileSelect,
  onFileRemove,
  acceptedTypes = defaultAcceptedTypes,
  maxSizeInMB = defaultMaxSize,
  label,
  description,
  currentFile,
  uploading = false,
  error,
  disabled = false,
  className = "",
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      return `File size must be less than ${maxSizeInMB}MB`;
    }

    // Check file type - handle both MIME types and extensions
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    const fileMimeType = file.type;

    // Check if acceptedTypes contains MIME types or extensions
    const isValidType = acceptedTypes.some((type) => {
      if (type.includes("/")) {
        // It's a MIME type
        return fileMimeType === type;
      } else {
        // It's a file extension
        return fileExtension === type;
      }
    });

    if (!isValidType) {
      // Show user-friendly format based on what was passed
      const displayTypes = acceptedTypes.map((type) => {
        if (type.includes("/")) {
          // Convert MIME type to extension for display
          switch (type) {
            case "image/jpeg":
              return "JPG";
            case "image/png":
              return "PNG";
            case "application/pdf":
              return "PDF";
            default:
              return type;
          }
        } else {
          return type.toUpperCase().replace(".", "");
        }
      });
      return `File type must be one of: ${displayTypes.join(", ")}`;
    }

    return null;
  };

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const file = files[0];
      const validationError = validateFile(file);

      if (validationError) {
        // You might want to pass this error up through a callback
        console.error(validationError);
        // You could call an onError callback here if provided
        return;
      }

      onFileSelect(file);
    },
    [onFileSelect, maxSizeInMB, acceptedTypes]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled || uploading) return;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files);
      }
    },
    [disabled, uploading, handleFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (disabled || uploading) return;

      handleFileSelect(e.target.files);
    },
    [disabled, uploading, handleFileSelect]
  );

  const handleButtonClick = () => {
    if (disabled || uploading) return;
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    if (onFileRemove) {
      onFileRemove();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-colors
          ${dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300"}
          ${
            disabled || uploading
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer hover:border-gray-400"
          }
          ${error ? "border-red-300 bg-red-50" : ""}
        `}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(",")}
          onChange={handleInputChange}
          disabled={disabled || uploading}
          className="hidden"
        />

        {currentFile ? (
          /* File Selected State */
          <div className="text-center">
            <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-900">
                {currentFile.name}
              </p>

              {/* Upload Progress */}
              {uploading && typeof currentFile.uploadProgress === "number" && (
                <div className="mt-2">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${currentFile.uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {currentFile.uploadProgress}% uploaded
                  </p>
                </div>
              )}

              {/* Remove Button */}
              {!uploading && onFileRemove && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile();
                  }}
                  className="mt-2 inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
                >
                  <XMarkIcon className="h-3 w-3 mr-1" />
                  Remove
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Empty State */
          <div className="text-center">
            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-900">
                {uploading
                  ? "Uploading..."
                  : "Click to upload or drag and drop"}
              </p>
              <p className="text-xs text-gray-500">
                {acceptedTypes
                  .map((type) => {
                    if (type.includes("/")) {
                      switch (type) {
                        case "image/jpeg":
                          return "JPG";
                        case "image/png":
                          return "PNG";
                        case "application/pdf":
                          return "PDF";
                        default:
                          return type;
                      }
                    } else {
                      return type.toUpperCase().replace(".", "");
                    }
                  })
                  .join(", ")}{" "}
                up to {maxSizeInMB}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="mt-2 text-sm text-gray-500">{description}</p>
      )}

      {/* Error Message */}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
