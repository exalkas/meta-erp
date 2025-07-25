import { useState, useCallback, useEffect } from "react";
import { useAudit } from "../contexts/AuditContext";
import { useCompany } from "../contexts/CompanyContext";
import { useNotification } from "../contexts/NotificationContext";
import { useGreekValidation } from "./useGreekValidation";

interface EntityCRUDOptions<TEntity> {
  entityName: string;
  apiEndpoint: string;
  enableValidation?: boolean;
  enableAuditLog?: boolean;
  enableNotifications?: boolean;
  enableGreekValidation?: boolean;
  cacheTime?: number;
  staleTime?: number;
  complianceLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  onSuccess?: (operation: CRUDOperation, data: TEntity | TEntity[]) => void;
  onError?: (operation: CRUDOperation, error: Error) => void;
  validateEntity?: (entity: Partial<TEntity>) => ValidationResult;
  transformEntity?: (entity: TEntity) => TEntity;
}

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

interface CRUDState<TEntity> {
  entities: TEntity[];
  currentEntity: TEntity | null;
  loading: boolean;
  error: string | null;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isFetching: boolean;
  lastFetch: number;
  validationErrors: Record<string, string>;
}

interface CRUDFilters {
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
  filters?: Record<string, any>;
}

interface CRUDResult<TEntity> extends CRUDState<TEntity> {
  // Read operations
  fetchAll: (filters?: CRUDFilters) => Promise<TEntity[]>;
  fetchById: (id: string) => Promise<TEntity>;
  search: (query: string) => Promise<TEntity[]>;

  // Create operations
  create: (entity: Partial<TEntity>) => Promise<TEntity>;
  createMany: (entities: Partial<TEntity>[]) => Promise<TEntity[]>;

  // Update operations
  update: (id: string, entity: Partial<TEntity>) => Promise<TEntity>;
  updateMany: (
    entities: { id: string; data: Partial<TEntity> }[]
  ) => Promise<TEntity[]>;

  // Delete operations
  delete: (id: string) => Promise<void>;
  deleteMany: (ids: string[]) => Promise<void>;

  // Utility operations
  reset: () => void;
  clearErrors: () => void;
  validate: (entity: Partial<TEntity>) => ValidationResult;
  refresh: () => Promise<void>;

  // Selection operations
  selectEntity: (entity: TEntity) => void;
  clearSelection: () => void;
}

type CRUDOperation = "create" | "read" | "update" | "delete" | "search";

/**
 * Enhanced generic CRUD hook with Greek ERP features
 * Provides full CRUD operations with validation, audit logging, and Greek business compliance
 */
export function useEntityCRUD<
  TEntity extends { id: string; [key: string]: any }
>(options: EntityCRUDOptions<TEntity>): CRUDResult<TEntity> {
  const { logAction } = useAudit();
  const { state: companyState } = useCompany();
  const { addNotification } = useNotification();
  const { validateAFM, validateGreekPhone, validateGreekPostalCode } =
    useGreekValidation();

  const {
    entityName,
    apiEndpoint,
    enableValidation = true,
    enableAuditLog = true,
    enableNotifications = true,
    enableGreekValidation = true,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 2 * 60 * 1000, // 2 minutes
    complianceLevel = "MEDIUM",
    onSuccess,
    onError,
    validateEntity,
    transformEntity,
  } = options;

  const [state, setState] = useState<CRUDState<TEntity>>({
    entities: [],
    currentEntity: null,
    loading: false,
    error: null,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    isFetching: false,
    lastFetch: 0,
    validationErrors: {},
  });

  // Greek validation helper
  const validateGreekFields = useCallback(
    (entity: Partial<TEntity>): ValidationResult => {
      if (!enableGreekValidation) {
        return { isValid: true, errors: {} };
      }

      const errors: Record<string, string> = {};

      // Check for AFM field
      if (entity.afm && !validateAFM(entity.afm as string)) {
        errors.afm = "Μη έγκυρο ΑΦΜ";
      }

      // Check for phone field
      if (entity.phone && !validateGreekPhone(entity.phone as string)) {
        errors.phone = "Μη έγκυρος αριθμός τηλεφώνου";
      }

      // Check for postal code
      if (
        entity.postalCode &&
        !validateGreekPostalCode(entity.postalCode as string)
      ) {
        errors.postalCode = "Μη έγκυρος ταχυδρομικός κώδικας";
      }

      return {
        isValid: Object.keys(errors).length === 0,
        errors,
      };
    },
    [
      enableGreekValidation,
      validateAFM,
      validateGreekPhone,
      validateGreekPostalCode,
    ]
  );

  // Combined validation
  const validate = useCallback(
    (entity: Partial<TEntity>): ValidationResult => {
      let result: ValidationResult = { isValid: true, errors: {} };

      // Custom validation
      if (validateEntity) {
        result = validateEntity(entity);
      }

      // Greek validation
      if (enableGreekValidation) {
        const greekResult = validateGreekFields(entity);
        result = {
          isValid: result.isValid && greekResult.isValid,
          errors: { ...result.errors, ...greekResult.errors },
        };
      }

      // Update state with validation errors
      setState((prev) => ({
        ...prev,
        validationErrors: result.errors,
      }));

      return result;
    },
    [validateEntity, enableGreekValidation, validateGreekFields]
  );

  // Audit logging helper
  const auditLog = useCallback(
    (operation: CRUDOperation, entityData?: any, error?: Error) => {
      if (!enableAuditLog) return;

      logAction({
        userId: "current_user",
        userEmail: "user@example.com",
        companyId: companyState.currentCompany?.id || "unknown",
        sessionId: "current_session",
        action: `${entityName}.${operation}`,
        module: "data",
        feature: "entity_crud",
        resource: entityName,
        resourceId: entityData?.id || "unknown",
        details: {
          method:
            operation === "create"
              ? "CREATE"
              : operation === "read" || operation === "search"
              ? "READ"
              : operation === "update"
              ? "UPDATE"
              : "DELETE",
          outcome: error ? "FAILURE" : "SUCCESS",
          errorMessage: error?.message,
          metadata: {
            entityName,
            entityData: entityData ? JSON.stringify(entityData) : undefined,
            operation,
            endpoint: apiEndpoint,
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
              ? 70
              : complianceLevel === "HIGH"
              ? 50
              : 30,
          factors: [`entity_${operation}`, "business_data"],
          flagged: !!error,
          requiresReview: complianceLevel === "CRITICAL" || !!error,
        },
      });
    },
    [
      enableAuditLog,
      logAction,
      companyState.currentCompany?.id,
      entityName,
      apiEndpoint,
      complianceLevel,
    ]
  );

  // Notification helper
  const showNotification = useCallback(
    (operation: CRUDOperation, success: boolean, message?: string) => {
      if (!enableNotifications) return;

      const operationLabels = {
        create: "Δημιουργία",
        read: "Ανάγνωση",
        update: "Ενημέρωση",
        delete: "Διαγραφή",
        search: "Αναζήτηση",
      };

      addNotification({
        type: success ? "success" : "error",
        title: `${operationLabels[operation]} ${entityName}`,
        message:
          message ||
          (success
            ? "Η λειτουργία ολοκληρώθηκε επιτυχώς"
            : "Παρουσιάστηκε σφάλμα"),
        priority: success ? "medium" : "high",
        category: "business",
        isPersistent: false,
        autoClose: true,
        duration: success ? 3000 : 5000,
      });
    },
    [enableNotifications, addNotification, entityName]
  );

  // API call helper
  const apiCall = useCallback(
    async (method: string, endpoint: string, data?: any) => {
      const response = await fetch(`${apiEndpoint}${endpoint}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-Company-ID": companyState.currentCompany?.id || "",
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    },
    [apiEndpoint, companyState.currentCompany?.id]
  );

  // CRUD Operations
  const fetchAll = useCallback(
    async (filters?: CRUDFilters): Promise<TEntity[]> => {
      setState((prev) => ({ ...prev, isFetching: true, error: null }));

      try {
        const queryParams = new URLSearchParams();
        if (filters?.search) queryParams.append("search", filters.search);
        if (filters?.sortBy) queryParams.append("sortBy", filters.sortBy);
        if (filters?.sortOrder)
          queryParams.append("sortOrder", filters.sortOrder);
        if (filters?.page) queryParams.append("page", filters.page.toString());
        if (filters?.limit)
          queryParams.append("limit", filters.limit.toString());
        if (filters?.filters) {
          Object.entries(filters.filters).forEach(([key, value]) => {
            queryParams.append(key, value.toString());
          });
        }

        const queryString = queryParams.toString();
        const endpoint = queryString ? `?${queryString}` : "";

        const entities = await apiCall("GET", endpoint);
        const transformedEntities = transformEntity
          ? entities.map(transformEntity)
          : entities;

        setState((prev) => ({
          ...prev,
          entities: transformedEntities,
          isFetching: false,
          lastFetch: Date.now(),
        }));

        auditLog("read", { count: transformedEntities.length, filters });
        showNotification("read", true);

        if (onSuccess) {
          onSuccess("read", transformedEntities);
        }

        return transformedEntities;
      } catch (error) {
        const errorMessage = (error as Error).message;
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isFetching: false,
        }));

        auditLog("read", { filters }, error as Error);
        showNotification("read", false, errorMessage);

        if (onError) {
          onError("read", error as Error);
        }

        throw error;
      }
    },
    [apiCall, transformEntity, auditLog, showNotification, onSuccess, onError]
  );

  const fetchById = useCallback(
    async (id: string): Promise<TEntity> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const entity = await apiCall("GET", `/${id}`);
        const transformedEntity = transformEntity
          ? transformEntity(entity)
          : entity;

        setState((prev) => ({
          ...prev,
          currentEntity: transformedEntity,
          loading: false,
        }));

        auditLog("read", { id });

        if (onSuccess) {
          onSuccess("read", transformedEntity);
        }

        return transformedEntity;
      } catch (error) {
        const errorMessage = (error as Error).message;
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));

        auditLog("read", { id }, error as Error);

        if (onError) {
          onError("read", error as Error);
        }

        throw error;
      }
    },
    [apiCall, transformEntity, auditLog, onSuccess, onError]
  );

  const create = useCallback(
    async (entity: Partial<TEntity>): Promise<TEntity> => {
      if (enableValidation) {
        const validation = validate(entity);
        if (!validation.isValid) {
          throw new Error("Validation failed");
        }
      }

      setState((prev) => ({ ...prev, isCreating: true, error: null }));

      try {
        const newEntity = await apiCall("POST", "", entity);
        const transformedEntity = transformEntity
          ? transformEntity(newEntity)
          : newEntity;

        setState((prev) => ({
          ...prev,
          entities: [...prev.entities, transformedEntity],
          currentEntity: transformedEntity,
          isCreating: false,
          validationErrors: {},
        }));

        auditLog("create", transformedEntity);
        showNotification("create", true);

        if (onSuccess) {
          onSuccess("create", transformedEntity);
        }

        return transformedEntity;
      } catch (error) {
        const errorMessage = (error as Error).message;
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isCreating: false,
        }));

        auditLog("create", entity, error as Error);
        showNotification("create", false, errorMessage);

        if (onError) {
          onError("create", error as Error);
        }

        throw error;
      }
    },
    [
      apiCall,
      transformEntity,
      enableValidation,
      validate,
      auditLog,
      showNotification,
      onSuccess,
      onError,
    ]
  );

  const update = useCallback(
    async (id: string, entity: Partial<TEntity>): Promise<TEntity> => {
      if (enableValidation) {
        const validation = validate(entity);
        if (!validation.isValid) {
          throw new Error("Validation failed");
        }
      }

      setState((prev) => ({ ...prev, isUpdating: true, error: null }));

      try {
        const updatedEntity = await apiCall("PUT", `/${id}`, entity);
        const transformedEntity = transformEntity
          ? transformEntity(updatedEntity)
          : updatedEntity;

        setState((prev) => ({
          ...prev,
          entities: prev.entities.map((e) =>
            e.id === id ? transformedEntity : e
          ),
          currentEntity:
            prev.currentEntity?.id === id
              ? transformedEntity
              : prev.currentEntity,
          isUpdating: false,
          validationErrors: {},
        }));

        auditLog("update", transformedEntity);
        showNotification("update", true);

        if (onSuccess) {
          onSuccess("update", transformedEntity);
        }

        return transformedEntity;
      } catch (error) {
        const errorMessage = (error as Error).message;
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isUpdating: false,
        }));

        auditLog("update", { id, ...entity }, error as Error);
        showNotification("update", false, errorMessage);

        if (onError) {
          onError("update", error as Error);
        }

        throw error;
      }
    },
    [
      apiCall,
      transformEntity,
      enableValidation,
      validate,
      auditLog,
      showNotification,
      onSuccess,
      onError,
    ]
  );

  const deleteEntity = useCallback(
    async (id: string): Promise<void> => {
      setState((prev) => ({ ...prev, isDeleting: true, error: null }));

      try {
        await apiCall("DELETE", `/${id}`);

        setState((prev) => ({
          ...prev,
          entities: prev.entities.filter((e) => e.id !== id),
          currentEntity:
            prev.currentEntity?.id === id ? null : prev.currentEntity,
          isDeleting: false,
        }));

        auditLog("delete", { id });
        showNotification("delete", true);

        if (onSuccess) {
          onSuccess("delete", [] as TEntity[]);
        }
      } catch (error) {
        const errorMessage = (error as Error).message;
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          isDeleting: false,
        }));

        auditLog("delete", { id }, error as Error);
        showNotification("delete", false, errorMessage);

        if (onError) {
          onError("delete", error as Error);
        }

        throw error;
      }
    },
    [apiCall, auditLog, showNotification, onSuccess, onError]
  );

  const search = useCallback(
    async (query: string): Promise<TEntity[]> => {
      return fetchAll({ search: query });
    },
    [fetchAll]
  );

  const createMany = useCallback(
    async (entities: Partial<TEntity>[]): Promise<TEntity[]> => {
      const results: TEntity[] = [];
      for (const entity of entities) {
        try {
          const result = await create(entity);
          results.push(result);
        } catch (error) {
          console.error("Failed to create entity:", error);
        }
      }
      return results;
    },
    [create]
  );

  const updateMany = useCallback(
    async (
      entities: { id: string; data: Partial<TEntity> }[]
    ): Promise<TEntity[]> => {
      const results: TEntity[] = [];
      for (const entity of entities) {
        try {
          const result = await update(entity.id, entity.data);
          results.push(result);
        } catch (error) {
          console.error("Failed to update entity:", error);
        }
      }
      return results;
    },
    [update]
  );

  const deleteMany = useCallback(
    async (ids: string[]): Promise<void> => {
      for (const id of ids) {
        try {
          await deleteEntity(id);
        } catch (error) {
          console.error("Failed to delete entity:", error);
        }
      }
    },
    [deleteEntity]
  );

  // Utility functions
  const reset = useCallback(() => {
    setState({
      entities: [],
      currentEntity: null,
      loading: false,
      error: null,
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      isFetching: false,
      lastFetch: 0,
      validationErrors: {},
    });
  }, []);

  const clearErrors = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
      validationErrors: {},
    }));
  }, []);

  const refresh = useCallback(async () => {
    await fetchAll();
  }, [fetchAll]);

  const selectEntity = useCallback((entity: TEntity) => {
    setState((prev) => ({
      ...prev,
      currentEntity: entity,
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentEntity: null,
    }));
  }, []);

  // Auto-refresh based on stale time
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.lastFetch && Date.now() - state.lastFetch > staleTime) {
        refresh();
      }
    }, staleTime);

    return () => clearInterval(interval);
  }, [state.lastFetch, staleTime, refresh]);

  return {
    ...state,
    fetchAll,
    fetchById,
    search,
    create,
    createMany,
    update,
    updateMany,
    delete: deleteEntity,
    deleteMany,
    reset,
    clearErrors,
    validate,
    refresh,
    selectEntity,
    clearSelection,
  };
}

export default useEntityCRUD;
