import { useState, useEffect, useRef, useCallback } from "react";

export interface DebounceOptions {
  delay?: number;
  leading?: boolean; // Execute immediately on first call
  trailing?: boolean; // Execute after delay (default behavior)
  maxWait?: number; // Maximum time to wait before executing

  // Greek ERP specific
  auditLog?: boolean;
  companyId?: string;
  userId?: string;
  personalDataHandling?: boolean;
}

export interface DebounceResult<T> {
  debouncedValue: T;
  isDebouncing: boolean;
  cancel: () => void;
  flush: () => void;

  // Greek ERP specific
  executionCount: number;
  lastExecutionTime?: Date;
  auditTrail?: Array<{
    timestamp: Date;
    action: "execute" | "cancel" | "flush";
    value?: T;
    userId?: string;
    delay: number;
  }>;
}

export const useDebounce = <T>(
  value: T,
  options: DebounceOptions = {}
): DebounceResult<T> => {
  const {
    delay = 500,
    leading = false,
    trailing = true,
    maxWait,
    auditLog = false,
    companyId,
    userId,
    personalDataHandling = false,
  } = options;

  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [executionCount, setExecutionCount] = useState(0);
  const [lastExecutionTime, setLastExecutionTime] = useState<Date>();
  const [auditTrail, setAuditTrail] = useState<
    Array<{
      timestamp: Date;
      action: "execute" | "cancel" | "flush";
      value?: T;
      userId?: string;
      delay: number;
    }>
  >([]);

  const timeoutRef = useRef<NodeJS.Timeout>();
  const maxWaitTimeoutRef = useRef<NodeJS.Timeout>();
  const lastCallTimeRef = useRef<number>();
  const lastLeadingCallTimeRef = useRef<number>();
  const previousValueRef = useRef<T>(value);

  // Audit logging helper
  const addAuditEntry = useCallback(
    (action: "execute" | "cancel" | "flush", executedValue?: T) => {
      if (auditLog) {
        const entry = {
          timestamp: new Date(),
          action,
          value: personalDataHandling ? undefined : executedValue,
          userId,
          delay,
        };

        setAuditTrail((prev) => [...prev, entry]);

        // Log to console for Greek compliance
        console.log(`[Debounce] ${action}:`, {
          companyId,
          userId,
          timestamp: entry.timestamp.toISOString(),
          hasValue: executedValue !== undefined,
          delay,
        });
      }
    },
    [auditLog, personalDataHandling, userId, delay, companyId]
  );

  // Execute the debounced function
  const execute = useCallback(
    (executedValue: T, source: "leading" | "trailing" | "flush") => {
      setDebouncedValue(executedValue);
      setIsDebouncing(false);
      setExecutionCount((prev) => prev + 1);
      setLastExecutionTime(new Date());

      addAuditEntry("execute", executedValue);

      if (auditLog) {
        console.log(`[Debounce] Executed (${source}):`, {
          companyId,
          userId,
          timestamp: new Date().toISOString(),
          executionCount: executionCount + 1,
        });
      }
    },
    [addAuditEntry, auditLog, companyId, userId, executionCount]
  );

  // Cancel pending execution
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }

    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current);
      maxWaitTimeoutRef.current = undefined;
    }

    setIsDebouncing(false);
    addAuditEntry("cancel");
  }, [addAuditEntry]);

  // Flush (execute immediately)
  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }

    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current);
      maxWaitTimeoutRef.current = undefined;
    }

    execute(value, "flush");
    addAuditEntry("flush", value);
  }, [value, execute, addAuditEntry]);

  // Main debounce logic
  useEffect(() => {
    const now = Date.now();
    lastCallTimeRef.current = now;

    // Leading edge execution
    if (
      leading &&
      (!lastLeadingCallTimeRef.current ||
        now - lastLeadingCallTimeRef.current > delay)
    ) {
      lastLeadingCallTimeRef.current = now;
      execute(value, "leading");
      return;
    }

    // Set up trailing execution
    if (trailing) {
      setIsDebouncing(true);

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        execute(value, "trailing");
      }, delay);

      // Set up maxWait timeout if specified
      if (maxWait && !maxWaitTimeoutRef.current) {
        maxWaitTimeoutRef.current = setTimeout(() => {
          execute(value, "trailing");
        }, maxWait);
      }
    }

    // Store previous value for comparison
    previousValueRef.current = value;

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (maxWaitTimeoutRef.current) {
        clearTimeout(maxWaitTimeoutRef.current);
      }
    };
  }, [value, delay, leading, trailing, maxWait, execute]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    debouncedValue,
    isDebouncing,
    cancel,
    flush,
    executionCount,
    lastExecutionTime,
    auditTrail: auditLog ? auditTrail : undefined,
  };
};

// Hook for debounced callback functions
export const useDebouncedCallback = <TArgs extends any[], TReturn>(
  callback: (...args: TArgs) => TReturn,
  options: DebounceOptions = {}
) => {
  const {
    delay = 500,
    leading = false,
    trailing = true,
    maxWait,
    auditLog = false,
    companyId,
    userId,
  } = options;

  const [executionCount, setExecutionCount] = useState(0);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [lastExecutionTime, setLastExecutionTime] = useState<Date>();

  const timeoutRef = useRef<NodeJS.Timeout>();
  const maxWaitTimeoutRef = useRef<NodeJS.Timeout>();
  const lastCallTimeRef = useRef<number>();
  const lastLeadingCallTimeRef = useRef<number>();
  const argsRef = useRef<TArgs>();

  const execute = useCallback(
    (...args: TArgs) => {
      setIsDebouncing(false);
      setExecutionCount((prev) => prev + 1);
      setLastExecutionTime(new Date());

      if (auditLog) {
        console.log("[Debounced Callback] Executed:", {
          companyId,
          userId,
          timestamp: new Date().toISOString(),
          executionCount: executionCount + 1,
        });
      }

      return callback(...args);
    },
    [callback, auditLog, companyId, userId, executionCount]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }

    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current);
      maxWaitTimeoutRef.current = undefined;
    }

    setIsDebouncing(false);
  }, []);

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }

    if (maxWaitTimeoutRef.current) {
      clearTimeout(maxWaitTimeoutRef.current);
      maxWaitTimeoutRef.current = undefined;
    }

    if (argsRef.current) {
      return execute(...argsRef.current);
    }
  }, [execute]);

  const debouncedCallback = useCallback(
    (...args: TArgs) => {
      const now = Date.now();
      lastCallTimeRef.current = now;
      argsRef.current = args;

      // Leading edge execution
      if (
        leading &&
        (!lastLeadingCallTimeRef.current ||
          now - lastLeadingCallTimeRef.current > delay)
      ) {
        lastLeadingCallTimeRef.current = now;
        return execute(...args);
      }

      // Set up trailing execution
      if (trailing) {
        setIsDebouncing(true);

        // Clear existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Set new timeout
        timeoutRef.current = setTimeout(() => {
          execute(...args);
        }, delay);

        // Set up maxWait timeout if specified
        if (maxWait && !maxWaitTimeoutRef.current) {
          maxWaitTimeoutRef.current = setTimeout(() => {
            execute(...args);
          }, maxWait);
        }
      }
    },
    [delay, leading, trailing, maxWait, execute]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    debouncedCallback,
    cancel,
    flush,
    isDebouncing,
    executionCount,
    lastExecutionTime,
  };
};

// Greek ERP specific debounce hook for search
export const useGreekSearchDebounce = (
  searchTerm: string,
  companyId: string,
  userId: string,
  delay = 300
) => {
  return useDebounce(searchTerm, {
    delay,
    auditLog: true,
    companyId,
    userId,
    personalDataHandling: true, // Search terms might contain personal data
  });
};

// Greek ERP specific debounce hook for form auto-save
export const useGreekFormAutoSave = <T>(
  formData: T,
  companyId: string,
  userId: string,
  delay = 2000
) => {
  return useDebounce(formData, {
    delay,
    auditLog: true,
    companyId,
    userId,
    personalDataHandling: true, // Form data likely contains personal data
    maxWait: 10000, // Max 10 seconds without save
  });
};
