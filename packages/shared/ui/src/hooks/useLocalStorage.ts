import { useState, useEffect, useCallback } from "react";
import { useAudit } from "../contexts/AuditContext";
import { useCompany } from "../contexts/CompanyContext";

interface UseLocalStorageOptions {
  encrypt?: boolean;
  auditLog?: boolean;
  expirationDays?: number;
  companyIsolated?: boolean;
  fallbackValue?: any;
}

interface StorageData<T> {
  value: T;
  timestamp: number;
  expiresAt?: number;
  companyId?: string;
  encrypted?: boolean;
}

/**
 * Enhanced local storage hook with Greek ERP features
 * Provides encryption, audit logging, expiration, and multi-tenant support
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions = {}
) {
  const { logAction } = useAudit();
  const { state } = useCompany();

  const {
    encrypt = false,
    auditLog = false,
    expirationDays,
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
      const item = window.localStorage.getItem(storageKey);

      if (!item) {
        return fallbackValue !== undefined ? fallbackValue : initialValue;
      }

      const decryptedItem = decrypt_data(item);
      const parsedData: StorageData<T> = JSON.parse(decryptedItem);

      // Check expiration
      if (parsedData.expiresAt && Date.now() > parsedData.expiresAt) {
        window.localStorage.removeItem(storageKey);
        return fallbackValue !== undefined ? fallbackValue : initialValue;
      }

      // Check company isolation
      if (
        companyIsolated &&
        parsedData.companyId !== state.currentCompany?.id
      ) {
        return fallbackValue !== undefined ? fallbackValue : initialValue;
      }

      return parsedData.value;
    } catch (error) {
      console.error("Error reading from localStorage:", error);
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

        const storageData: StorageData<T> = {
          value: valueToStore,
          timestamp: Date.now(),
          companyId: companyIsolated ? state.currentCompany?.id : undefined,
          encrypted: encrypt,
        };

        if (expirationDays) {
          storageData.expiresAt =
            Date.now() + expirationDays * 24 * 60 * 60 * 1000;
        }

        const dataToStore = JSON.stringify(storageData);
        const encryptedData = encrypt_data(dataToStore);

        const storageKey = getStorageKey();
        window.localStorage.setItem(storageKey, encryptedData);

        setStoredValue(valueToStore);

        // Audit log if enabled
        if (auditLog) {
          logAction({
            userId: "system",
            userEmail: "system@localhost",
            companyId: state.currentCompany?.id || "unknown",
            sessionId: "system",
            action: "localStorage.set",
            module: "storage",
            feature: "localStorage",
            resource: "local_storage",
            resourceId: storageKey,
            details: {
              method: "CREATE",
              outcome: "SUCCESS",
              metadata: {
                key: storageKey,
                dataType: typeof valueToStore,
                encrypted: encrypt,
                companyIsolated,
                expirationDays,
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
              score: 30,
              factors: ["data_storage"],
              flagged: false,
              requiresReview: false,
            },
          });
        }
      } catch (error) {
        console.error("Error setting localStorage:", error);
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
      expirationDays,
    ]
  );

  // Remove from storage
  const removeValue = useCallback(() => {
    try {
      const storageKey = getStorageKey();
      window.localStorage.removeItem(storageKey);
      setStoredValue(
        fallbackValue !== undefined ? fallbackValue : initialValue
      );

      if (auditLog) {
        logAction({
          userId: "system",
          userEmail: "system@localhost",
          companyId: state.currentCompany?.id || "unknown",
          sessionId: "system",
          action: "localStorage.remove",
          module: "storage",
          feature: "localStorage",
          resource: "local_storage",
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
            score: 20,
            factors: ["data_deletion"],
            flagged: false,
            requiresReview: false,
          },
        });
      }
    } catch (error) {
      console.error("Error removing from localStorage:", error);
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

  // Clear expired entries
  const clearExpired = useCallback(() => {
    try {
      const keysToRemove: string[] = [];

      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (!key) continue;

        const item = window.localStorage.getItem(key);
        if (!item) continue;

        try {
          const decryptedItem = decrypt_data(item);
          const parsedData: StorageData<any> = JSON.parse(decryptedItem);

          if (parsedData.expiresAt && Date.now() > parsedData.expiresAt) {
            keysToRemove.push(key);
          }
        } catch {
          // Skip invalid items
        }
      }

      keysToRemove.forEach((key) => {
        window.localStorage.removeItem(key);
      });

      if (auditLog && keysToRemove.length > 0) {
        logAction({
          userId: "system",
          userEmail: "system@localhost",
          companyId: state.currentCompany?.id || "unknown",
          sessionId: "system",
          action: "localStorage.clearExpired",
          module: "storage",
          feature: "localStorage",
          resource: "local_storage",
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
            factors: ["data_cleanup"],
            flagged: false,
            requiresReview: false,
          },
        });
      }
    } catch (error) {
      console.error("Error clearing expired localStorage entries:", error);
    }
  }, [decrypt_data, auditLog, logAction, state.currentCompany?.id]);

  // Get storage info
  const getStorageInfo = useCallback(() => {
    try {
      const storageKey = getStorageKey();
      const item = window.localStorage.getItem(storageKey);

      if (!item) return null;

      const decryptedItem = decrypt_data(item);
      const parsedData: StorageData<T> = JSON.parse(decryptedItem);

      return {
        key: storageKey,
        timestamp: parsedData.timestamp,
        expiresAt: parsedData.expiresAt,
        companyId: parsedData.companyId,
        encrypted: parsedData.encrypted,
        size: item.length,
        isExpired: parsedData.expiresAt
          ? Date.now() > parsedData.expiresAt
          : false,
      };
    } catch (error) {
      console.error("Error getting storage info:", error);
      return null;
    }
  }, [getStorageKey, decrypt_data]);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      const storageKey = getStorageKey();
      if (e.key === storageKey) {
        setStoredValue(readFromStorage());
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [getStorageKey, readFromStorage]);

  // Auto-clear expired entries on mount
  useEffect(() => {
    clearExpired();
  }, [clearExpired]);

  return {
    value: storedValue,
    setValue,
    removeValue,
    clearExpired,
    getStorageInfo,
    isAvailable: typeof window !== "undefined" && "localStorage" in window,
  };
}

export default useLocalStorage;
