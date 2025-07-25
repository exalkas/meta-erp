import React, { useState, useRef, useCallback } from "react";
import { useTranslation } from "../../contexts/TranslationContext";

interface ImageUploadProps {
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
  multiple?: boolean;
  maxFileSize?: number; // in bytes
  maxFiles?: number;
  onImagesChange?: (files: File[]) => void;
  onImageUpload?: (file: File, progress: number) => void;
  onUploadComplete?: (file: File, response?: any) => void;
  onUploadError?: (file: File, error: string) => void;
  uploadUrl?: string;
  showProgress?: boolean;
  dragDropText?: string;
  browseText?: string;
  dropText?: string;
  removeText?: string;
  allowedTypes?: string[];
  customValidator?: (file: File) => string | null;
  aspectRatio?: number; // width/height ratio for crop
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1 for image quality
  outputFormat?: "jpeg" | "png" | "webp";
  showCrop?: boolean;
  showPreview?: boolean;
  previewSize?: "sm" | "md" | "lg";
  gridView?: boolean;
}

interface ImageWithProgress {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
  preview: string;
  originalFile?: File;
}

const ImageIcon: React.FC<{ className?: string }> = ({ className }) => (
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

const EditIcon: React.FC<{ className?: string }> = ({ className }) => (
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
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
    />
  </svg>
);

export const ImageUpload: React.FC<ImageUploadProps> = ({
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
  multiple = false,
  maxFileSize = 5 * 1024 * 1024, // 5MB default for images
  maxFiles = 10,
  onImagesChange,
  onImageUpload,
  onUploadComplete,
  onUploadError,
  uploadUrl,
  showProgress = true,
  dragDropText,
  browseText,
  dropText,
  removeText,
  allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"],
  customValidator,
  aspectRatio,
  minWidth = 100,
  minHeight = 100,
  maxWidth = 2048,
  maxHeight = 2048,
  quality = 0.8,
  outputFormat = "jpeg",
  showCrop = false,
  showPreview = true,
  previewSize = "md",
  gridView = false,
}) => {
  const { t } = useTranslation();
  const [images, setImages] = useState<ImageWithProgress[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [cropImageIndex, setCropImageIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: "min-h-32 text-sm",
    md: "min-h-40 text-base",
    lg: "min-h-48 text-lg",
  };

  const previewSizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const variantClasses = {
    default: "border-2 border-dashed border-gray-300 bg-white",
    filled: "border-2 border-dashed border-gray-300 bg-gray-50",
    outlined: "border-2 border-dashed border-gray-400 bg-transparent",
  };

  const validateImage = useCallback(
    (file: File): string | null => {
      if (customValidator) {
        const customError = customValidator(file);
        if (customError) return customError;
      }

      if (!file.type.startsWith("image/")) {
        return t("not_an_image");
      }

      if (maxFileSize && file.size > maxFileSize) {
        return t("file_too_large", {
          size: (maxFileSize / 1024 / 1024).toFixed(1),
        });
      }

      if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
        return t("image_type_not_allowed");
      }

      return null;
    },
    [customValidator, maxFileSize, allowedTypes, t]
  );

  const validateImageDimensions = useCallback(
    (img: HTMLImageElement): string | null => {
      if (minWidth && img.width < minWidth) {
        return t("image_too_small", { width: minWidth, height: minHeight });
      }
      if (minHeight && img.height < minHeight) {
        return t("image_too_small", { width: minWidth, height: minHeight });
      }
      if (maxWidth && img.width > maxWidth) {
        return t("image_too_large", { width: maxWidth, height: maxHeight });
      }
      if (maxHeight && img.height > maxHeight) {
        return t("image_too_large", { width: maxWidth, height: maxHeight });
      }
      return null;
    },
    [minWidth, minHeight, maxWidth, maxHeight, t]
  );

  const createImagePreview = useCallback(
    (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const dimensionError = validateImageDimensions(img);
            if (dimensionError) {
              reject(dimensionError);
              return;
            }
            resolve(e.target?.result as string);
          };
          img.onerror = () => reject(t("failed_to_load_image"));
          img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(t("failed_to_read_file"));
        reader.readAsDataURL(file);
      });
    },
    [validateImageDimensions, t]
  );

  const resizeImage = useCallback(
    (file: File, maxWidth: number, maxHeight: number): Promise<File> => {
      return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
          let { width, height } = img;

          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const resizedFile = new File([blob], file.name, {
                  type: `image/${outputFormat}`,
                  lastModified: Date.now(),
                });
                resolve(resizedFile);
              } else {
                resolve(file);
              }
            },
            `image/${outputFormat}`,
            quality
          );
        };

        img.src = URL.createObjectURL(file);
      });
    },
    [outputFormat, quality]
  );

  const addImages = useCallback(
    async (newFiles: File[]) => {
      const validImages: ImageWithProgress[] = [];

      for (const file of newFiles) {
        if (images.length + validImages.length >= maxFiles) {
          break;
        }

        const validationError = validateImage(file);
        if (validationError) {
          onUploadError?.(file, validationError);
          continue;
        }

        try {
          const preview = await createImagePreview(file);

          validImages.push({
            file,
            progress: 0,
            status: "pending",
            preview,
            originalFile: file,
          });
        } catch (error) {
          onUploadError?.(file, error as string);
        }
      }

      if (validImages.length > 0) {
        const updatedImages = [...images, ...validImages];
        setImages(updatedImages);
        onImagesChange?.(updatedImages.map((img) => img.file));
      }
    },
    [
      images,
      maxFiles,
      validateImage,
      createImagePreview,
      onImagesChange,
      onUploadError,
    ]
  );

  const removeImage = useCallback(
    (index: number) => {
      const updatedImages = images.filter((_, i) => i !== index);
      setImages(updatedImages);
      onImagesChange?.(updatedImages.map((img) => img.file));
    },
    [images, onImagesChange]
  );

  const uploadImage = useCallback(
    async (imageWithProgress: ImageWithProgress, index: number) => {
      if (!uploadUrl) return;

      const formData = new FormData();
      formData.append("image", imageWithProgress.file);

      const updatedImages = [...images];
      updatedImages[index] = { ...imageWithProgress, status: "uploading" };
      setImages(updatedImages);

      try {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            updatedImages[index] = { ...updatedImages[index], progress };
            setImages([...updatedImages]);
            onImageUpload?.(imageWithProgress.file, progress);
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            updatedImages[index] = {
              ...updatedImages[index],
              status: "completed",
              progress: 100,
            };
            setImages([...updatedImages]);
            onUploadComplete?.(imageWithProgress.file, response);
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
        updatedImages[index] = {
          ...updatedImages[index],
          status: "error",
          error: error instanceof Error ? error.message : "Upload failed",
        };
        setImages([...updatedImages]);
        onUploadError?.(
          imageWithProgress.file,
          error instanceof Error ? error.message : "Upload failed"
        );
      }
    },
    [images, uploadUrl, onImageUpload, onUploadComplete, onUploadError]
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

      const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/")
      );
      addImages(droppedFiles);
    },
    [disabled, addImages]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
      addImages(selectedFiles);

      // Reset input value to allow re-selecting same file
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [addImages]
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

  const renderImagePreview = (
    imageWithProgress: ImageWithProgress,
    index: number
  ) => {
    if (gridView) {
      return (
        <div key={index} className="relative group">
          <img
            src={imageWithProgress.preview}
            alt={`Preview ${index + 1}`}
            className={`${previewSizeClasses[previewSize]} object-cover rounded-lg`}
          />

          {showProgress && imageWithProgress.status === "uploading" && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <div className="text-white text-sm">
                {Math.round(imageWithProgress.progress)}%
              </div>
            </div>
          )}

          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex space-x-1">
              {showCrop && (
                <button
                  type="button"
                  onClick={() => setCropImageIndex(index)}
                  className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  aria-label={t("crop_image")}
                >
                  <EditIcon className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                aria-label={removeText || t("remove_image")}
              >
                <RemoveIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            className={`absolute bottom-2 left-2 text-xs ${getStatusColor(
              imageWithProgress.status
            )}`}
          >
            {t(imageWithProgress.status)}
          </div>
        </div>
      );
    }

    return (
      <div
        key={index}
        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
      >
        <div className="flex items-center space-x-3">
          <img
            src={imageWithProgress.preview}
            alt={imageWithProgress.file.name}
            className="w-16 h-16 object-cover rounded"
          />

          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {imageWithProgress.file.name}
            </p>
            <p className="text-xs text-gray-500">
              {formatFileSize(imageWithProgress.file.size)}
            </p>
            {imageWithProgress.error && (
              <p className="text-xs text-red-500 mt-1">
                {imageWithProgress.error}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {showProgress && imageWithProgress.status === "uploading" && (
            <div className="w-24">
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${imageWithProgress.progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round(imageWithProgress.progress)}%
              </p>
            </div>
          )}

          <span
            className={`text-xs ${getStatusColor(imageWithProgress.status)}`}
          >
            {t(imageWithProgress.status)}
          </span>

          {showCrop && (
            <button
              type="button"
              onClick={() => setCropImageIndex(index)}
              className="text-blue-500 hover:text-blue-700 p-1"
              aria-label={t("crop_image")}
            >
              <EditIcon className="w-4 h-4" />
            </button>
          )}

          {uploadUrl && imageWithProgress.status === "pending" && (
            <button
              type="button"
              onClick={() => uploadImage(imageWithProgress, index)}
              className="text-blue-500 hover:text-blue-700 text-sm"
            >
              {t("upload")}
            </button>
          )}

          <button
            type="button"
            onClick={() => removeImage(index)}
            className="text-red-500 hover:text-red-700 p-1"
            aria-label={removeText || t("remove_image")}
          >
            <RemoveIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
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
        aria-label={label || t("upload_images")}
        tabIndex={disabled ? -1 : 0}
      >
        <input
          ref={fileInputRef}
          type="file"
          id={id}
          accept={allowedTypes.join(",")}
          multiple={multiple}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        <ImageIcon className="w-12 h-12 text-gray-400 mb-4" />

        <div className="text-center">
          <p className="text-gray-600 mb-2">
            {isDragOver
              ? dropText || t("drop_images_here")
              : dragDropText || t("drag_drop_images_here")}
          </p>
          <p className="text-sm text-gray-500">
            {t("or")}{" "}
            <span className="text-blue-500 underline">
              {browseText || t("browse_images")}
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

      {images.length > 0 && showPreview && (
        <div className="mt-4">
          {gridView ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((imageWithProgress, index) =>
                renderImagePreview(imageWithProgress, index)
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {images.map((imageWithProgress, index) =>
                renderImagePreview(imageWithProgress, index)
              )}
            </div>
          )}
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

export default ImageUpload;
