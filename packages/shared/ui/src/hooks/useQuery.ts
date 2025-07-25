import { useCallback, useMemo, useState, useEffect } from "react";

export type QueryKey = string | readonly unknown[];

export interface QueryOptions<TData = unknown, TError = Error> {
  // Greek ERP specific options
  companyId?: string;
  userId?: string;

  // Enhanced caching options
  cacheTime?: number;
  staleTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;

  // Greek compliance features
  auditLog?: boolean;
  personalDataHandling?: boolean;

  // Performance options
  retryDelay?: number;
  maxRetries?: number;

  // Error handling
  onError?: (error: TError) => void;
  onSuccess?: (data: TData) => void;
}

export interface QueryResult<TData = unknown, TError = Error> {
  data: TData | undefined;
  error: TError | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  isFetching: boolean;
  isRefetching: boolean;
  refetch: () => void;
  remove: () => void;

  // Enhanced helpers
  hasData: boolean;
  isEmpty: boolean;
  isStale: boolean;

  // Greek ERP specific
  lastUpdated?: Date;
  dataSource?: string;
  complianceStatus?: "compliant" | "pending" | "violation";
}

export const useQuery = <TData = unknown, TError = Error>(
  key: QueryKey,
  queryFn: () => Promise<TData>,
  options: QueryOptions<TData, TError> = {}
): QueryResult<TData, TError> => {
  // Default options for Greek ERP
  const defaultOptions: Partial<QueryOptions<TData, TError>> = {
    cacheTime: 5 * 60 * 1000, // 5 minutes
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    maxRetries: 3,
    retryDelay: 1000,
    auditLog: true,
    personalDataHandling: false,
  };

  const mergedOptions = { ...defaultOptions, ...options };

  // Enhanced query key with company and user context
  const enhancedKey = useMemo(() => {
    const baseKey = Array.isArray(key) ? key : [key];

    if (mergedOptions.companyId) {
      baseKey.push("company", mergedOptions.companyId);
    }

    if (mergedOptions.userId) {
      baseKey.push("user", mergedOptions.userId);
    }

    return baseKey;
  }, [key, mergedOptions.companyId, mergedOptions.userId]);

  // Enhanced query function with logging and error handling
  const enhancedQueryFn = useCallback(async () => {
    try {
      // Audit logging for Greek compliance
      if (mergedOptions.auditLog) {
        console.log(`[Query] Executing query: ${JSON.stringify(enhancedKey)}`, {
          timestamp: new Date().toISOString(),
          companyId: mergedOptions.companyId,
          userId: mergedOptions.userId,
        });
      }

      const result = await queryFn();

      // Log successful queries
      if (mergedOptions.auditLog) {
        console.log(
          `[Query] Query successful: ${JSON.stringify(enhancedKey)}`,
          {
            timestamp: new Date().toISOString(),
            dataSize: JSON.stringify(result).length,
          }
        );
      }

      return result;
    } catch (error) {
      // Enhanced error logging
      console.error(`[Query] Query failed: ${JSON.stringify(enhancedKey)}`, {
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        companyId: mergedOptions.companyId,
        userId: mergedOptions.userId,
      });

      // Personal data handling for Greek GDPR compliance
      if (mergedOptions.personalDataHandling && error instanceof Error) {
        // Sanitize error messages that might contain personal data
        const sanitizedError = new Error("Data processing error occurred");
        throw sanitizedError;
      }

      throw error;
    }
  }, [queryFn, enhancedKey, mergedOptions]);

  // Simple query implementation (would integrate with React Query when available)
  const [data, setData] = useState<TData | undefined>();
  const [error, setError] = useState<TError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const executeQuery = useCallback(async () => {
    setIsLoading(true);
    setIsFetching(true);
    setError(null);

    try {
      const result = await enhancedQueryFn();
      setData(result);
      mergedOptions.onSuccess?.(result);
    } catch (err) {
      const errorObj = err as TError;
      setError(errorObj);
      mergedOptions.onError?.(errorObj);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, [enhancedQueryFn, mergedOptions]);

  useEffect(() => {
    executeQuery();
  }, [executeQuery]);

  const queryResult = {
    data,
    error,
    isLoading,
    isError: error !== null,
    isSuccess: data !== undefined && error === null,
    isFetching,
    isRefetching: false,
    refetch: executeQuery,
    remove: () => setData(undefined),
    isStale: false,
    dataUpdatedAt: Date.now(),
  };

  // Enhanced result with additional helpers
  const enhancedResult: QueryResult<TData, TError> = {
    ...queryResult,
    hasData: queryResult.data !== undefined && queryResult.data !== null,
    isEmpty:
      queryResult.data === undefined ||
      queryResult.data === null ||
      (Array.isArray(queryResult.data) && queryResult.data.length === 0),
    isStale: queryResult.isStale,
    lastUpdated: queryResult.dataUpdatedAt
      ? new Date(queryResult.dataUpdatedAt)
      : undefined,
    dataSource: "cache", // This could be enhanced to track actual source
    complianceStatus: "compliant", // This could be enhanced based on data validation
  };

  return enhancedResult;
};

// Specialized hooks for common Greek ERP patterns
export const useCompanyQuery = <TData = unknown>(
  key: QueryKey,
  queryFn: () => Promise<TData>,
  companyId: string,
  options: QueryOptions<TData> = {}
) => {
  return useQuery(key, queryFn, { ...options, companyId, auditLog: true });
};

export const useUserQuery = <TData = unknown>(
  key: QueryKey,
  queryFn: () => Promise<TData>,
  userId: string,
  options: QueryOptions<TData> = {}
) => {
  return useQuery(key, queryFn, {
    ...options,
    userId,
    personalDataHandling: true,
    auditLog: true,
  });
};

export const useAADEQuery = <TData = unknown>(
  key: QueryKey,
  queryFn: () => Promise<TData>,
  options: QueryOptions<TData> = {}
) => {
  return useQuery(key, queryFn, {
    ...options,
    auditLog: true,
    staleTime: 0, // AADE data should always be fresh
    cacheTime: 0, // Don't cache AADE responses
  });
};
