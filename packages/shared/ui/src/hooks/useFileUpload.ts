import { useState, useCallback, useRef, useEffect } from "react";
import { useAudit } from "../contexts/AuditContext";
import { useCompany } from "../contexts/CompanyContext";
import { useNotification } from "../contexts/NotificationContext";

interface FileUploadOptions {
  multiple?: boolean;
  maxFileSize?: number; // in bytes
  maxFiles?: number;
  acceptedTypes?: string[];
  enableGreekValidation?: boolean;
  enableAADECompliance?: boolean;
  uploadEndpoint?: string;
  chunkSize?: number; // for large file uploads
  auditLog?: boolean;
  autoUpload?: boolean;
  complianceLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  onProgress?: (progress: FileUploadProgress) => void;
  onSuccess?: (files: UploadedFile[]) => void;
  onError?: (error: FileUploadError) => void;
  onValidationError?: (errors: FileValidationError[]) => void;
}

interface FileUploadProgress {
  fileId: string;
  fileName: string;
  progress: number; // 0-100
  speed: number; // bytes per second
  estimatedTimeRemaining: number; // seconds
  uploadedBytes: number;
  totalBytes: number;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  thumbnailUrl?: string;
  metadata: FileMetadata;
  uploadedAt: string;
  aadeCompliant?: boolean;
  greekDocumentType?: GreekDocumentType;
}

interface FileMetadata {
  companyId: string;
  uploadedBy: string;
  originalName: string;
  checksum: string;
  tags: string[];
  category: FileCategory;
  isPersonalData: boolean;
  isFinancialData: boolean;
  retentionPeriod?: string;
  greekCompliance?: {
    documentType: GreekDocumentType;
    afmValidated: boolean;
    vatCompliant: boolean;
    aadeReady: boolean;
  };
}

interface FileUploadError {
  fileId: string;
  fileName: string;
  error: string;
  code: string;
}

interface FileValidationError {
  fileId: string;
  fileName: string;
  errors: string[];
}

type FileCategory =
  | "invoice"
  | "receipt"
  | "contract"
  | "report"
  | "certificate"
  | "other";
type GreekDocumentType =
  | "timologio"
  | "apodeixi"
  | "pistotiko"
  | "deltio_apostolis"
  | "other";

interface FileUploadState {
  files: File[];
  uploadedFiles: UploadedFile[];
  uploadProgress: Record<string, FileUploadProgress>;
  isUploading: boolean;
  errors: FileUploadError[];
  validationErrors: FileValidationError[];
  totalProgress: number;
  completedUploads: number;
  failedUploads: number;
}

interface FileUploadResult extends FileUploadState {
  selectFiles: (files: FileList | File[]) => void;
  uploadFiles: () => Promise<UploadedFile[]>;
  uploadFile: (file: File) => Promise<UploadedFile>;
  cancelUpload: (fileId: string) => void;
  cancelAllUploads: () => void;
  removeFile: (fileId: string) => void;
  clearFiles: () => void;
  clearErrors: () => void;
  retryUpload: (fileId: string) => Promise<UploadedFile>;
  validateFiles: () => FileValidationError[];
  getFileProgress: (fileId: string) => FileUploadProgress | null;
  isFileValid: (file: File) => boolean;
  getGreekDocumentType: (file: File) => Promise<GreekDocumentType>;
}

/**
 * Enhanced file upload hook with Greek ERP features
 * Supports multi-file uploads, Greek document validation, AADE compliance, and audit logging
 */
export function useFileUpload(
  options: FileUploadOptions = {}
): FileUploadResult {
  const { logAction } = useAudit();
  const { state: companyState } = useCompany();
  const { addNotification } = useNotification();

  const {
    multiple = true,
    maxFileSize = 50 * 1024 * 1024, // 50MB
    maxFiles = 10,
    acceptedTypes = [
      "image/*",
      "application/pdf",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".txt",
      ".csv",
    ],
    enableGreekValidation = true,
    enableAADECompliance = true,
    uploadEndpoint = "/api/files/upload",
    chunkSize = 1024 * 1024, // 1MB chunks
    auditLog = true,
    autoUpload = false,
    complianceLevel = "MEDIUM",
    onProgress,
    onSuccess,
    onError,
    onValidationError,
  } = options;

  const [state, setState] = useState<FileUploadState>({
    files: [],
    uploadedFiles: [],
    uploadProgress: {},
    isUploading: false,
    errors: [],
    validationErrors: [],
    totalProgress: 0,
    completedUploads: 0,
    failedUploads: 0,
  });

  const uploadRefs = useRef<Record<string, AbortController>>({});
  const fileIdCounter = useRef(0);

  // Generate unique file ID
  const generateFileId = useCallback(() => {
    return `file_${Date.now()}_${++fileIdCounter.current}`;
  }, []);

  // Calculate file checksum
  const calculateChecksum = useCallback(async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }, []);

  // Greek document type detection
  const getGreekDocumentType = useCallback(
    async (file: File): Promise<GreekDocumentType> => {
      const fileName = file.name.toLowerCase();

      if (fileName.includes("timologio") || fileName.includes("invoice")) {
        return "timologio";
      }
      if (fileName.includes("apodeixi") || fileName.includes("receipt")) {
        return "apodeixi";
      }
      if (fileName.includes("pistotiko") || fileName.includes("certificate")) {
        return "pistotiko";
      }
      if (fileName.includes("deltio") || fileName.includes("delivery")) {
        return "deltio_apostolis";
      }

      return "other";
    },
    []
  );

  // File validation
  const validateFile = useCallback(
    (file: File): string[] => {
      const errors: string[] = [];

      // Size validation
      if (file.size > maxFileSize) {
        errors.push(
          `Το αρχείο υπερβαίνει το μέγιστο επιτρεπόμενο μέγεθος (${Math.round(
            maxFileSize / 1024 / 1024
          )}MB)`
        );
      }

      // Type validation
      const isAcceptedType = acceptedTypes.some((type) => {
        if (type.startsWith(".")) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        if (type.includes("*")) {
          const baseType = type.split("/")[0];
          return file.type.startsWith(baseType);
        }
        return file.type === type;
      });

      if (!isAcceptedType) {
        errors.push("Μη υποστηριζόμενος τύπος αρχείου");
      }

      // Greek document validation
      if (enableGreekValidation) {
        if (file.name.includes("..")) {
          errors.push("Μη έγκυρο όνομα αρχείου");
        }

        // Check for Greek characters in business documents
        if (
          file.type === "application/pdf" &&
          !/[\u0370-\u03FF]/.test(file.name)
        ) {
          // Warning: PDF doesn't contain Greek characters
        }
      }

      return errors;
    },
    [maxFileSize, acceptedTypes, enableGreekValidation]
  );

  const isFileValid = useCallback(
    (file: File): boolean => {
      return validateFile(file).length === 0;
    },
    [validateFile]
  );

  const validateFiles = useCallback((): FileValidationError[] => {
    const validationErrors: FileValidationError[] = [];

    // Check total number of files
    if (state.files.length > maxFiles) {
      validationErrors.push({
        fileId: "global",
        fileName: "Συνολικός έλεγχος",
        errors: [`Μέγιστος αριθμός αρχείων: ${maxFiles}`],
      });
    }

    // Validate individual files
    state.files.forEach((file, index) => {
      const fileId = `temp_${index}`;
      const errors = validateFile(file);

      if (errors.length > 0) {
        validationErrors.push({
          fileId,
          fileName: file.name,
          errors,
        });
      }
    });

    setState((prev) => ({
      ...prev,
      validationErrors,
    }));

    if (onValidationError && validationErrors.length > 0) {
      onValidationError(validationErrors);
    }

    return validationErrors;
  }, [state.files, maxFiles, validateFile, onValidationError]);

  // File selection
  const selectFiles = useCallback(
    (fileList: FileList | File[]) => {
      const newFiles = Array.from(fileList);

      setState((prev) => ({
        ...prev,
        files: multiple ? [...prev.files, ...newFiles] : newFiles,
        errors: [],
        validationErrors: [],
      }));

      if (autoUpload) {
        // Auto-upload after a short delay to allow state update
        setTimeout(() => {
          uploadFiles();
        }, 100);
      }
    },
    [multiple, autoUpload]
  );

  // Single file upload
  const uploadFile = useCallback(
    async (file: File): Promise<UploadedFile> => {
      const fileId = generateFileId();
      const fileName = file.name;

      // Validate file
      const validationErrors = validateFile(file);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(", "));
      }

      // Create abort controller
      const abortController = new AbortController();
      uploadRefs.current[fileId] = abortController;

      // Initialize progress
      const initialProgress: FileUploadProgress = {
        fileId,
        fileName,
        progress: 0,
        speed: 0,
        estimatedTimeRemaining: 0,
        uploadedBytes: 0,
        totalBytes: file.size,
      };

      setState((prev) => ({
        ...prev,
        uploadProgress: {
          ...prev.uploadProgress,
          [fileId]: initialProgress,
        },
      }));

      try {
        // Calculate checksum
        const checksum = await calculateChecksum(file);

        // Detect Greek document type
        const documentType = await getGreekDocumentType(file);

        // Prepare form data
        const formData = new FormData();
        formData.append("file", file);
        formData.append(
          "metadata",
          JSON.stringify({
            companyId: companyState.currentCompany?.id,
            originalName: fileName,
            checksum,
            category: "other" as FileCategory,
            documentType,
            isPersonalData:
              complianceLevel === "HIGH" || complianceLevel === "CRITICAL",
            isFinancialData: complianceLevel === "CRITICAL",
          })
        );

        const startTime = Date.now();
        let uploadedBytes = 0;

        // Upload with progress tracking
        const response = await fetch(uploadEndpoint, {
          method: "POST",
          body: formData,
          signal: abortController.signal,
          headers: {
            "X-Company-ID": companyState.currentCompany?.id || "",
          },
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const uploadedFile: UploadedFile = await response.json();

        // Update progress to 100%
        setState((prev) => ({
          ...prev,
          uploadProgress: {
            ...prev.uploadProgress,
            [fileId]: {
              ...initialProgress,
              progress: 100,
              uploadedBytes: file.size,
            },
          },
          uploadedFiles: [...prev.uploadedFiles, uploadedFile],
          completedUploads: prev.completedUploads + 1,
        }));

        // Audit log
        if (auditLog) {
          logAction({
            userId: "current_user",
            userEmail: "user@example.com",
            companyId: companyState.currentCompany?.id || "unknown",
            sessionId: "current_session",
            action: "file.upload",
            module: "files",
            feature: "file_upload",
            resource: "file",
            resourceId: uploadedFile.id,
            details: {
              method: "CREATE",
              outcome: "SUCCESS",
              metadata: {
                fileName,
                fileSize: file.size,
                fileType: file.type,
                documentType,
                checksum,
                uploadDuration: Date.now() - startTime,
              },
            },
            ipAddress: "127.0.0.1",
            userAgent: navigator.userAgent,
            compliance: {
              level: complianceLevel,
              category: "BUSINESS",
              requiresRetention: true,
              personalDataInvolved:
                complianceLevel === "HIGH" || complianceLevel === "CRITICAL",
              financialDataInvolved: complianceLevel === "CRITICAL",
            },
            risk: {
              score:
                complianceLevel === "CRITICAL"
                  ? 60
                  : complianceLevel === "HIGH"
                  ? 40
                  : 20,
              factors: ["file_upload", "document_storage"],
              flagged: false,
              requiresReview: complianceLevel === "CRITICAL",
            },
          });
        }

        // Show success notification
        addNotification({
          type: "success",
          title: "Επιτυχής μεταφόρτωση",
          message: `Το αρχείο "${fileName}" μεταφορτώθηκε επιτυχώς`,
          priority: "medium",
          category: "business",
          isPersistent: false,
          autoClose: true,
          duration: 3000,
        });

        if (onProgress) {
          onProgress({
            ...initialProgress,
            progress: 100,
            uploadedBytes: file.size,
          });
        }

        return uploadedFile;
      } catch (error) {
        const uploadError: FileUploadError = {
          fileId,
          fileName,
          error: (error as Error).message,
          code: "UPLOAD_FAILED",
        };

        setState((prev) => ({
          ...prev,
          errors: [...prev.errors, uploadError],
          failedUploads: prev.failedUploads + 1,
        }));

        // Audit log error
        if (auditLog) {
          logAction({
            userId: "current_user",
            userEmail: "user@example.com",
            companyId: companyState.currentCompany?.id || "unknown",
            sessionId: "current_session",
            action: "file.upload_error",
            module: "files",
            feature: "file_upload",
            resource: "file",
            details: {
              method: "CREATE",
              outcome: "FAILURE",
              errorMessage: (error as Error).message,
              metadata: {
                fileName,
                fileSize: file.size,
                fileType: file.type,
              },
            },
            ipAddress: "127.0.0.1",
            userAgent: navigator.userAgent,
            compliance: {
              level: complianceLevel,
              category: "BUSINESS",
              requiresRetention: true,
              personalDataInvolved: false,
              financialDataInvolved: false,
            },
            risk: {
              score: 50,
              factors: ["file_upload_failure"],
              flagged: true,
              requiresReview: false,
            },
          });
        }

        // Show error notification
        addNotification({
          type: "error",
          title: "Σφάλμα μεταφόρτωσης",
          message: `Αποτυχία μεταφόρτωσης του αρχείου "${fileName}": ${
            (error as Error).message
          }`,
          priority: "high",
          category: "business",
          isPersistent: false,
          autoClose: true,
          duration: 5000,
        });

        if (onError) {
          onError(uploadError);
        }

        throw error;
      } finally {
        delete uploadRefs.current[fileId];
      }
    },
    [
      generateFileId,
      validateFile,
      calculateChecksum,
      getGreekDocumentType,
      uploadEndpoint,
      companyState.currentCompany?.id,
      complianceLevel,
      auditLog,
      logAction,
      addNotification,
      onProgress,
      onError,
    ]
  );

  // Multiple files upload
  const uploadFiles = useCallback(async (): Promise<UploadedFile[]> => {
    if (state.files.length === 0) {
      return [];
    }

    // Validate all files first
    const validationErrors = validateFiles();
    if (validationErrors.length > 0) {
      throw new Error("Validation failed");
    }

    setState((prev) => ({
      ...prev,
      isUploading: true,
      completedUploads: 0,
      failedUploads: 0,
      errors: [],
    }));

    const uploadPromises = state.files.map((file) => uploadFile(file));

    try {
      const results = await Promise.allSettled(uploadPromises);
      const uploadedFiles: UploadedFile[] = [];

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          uploadedFiles.push(result.value);
        }
      });

      setState((prev) => ({
        ...prev,
        isUploading: false,
        totalProgress: 100,
      }));

      if (onSuccess && uploadedFiles.length > 0) {
        onSuccess(uploadedFiles);
      }

      return uploadedFiles;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isUploading: false,
      }));
      throw error;
    }
  }, [state.files, validateFiles, uploadFile, onSuccess]);

  // Cancel upload
  const cancelUpload = useCallback((fileId: string) => {
    const abortController = uploadRefs.current[fileId];
    if (abortController) {
      abortController.abort();
      delete uploadRefs.current[fileId];
    }

    setState((prev) => {
      const newProgress = { ...prev.uploadProgress };
      delete newProgress[fileId];

      return {
        ...prev,
        uploadProgress: newProgress,
      };
    });
  }, []);

  // Cancel all uploads
  const cancelAllUploads = useCallback(() => {
    Object.keys(uploadRefs.current).forEach((fileId) => {
      cancelUpload(fileId);
    });

    setState((prev) => ({
      ...prev,
      isUploading: false,
      uploadProgress: {},
    }));
  }, [cancelUpload]);

  // Remove file from queue
  const removeFile = useCallback((fileId: string) => {
    setState((prev) => ({
      ...prev,
      files: prev.files.filter((_, index) => `temp_${index}` !== fileId),
    }));
  }, []);

  // Clear all files
  const clearFiles = useCallback(() => {
    cancelAllUploads();
    setState((prev) => ({
      ...prev,
      files: [],
      uploadedFiles: [],
      errors: [],
      validationErrors: [],
      totalProgress: 0,
      completedUploads: 0,
      failedUploads: 0,
    }));
  }, [cancelAllUploads]);

  // Clear errors
  const clearErrors = useCallback(() => {
    setState((prev) => ({
      ...prev,
      errors: [],
      validationErrors: [],
    }));
  }, []);

  // Retry upload
  const retryUpload = useCallback(
    async (fileId: string): Promise<UploadedFile> => {
      const fileIndex = parseInt(fileId.replace("temp_", ""));
      const file = state.files[fileIndex];

      if (!file) {
        throw new Error("File not found");
      }

      return uploadFile(file);
    },
    [state.files, uploadFile]
  );

  // Get file progress
  const getFileProgress = useCallback(
    (fileId: string): FileUploadProgress | null => {
      return state.uploadProgress[fileId] || null;
    },
    [state.uploadProgress]
  );

  // Calculate total progress
  useEffect(() => {
    const progressValues = Object.values(state.uploadProgress);
    if (progressValues.length > 0) {
      const totalProgress =
        progressValues.reduce((sum, p) => sum + p.progress, 0) /
        progressValues.length;
      setState((prev) => ({
        ...prev,
        totalProgress,
      }));
    }
  }, [state.uploadProgress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAllUploads();
    };
  }, [cancelAllUploads]);

  return {
    ...state,
    selectFiles,
    uploadFiles,
    uploadFile,
    cancelUpload,
    cancelAllUploads,
    removeFile,
    clearFiles,
    clearErrors,
    retryUpload,
    validateFiles,
    getFileProgress,
    isFileValid,
    getGreekDocumentType,
  };
}

export default useFileUpload;
