import { useState, useCallback, useEffect, useRef } from "react";
import { useAudit } from "../contexts/AuditContext";
import { useCompany } from "../contexts/CompanyContext";
import { useNotification } from "../contexts/NotificationContext";

interface WorkflowOptions {
  enableNotifications?: boolean;
  enableAuditLog?: boolean;
  enableGreekCompliance?: boolean;
  autoProgress?: boolean;
  timeoutWarnings?: boolean;
  escalationEnabled?: boolean;
  apiEndpoint?: string;
  complianceLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  category: WorkflowCategory;
  isActive: boolean;
  steps: WorkflowStep[];
  conditions: WorkflowCondition[];
  variables: WorkflowVariable[];
  settings: WorkflowSettings;
  greekCompliance?: GreekWorkflowCompliance;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface WorkflowStep {
  id: string;
  name: string;
  type: WorkflowStepType;
  order: number;
  description?: string;
  assignee: WorkflowAssignee;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  form?: WorkflowForm;
  timeouts: WorkflowTimeout[];
  escalation?: WorkflowEscalation;
  isRequired: boolean;
  allowDelegate: boolean;
  allowSkip: boolean;
  allowReject: boolean;
  permissions: WorkflowPermissions;
}

interface WorkflowInstance {
  id: string;
  definitionId: string;
  definitionVersion: string;
  title: string;
  description?: string;
  status: WorkflowInstanceStatus;
  priority: WorkflowPriority;
  currentStep: string | null;
  initiator: WorkflowUser;
  context: WorkflowContext;
  variables: Record<string, any>;
  history: WorkflowHistoryEntry[];
  attachments: WorkflowAttachment[];
  comments: WorkflowComment[];
  deadlines: WorkflowDeadline[];
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  suspendedAt?: string;
  cancelledAt?: string;
}

interface WorkflowAssignee {
  type: "user" | "role" | "group" | "expression";
  value: string;
  fallbackUsers?: string[];
  allowSelfAssign?: boolean;
}

interface WorkflowAction {
  id: string;
  type: WorkflowActionType;
  name: string;
  parameters: Record<string, any>;
  conditions?: WorkflowCondition[];
  order: number;
}

interface WorkflowCondition {
  id: string;
  type: "expression" | "field" | "user" | "role" | "time" | "custom";
  operator: ConditionOperator;
  field?: string;
  value: any;
  expression?: string;
}

interface WorkflowVariable {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "object" | "array";
  defaultValue?: any;
  required: boolean;
  description?: string;
  validation?: VariableValidation;
}

interface WorkflowForm {
  id: string;
  fields: FormField[];
  validation: FormValidation[];
  layout: FormLayout;
}

interface WorkflowTimeout {
  duration: number; // in minutes
  action: "escalate" | "auto_approve" | "auto_reject" | "notify" | "assign";
  parameters?: Record<string, any>;
}

interface WorkflowEscalation {
  levels: EscalationLevel[];
  maxLevels: number;
  notifyOriginalAssignee: boolean;
}

interface EscalationLevel {
  level: number;
  assignee: WorkflowAssignee;
  timeout: number; // in minutes
  action: "assign" | "notify" | "auto_approve";
}

interface WorkflowSettings {
  allowParallel: boolean;
  allowSkipSteps: boolean;
  allowReassign: boolean;
  requireComments: boolean;
  enableNotifications: boolean;
  retention: {
    completed: number; // days
    cancelled: number; // days
    suspended: number; // days
  };
}

interface GreekWorkflowCompliance {
  requiresAADEApproval: boolean;
  financialThreshold?: number;
  requiredDocuments: string[];
  complianceSteps: string[];
  auditRequirements: {
    level: "basic" | "enhanced" | "full";
    retention: number; // years
    reportFrequency: "monthly" | "quarterly" | "yearly";
  };
}

interface WorkflowUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
}

interface WorkflowContext {
  entityType: string;
  entityId: string;
  parentWorkflowId?: string;
  businessData: Record<string, any>;
  metadata: Record<string, any>;
}

interface WorkflowHistoryEntry {
  id: string;
  stepId: string;
  stepName: string;
  action: WorkflowHistoryAction;
  actor: WorkflowUser;
  timestamp: string;
  duration?: number; // in minutes
  comment?: string;
  reason?: string;
  previousValues?: Record<string, any>;
  newValues?: Record<string, any>;
  attachments?: string[];
}

interface WorkflowAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface WorkflowComment {
  id: string;
  stepId?: string;
  author: WorkflowUser;
  content: string;
  isPrivate: boolean;
  mentions: string[];
  attachments: string[];
  createdAt: string;
  updatedAt?: string;
}

interface WorkflowDeadline {
  stepId: string;
  type: "soft" | "hard";
  deadline: string;
  warningDays: number;
  isBreached: boolean;
  breachedAt?: string;
}

interface WorkflowPermissions {
  canView: string[];
  canEdit: string[];
  canApprove: string[];
  canReject: string[];
  canReassign: string[];
  canComment: string[];
  canAttach: string[];
}

type WorkflowCategory =
  | "approval"
  | "review"
  | "compliance"
  | "financial"
  | "hr"
  | "procurement"
  | "legal"
  | "technical"
  | "custom";

type WorkflowStepType =
  | "start"
  | "task"
  | "approval"
  | "review"
  | "notification"
  | "condition"
  | "parallel"
  | "merge"
  | "subprocess"
  | "end";

type WorkflowInstanceStatus =
  | "draft"
  | "active"
  | "suspended"
  | "completed"
  | "cancelled"
  | "error";

type WorkflowPriority = "low" | "medium" | "high" | "urgent" | "critical";

type WorkflowActionType =
  | "email"
  | "sms"
  | "webhook"
  | "database"
  | "api_call"
  | "file_operation"
  | "notification"
  | "script"
  | "aade_submit"
  | "document_generate";

type ConditionOperator =
  | "equals"
  | "not_equals"
  | "greater_than"
  | "less_than"
  | "greater_equal"
  | "less_equal"
  | "contains"
  | "starts_with"
  | "ends_with"
  | "in"
  | "not_in"
  | "is_null"
  | "is_not_null"
  | "regex";

type WorkflowHistoryAction =
  | "started"
  | "approved"
  | "rejected"
  | "delegated"
  | "reassigned"
  | "completed"
  | "cancelled"
  | "suspended"
  | "resumed"
  | "escalated"
  | "timeout"
  | "error";

interface VariableValidation {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: string;
  custom?: string;
}

interface FormField {
  name: string;
  type: string;
  label: string;
  required: boolean;
  validation?: any;
  options?: any[];
}

interface FormValidation {
  field: string;
  rules: string[];
  message: string;
}

interface FormLayout {
  sections: FormSection[];
  columns: number;
}

interface FormSection {
  title: string;
  fields: string[];
  collapsible: boolean;
}

interface WorkflowState {
  definitions: WorkflowDefinition[];
  instances: WorkflowInstance[];
  currentDefinition: WorkflowDefinition | null;
  currentInstance: WorkflowInstance | null;
  myTasks: WorkflowTask[];
  isLoading: boolean;
  isExecuting: boolean;
  error: string | null;
  statistics: WorkflowStatistics;
  filters: WorkflowFilters;
}

interface WorkflowTask {
  id: string;
  instanceId: string;
  stepId: string;
  title: string;
  description?: string;
  priority: WorkflowPriority;
  status: TaskStatus;
  assignee: string;
  deadline?: string;
  createdAt: string;
  claimedAt?: string;
  completedAt?: string;
  definition: WorkflowDefinition;
  instance: WorkflowInstance;
}

interface WorkflowStatistics {
  totalInstances: number;
  activeInstances: number;
  completedInstances: number;
  averageCompletionTime: number;
  pendingTasks: number;
  overdueTasks: number;
  instancesByStatus: Record<WorkflowInstanceStatus, number>;
  tasksByPriority: Record<WorkflowPriority, number>;
  performanceMetrics: {
    stepAverages: Record<string, number>;
    bottlenecks: WorkflowBottleneck[];
  };
}

interface WorkflowBottleneck {
  stepId: string;
  stepName: string;
  averageTime: number;
  instances: number;
  efficiency: number;
}

interface WorkflowFilters {
  status?: WorkflowInstanceStatus[];
  priority?: WorkflowPriority[];
  assignee?: string[];
  category?: WorkflowCategory[];
  dateRange?: {
    start: string;
    end: string;
  };
  searchText?: string;
}

type TaskStatus =
  | "pending"
  | "claimed"
  | "in_progress"
  | "completed"
  | "rejected"
  | "escalated";

interface WorkflowResult extends WorkflowState {
  // Definition management
  createDefinition: (
    definition: Omit<WorkflowDefinition, "id" | "createdAt" | "updatedAt">
  ) => Promise<WorkflowDefinition>;
  updateDefinition: (
    id: string,
    definition: Partial<WorkflowDefinition>
  ) => Promise<WorkflowDefinition>;
  deleteDefinition: (id: string) => Promise<void>;
  duplicateDefinition: (
    id: string,
    newName: string
  ) => Promise<WorkflowDefinition>;
  validateDefinition: (definition: WorkflowDefinition) => ValidationResult[];

  // Instance management
  startWorkflow: (
    definitionId: string,
    context: WorkflowContext,
    variables?: Record<string, any>
  ) => Promise<WorkflowInstance>;
  suspendInstance: (instanceId: string, reason: string) => Promise<void>;
  resumeInstance: (instanceId: string) => Promise<void>;
  cancelInstance: (instanceId: string, reason: string) => Promise<void>;

  // Task management
  claimTask: (taskId: string) => Promise<void>;
  completeTask: (
    taskId: string,
    action: string,
    data?: Record<string, any>,
    comment?: string
  ) => Promise<void>;
  delegateTask: (
    taskId: string,
    userId: string,
    comment?: string
  ) => Promise<void>;
  reassignTask: (
    taskId: string,
    userId: string,
    comment?: string
  ) => Promise<void>;
  escalateTask: (taskId: string, level?: number) => Promise<void>;

  // Comments and attachments
  addComment: (
    instanceId: string,
    content: string,
    stepId?: string,
    isPrivate?: boolean
  ) => Promise<WorkflowComment>;
  updateComment: (commentId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  addAttachment: (
    instanceId: string,
    file: File,
    stepId?: string
  ) => Promise<WorkflowAttachment>;
  removeAttachment: (attachmentId: string) => Promise<void>;

  // Querying and filtering
  getMyTasks: (filters?: Partial<WorkflowFilters>) => Promise<WorkflowTask[]>;
  getInstanceHistory: (instanceId: string) => Promise<WorkflowHistoryEntry[]>;
  searchInstances: (
    query: string,
    filters?: WorkflowFilters
  ) => Promise<WorkflowInstance[]>;
  getInstancesByDefinition: (
    definitionId: string
  ) => Promise<WorkflowInstance[]>;

  // Analytics and reporting
  getStatistics: (filters?: WorkflowFilters) => Promise<WorkflowStatistics>;
  generateReport: (type: string, filters?: WorkflowFilters) => Promise<string>;
  exportInstances: (
    format: "csv" | "excel" | "pdf",
    instanceIds?: string[]
  ) => Promise<string>;

  // Monitoring and administration
  getBottlenecks: (definitionId?: string) => Promise<WorkflowBottleneck[]>;
  getPerformanceMetrics: (definitionId: string, period: string) => Promise<any>;
  cleanupCompletedInstances: (olderThanDays: number) => Promise<number>;

  // Utilities
  refresh: () => Promise<void>;
  setCurrentDefinition: (definition: WorkflowDefinition | null) => void;
  setCurrentInstance: (instance: WorkflowInstance | null) => void;
  applyFilters: (filters: WorkflowFilters) => void;
  clearFilters: () => void;
}

interface ValidationResult {
  field: string;
  message: string;
  severity: "error" | "warning" | "info";
}

/**
 * Enhanced workflow hook for business process management
 * Provides complete workflow automation with Greek compliance and audit trails
 */
export function useWorkflow(options: WorkflowOptions = {}): WorkflowResult {
  const { logAction } = useAudit();
  const { state: companyState } = useCompany();
  const { addNotification } = useNotification();

  const {
    enableNotifications = true,
    enableAuditLog = true,
    enableGreekCompliance = true,
    autoProgress = false,
    timeoutWarnings = true,
    escalationEnabled = true,
    apiEndpoint = "/api/workflows",
    complianceLevel = "HIGH",
  } = options;

  const [state, setState] = useState<WorkflowState>({
    definitions: [],
    instances: [],
    currentDefinition: null,
    currentInstance: null,
    myTasks: [],
    isLoading: false,
    isExecuting: false,
    error: null,
    statistics: {
      totalInstances: 0,
      activeInstances: 0,
      completedInstances: 0,
      averageCompletionTime: 0,
      pendingTasks: 0,
      overdueTasks: 0,
      instancesByStatus: {} as Record<WorkflowInstanceStatus, number>,
      tasksByPriority: {} as Record<WorkflowPriority, number>,
      performanceMetrics: {
        stepAverages: {},
        bottlenecks: [],
      },
    },
    filters: {},
  });

  const timeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

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
        throw new Error(`Workflow API Error: ${response.statusText}`);
      }

      return response.json();
    },
    [apiEndpoint, companyState.currentCompany?.id]
  );

  // Audit logging helper
  const auditWorkflowOperation = useCallback(
    (operation: string, data?: any, error?: Error) => {
      if (!enableAuditLog) return;

      logAction({
        userId: "current_user",
        userEmail: "user@example.com",
        companyId: companyState.currentCompany?.id || "unknown",
        sessionId: "current_session",
        action: `workflow.${operation}`,
        module: "workflows",
        feature: "workflow_management",
        resource: "workflow",
        resourceId:
          data?.id || data?.instanceId || data?.definitionId || "unknown",
        details: {
          method:
            operation.includes("delete") || operation.includes("cancel")
              ? "DELETE"
              : operation.includes("create") || operation.includes("start")
              ? "CREATE"
              : operation.includes("update") || operation.includes("complete")
              ? "UPDATE"
              : "READ",
          outcome: error ? "FAILURE" : "SUCCESS",
          errorMessage: error?.message,
          metadata: {
            operation,
            workflowData: data ? JSON.stringify(data) : undefined,
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
          factors: ["business_process", "workflow_automation"],
          flagged: !!error,
          requiresReview: complianceLevel === "CRITICAL" || !!error,
        },
      });
    },
    [
      enableAuditLog,
      logAction,
      companyState.currentCompany?.id,
      complianceLevel,
    ]
  );

  // Start workflow
  const startWorkflow = useCallback(
    async (
      definitionId: string,
      context: WorkflowContext,
      variables: Record<string, any> = {}
    ): Promise<WorkflowInstance> => {
      setState((prev) => ({ ...prev, isExecuting: true, error: null }));

      try {
        const instance = await apiCall("/instances", {
          method: "POST",
          body: JSON.stringify({
            definitionId,
            context,
            variables,
            initiator: {
              id: "current_user",
              name: "Current User",
              email: "user@example.com",
              role: "user",
            },
          }),
        });

        setState((prev) => ({
          ...prev,
          instances: [...prev.instances, instance],
          currentInstance: instance,
          isExecuting: false,
          statistics: {
            ...prev.statistics,
            totalInstances: prev.statistics.totalInstances + 1,
            activeInstances: prev.statistics.activeInstances + 1,
          },
        }));

        auditWorkflowOperation("start_workflow", {
          definitionId,
          instanceId: instance.id,
        });

        if (enableNotifications) {
          addNotification({
            type: "success",
            title: "Έναρξη διαδικασίας",
            message: `Η διαδικασία "${instance.title}" ξεκίνησε επιτυχώς`,
            priority: "medium",
            category: "business",
            isPersistent: false,
            autoClose: true,
            duration: 5000,
          });
        }

        return instance;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isExecuting: false,
          error: (error as Error).message,
        }));
        auditWorkflowOperation(
          "start_workflow",
          { definitionId },
          error as Error
        );
        throw error;
      }
    },
    [apiCall, auditWorkflowOperation, enableNotifications, addNotification]
  );

  // Complete task
  const completeTask = useCallback(
    async (
      taskId: string,
      action: string,
      data: Record<string, any> = {},
      comment?: string
    ): Promise<void> => {
      setState((prev) => ({ ...prev, isExecuting: true, error: null }));

      try {
        await apiCall(`/tasks/${taskId}/complete`, {
          method: "POST",
          body: JSON.stringify({
            action,
            data,
            comment,
            completedBy: "current_user",
            completedAt: new Date().toISOString(),
          }),
        });

        // Update local state
        setState((prev) => ({
          ...prev,
          myTasks: prev.myTasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  status: "completed",
                  completedAt: new Date().toISOString(),
                }
              : task
          ),
          isExecuting: false,
        }));

        auditWorkflowOperation("complete_task", { taskId, action, comment });

        if (enableNotifications) {
          addNotification({
            type: "success",
            title: "Ολοκλήρωση εργασίας",
            message: `Η εργασία ολοκληρώθηκε επιτυχώς με ενέργεια: ${action}`,
            priority: "medium",
            category: "business",
            isPersistent: false,
            autoClose: true,
            duration: 4000,
          });
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isExecuting: false,
          error: (error as Error).message,
        }));
        auditWorkflowOperation(
          "complete_task",
          { taskId, action },
          error as Error
        );
        throw error;
      }
    },
    [apiCall, auditWorkflowOperation, enableNotifications, addNotification]
  );

  // Delegate task
  const delegateTask = useCallback(
    async (taskId: string, userId: string, comment?: string): Promise<void> => {
      try {
        await apiCall(`/tasks/${taskId}/delegate`, {
          method: "POST",
          body: JSON.stringify({
            userId,
            comment,
            delegatedBy: "current_user",
            delegatedAt: new Date().toISOString(),
          }),
        });

        setState((prev) => ({
          ...prev,
          myTasks: prev.myTasks.filter((task) => task.id !== taskId),
        }));

        auditWorkflowOperation("delegate_task", { taskId, userId, comment });

        if (enableNotifications) {
          addNotification({
            type: "info",
            title: "Εκχώρηση εργασίας",
            message: `Η εργασία εκχωρήθηκε επιτυχώς`,
            priority: "low",
            category: "business",
            isPersistent: false,
            autoClose: true,
            duration: 3000,
          });
        }
      } catch (error) {
        auditWorkflowOperation(
          "delegate_task",
          { taskId, userId },
          error as Error
        );
        throw error;
      }
    },
    [apiCall, auditWorkflowOperation, enableNotifications, addNotification]
  );

  // Add comment
  const addComment = useCallback(
    async (
      instanceId: string,
      content: string,
      stepId?: string,
      isPrivate: boolean = false
    ): Promise<WorkflowComment> => {
      try {
        const comment = await apiCall(`/instances/${instanceId}/comments`, {
          method: "POST",
          body: JSON.stringify({
            content,
            stepId,
            isPrivate,
            author: {
              id: "current_user",
              name: "Current User",
              email: "user@example.com",
              role: "user",
            },
            createdAt: new Date().toISOString(),
          }),
        });

        setState((prev) => ({
          ...prev,
          instances: prev.instances.map((instance) =>
            instance.id === instanceId
              ? { ...instance, comments: [...instance.comments, comment] }
              : instance
          ),
        }));

        auditWorkflowOperation("add_comment", {
          instanceId,
          commentId: comment.id,
        });

        return comment;
      } catch (error) {
        auditWorkflowOperation("add_comment", { instanceId }, error as Error);
        throw error;
      }
    },
    [apiCall, auditWorkflowOperation]
  );

  // Get my tasks
  const getMyTasks = useCallback(
    async (filters: Partial<WorkflowFilters> = {}): Promise<WorkflowTask[]> => {
      try {
        const queryParams = new URLSearchParams();
        queryParams.append("assignee", "current_user");

        if (filters.status) {
          filters.status.forEach((status) =>
            queryParams.append("status", status)
          );
        }
        if (filters.priority) {
          filters.priority.forEach((priority) =>
            queryParams.append("priority", priority)
          );
        }

        const tasks = await apiCall(`/tasks?${queryParams.toString()}`);

        setState((prev) => ({
          ...prev,
          myTasks: tasks,
          statistics: {
            ...prev.statistics,
            pendingTasks: tasks.filter(
              (t: WorkflowTask) => t.status === "pending"
            ).length,
            overdueTasks: tasks.filter(
              (t: WorkflowTask) =>
                t.deadline && new Date(t.deadline) < new Date()
            ).length,
          },
        }));

        return tasks;
      } catch (error) {
        auditWorkflowOperation("get_my_tasks", { filters }, error as Error);
        throw error;
      }
    },
    [apiCall, auditWorkflowOperation]
  );

  // Create definition
  const createDefinition = useCallback(
    async (
      definition: Omit<WorkflowDefinition, "id" | "createdAt" | "updatedAt">
    ): Promise<WorkflowDefinition> => {
      try {
        const newDefinition = await apiCall("/definitions", {
          method: "POST",
          body: JSON.stringify({
            ...definition,
            createdBy: "current_user",
            createdAt: new Date().toISOString(),
          }),
        });

        setState((prev) => ({
          ...prev,
          definitions: [...prev.definitions, newDefinition],
        }));

        auditWorkflowOperation("create_definition", {
          definitionId: newDefinition.id,
        });

        if (enableNotifications) {
          addNotification({
            type: "success",
            title: "Δημιουργία διαδικασίας",
            message: `Η διαδικασία "${definition.name}" δημιουργήθηκε επιτυχώς`,
            priority: "medium",
            category: "business",
            isPersistent: false,
            autoClose: true,
            duration: 4000,
          });
        }

        return newDefinition;
      } catch (error) {
        auditWorkflowOperation(
          "create_definition",
          { definition },
          error as Error
        );
        throw error;
      }
    },
    [apiCall, auditWorkflowOperation, enableNotifications, addNotification]
  );

  // Validate definition
  const validateDefinition = useCallback(
    (definition: WorkflowDefinition): ValidationResult[] => {
      const errors: ValidationResult[] = [];

      // Basic validation
      if (!definition.name || definition.name.trim().length === 0) {
        errors.push({
          field: "name",
          message: "Το όνομα της διαδικασίας είναι υποχρεωτικό",
          severity: "error",
        });
      }

      if (!definition.steps || definition.steps.length === 0) {
        errors.push({
          field: "steps",
          message: "Η διαδικασία πρέπει να έχει τουλάχιστον ένα βήμα",
          severity: "error",
        });
      }

      // Check for start and end steps
      const hasStartStep = definition.steps.some(
        (step) => step.type === "start"
      );
      const hasEndStep = definition.steps.some((step) => step.type === "end");

      if (!hasStartStep) {
        errors.push({
          field: "steps",
          message: "Η διαδικασία πρέπει να έχει ένα βήμα έναρξης",
          severity: "error",
        });
      }

      if (!hasEndStep) {
        errors.push({
          field: "steps",
          message: "Η διαδικασία πρέπει να έχει ένα βήμα τερματισμού",
          severity: "error",
        });
      }

      // Validate step connections
      definition.steps.forEach((step) => {
        if (step.assignee.type === "user" && !step.assignee.value) {
          errors.push({
            field: `steps.${step.id}.assignee`,
            message: `Το βήμα "${step.name}" δεν έχει καθορισμένο υπεύθυνο`,
            severity: "error",
          });
        }
      });

      // Greek compliance validation
      if (enableGreekCompliance && definition.greekCompliance) {
        const compliance = definition.greekCompliance;

        if (
          compliance.financialThreshold &&
          compliance.financialThreshold < 0
        ) {
          errors.push({
            field: "greekCompliance.financialThreshold",
            message: "Το όριο χρηματικού ποσού δεν μπορεί να είναι αρνητικό",
            severity: "error",
          });
        }

        if (
          compliance.requiresAADEApproval &&
          !compliance.complianceSteps.length
        ) {
          errors.push({
            field: "greekCompliance.complianceSteps",
            message: "Απαιτούνται βήματα συμμόρφωσης για έγκριση AADE",
            severity: "warning",
          });
        }
      }

      return errors;
    },
    [enableGreekCompliance]
  );

  // Timeout monitoring
  useEffect(() => {
    if (!timeoutWarnings) return;

    const checkTimeouts = () => {
      state.myTasks.forEach((task) => {
        if (task.deadline && task.status === "pending") {
          const deadlineTime = new Date(task.deadline).getTime();
          const now = Date.now();
          const timeUntilDeadline = deadlineTime - now;

          // Warn 1 hour before deadline
          if (timeUntilDeadline > 0 && timeUntilDeadline <= 60 * 60 * 1000) {
            if (!timeoutRef.current[task.id]) {
              timeoutRef.current[task.id] = setTimeout(() => {
                if (enableNotifications) {
                  addNotification({
                    type: "warning",
                    title: "Προειδοποίηση προθεσμίας",
                    message: `Η εργασία "${task.title}" λήγει σε λιγότερο από 1 ώρα`,
                    priority: "high",
                    category: "business",
                    isPersistent: true,
                    autoClose: false,
                  });
                }
                delete timeoutRef.current[task.id];
              }, timeUntilDeadline - 60 * 60 * 1000);
            }
          }
        }
      });
    };

    const interval = setInterval(checkTimeouts, 5 * 60 * 1000); // Check every 5 minutes
    checkTimeouts(); // Initial check

    return () => {
      clearInterval(interval);
      Object.values(timeoutRef.current).forEach((timeout) =>
        clearTimeout(timeout)
      );
    };
  }, [state.myTasks, timeoutWarnings, enableNotifications, addNotification]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setState((prev) => ({ ...prev, isLoading: true }));

        const [definitions, myTasks] = await Promise.all([
          apiCall("/definitions"),
          getMyTasks(),
        ]);

        setState((prev) => ({
          ...prev,
          definitions,
          isLoading: false,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: (error as Error).message,
        }));
      }
    };

    loadInitialData();
  }, [apiCall, getMyTasks]);

  return {
    ...state,
    createDefinition,
    updateDefinition: async (
      id: string,
      definition: Partial<WorkflowDefinition>
    ) => {
      const updated = await apiCall(`/definitions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(definition),
      });
      setState((prev) => ({
        ...prev,
        definitions: prev.definitions.map((d) => (d.id === id ? updated : d)),
      }));
      return updated;
    },
    deleteDefinition: async (id: string) => {
      await apiCall(`/definitions/${id}`, { method: "DELETE" });
      setState((prev) => ({
        ...prev,
        definitions: prev.definitions.filter((d) => d.id !== id),
      }));
    },
    duplicateDefinition: async (id: string, newName: string) => {
      return await apiCall(`/definitions/${id}/duplicate`, {
        method: "POST",
        body: JSON.stringify({ name: newName }),
      });
    },
    validateDefinition,
    startWorkflow,
    suspendInstance: async (instanceId: string, reason: string) => {
      await apiCall(`/instances/${instanceId}/suspend`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
    },
    resumeInstance: async (instanceId: string) => {
      await apiCall(`/instances/${instanceId}/resume`, {
        method: "POST",
      });
    },
    cancelInstance: async (instanceId: string, reason: string) => {
      await apiCall(`/instances/${instanceId}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
    },
    claimTask: async (taskId: string) => {
      await apiCall(`/tasks/${taskId}/claim`, {
        method: "POST",
        body: JSON.stringify({ claimedBy: "current_user" }),
      });
    },
    completeTask,
    delegateTask,
    reassignTask: async (taskId: string, userId: string, comment?: string) => {
      await apiCall(`/tasks/${taskId}/reassign`, {
        method: "POST",
        body: JSON.stringify({ userId, comment }),
      });
    },
    escalateTask: async (taskId: string, level?: number) => {
      await apiCall(`/tasks/${taskId}/escalate`, {
        method: "POST",
        body: JSON.stringify({ level }),
      });
    },
    addComment,
    updateComment: async (commentId: string, content: string) => {
      await apiCall(`/comments/${commentId}`, {
        method: "PATCH",
        body: JSON.stringify({ content }),
      });
    },
    deleteComment: async (commentId: string) => {
      await apiCall(`/comments/${commentId}`, { method: "DELETE" });
    },
    addAttachment: async (instanceId: string, file: File, stepId?: string) => {
      const formData = new FormData();
      formData.append("file", file);
      if (stepId) formData.append("stepId", stepId);

      const response = await fetch(
        `${apiEndpoint}/instances/${instanceId}/attachments`,
        {
          method: "POST",
          body: formData,
          headers: {
            "X-Company-ID": companyState.currentCompany?.id || "",
          },
        }
      );

      return response.json();
    },
    removeAttachment: async (attachmentId: string) => {
      await apiCall(`/attachments/${attachmentId}`, { method: "DELETE" });
    },
    getMyTasks,
    getInstanceHistory: async (instanceId: string) => {
      return await apiCall(`/instances/${instanceId}/history`);
    },
    searchInstances: async (query: string, filters?: WorkflowFilters) => {
      const params = new URLSearchParams({ q: query });
      if (filters?.status) {
        filters.status.forEach((status) => params.append("status", status));
      }
      return await apiCall(`/instances/search?${params.toString()}`);
    },
    getInstancesByDefinition: async (definitionId: string) => {
      return await apiCall(`/instances?definitionId=${definitionId}`);
    },
    getStatistics: async (filters?: WorkflowFilters) => {
      const params = new URLSearchParams();
      if (filters?.dateRange) {
        params.append("startDate", filters.dateRange.start);
        params.append("endDate", filters.dateRange.end);
      }
      return await apiCall(`/statistics?${params.toString()}`);
    },
    generateReport: async (type: string, filters?: WorkflowFilters) => {
      return await apiCall(`/reports/${type}`, {
        method: "POST",
        body: JSON.stringify({ filters }),
      });
    },
    exportInstances: async (
      format: "csv" | "excel" | "pdf",
      instanceIds?: string[]
    ) => {
      const params = new URLSearchParams({ format });
      if (instanceIds) {
        params.append("ids", instanceIds.join(","));
      }
      return await apiCall(`/export?${params.toString()}`);
    },
    getBottlenecks: async (definitionId?: string) => {
      const params = definitionId ? `?definitionId=${definitionId}` : "";
      return await apiCall(`/analytics/bottlenecks${params}`);
    },
    getPerformanceMetrics: async (definitionId: string, period: string) => {
      return await apiCall(
        `/analytics/performance?definitionId=${definitionId}&period=${period}`
      );
    },
    cleanupCompletedInstances: async (olderThanDays: number) => {
      return await apiCall(`/cleanup?olderThanDays=${olderThanDays}`, {
        method: "POST",
      });
    },
    refresh: async () => {
      const [definitions, instances, myTasks] = await Promise.all([
        apiCall("/definitions"),
        apiCall("/instances"),
        getMyTasks(),
      ]);
      setState((prev) => ({
        ...prev,
        definitions,
        instances,
      }));
    },
    setCurrentDefinition: (definition: WorkflowDefinition | null) => {
      setState((prev) => ({ ...prev, currentDefinition: definition }));
    },
    setCurrentInstance: (instance: WorkflowInstance | null) => {
      setState((prev) => ({ ...prev, currentInstance: instance }));
    },
    applyFilters: (filters: WorkflowFilters) => {
      setState((prev) => ({ ...prev, filters }));
    },
    clearFilters: () => {
      setState((prev) => ({ ...prev, filters: {} }));
    },
  };
}

export default useWorkflow;
