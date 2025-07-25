import { useState, useCallback, useEffect, useRef } from "react";
import { useAudit } from "../contexts/AuditContext";
import { useCompany } from "../contexts/CompanyContext";
import { useNotification } from "../contexts/NotificationContext";

interface FileManagerOptions {
  enableVersioning?: boolean;
  enableSharing?: boolean;
  enableGreekCompliance?: boolean;
  enableAADEIntegration?: boolean;
  autoSave?: boolean;
  cacheTime?: number;
  auditLog?: boolean;
  complianceLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  apiEndpoint?: string;
  maxVersions?: number;
  allowedOperations?: FileOperation[];
}

interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  path: string;
  parentId?: string;
  isFolder: boolean;
  metadata: FileMetadata;
  permissions: FilePermissions;
  versions: FileVersion[];
  shares: FileShare[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  greekCompliance?: GreekFileCompliance;
  aadeStatus?: AADEStatus;
}

interface FileMetadata {
  companyId: string;
  ownerId: string;
  ownerName: string;
  description?: string;
  category: FileCategory;
  documentType?: GreekDocumentType;
  checksum: string;
  isPersonalData: boolean;
  isFinancialData: boolean;
  retentionPeriod?: string;
  customFields: Record<string, any>;
}

interface FilePermissions {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canShare: boolean;
  canDownload: boolean;
  canComment: boolean;
  inheritedFrom?: string;
}

interface FileVersion {
  id: string;
  version: string;
  fileId: string;
  url: string;
  size: number;
  checksum: string;
  comment?: string;
  createdBy: string;
  createdAt: string;
  isActive: boolean;
}

interface FileShare {
  id: string;
  fileId: string;
  sharedWith: string;
  sharedBy: string;
  permissions: FilePermissions;
  expiresAt?: string;
  accessKey?: string;
  isPublic: boolean;
  createdAt: string;
}

interface GreekFileCompliance {
  documentType: GreekDocumentType;
  afmValidated: boolean;
  vatCompliant: boolean;
  hasGreekContent: boolean;
  complianceScore: number;
  lastValidated: string;
  validationErrors: string[];
}

interface AADEStatus {
  submitted: boolean;
  submittedAt?: string;
  submissionId?: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  marks: string[];
  uid?: string;
  qrUrl?: string;
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
type FileOperation =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "download"
  | "share"
  | "version"
  | "move"
  | "copy";

interface FileManagerState {
  files: FileItem[];
  currentFolder: FileItem | null;
  selectedFiles: string[];
  searchResults: FileItem[];
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
  breadcrumb: FileItem[];
  viewMode: "list" | "grid" | "details";
  sortBy: "name" | "date" | "size" | "type";
  sortOrder: "asc" | "desc";
  filter: FileFilter;
  clipboard: ClipboardOperation | null;
}

interface FileFilter {
  type?: string;
  category?: FileCategory;
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  sizeRange?: {
    min: number;
    max: number;
  };
  owner?: string;
  hasAADEStatus?: boolean;
  complianceLevel?: string;
}

interface ClipboardOperation {
  operation: "copy" | "cut";
  fileIds: string[];
  sourceFolder: string;
}

interface FileManagerResult extends FileManagerState {
  // Navigation
  navigateToFolder: (folderId: string) => Promise<void>;
  navigateUp: () => Promise<void>;
  navigateToRoot: () => Promise<void>;

  // File operations
  createFolder: (name: string, parentId?: string) => Promise<FileItem>;
  renameFile: (fileId: string, newName: string) => Promise<void>;
  deleteFiles: (fileIds: string[]) => Promise<void>;
  moveFiles: (fileIds: string[], targetFolderId: string) => Promise<void>;
  copyFiles: (fileIds: string[], targetFolderId: string) => Promise<void>;

  // File content
  downloadFile: (fileId: string) => Promise<string>;
  downloadMultiple: (fileIds: string[]) => Promise<string>;
  getFileContent: (fileId: string) => Promise<string>;
  updateFileContent: (fileId: string, content: string) => Promise<void>;

  // Versioning
  createVersion: (fileId: string, comment?: string) => Promise<FileVersion>;
  restoreVersion: (versionId: string) => Promise<void>;
  deleteVersion: (versionId: string) => Promise<void>;
  getVersionHistory: (fileId: string) => Promise<FileVersion[]>;

  // Sharing
  shareFile: (fileId: string, shareOptions: ShareOptions) => Promise<FileShare>;
  unshareFile: (shareId: string) => Promise<void>;
  getShares: (fileId: string) => Promise<FileShare[]>;
  updateSharePermissions: (
    shareId: string,
    permissions: FilePermissions
  ) => Promise<void>;

  // Search and filtering
  search: (query: string) => Promise<FileItem[]>;
  applyFilter: (filter: FileFilter) => void;
  clearFilter: () => void;

  // Selection
  selectFile: (fileId: string) => void;
  selectFiles: (fileIds: string[]) => void;
  selectAll: () => void;
  clearSelection: () => void;

  // Clipboard
  copyToClipboard: (fileIds: string[]) => void;
  cutToClipboard: (fileIds: string[]) => void;
  pasteFromClipboard: (targetFolderId?: string) => Promise<void>;
  clearClipboard: () => void;

  // View
  setViewMode: (mode: "list" | "grid" | "details") => void;
  setSorting: (
    sortBy: "name" | "date" | "size" | "type",
    order: "asc" | "desc"
  ) => void;

  // Greek compliance
  validateGreekCompliance: (fileId: string) => Promise<GreekFileCompliance>;
  submitToAADE: (fileId: string) => Promise<AADEStatus>;
  checkAADEStatus: (fileId: string) => Promise<AADEStatus>;

  // Utility
  refresh: () => Promise<void>;
  getFileDetails: (fileId: string) => Promise<FileItem>;
  updateFileMetadata: (
    fileId: string,
    metadata: Partial<FileMetadata>
  ) => Promise<void>;
  addFileTags: (fileId: string, tags: string[]) => Promise<void>;
  removeFileTags: (fileId: string, tags: string[]) => Promise<void>;
}

interface ShareOptions {
  sharedWith: string;
  permissions: FilePermissions;
  expiresAt?: string;
  isPublic?: boolean;
  message?: string;
}

/**
 * Enhanced file manager hook with Greek ERP features
 * Provides complete file management with versioning, sharing, and AADE compliance
 */
export function useFileManager(
  options: FileManagerOptions = {}
): FileManagerResult {
  const { logAction } = useAudit();
  const { state: companyState } = useCompany();
  const { addNotification } = useNotification();

  const {
    enableVersioning = true,
    enableSharing = true,
    enableGreekCompliance = true,
    enableAADEIntegration = true,
    autoSave = true,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    auditLog = true,
    complianceLevel = "MEDIUM",
    apiEndpoint = "/api/files",
    maxVersions = 10,
    allowedOperations = [
      "create",
      "read",
      "update",
      "delete",
      "download",
      "share",
      "version",
      "move",
      "copy",
    ],
  } = options;

  const [state, setState] = useState<FileManagerState>({
    files: [],
    currentFolder: null,
    selectedFiles: [],
    searchResults: [],
    isLoading: false,
    isUploading: false,
    error: null,
    breadcrumb: [],
    viewMode: "list",
    sortBy: "name",
    sortOrder: "asc",
    filter: {},
    clipboard: null,
  });

  const cacheRef = useRef<Map<string, { data: FileItem[]; timestamp: number }>>(
    new Map()
  );

  // API helper
  const apiCall = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      const response = await fetch(`${apiEndpoint}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "X-Company-ID": companyState.currentCompany?.id || "",
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      return response.json();
    },
    [apiEndpoint, companyState.currentCompany?.id]
  );

  // Audit logging helper
  const auditFileOperation = useCallback(
    (operation: string, fileData?: any, error?: Error) => {
      if (!auditLog) return;

      logAction({
        userId: "current_user",
        userEmail: "user@example.com",
        companyId: companyState.currentCompany?.id || "unknown",
        sessionId: "current_session",
        action: `file_manager.${operation}`,
        module: "files",
        feature: "file_manager",
        resource: "file",
        resourceId: fileData?.id || "unknown",
        details: {
          method: operation.includes("delete")
            ? "DELETE"
            : operation.includes("create")
            ? "CREATE"
            : operation.includes("update")
            ? "UPDATE"
            : "READ",
          outcome: error ? "FAILURE" : "SUCCESS",
          errorMessage: error?.message,
          metadata: {
            operation,
            fileData: fileData ? JSON.stringify(fileData) : undefined,
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
          factors: [`file_${operation}`, "document_management"],
          flagged: !!error,
          requiresReview: complianceLevel === "CRITICAL" || !!error,
        },
      });
    },
    [auditLog, logAction, companyState.currentCompany?.id, complianceLevel]
  );

  // Load files from folder
  const loadFiles = useCallback(
    async (folderId?: string): Promise<FileItem[]> => {
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        const cacheKey = folderId || "root";
        const cached = cacheRef.current.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < cacheTime) {
          setState((prev) => ({
            ...prev,
            files: cached.data,
            isLoading: false,
          }));
          return cached.data;
        }

        const endpoint = folderId ? `?parent=${folderId}` : "";
        const files = await apiCall(endpoint);

        cacheRef.current.set(cacheKey, {
          data: files,
          timestamp: Date.now(),
        });

        setState((prev) => ({ ...prev, files, isLoading: false }));
        auditFileOperation("load_files", { folderId, count: files.length });

        return files;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: (error as Error).message,
          isLoading: false,
        }));
        auditFileOperation("load_files", { folderId }, error as Error);
        throw error;
      }
    },
    [apiCall, cacheTime, auditFileOperation]
  );

  // Navigation
  const navigateToFolder = useCallback(
    async (folderId: string) => {
      try {
        const folder = await apiCall(`/${folderId}`);
        const files = await loadFiles(folderId);

        setState((prev) => ({
          ...prev,
          currentFolder: folder,
          breadcrumb: [...prev.breadcrumb, folder],
          selectedFiles: [],
        }));
      } catch (error) {
        addNotification({
          type: "error",
          title: "Σφάλμα πλοήγησης",
          message: `Αδυναμία πρόσβασης στον φάκελο: ${
            (error as Error).message
          }`,
          priority: "medium",
          category: "business",
          isPersistent: false,
          autoClose: true,
          duration: 5000,
        });
      }
    },
    [apiCall, loadFiles, addNotification]
  );

  const navigateUp = useCallback(async () => {
    if (state.breadcrumb.length > 0) {
      const newBreadcrumb = [...state.breadcrumb];
      newBreadcrumb.pop();
      const parentFolder = newBreadcrumb[newBreadcrumb.length - 1] || null;

      await loadFiles(parentFolder?.id);
      setState((prev) => ({
        ...prev,
        currentFolder: parentFolder,
        breadcrumb: newBreadcrumb,
        selectedFiles: [],
      }));
    }
  }, [state.breadcrumb, loadFiles]);

  const navigateToRoot = useCallback(async () => {
    await loadFiles();
    setState((prev) => ({
      ...prev,
      currentFolder: null,
      breadcrumb: [],
      selectedFiles: [],
    }));
  }, [loadFiles]);

  // File operations
  const createFolder = useCallback(
    async (name: string, parentId?: string): Promise<FileItem> => {
      try {
        const folderData = {
          name,
          parentId: parentId || state.currentFolder?.id,
          isFolder: true,
          metadata: {
            companyId: companyState.currentCompany?.id,
            category: "other" as FileCategory,
          },
        };

        const newFolder = await apiCall("", {
          method: "POST",
          body: JSON.stringify(folderData),
        });

        setState((prev) => ({
          ...prev,
          files: [...prev.files, newFolder],
        }));

        auditFileOperation("create_folder", newFolder);

        addNotification({
          type: "success",
          title: "Δημιουργία φακέλου",
          message: `Ο φάκελος "${name}" δημιουργήθηκε επιτυχώς`,
          priority: "low",
          category: "business",
          isPersistent: false,
          autoClose: true,
          duration: 3000,
        });

        return newFolder;
      } catch (error) {
        auditFileOperation("create_folder", { name, parentId }, error as Error);
        throw error;
      }
    },
    [
      state.currentFolder?.id,
      companyState.currentCompany?.id,
      apiCall,
      auditFileOperation,
      addNotification,
    ]
  );

  const deleteFiles = useCallback(
    async (fileIds: string[]): Promise<void> => {
      try {
        setState((prev) => ({ ...prev, isLoading: true }));

        await apiCall("/bulk-delete", {
          method: "DELETE",
          body: JSON.stringify({ fileIds }),
        });

        setState((prev) => ({
          ...prev,
          files: prev.files.filter((file) => !fileIds.includes(file.id)),
          selectedFiles: prev.selectedFiles.filter(
            (id) => !fileIds.includes(id)
          ),
          isLoading: false,
        }));

        auditFileOperation("delete_files", { fileIds, count: fileIds.length });

        addNotification({
          type: "success",
          title: "Διαγραφή αρχείων",
          message: `${fileIds.length} αρχεία διαγράφηκαν επιτυχώς`,
          priority: "medium",
          category: "business",
          isPersistent: false,
          autoClose: true,
          duration: 3000,
        });
      } catch (error) {
        setState((prev) => ({ ...prev, isLoading: false }));
        auditFileOperation("delete_files", { fileIds }, error as Error);
        throw error;
      }
    },
    [apiCall, auditFileOperation, addNotification]
  );

  // Greek compliance
  const validateGreekCompliance = useCallback(
    async (fileId: string): Promise<GreekFileCompliance> => {
      try {
        const compliance = await apiCall(
          `/${fileId}/validate-greek-compliance`
        );

        auditFileOperation("validate_compliance", { fileId, compliance });

        return compliance;
      } catch (error) {
        auditFileOperation("validate_compliance", { fileId }, error as Error);
        throw error;
      }
    },
    [apiCall, auditFileOperation]
  );

  const submitToAADE = useCallback(
    async (fileId: string): Promise<AADEStatus> => {
      try {
        const aadeStatus = await apiCall(`/${fileId}/submit-aade`, {
          method: "POST",
        });

        auditFileOperation("submit_aade", { fileId, aadeStatus });

        addNotification({
          type: "success",
          title: "Υποβολή AADE",
          message: "Το έγγραφο υποβλήθηκε επιτυχώς στο AADE",
          priority: "high",
          category: "compliance",
          isPersistent: false,
          autoClose: true,
          duration: 5000,
        });

        return aadeStatus;
      } catch (error) {
        auditFileOperation("submit_aade", { fileId }, error as Error);

        addNotification({
          type: "error",
          title: "Σφάλμα υποβολής AADE",
          message: `Αποτυχία υποβολής: ${(error as Error).message}`,
          priority: "high",
          category: "compliance",
          isPersistent: false,
          autoClose: true,
          duration: 7000,
        });

        throw error;
      }
    },
    [apiCall, auditFileOperation, addNotification]
  );

  // Selection operations
  const selectFile = useCallback((fileId: string) => {
    setState((prev) => ({
      ...prev,
      selectedFiles: prev.selectedFiles.includes(fileId)
        ? prev.selectedFiles.filter((id) => id !== fileId)
        : [...prev.selectedFiles, fileId],
    }));
  }, []);

  const selectAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedFiles: prev.files.map((file) => file.id),
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedFiles: [],
    }));
  }, []);

  // Search
  const search = useCallback(
    async (query: string): Promise<FileItem[]> => {
      try {
        const results = await apiCall(`/search?q=${encodeURIComponent(query)}`);

        setState((prev) => ({
          ...prev,
          searchResults: results,
        }));

        auditFileOperation("search", { query, resultCount: results.length });

        return results;
      } catch (error) {
        auditFileOperation("search", { query }, error as Error);
        throw error;
      }
    },
    [apiCall, auditFileOperation]
  );

  // Initialize
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  return {
    ...state,
    navigateToFolder,
    navigateUp,
    navigateToRoot,
    createFolder,
    renameFile: async (fileId: string, newName: string) => {
      const updated = await apiCall(`/${fileId}`, {
        method: "PATCH",
        body: JSON.stringify({ name: newName }),
      });
      setState((prev) => ({
        ...prev,
        files: prev.files.map((f) => (f.id === fileId ? updated : f)),
      }));
    },
    deleteFiles,
    moveFiles: async (fileIds: string[], targetFolderId: string) => {
      await apiCall("/bulk-move", {
        method: "PATCH",
        body: JSON.stringify({ fileIds, targetFolderId }),
      });
      await loadFiles(state.currentFolder?.id);
    },
    copyFiles: async (fileIds: string[], targetFolderId: string) => {
      await apiCall("/bulk-copy", {
        method: "POST",
        body: JSON.stringify({ fileIds, targetFolderId }),
      });
    },
    downloadFile: async (fileId: string) => {
      return await apiCall(`/${fileId}/download`);
    },
    downloadMultiple: async (fileIds: string[]) => {
      return await apiCall("/bulk-download", {
        method: "POST",
        body: JSON.stringify({ fileIds }),
      });
    },
    getFileContent: async (fileId: string) => {
      return await apiCall(`/${fileId}/content`);
    },
    updateFileContent: async (fileId: string, content: string) => {
      await apiCall(`/${fileId}/content`, {
        method: "PUT",
        body: JSON.stringify({ content }),
      });
    },
    createVersion: async (fileId: string, comment?: string) => {
      return await apiCall(`/${fileId}/versions`, {
        method: "POST",
        body: JSON.stringify({ comment }),
      });
    },
    restoreVersion: async (versionId: string) => {
      await apiCall(`/versions/${versionId}/restore`, {
        method: "POST",
      });
    },
    deleteVersion: async (versionId: string) => {
      await apiCall(`/versions/${versionId}`, {
        method: "DELETE",
      });
    },
    getVersionHistory: async (fileId: string) => {
      return await apiCall(`/${fileId}/versions`);
    },
    shareFile: async (fileId: string, shareOptions: ShareOptions) => {
      return await apiCall(`/${fileId}/shares`, {
        method: "POST",
        body: JSON.stringify(shareOptions),
      });
    },
    unshareFile: async (shareId: string) => {
      await apiCall(`/shares/${shareId}`, {
        method: "DELETE",
      });
    },
    getShares: async (fileId: string) => {
      return await apiCall(`/${fileId}/shares`);
    },
    updateSharePermissions: async (
      shareId: string,
      permissions: FilePermissions
    ) => {
      await apiCall(`/shares/${shareId}`, {
        method: "PATCH",
        body: JSON.stringify({ permissions }),
      });
    },
    search,
    applyFilter: (filter: FileFilter) => {
      setState((prev) => ({ ...prev, filter }));
    },
    clearFilter: () => {
      setState((prev) => ({ ...prev, filter: {} }));
    },
    selectFile,
    selectFiles: (fileIds: string[]) => {
      setState((prev) => ({ ...prev, selectedFiles: fileIds }));
    },
    selectAll,
    clearSelection,
    copyToClipboard: (fileIds: string[]) => {
      setState((prev) => ({
        ...prev,
        clipboard: {
          operation: "copy",
          fileIds,
          sourceFolder: prev.currentFolder?.id || "root",
        },
      }));
    },
    cutToClipboard: (fileIds: string[]) => {
      setState((prev) => ({
        ...prev,
        clipboard: {
          operation: "cut",
          fileIds,
          sourceFolder: prev.currentFolder?.id || "root",
        },
      }));
    },
    pasteFromClipboard: async (targetFolderId?: string) => {
      if (!state.clipboard) return;

      const target = targetFolderId || state.currentFolder?.id || "root";

      if (state.clipboard.operation === "copy") {
        await apiCall("/bulk-copy", {
          method: "POST",
          body: JSON.stringify({
            fileIds: state.clipboard.fileIds,
            targetFolderId: target,
          }),
        });
      } else {
        await apiCall("/bulk-move", {
          method: "PATCH",
          body: JSON.stringify({
            fileIds: state.clipboard.fileIds,
            targetFolderId: target,
          }),
        });
      }

      setState((prev) => ({ ...prev, clipboard: null }));
      await loadFiles(state.currentFolder?.id);
    },
    clearClipboard: () => {
      setState((prev) => ({ ...prev, clipboard: null }));
    },
    setViewMode: (mode: "list" | "grid" | "details") => {
      setState((prev) => ({ ...prev, viewMode: mode }));
    },
    setSorting: (
      sortBy: "name" | "date" | "size" | "type",
      order: "asc" | "desc"
    ) => {
      setState((prev) => ({ ...prev, sortBy, sortOrder: order }));
    },
    validateGreekCompliance,
    submitToAADE,
    checkAADEStatus: async (fileId: string) => {
      return await apiCall(`/${fileId}/aade-status`);
    },
    refresh: async () => {
      await loadFiles(state.currentFolder?.id);
    },
    getFileDetails: async (fileId: string) => {
      return await apiCall(`/${fileId}`);
    },
    updateFileMetadata: async (
      fileId: string,
      metadata: Partial<FileMetadata>
    ) => {
      await apiCall(`/${fileId}/metadata`, {
        method: "PATCH",
        body: JSON.stringify(metadata),
      });
    },
    addFileTags: async (fileId: string, tags: string[]) => {
      await apiCall(`/${fileId}/tags`, {
        method: "POST",
        body: JSON.stringify({ tags }),
      });
    },
    removeFileTags: async (fileId: string, tags: string[]) => {
      await apiCall(`/${fileId}/tags`, {
        method: "DELETE",
        body: JSON.stringify({ tags }),
      });
    },
  };
}

export default useFileManager;
