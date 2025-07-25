import { useState, useEffect, useCallback } from "react";
import { useAudit } from "../contexts/AuditContext";
import { useCompany } from "../contexts/CompanyContext";

interface UseSessionStorageOptions {
  encrypt?: boolean;
  auditLog?: boolean;
  companyIsolated?: boolean;
  fallbackValue?: any;
}

interface SessionStorageData<T> {
  value: T;
  timestamp: number;
  companyId?: string;
  encrypted?: boolean;
}

/**
 * Enhanced session storage hook with Greek ERP features
 * Provides encryption, audit logging, and multi-tenant support
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T,
  options: UseSessionStorageOptions = {}
) {
  const { logAction } = useAudit();
  const { state } = useCompany();

  const {
    encrypt = false,
    auditLog = false,
    companyIsolated = false,
    fallbackValue,
  } = options;

  // Generate company-specific key if isolated
  const getStorageKey = useCallback(() => {
    if (companyIsolated && state.currentCompany?.id) {
      return `${state.currentCompany.id}:${key}`;
    }
    return key;
  }, [key, companyIsolated, state.currentCompany?.id]);

  // Simple encryption/decryption (should use proper crypto in production)
  const encrypt_data = useCallback(
    (data: string): string => {
      if (!encrypt) return data;
      // Simple base64 encoding (use proper encryption in production)
      return btoa(data);
    },
    [encrypt]
  );

  const decrypt_data = useCallback(
    (data: string): string => {
      if (!encrypt) return data;
      try {
        return atob(data);
      } catch {
        return data; // Return as-is if decryption fails
      }
    },
    [encrypt]
  );

  // Read from storage
  const readFromStorage = useCallback((): T => {
    try {
      const storageKey = getStorageKey();
      const item = window.sessionStorage.getItem(storageKey);

      if (!item) {
        return fallbackValue !== undefined ? fallbackValue : initialValue;
      }

      const decryptedItem = decrypt_data(item);
      const parsedData: SessionStorageData<T> = JSON.parse(decryptedItem);

      // Check company isolation
      if (
        companyIsolated &&
        parsedData.companyId !== state.currentCompany?.id
      ) {
        return fallbackValue !== undefined ? fallbackValue : initialValue;
      }

      return parsedData.value;
    } catch (error) {
      console.error("Error reading from sessionStorage:", error);
      return fallbackValue !== undefined ? fallbackValue : initialValue;
    }
  }, [
    getStorageKey,
    decrypt_data,
    fallbackValue,
    initialValue,
    companyIsolated,
    state.currentCompany?.id,
  ]);

  // Initialize state
  const [storedValue, setStoredValue] = useState<T>(readFromStorage);

  // Write to storage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        const storageData: SessionStorageData<T> = {
          value: valueToStore,
          timestamp: Date.now(),
          companyId: companyIsolated ? state.currentCompany?.id : undefined,
          encrypted: encrypt,
        };

        const dataToStore = JSON.stringify(storageData);
        const encryptedData = encrypt_data(dataToStore);

        const storageKey = getStorageKey();
        window.sessionStorage.setItem(storageKey, encryptedData);

        setStoredValue(valueToStore);

        // Audit log if enabled
        if (auditLog) {
          logAction({
            userId: "system",
            userEmail: "system@localhost",
            companyId: state.currentCompany?.id || "unknown",
            sessionId: "system",
            action: "sessionStorage.set",
            module: "storage",
            feature: "sessionStorage",
            resource: "session_storage",
            resourceId: storageKey,
            details: {
              method: "CREATE",
              outcome: "SUCCESS",
              metadata: {
                key: storageKey,
                dataType: typeof valueToStore,
                encrypted: encrypt,
                companyIsolated,
              },
            },
            ipAddress: "127.0.0.1",
            userAgent: navigator.userAgent,
            compliance: {
              level: "MEDIUM",
              category: "PERSONAL_DATA",
              requiresRetention: true,
              personalDataInvolved: true,
              financialDataInvolved: false,
            },
            risk: {
              score: 25,
              factors: ["session_data_storage"],
              flagged: false,
              requiresReview: false,
            },
          });
        }
      } catch (error) {
        console.error("Error setting sessionStorage:", error);
      }
    },
    [
      storedValue,
      encrypt_data,
      getStorageKey,
      auditLog,
      logAction,
      encrypt,
      companyIsolated,
      state.currentCompany?.id,
    ]
  );

  // Remove from storage
  const removeValue = useCallback(() => {
    try {
      const storageKey = getStorageKey();
      window.sessionStorage.removeItem(storageKey);
      setStoredValue(
        fallbackValue !== undefined ? fallbackValue : initialValue
      );

      if (auditLog) {
        logAction({
          userId: "system",
          userEmail: "system@localhost",
          companyId: state.currentCompany?.id || "unknown",
          sessionId: "system",
          action: "sessionStorage.remove",
          module: "storage",
          feature: "sessionStorage",
          resource: "session_storage",
          resourceId: storageKey,
          details: {
            method: "DELETE",
            outcome: "SUCCESS",
            metadata: {
              key: storageKey,
              companyIsolated,
            },
          },
          ipAddress: "127.0.0.1",
          userAgent: navigator.userAgent,
          compliance: {
            level: "MEDIUM",
            category: "PERSONAL_DATA",
            requiresRetention: true,
            personalDataInvolved: true,
            financialDataInvolved: false,
          },
          risk: {
            score: 15,
            factors: ["session_data_deletion"],
            flagged: false,
            requiresReview: false,
          },
        });
      }
    } catch (error) {
      console.error("Error removing from sessionStorage:", error);
    }
  }, [
    getStorageKey,
    fallbackValue,
    initialValue,
    auditLog,
    logAction,
    companyIsolated,
    state.currentCompany?.id,
  ]);

  // Clear all session storage
  const clearAll = useCallback(() => {
    try {
      const keysToRemove: string[] = [];

      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (!key) continue;
        keysToRemove.push(key);
      }

      window.sessionStorage.clear();

      if (auditLog && keysToRemove.length > 0) {
        logAction({
          userId: "system",
          userEmail: "system@localhost",
          companyId: state.currentCompany?.id || "unknown",
          sessionId: "system",
          action: "sessionStorage.clearAll",
          module: "storage",
          feature: "sessionStorage",
          resource: "session_storage",
          details: {
            method: "DELETE",
            outcome: "SUCCESS",
            metadata: {
              removedKeys: keysToRemove,
              count: keysToRemove.length,
            },
          },
          ipAddress: "127.0.0.1",
          userAgent: navigator.userAgent,
          compliance: {
            level: "LOW",
            category: "SYSTEM",
            requiresRetention: true,
            personalDataInvolved: false,
            financialDataInvolved: false,
          },
          risk: {
            score: 10,
            factors: ["session_cleanup"],
            flagged: false,
            requiresReview: false,
          },
        });
      }

      setStoredValue(
        fallbackValue !== undefined ? fallbackValue : initialValue
      );
    } catch (error) {
      console.error("Error clearing sessionStorage:", error);
    }
  }, [
    auditLog,
    logAction,
    state.currentCompany?.id,
    fallbackValue,
    initialValue,
  ]);

  // Get storage info
  const getStorageInfo = useCallback(() => {
    try {
      const storageKey = getStorageKey();
      const item = window.sessionStorage.getItem(storageKey);

      if (!item) return null;

      const decryptedItem = decrypt_data(item);
      const parsedData: SessionStorageData<T> = JSON.parse(decryptedItem);

      return {
        key: storageKey,
        timestamp: parsedData.timestamp,
        companyId: parsedData.companyId,
        encrypted: parsedData.encrypted,
        size: item.length,
        sessionDuration: Date.now() - parsedData.timestamp,
      };
    } catch (error) {
      console.error("Error getting storage info:", error);
      return null;
    }
  }, [getStorageKey, decrypt_data]);

  // Listen for storage changes (session storage doesn't fire storage events across tabs)
  useEffect(() => {
    // Session storage is tab-specific, so we don't need to listen for storage events
    // But we can trigger a re-read if the company changes
    setStoredValue(readFromStorage());
  }, [readFromStorage]);

  return {
    value: storedValue,
    setValue,
    removeValue,
    clearAll,
    getStorageInfo,
    isAvailable: typeof window !== "undefined" && "sessionStorage" in window,
  };
}

export default useSessionStorage;
