import { useState, useCallback, useRef } from "react";
import { useAudit } from "../contexts/AuditContext";
import { useCompany } from "../contexts/CompanyContext";
import { useNotification } from "../contexts/NotificationContext";

interface UseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  onSettled?: (
    data: TData | undefined,
    error: Error | null,
    variables: TVariables
  ) => void;
  retry?: number;
  retryDelay?: number;
  optimisticUpdate?: (variables: TVariables) => any;
  rollbackOnError?: boolean;
  auditLog?: boolean;
  showNotifications?: boolean;
  complianceLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

interface MutationState<TData> {
  data: TData | undefined;
  error: Error | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isIdle: boolean;
  failureCount: number;
  variables: any;
}

interface MutationResult<TData, TVariables> extends MutationState<TData> {
  mutate: (variables: TVariables) => void;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  reset: () => void;
  rollback: () => void;
}

/**
 * Enhanced mutation hook with Greek ERP features
 * Provides optimistic updates, retry logic, audit logging, and compliance tracking
 */
export function useMutation<TData = unknown, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseMutationOptions<TData, TVariables> = {}
): MutationResult<TData, TVariables> {
  const { logAction } = useAudit();
  const { state } = useCompany();
  const { addNotification } = useNotification();

  const {
    onSuccess,
    onError,
    onSettled,
    retry = 0,
    retryDelay = 1000,
    optimisticUpdate,
    rollbackOnError = true,
    auditLog = true,
    showNotifications = true,
    complianceLevel = "MEDIUM",
    requiresConfirmation = false,
    confirmationMessage = "Are you sure you want to proceed?",
  } = options;

  const [state_mutation, setState] = useState<MutationState<TData>>({
    data: undefined,
    error: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
    isIdle: true,
    failureCount: 0,
    variables: undefined,
  });

  const optimisticDataRef = useRef<any>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const reset = useCallback(() => {
    setState({
      data: undefined,
      error: null,
      isLoading: false,
      isSuccess: false,
      isError: false,
      isIdle: true,
      failureCount: 0,
      variables: undefined,
    });

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const rollback = useCallback(() => {
    if (optimisticDataRef.current) {
      // Restore original data (this would typically update global state)
      optimisticDataRef.current = null;

      if (auditLog) {
        logAction({
          userId: "current_user",
          userEmail: "user@example.com",
          companyId: state.currentCompany?.id || "unknown",
          sessionId: "current_session",
          action: "mutation.rollback",
          module: "data",
          feature: "mutation",
          resource: "optimistic_update",
          details: {
            method: "UPDATE",
            outcome: "SUCCESS",
            metadata: {
              rollbackReason: "manual_rollback",
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
            score: 20,
            factors: ["data_rollback"],
            flagged: false,
            requiresReview: false,
          },
        });
      }
    }
  }, [auditLog, logAction, state.currentCompany?.id, complianceLevel]);

  const mutateAsync = useCallback(
    async (variables: TVariables): Promise<TData> => {
      // Confirmation dialog if required
      if (requiresConfirmation) {
        const confirmed = window.confirm(confirmationMessage);
        if (!confirmed) {
          throw new Error("Operation cancelled by user");
        }
      }

      setState((prev) => ({
        ...prev,
        isLoading: true,
        isError: false,
        isSuccess: false,
        isIdle: false,
        variables,
      }));

      // Apply optimistic update
      if (optimisticUpdate) {
        optimisticDataRef.current = optimisticUpdate(variables);
      }

      const executeWithRetry = async (attemptCount = 0): Promise<TData> => {
        try {
          const startTime = Date.now();
          const result = await mutationFn(variables);
          const duration = Date.now() - startTime;

          // Success state
          setState((prev) => ({
            ...prev,
            data: result,
            isLoading: false,
            isSuccess: true,
            isError: false,
            error: null,
            failureCount: 0,
          }));

          // Audit log
          if (auditLog) {
            logAction({
              userId: "current_user",
              userEmail: "user@example.com",
              companyId: state.currentCompany?.id || "unknown",
              sessionId: "current_session",
              action: "mutation.success",
              module: "data",
              feature: "mutation",
              resource: "mutation_operation",
              details: {
                method: "EXECUTE",
                outcome: "SUCCESS",
                metadata: {
                  duration,
                  attemptCount: attemptCount + 1,
                  hasOptimisticUpdate: !!optimisticUpdate,
                  variables: JSON.stringify(variables),
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
                    ? 80
                    : complianceLevel === "HIGH"
                    ? 60
                    : 40,
                factors: ["data_mutation", "business_operation"],
                flagged: complianceLevel === "CRITICAL",
                requiresReview: complianceLevel === "CRITICAL",
              },
            });
          }

          // Show success notification
          if (showNotifications) {
            addNotification({
              type: "success",
              title: "Operation Successful",
              message: "Your operation has been completed successfully.",
              priority: "medium",
              category: "business",
              isPersistent: false,
              autoClose: true,
              duration: 3000,
            });
          }

          // Call success callback
          if (onSuccess) {
            onSuccess(result, variables);
          }

          return result;
        } catch (error) {
          const mutationError = error as Error;

          // Retry logic
          if (attemptCount < retry) {
            setState((prev) => ({
              ...prev,
              failureCount: prev.failureCount + 1,
            }));

            return new Promise((resolve, reject) => {
              retryTimeoutRef.current = setTimeout(() => {
                executeWithRetry(attemptCount + 1)
                  .then(resolve)
                  .catch(reject);
              }, retryDelay * Math.pow(2, attemptCount)); // Exponential backoff
            });
          }

          // Final failure
          setState((prev) => ({
            ...prev,
            error: mutationError,
            isLoading: false,
            isError: true,
            isSuccess: false,
            failureCount: prev.failureCount + 1,
          }));

          // Rollback optimistic update
          if (rollbackOnError && optimisticDataRef.current) {
            rollback();
          }

          // Audit log
          if (auditLog) {
            logAction({
              userId: "current_user",
              userEmail: "user@example.com",
              companyId: state.currentCompany?.id || "unknown",
              sessionId: "current_session",
              action: "mutation.error",
              module: "data",
              feature: "mutation",
              resource: "mutation_operation",
              details: {
                method: "EXECUTE",
                outcome: "FAILURE",
                errorMessage: mutationError.message,
                metadata: {
                  attemptCount: attemptCount + 1,
                  totalRetries: retry,
                  hasOptimisticUpdate: !!optimisticUpdate,
                  rolledBack: rollbackOnError,
                  variables: JSON.stringify(variables),
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
                    ? 90
                    : complianceLevel === "HIGH"
                    ? 70
                    : 50,
                factors: [
                  "data_mutation_failure",
                  "business_operation_failure",
                ],
                flagged: true,
                requiresReview:
                  complianceLevel === "HIGH" || complianceLevel === "CRITICAL",
              },
            });
          }

          // Show error notification
          if (showNotifications) {
            addNotification({
              type: "error",
              title: "Operation Failed",
              message:
                mutationError.message ||
                "An error occurred during the operation.",
              priority: "high",
              category: "business",
              isPersistent: false,
              autoClose: true,
              duration: 5000,
            });
          }

          // Call error callback
          if (onError) {
            onError(mutationError, variables);
          }

          throw mutationError;
        } finally {
          // Call settled callback
          if (onSettled) {
            onSettled(state_mutation.data, state_mutation.error, variables);
          }
        }
      };

      return executeWithRetry();
    },
    [
      mutationFn,
      optimisticUpdate,
      retry,
      retryDelay,
      rollbackOnError,
      auditLog,
      showNotifications,
      complianceLevel,
      requiresConfirmation,
      confirmationMessage,
      onSuccess,
      onError,
      onSettled,
      logAction,
      state.currentCompany?.id,
      addNotification,
      rollback,
      state_mutation.data,
      state_mutation.error,
    ]
  );

  const mutate = useCallback(
    (variables: TVariables) => {
      mutateAsync(variables).catch(() => {
        // Error is already handled in mutateAsync
      });
    },
    [mutateAsync]
  );

  return {
    ...state_mutation,
    mutate,
    mutateAsync,
    reset,
    rollback,
  };
}

export default useMutation;
