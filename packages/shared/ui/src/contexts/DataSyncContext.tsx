import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

export interface SyncOperation {
  id: string;
  type: "CREATE" | "UPDATE" | "DELETE";
  resource: string;
  resourceId: string;
  companyId: string;
  userId: string;
  timestamp: string;
  data: any;
  version: number;
  checksum: string;
  status: "PENDING" | "SYNCING" | "SYNCED" | "FAILED" | "CONFLICT";
  retryCount: number;
  maxRetries: number;
  error?: string;
  conflictData?: any;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
}

export interface SyncConflict {
  id: string;
  operationId: string;
  resource: string;
  resourceId: string;
  localData: any;
  remoteData: any;
  conflictType: "VERSION" | "SIMULTANEOUS" | "DELETED" | "PERMISSION";
  timestamp: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolution?: "LOCAL" | "REMOTE" | "MERGE" | "MANUAL";
  mergedData?: any;
}

export interface SyncStatistics {
  totalOperations: number;
  pendingOperations: number;
  syncedOperations: number;
  failedOperations: number;
  conflictedOperations: number;
  lastSyncTime: string | null;
  syncSpeed: number; // operations per second
  dataTransferred: number; // bytes
  uptime: number; // seconds
  connectionQuality: "EXCELLENT" | "GOOD" | "POOR" | "OFFLINE";
  resourceStats: Record<
    string,
    {
      synced: number;
      pending: number;
      failed: number;
      conflicts: number;
    }
  >;
}

export interface SyncSettings {
  enableRealTimeSync: boolean;
  enableOfflineMode: boolean;
  autoResolveConflicts: boolean;
  conflictResolutionStrategy:
    | "LOCAL_WINS"
    | "REMOTE_WINS"
    | "TIMESTAMP"
    | "MANUAL";
  syncInterval: number; // milliseconds
  batchSize: number;
  maxRetries: number;
  retryDelay: number; // milliseconds
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  prioritySync: boolean;
  resources: {
    [key: string]: {
      enabled: boolean;
      realTime: boolean;
      conflictResolution: "LOCAL_WINS" | "REMOTE_WINS" | "TIMESTAMP" | "MANUAL";
      syncInterval: number;
      priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    };
  };
}

interface DataSyncState {
  isOnline: boolean;
  isConnected: boolean;
  isSyncing: boolean;
  operations: SyncOperation[];
  conflicts: SyncConflict[];
  statistics: SyncStatistics;
  settings: SyncSettings;
  loading: boolean;
  error: string | null;
  lastActivity: string | null;
  connectionId: string | null;
  syncQueue: string[];
  offlineChanges: Record<string, any>;
}

type DataSyncAction =
  | { type: "SET_ONLINE_STATUS"; payload: boolean }
  | { type: "SET_CONNECTION_STATUS"; payload: boolean }
  | { type: "SET_SYNCING_STATUS"; payload: boolean }
  | { type: "ADD_OPERATION"; payload: SyncOperation }
  | {
      type: "UPDATE_OPERATION";
      payload: { id: string; updates: Partial<SyncOperation> };
    }
  | { type: "REMOVE_OPERATION"; payload: string }
  | { type: "SET_OPERATIONS"; payload: SyncOperation[] }
  | { type: "ADD_CONFLICT"; payload: SyncConflict }
  | { type: "RESOLVE_CONFLICT"; payload: { id: string; resolution: any } }
  | { type: "UPDATE_STATISTICS"; payload: Partial<SyncStatistics> }
  | { type: "UPDATE_SETTINGS"; payload: Partial<SyncSettings> }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_LAST_ACTIVITY"; payload: string }
  | { type: "SET_CONNECTION_ID"; payload: string | null }
  | { type: "ADD_TO_SYNC_QUEUE"; payload: string }
  | { type: "REMOVE_FROM_SYNC_QUEUE"; payload: string }
  | { type: "SET_OFFLINE_CHANGES"; payload: Record<string, any> }
  | { type: "CLEAR_OFFLINE_CHANGES" };

const defaultSettings: SyncSettings = {
  enableRealTimeSync: true,
  enableOfflineMode: true,
  autoResolveConflicts: false,
  conflictResolutionStrategy: "MANUAL",
  syncInterval: 30000, // 30 seconds
  batchSize: 100,
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
  compressionEnabled: true,
  encryptionEnabled: true,
  prioritySync: true,
  resources: {
    customers: {
      enabled: true,
      realTime: true,
      conflictResolution: "MANUAL",
      syncInterval: 15000,
      priority: "HIGH",
    },
    invoices: {
      enabled: true,
      realTime: true,
      conflictResolution: "TIMESTAMP",
      syncInterval: 10000,
      priority: "URGENT",
    },
    products: {
      enabled: true,
      realTime: false,
      conflictResolution: "REMOTE_WINS",
      syncInterval: 60000,
      priority: "MEDIUM",
    },
  },
};

const initialState: DataSyncState = {
  isOnline: navigator.onLine,
  isConnected: false,
  isSyncing: false,
  operations: [],
  conflicts: [],
  statistics: {
    totalOperations: 0,
    pendingOperations: 0,
    syncedOperations: 0,
    failedOperations: 0,
    conflictedOperations: 0,
    lastSyncTime: null,
    syncSpeed: 0,
    dataTransferred: 0,
    uptime: 0,
    connectionQuality: "OFFLINE",
    resourceStats: {},
  },
  settings: defaultSettings,
  loading: false,
  error: null,
  lastActivity: null,
  connectionId: null,
  syncQueue: [],
  offlineChanges: {},
};

function dataSyncReducer(
  state: DataSyncState,
  action: DataSyncAction
): DataSyncState {
  switch (action.type) {
    case "SET_ONLINE_STATUS":
      return { ...state, isOnline: action.payload };

    case "SET_CONNECTION_STATUS":
      return { ...state, isConnected: action.payload };

    case "SET_SYNCING_STATUS":
      return { ...state, isSyncing: action.payload };

    case "ADD_OPERATION":
      return {
        ...state,
        operations: [action.payload, ...state.operations],
        statistics: {
          ...state.statistics,
          totalOperations: state.statistics.totalOperations + 1,
          pendingOperations: state.statistics.pendingOperations + 1,
        },
      };

    case "UPDATE_OPERATION":
      return {
        ...state,
        operations: state.operations.map((op) =>
          op.id === action.payload.id
            ? { ...op, ...action.payload.updates }
            : op
        ),
      };

    case "REMOVE_OPERATION":
      return {
        ...state,
        operations: state.operations.filter((op) => op.id !== action.payload),
      };

    case "SET_OPERATIONS":
      return { ...state, operations: action.payload };

    case "ADD_CONFLICT":
      return {
        ...state,
        conflicts: [action.payload, ...state.conflicts],
        statistics: {
          ...state.statistics,
          conflictedOperations: state.statistics.conflictedOperations + 1,
        },
      };

    case "RESOLVE_CONFLICT":
      return {
        ...state,
        conflicts: state.conflicts.map((conflict) =>
          conflict.id === action.payload.id
            ? { ...conflict, ...action.payload.resolution }
            : conflict
        ),
      };

    case "UPDATE_STATISTICS":
      return {
        ...state,
        statistics: { ...state.statistics, ...action.payload },
      };

    case "UPDATE_SETTINGS":
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };

    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload };

    case "SET_LAST_ACTIVITY":
      return { ...state, lastActivity: action.payload };

    case "SET_CONNECTION_ID":
      return { ...state, connectionId: action.payload };

    case "ADD_TO_SYNC_QUEUE":
      return {
        ...state,
        syncQueue: [...state.syncQueue, action.payload],
      };

    case "REMOVE_FROM_SYNC_QUEUE":
      return {
        ...state,
        syncQueue: state.syncQueue.filter((id) => id !== action.payload),
      };

    case "SET_OFFLINE_CHANGES":
      return { ...state, offlineChanges: action.payload };

    case "CLEAR_OFFLINE_CHANGES":
      return { ...state, offlineChanges: {} };

    default:
      return state;
  }
}

const DataSyncContext = createContext<{
  state: DataSyncState;
  dispatch: React.Dispatch<DataSyncAction>;
  // Core sync functions
  syncData: (
    resource: string,
    data: any,
    operation: "CREATE" | "UPDATE" | "DELETE"
  ) => Promise<void>;
  syncResource: (resource: string) => Promise<void>;
  syncAll: () => Promise<void>;
  forcSync: (operationId: string) => Promise<void>;
  // Conflict resolution
  resolveConflict: (
    conflictId: string,
    resolution: "LOCAL" | "REMOTE" | "MERGE",
    mergedData?: any
  ) => Promise<void>;
  autoResolveConflicts: () => Promise<void>;
  getConflictsByResource: (resource: string) => SyncConflict[];
  // Queue management
  addToQueue: (
    resource: string,
    data: any,
    operation: "CREATE" | "UPDATE" | "DELETE"
  ) => void;
  processQueue: () => Promise<void>;
  clearQueue: () => void;
  retryFailedOperations: () => Promise<void>;
  // Offline support
  enableOfflineMode: () => void;
  disableOfflineMode: () => void;
  syncOfflineChanges: () => Promise<void>;
  getOfflineChanges: () => Record<string, any>;
  // Statistics and monitoring
  getStatistics: () => SyncStatistics;
  getOperationsByResource: (resource: string) => SyncOperation[];
  getFailedOperations: () => SyncOperation[];
  getPendingOperations: () => SyncOperation[];
  // Settings
  updateSettings: (settings: Partial<SyncSettings>) => void;
  updateResourceSettings: (
    resource: string,
    settings: Partial<SyncSettings["resources"][string]>
  ) => void;
  // Connection management
  connect: () => Promise<void>;
  disconnect: () => void;
  reconnect: () => Promise<void>;
  checkConnection: () => Promise<boolean>;
  // Utilities
  generateChecksum: (data: any) => string;
  validateOperation: (operation: SyncOperation) => boolean;
  optimizeData: (data: any) => any;
  // Real-time features
  subscribeToResource: (
    resource: string,
    callback: (data: any) => void
  ) => () => void;
  unsubscribeFromResource: (resource: string) => void;
  broadcastChange: (resource: string, data: any) => void;
} | null>(null);

export function DataSyncProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dataSyncReducer, initialState);

  // Generate unique operation ID
  const generateOperationId = () =>
    `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Core sync functions
  const syncData = async (
    resource: string,
    data: any,
    operation: "CREATE" | "UPDATE" | "DELETE"
  ) => {
    if (!state.isOnline && !state.settings.enableOfflineMode) {
      throw new Error("Cannot sync data while offline");
    }

    const syncOperation: SyncOperation = {
      id: generateOperationId(),
      type: operation,
      resource,
      resourceId: data.id || generateOperationId(),
      companyId: "current-company-id", // Get from auth context
      userId: "current-user-id",
      timestamp: new Date().toISOString(),
      data,
      version: data.version || 1,
      checksum: generateChecksum(data),
      status: "PENDING",
      retryCount: 0,
      maxRetries: state.settings.maxRetries,
      priority: state.settings.resources[resource]?.priority || "MEDIUM",
    };

    dispatch({ type: "ADD_OPERATION", payload: syncOperation });

    if (state.isOnline && state.isConnected) {
      await processOperation(syncOperation);
    } else {
      // Store for offline sync
      const offlineChanges = { ...state.offlineChanges };
      offlineChanges[syncOperation.id] = syncOperation;
      dispatch({ type: "SET_OFFLINE_CHANGES", payload: offlineChanges });
    }
  };

  const syncResource = async (resource: string) => {
    if (!state.settings.resources[resource]?.enabled) {
      return;
    }

    dispatch({ type: "SET_SYNCING_STATUS", payload: true });

    try {
      // In a real implementation, fetch and sync resource data
      const pendingOps = state.operations.filter(
        (op) => op.resource === resource && op.status === "PENDING"
      );

      for (const operation of pendingOps) {
        await processOperation(operation);
      }
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Sync failed",
      });
    } finally {
      dispatch({ type: "SET_SYNCING_STATUS", payload: false });
    }
  };

  const syncAll = async () => {
    dispatch({ type: "SET_SYNCING_STATUS", payload: true });

    try {
      const resources = Object.keys(state.settings.resources);
      await Promise.all(resources.map((resource) => syncResource(resource)));
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Full sync failed",
      });
    } finally {
      dispatch({ type: "SET_SYNCING_STATUS", payload: false });
    }
  };

  const forcSync = async (operationId: string) => {
    const operation = state.operations.find((op) => op.id === operationId);
    if (!operation) {
      throw new Error("Operation not found");
    }

    dispatch({
      type: "UPDATE_OPERATION",
      payload: {
        id: operationId,
        updates: { status: "PENDING", retryCount: 0 },
      },
    });

    await processOperation(operation);
  };

  // Process individual operation
  const processOperation = async (operation: SyncOperation) => {
    dispatch({
      type: "UPDATE_OPERATION",
      payload: {
        id: operation.id,
        updates: { status: "SYNCING" },
      },
    });

    try {
      // In a real implementation, send to server
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay

      dispatch({
        type: "UPDATE_OPERATION",
        payload: {
          id: operation.id,
          updates: { status: "SYNCED" },
        },
      });

      dispatch({
        type: "UPDATE_STATISTICS",
        payload: {
          syncedOperations: state.statistics.syncedOperations + 1,
          pendingOperations: state.statistics.pendingOperations - 1,
          lastSyncTime: new Date().toISOString(),
        },
      });
    } catch (error) {
      const retryCount = operation.retryCount + 1;

      if (retryCount >= operation.maxRetries) {
        dispatch({
          type: "UPDATE_OPERATION",
          payload: {
            id: operation.id,
            updates: {
              status: "FAILED",
              error: error instanceof Error ? error.message : "Unknown error",
              retryCount,
            },
          },
        });

        dispatch({
          type: "UPDATE_STATISTICS",
          payload: {
            failedOperations: state.statistics.failedOperations + 1,
            pendingOperations: state.statistics.pendingOperations - 1,
          },
        });
      } else {
        dispatch({
          type: "UPDATE_OPERATION",
          payload: {
            id: operation.id,
            updates: {
              status: "PENDING",
              retryCount,
              error: error instanceof Error ? error.message : "Unknown error",
            },
          },
        });

        // Retry after delay
        setTimeout(
          () => processOperation(operation),
          state.settings.retryDelay
        );
      }
    }
  };

  // Conflict resolution
  const resolveConflict = async (
    conflictId: string,
    resolution: "LOCAL" | "REMOTE" | "MERGE",
    mergedData?: any
  ) => {
    const conflict = state.conflicts.find((c) => c.id === conflictId);
    if (!conflict) {
      throw new Error("Conflict not found");
    }

    let resolvedData;
    switch (resolution) {
      case "LOCAL":
        resolvedData = conflict.localData;
        break;
      case "REMOTE":
        resolvedData = conflict.remoteData;
        break;
      case "MERGE":
        resolvedData = mergedData || {
          ...conflict.remoteData,
          ...conflict.localData,
        };
        break;
    }

    dispatch({
      type: "RESOLVE_CONFLICT",
      payload: {
        id: conflictId,
        resolution: {
          resolvedBy: "current-user-id",
          resolvedAt: new Date().toISOString(),
          resolution,
          mergedData: resolvedData,
        },
      },
    });

    // Re-sync with resolved data
    await syncData(conflict.resource, resolvedData, "UPDATE");
  };

  const autoResolveConflicts = async () => {
    if (!state.settings.autoResolveConflicts) {
      return;
    }

    const unresolvedConflicts = state.conflicts.filter((c) => !c.resolvedBy);

    for (const conflict of unresolvedConflicts) {
      const strategy =
        state.settings.resources[conflict.resource]?.conflictResolution ||
        state.settings.conflictResolutionStrategy;

      switch (strategy) {
        case "LOCAL_WINS":
          await resolveConflict(conflict.id, "LOCAL");
          break;
        case "REMOTE_WINS":
          await resolveConflict(conflict.id, "REMOTE");
          break;
        case "TIMESTAMP":
          const localTime = new Date(
            conflict.localData.updatedAt || conflict.localData.createdAt
          );
          const remoteTime = new Date(
            conflict.remoteData.updatedAt || conflict.remoteData.createdAt
          );
          await resolveConflict(
            conflict.id,
            localTime > remoteTime ? "LOCAL" : "REMOTE"
          );
          break;
      }
    }
  };

  const getConflictsByResource = (resource: string) => {
    return state.conflicts.filter((c) => c.resource === resource);
  };

  // Queue management
  const addToQueue = (
    resource: string,
    data: any,
    operation: "CREATE" | "UPDATE" | "DELETE"
  ) => {
    const operationId = generateOperationId();
    dispatch({ type: "ADD_TO_SYNC_QUEUE", payload: operationId });

    // Store operation for processing
    const syncOperation: SyncOperation = {
      id: operationId,
      type: operation,
      resource,
      resourceId: data.id || operationId,
      companyId: "current-company-id",
      userId: "current-user-id",
      timestamp: new Date().toISOString(),
      data,
      version: data.version || 1,
      checksum: generateChecksum(data),
      status: "PENDING",
      retryCount: 0,
      maxRetries: state.settings.maxRetries,
      priority: state.settings.resources[resource]?.priority || "MEDIUM",
    };

    dispatch({ type: "ADD_OPERATION", payload: syncOperation });
  };

  const processQueue = async () => {
    if (state.syncQueue.length === 0) {
      return;
    }

    dispatch({ type: "SET_SYNCING_STATUS", payload: true });

    try {
      const batchSize = state.settings.batchSize;
      const batch = state.syncQueue.slice(0, batchSize);

      for (const operationId of batch) {
        const operation = state.operations.find((op) => op.id === operationId);
        if (operation) {
          await processOperation(operation);
        }
        dispatch({ type: "REMOVE_FROM_SYNC_QUEUE", payload: operationId });
      }
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error ? error.message : "Queue processing failed",
      });
    } finally {
      dispatch({ type: "SET_SYNCING_STATUS", payload: false });
    }
  };

  const clearQueue = () => {
    state.syncQueue.forEach((operationId) => {
      dispatch({ type: "REMOVE_FROM_SYNC_QUEUE", payload: operationId });
    });
  };

  const retryFailedOperations = async () => {
    const failedOps = state.operations.filter((op) => op.status === "FAILED");

    for (const operation of failedOps) {
      dispatch({
        type: "UPDATE_OPERATION",
        payload: {
          id: operation.id,
          updates: { status: "PENDING", retryCount: 0, error: undefined },
        },
      });

      await processOperation(operation);
    }
  };

  // Offline support
  const enableOfflineMode = () => {
    dispatch({ type: "UPDATE_SETTINGS", payload: { enableOfflineMode: true } });
  };

  const disableOfflineMode = () => {
    dispatch({
      type: "UPDATE_SETTINGS",
      payload: { enableOfflineMode: false },
    });
  };

  const syncOfflineChanges = async () => {
    if (Object.keys(state.offlineChanges).length === 0) {
      return;
    }

    dispatch({ type: "SET_SYNCING_STATUS", payload: true });

    try {
      for (const [operationId, operation] of Object.entries(
        state.offlineChanges
      )) {
        await processOperation(operation as SyncOperation);
      }

      dispatch({ type: "CLEAR_OFFLINE_CHANGES" });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Offline sync failed",
      });
    } finally {
      dispatch({ type: "SET_SYNCING_STATUS", payload: false });
    }
  };

  const getOfflineChanges = () => {
    return state.offlineChanges;
  };

  // Statistics and monitoring
  const getStatistics = () => {
    return state.statistics;
  };

  const getOperationsByResource = (resource: string) => {
    return state.operations.filter((op) => op.resource === resource);
  };

  const getFailedOperations = () => {
    return state.operations.filter((op) => op.status === "FAILED");
  };

  const getPendingOperations = () => {
    return state.operations.filter((op) => op.status === "PENDING");
  };

  // Settings
  const updateSettings = (settings: Partial<SyncSettings>) => {
    dispatch({ type: "UPDATE_SETTINGS", payload: settings });
  };

  const updateResourceSettings = (
    resource: string,
    settings: Partial<SyncSettings["resources"][string]>
  ) => {
    const newResourceSettings = {
      ...state.settings.resources,
      [resource]: { ...state.settings.resources[resource], ...settings },
    };

    dispatch({
      type: "UPDATE_SETTINGS",
      payload: { resources: newResourceSettings },
    });
  };

  // Connection management
  const connect = async () => {
    try {
      // In a real implementation, establish WebSocket connection
      const connectionId = `conn_${Date.now()}`;
      dispatch({ type: "SET_CONNECTION_ID", payload: connectionId });
      dispatch({ type: "SET_CONNECTION_STATUS", payload: true });
      dispatch({
        type: "SET_LAST_ACTIVITY",
        payload: new Date().toISOString(),
      });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload: error instanceof Error ? error.message : "Connection failed",
      });
    }
  };

  const disconnect = () => {
    dispatch({ type: "SET_CONNECTION_STATUS", payload: false });
    dispatch({ type: "SET_CONNECTION_ID", payload: null });
  };

  const reconnect = async () => {
    disconnect();
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await connect();
  };

  const checkConnection = async (): Promise<boolean> => {
    try {
      // In a real implementation, ping server
      return true;
    } catch (error) {
      return false;
    }
  };

  // Utilities
  const generateChecksum = (data: any): string => {
    // Simple checksum implementation
    return btoa(JSON.stringify(data)).slice(0, 16);
  };

  const validateOperation = (operation: SyncOperation): boolean => {
    return !!(
      operation.id &&
      operation.resource &&
      operation.type &&
      operation.data
    );
  };

  const optimizeData = (data: any): any => {
    // In a real implementation, compress and optimize data
    return data;
  };

  // Real-time features
  const subscribeToResource = (
    resource: string,
    callback: (data: any) => void
  ) => {
    // In a real implementation, subscribe to WebSocket events
    const unsubscribe = () => {
      // Cleanup subscription
    };

    return unsubscribe;
  };

  const unsubscribeFromResource = (resource: string) => {
    // In a real implementation, unsubscribe from WebSocket events
  };

  const broadcastChange = (resource: string, data: any) => {
    // In a real implementation, broadcast change to other clients
  };

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      dispatch({ type: "SET_ONLINE_STATUS", payload: true });
      if (state.settings.enableOfflineMode) {
        syncOfflineChanges();
      }
    };

    const handleOffline = () => {
      dispatch({ type: "SET_ONLINE_STATUS", payload: false });
      disconnect();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Auto-sync interval
  useEffect(() => {
    if (!state.settings.enableRealTimeSync) {
      return;
    }

    const interval = setInterval(() => {
      if (state.isOnline && state.isConnected && !state.isSyncing) {
        processQueue();
      }
    }, state.settings.syncInterval);

    return () => clearInterval(interval);
  }, [
    state.settings.syncInterval,
    state.settings.enableRealTimeSync,
    state.isOnline,
    state.isConnected,
    state.isSyncing,
  ]);

  const contextValue = {
    state,
    dispatch,
    syncData,
    syncResource,
    syncAll,
    forcSync,
    resolveConflict,
    autoResolveConflicts,
    getConflictsByResource,
    addToQueue,
    processQueue,
    clearQueue,
    retryFailedOperations,
    enableOfflineMode,
    disableOfflineMode,
    syncOfflineChanges,
    getOfflineChanges,
    getStatistics,
    getOperationsByResource,
    getFailedOperations,
    getPendingOperations,
    updateSettings,
    updateResourceSettings,
    connect,
    disconnect,
    reconnect,
    checkConnection,
    generateChecksum,
    validateOperation,
    optimizeData,
    subscribeToResource,
    unsubscribeFromResource,
    broadcastChange,
  };

  return (
    <DataSyncContext.Provider value={contextValue}>
      {children}
    </DataSyncContext.Provider>
  );
}

export function useDataSync() {
  const context = useContext(DataSyncContext);
  if (!context) {
    throw new Error("useDataSync must be used within a DataSyncProvider");
  }
  return context;
}

export default DataSyncContext;
