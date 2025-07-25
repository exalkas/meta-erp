import { useState, useCallback, useRef, useEffect } from "react";
import { useAudit } from "../contexts/AuditContext";
import { useCompany } from "../contexts/CompanyContext";

interface UseInfiniteQueryOptions<TData, TError> {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  retry?: number;
  retryDelay?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  auditLog?: boolean;
  pageSize?: number;
  initialPageParam?: any;
  getNextPageParam?: (lastPage: TData, allPages: TData[]) => any;
  getPreviousPageParam?: (firstPage: TData, allPages: TData[]) => any;
  onSuccess?: (data: InfiniteData<TData>) => void;
  onError?: (error: TError) => void;
  complianceLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

interface InfiniteData<TData> {
  pages: TData[];
  pageParams: any[];
}

interface InfiniteQueryState<TData, TError> {
  data: InfiniteData<TData> | undefined;
  error: TError | null;
  isLoading: boolean;
  isFetching: boolean;
  isSuccess: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  isFetchingPreviousPage: boolean;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  fetchStatus: "idle" | "fetching" | "paused";
  dataUpdatedAt: number;
  errorUpdatedAt: number;
  failureCount: number;
}

interface InfiniteQueryResult<TData, TError>
  extends InfiniteQueryState<TData, TError> {
  fetchNextPage: () => Promise<void>;
  fetchPreviousPage: () => Promise<void>;
  refetch: () => Promise<void>;
  remove: () => void;
  invalidate: () => void;
  reset: () => void;
}

/**
 * Enhanced infinite query hook with Greek ERP features
 * Provides infinite scroll functionality with audit logging and compliance tracking
 */
export function useInfiniteQuery<TData = unknown, TError = Error>(
  queryKey: string | (string | number)[],
  queryFn: ({ pageParam }: { pageParam: any }) => Promise<TData>,
  options: UseInfiniteQueryOptions<TData, TError> = {}
): InfiniteQueryResult<TData, TError> {
  const { logAction } = useAudit();
  const { state } = useCompany();

  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
    retry = 3,
    retryDelay = 1000,
    refetchOnWindowFocus = true,
    refetchOnReconnect = true,
    auditLog = true,
    pageSize = 20,
    initialPageParam = 0,
    getNextPageParam = (lastPage: any) => lastPage.nextCursor,
    getPreviousPageParam = (firstPage: any) => firstPage.prevCursor,
    onSuccess,
    onError,
    complianceLevel = "MEDIUM",
  } = options;

  const [state_query, setState] = useState<InfiniteQueryState<TData, TError>>({
    data: undefined,
    error: null,
    isLoading: false,
    isFetching: false,
    isSuccess: false,
    isError: false,
    isFetchingNextPage: false,
    isFetchingPreviousPage: false,
    hasNextPage: false,
    hasPreviousPage: false,
    fetchStatus: "idle",
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    failureCount: 0,
  });

  const cacheRef = useRef<
    Map<string, { data: InfiniteData<TData>; timestamp: number }>
  >(new Map());
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const getCacheKey = useCallback(() => {
    if (Array.isArray(queryKey)) {
      return queryKey.join(":");
    }
    return queryKey;
  }, [queryKey]);

  const getFromCache = useCallback(() => {
    const cacheKey = getCacheKey();
    const cached = cacheRef.current.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < staleTime) {
      return cached.data;
    }

    return null;
  }, [getCacheKey, staleTime]);

  const setToCache = useCallback(
    (data: InfiniteData<TData>) => {
      const cacheKey = getCacheKey();
      cacheRef.current.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });
    },
    [getCacheKey]
  );

  const clearCache = useCallback(() => {
    const cacheKey = getCacheKey();
    cacheRef.current.delete(cacheKey);
  }, [getCacheKey]);

  const fetchPage = useCallback(
    async (
      pageParam: any,
      direction: "next" | "previous" | "initial" = "initial"
    ): Promise<TData> => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      const executeWithRetry = async (attemptCount = 0): Promise<TData> => {
        try {
          const startTime = Date.now();
          const result = await queryFn({ pageParam });
          const duration = Date.now() - startTime;

          // Audit log
          if (auditLog) {
            logAction({
              userId: "current_user",
              userEmail: "user@example.com",
              companyId: state.currentCompany?.id || "unknown",
              sessionId: "current_session",
              action: "infinite_query.fetch",
              module: "data",
              feature: "infinite_query",
              resource: "page_data",
              resourceId: getCacheKey(),
              details: {
                method: "READ",
                outcome: "SUCCESS",
                metadata: {
                  queryKey: getCacheKey(),
                  pageParam,
                  direction,
                  duration,
                  attemptCount: attemptCount + 1,
                  pageSize,
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
                factors: ["data_query", "infinite_scroll"],
                flagged: false,
                requiresReview: complianceLevel === "CRITICAL",
              },
            });
          }

          return result;
        } catch (error) {
          const queryError = error as TError;

          // Retry logic
          if (attemptCount < retry) {
            return new Promise((resolve, reject) => {
              retryTimeoutRef.current = setTimeout(() => {
                executeWithRetry(attemptCount + 1)
                  .then(resolve)
                  .catch(reject);
              }, retryDelay * Math.pow(2, attemptCount)); // Exponential backoff
            });
          }

          // Audit log error
          if (auditLog) {
            logAction({
              userId: "current_user",
              userEmail: "user@example.com",
              companyId: state.currentCompany?.id || "unknown",
              sessionId: "current_session",
              action: "infinite_query.error",
              module: "data",
              feature: "infinite_query",
              resource: "page_data",
              resourceId: getCacheKey(),
              details: {
                method: "READ",
                outcome: "FAILURE",
                errorMessage: (error as Error).message,
                metadata: {
                  queryKey: getCacheKey(),
                  pageParam,
                  direction,
                  attemptCount: attemptCount + 1,
                  totalRetries: retry,
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
                factors: ["data_query_failure", "infinite_scroll_failure"],
                flagged: true,
                requiresReview:
                  complianceLevel === "HIGH" || complianceLevel === "CRITICAL",
              },
            });
          }

          throw queryError;
        }
      };

      return executeWithRetry();
    },
    [
      queryFn,
      retry,
      retryDelay,
      auditLog,
      logAction,
      state.currentCompany?.id,
      getCacheKey,
      pageSize,
      complianceLevel,
    ]
  );

  const fetchNextPage = useCallback(async () => {
    if (!state_query.hasNextPage || state_query.isFetchingNextPage) {
      return;
    }

    setState((prev) => ({
      ...prev,
      isFetchingNextPage: true,
      isFetching: true,
      fetchStatus: "fetching",
    }));

    try {
      const currentData = state_query.data;
      if (!currentData) return;

      const lastPage = currentData.pages[currentData.pages.length - 1];
      const nextPageParam = getNextPageParam(lastPage, currentData.pages);

      if (nextPageParam === undefined) {
        setState((prev) => ({
          ...prev,
          hasNextPage: false,
          isFetchingNextPage: false,
          isFetching: false,
          fetchStatus: "idle",
        }));
        return;
      }

      const newPage = await fetchPage(nextPageParam, "next");

      const newData: InfiniteData<TData> = {
        pages: [...currentData.pages, newPage],
        pageParams: [...currentData.pageParams, nextPageParam],
      };

      setState((prev) => ({
        ...prev,
        data: newData,
        hasNextPage: getNextPageParam(newPage, newData.pages) !== undefined,
        isFetchingNextPage: false,
        isFetching: false,
        fetchStatus: "idle",
        dataUpdatedAt: Date.now(),
        isSuccess: true,
        isError: false,
        error: null,
      }));

      setToCache(newData);

      if (onSuccess) {
        onSuccess(newData);
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error as TError,
        isFetchingNextPage: false,
        isFetching: false,
        fetchStatus: "idle",
        isError: true,
        errorUpdatedAt: Date.now(),
        failureCount: prev.failureCount + 1,
      }));

      if (onError) {
        onError(error as TError);
      }
    }
  }, [
    state_query.hasNextPage,
    state_query.isFetchingNextPage,
    state_query.data,
    getNextPageParam,
    fetchPage,
    setToCache,
    onSuccess,
    onError,
  ]);

  const fetchPreviousPage = useCallback(async () => {
    if (!state_query.hasPreviousPage || state_query.isFetchingPreviousPage) {
      return;
    }

    setState((prev) => ({
      ...prev,
      isFetchingPreviousPage: true,
      isFetching: true,
      fetchStatus: "fetching",
    }));

    try {
      const currentData = state_query.data;
      if (!currentData) return;

      const firstPage = currentData.pages[0];
      const prevPageParam = getPreviousPageParam(firstPage, currentData.pages);

      if (prevPageParam === undefined) {
        setState((prev) => ({
          ...prev,
          hasPreviousPage: false,
          isFetchingPreviousPage: false,
          isFetching: false,
          fetchStatus: "idle",
        }));
        return;
      }

      const newPage = await fetchPage(prevPageParam, "previous");

      const newData: InfiniteData<TData> = {
        pages: [newPage, ...currentData.pages],
        pageParams: [prevPageParam, ...currentData.pageParams],
      };

      setState((prev) => ({
        ...prev,
        data: newData,
        hasPreviousPage:
          getPreviousPageParam(newPage, newData.pages) !== undefined,
        isFetchingPreviousPage: false,
        isFetching: false,
        fetchStatus: "idle",
        dataUpdatedAt: Date.now(),
        isSuccess: true,
        isError: false,
        error: null,
      }));

      setToCache(newData);

      if (onSuccess) {
        onSuccess(newData);
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error as TError,
        isFetchingPreviousPage: false,
        isFetching: false,
        fetchStatus: "idle",
        isError: true,
        errorUpdatedAt: Date.now(),
        failureCount: prev.failureCount + 1,
      }));

      if (onError) {
        onError(error as TError);
      }
    }
  }, [
    state_query.hasPreviousPage,
    state_query.isFetchingPreviousPage,
    state_query.data,
    getPreviousPageParam,
    fetchPage,
    setToCache,
    onSuccess,
    onError,
  ]);

  const refetch = useCallback(async () => {
    if (!enabled) return;

    setState((prev) => ({
      ...prev,
      isFetching: true,
      fetchStatus: "fetching",
      isError: false,
      error: null,
    }));

    try {
      const newPage = await fetchPage(initialPageParam, "initial");

      const newData: InfiniteData<TData> = {
        pages: [newPage],
        pageParams: [initialPageParam],
      };

      setState((prev) => ({
        ...prev,
        data: newData,
        hasNextPage: getNextPageParam(newPage, [newPage]) !== undefined,
        hasPreviousPage: getPreviousPageParam(newPage, [newPage]) !== undefined,
        isFetching: false,
        fetchStatus: "idle",
        dataUpdatedAt: Date.now(),
        isSuccess: true,
        isError: false,
        error: null,
        failureCount: 0,
      }));

      setToCache(newData);

      if (onSuccess) {
        onSuccess(newData);
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error as TError,
        isFetching: false,
        fetchStatus: "idle",
        isError: true,
        errorUpdatedAt: Date.now(),
        failureCount: prev.failureCount + 1,
      }));

      if (onError) {
        onError(error as TError);
      }
    }
  }, [
    enabled,
    fetchPage,
    initialPageParam,
    getNextPageParam,
    getPreviousPageParam,
    setToCache,
    onSuccess,
    onError,
  ]);

  const remove = useCallback(() => {
    clearCache();
    setState({
      data: undefined,
      error: null,
      isLoading: false,
      isFetching: false,
      isSuccess: false,
      isError: false,
      isFetchingNextPage: false,
      isFetchingPreviousPage: false,
      hasNextPage: false,
      hasPreviousPage: false,
      fetchStatus: "idle",
      dataUpdatedAt: 0,
      errorUpdatedAt: 0,
      failureCount: 0,
    });
  }, [clearCache]);

  const invalidate = useCallback(() => {
    clearCache();
    refetch();
  }, [clearCache, refetch]);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    remove();
  }, [remove]);

  // Initial fetch
  useEffect(() => {
    if (!enabled) return;

    const cachedData = getFromCache();
    if (cachedData) {
      setState((prev) => ({
        ...prev,
        data: cachedData,
        isSuccess: true,
        dataUpdatedAt: Date.now(),
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      isLoading: true,
      isFetching: true,
      fetchStatus: "fetching",
    }));

    refetch().finally(() => {
      setState((prev) => ({
        ...prev,
        isLoading: false,
      }));
    });
  }, [enabled, getFromCache, refetch]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state_query,
    fetchNextPage,
    fetchPreviousPage,
    refetch,
    remove,
    invalidate,
    reset,
  };
}

export default useInfiniteQuery;
