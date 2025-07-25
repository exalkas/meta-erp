import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  type:
    | "APPROVAL"
    | "REVIEW"
    | "VALIDATION"
    | "NOTIFICATION"
    | "INTEGRATION"
    | "CALCULATION";
  order: number;
  assigneeType: "USER" | "ROLE" | "DEPARTMENT" | "SYSTEM" | "EXTERNAL";
  assignee: string;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  timeoutMinutes?: number;
  escalation?: {
    enabled: boolean;
    timeoutMinutes: number;
    escalateTo: string;
    escalationType: "USER" | "ROLE" | "DEPARTMENT";
  };
  isActive: boolean;
  isRequired: boolean;
  allowSkip: boolean;
  greekCompliance?: {
    requiresAADE: boolean;
    requiresDOY: boolean;
    taxImplications: boolean;
    legalRequirement: boolean;
  };
}

export interface WorkflowCondition {
  id: string;
  field: string;
  operator:
    | "EQUALS"
    | "NOT_EQUALS"
    | "GREATER_THAN"
    | "LESS_THAN"
    | "CONTAINS"
    | "EXISTS";
  value: any;
  type: "FIELD" | "USER" | "ROLE" | "DATE" | "AMOUNT" | "STATUS";
}

export interface WorkflowAction {
  id: string;
  type:
    | "SET_FIELD"
    | "SEND_EMAIL"
    | "SEND_SMS"
    | "CREATE_TASK"
    | "UPDATE_STATUS"
    | "INTEGRATION_CALL";
  parameters: Record<string, any>;
  delay?: number; // minutes
  conditions?: WorkflowCondition[];
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  category:
    | "FINANCIAL"
    | "HR"
    | "PROCUREMENT"
    | "SALES"
    | "INVENTORY"
    | "COMPLIANCE"
    | "CUSTOM";
  entityType: string; // invoice, contract, employee, etc.
  steps: WorkflowStep[];
  triggers: {
    onCreate: boolean;
    onUpdate: boolean;
    onStatusChange: boolean;
    onFieldChange: string[];
    onSchedule?: string; // cron expression
  };
  settings: {
    allowParallel: boolean;
    allowReassign: boolean;
    allowSkipSteps: boolean;
    requireComments: boolean;
    trackTime: boolean;
    autoArchive: boolean;
    retentionDays: number;
  };
  greekCompliance: {
    aadeIntegration: boolean;
    taxCalculation: boolean;
    legalDocuments: boolean;
    auditTrail: boolean;
    retentionRequired: boolean;
    retentionYears: number;
  };
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowInstance {
  id: string;
  workflowId: string;
  workflowVersion: string;
  entityId: string;
  entityType: string;
  status:
    | "PENDING"
    | "IN_PROGRESS"
    | "APPROVED"
    | "REJECTED"
    | "CANCELLED"
    | "ERROR";
  currentStep: number;
  currentAssignee: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  startedAt: string;
  completedAt?: string;
  dueDate?: string;
  data: Record<string, any>;
  history: WorkflowHistoryEntry[];
  comments: WorkflowComment[];
  attachments: string[];
  metadata: {
    initiatedBy: string;
    companyId: string;
    department: string;
    totalSteps: number;
    completedSteps: number;
    estimatedCompletion?: string;
    actualDuration?: number; // minutes
  };
}

export interface WorkflowHistoryEntry {
  id: string;
  stepId: string;
  stepName: string;
  action:
    | "STARTED"
    | "COMPLETED"
    | "APPROVED"
    | "REJECTED"
    | "SKIPPED"
    | "ESCALATED"
    | "REASSIGNED";
  actorId: string;
  actorName: string;
  timestamp: string;
  duration?: number; // minutes
  comment?: string;
  data?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
}

export interface WorkflowComment {
  id: string;
  stepId?: string;
  authorId: string;
  authorName: string;
  content: string;
  type: "COMMENT" | "APPROVAL" | "REJECTION" | "QUESTION" | "INSTRUCTION";
  timestamp: string;
  isPrivate: boolean;
  attachments: string[];
}

export interface WorkflowMetrics {
  totalWorkflows: number;
  activeWorkflows: number;
  completedWorkflows: number;
  avgCompletionTime: number; // minutes
  bottlenecks: Array<{
    stepId: string;
    stepName: string;
    avgDuration: number;
    instances: number;
  }>;
  userPerformance: Array<{
    userId: string;
    userName: string;
    completedTasks: number;
    avgResponseTime: number;
    onTimeCompletion: number; // percentage
  }>;
  complianceMetrics: {
    aadeCompliance: number; // percentage
    auditTrailComplete: number; // percentage
    retentionCompliance: number; // percentage
  };
}

interface WorkflowContextState {
  definitions: WorkflowDefinition[];
  instances: WorkflowInstance[];
  currentInstance: WorkflowInstance | null;
  myTasks: WorkflowInstance[];
  metrics: WorkflowMetrics | null;
  loading: boolean;
  error: string | null;
  filters: {
    status?: string;
    assignee?: string;
    priority?: string;
    category?: string;
    dateRange?: {
      start: string;
      end: string;
    };
  };
  settings: {
    enableNotifications: boolean;
    enableEscalation: boolean;
    defaultTimeout: number; // minutes
    enableComments: boolean;
    enableAttachments: boolean;
    maxAttachmentSize: number; // MB
  };
}

type WorkflowContextAction =
  | { type: "SET_DEFINITIONS"; payload: WorkflowDefinition[] }
  | { type: "ADD_DEFINITION"; payload: WorkflowDefinition }
  | {
      type: "UPDATE_DEFINITION";
      payload: { id: string; updates: Partial<WorkflowDefinition> };
    }
  | { type: "SET_INSTANCES"; payload: WorkflowInstance[] }
  | { type: "ADD_INSTANCE"; payload: WorkflowInstance }
  | {
      type: "UPDATE_INSTANCE";
      payload: { id: string; updates: Partial<WorkflowInstance> };
    }
  | { type: "SET_CURRENT_INSTANCE"; payload: WorkflowInstance | null }
  | { type: "SET_MY_TASKS"; payload: WorkflowInstance[] }
  | { type: "SET_METRICS"; payload: WorkflowMetrics }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_FILTERS"; payload: Partial<WorkflowContextState["filters"]> }
  | {
      type: "UPDATE_SETTINGS";
      payload: Partial<WorkflowContextState["settings"]>;
    }
  | {
      type: "ADD_COMMENT";
      payload: { instanceId: string; comment: WorkflowComment };
    }
  | {
      type: "ADD_HISTORY_ENTRY";
      payload: { instanceId: string; entry: WorkflowHistoryEntry };
    };

const initialState: WorkflowContextState = {
  definitions: [],
  instances: [],
  currentInstance: null,
  myTasks: [],
  metrics: null,
  loading: false,
  error: null,
  filters: {},
  settings: {
    enableNotifications: true,
    enableEscalation: true,
    defaultTimeout: 1440, // 24 hours
    enableComments: true,
    enableAttachments: true,
    maxAttachmentSize: 10, // 10MB
  },
};

function workflowReducer(
  state: WorkflowContextState,
  action: WorkflowContextAction
): WorkflowContextState {
  switch (action.type) {
    case "SET_DEFINITIONS":
      return { ...state, definitions: action.payload };

    case "ADD_DEFINITION":
      return { ...state, definitions: [...state.definitions, action.payload] };

    case "UPDATE_DEFINITION":
      return {
        ...state,
        definitions: state.definitions.map((def) =>
          def.id === action.payload.id
            ? {
                ...def,
                ...action.payload.updates,
                updatedAt: new Date().toISOString(),
              }
            : def
        ),
      };

    case "SET_INSTANCES":
      return { ...state, instances: action.payload };

    case "ADD_INSTANCE":
      return { ...state, instances: [...state.instances, action.payload] };

    case "UPDATE_INSTANCE":
      return {
        ...state,
        instances: state.instances.map((instance) =>
          instance.id === action.payload.id
            ? { ...instance, ...action.payload.updates }
            : instance
        ),
        currentInstance:
          state.currentInstance?.id === action.payload.id
            ? { ...state.currentInstance, ...action.payload.updates }
            : state.currentInstance,
      };

    case "SET_CURRENT_INSTANCE":
      return { ...state, currentInstance: action.payload };

    case "SET_MY_TASKS":
      return { ...state, myTasks: action.payload };

    case "SET_METRICS":
      return { ...state, metrics: action.payload };

    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload };

    case "SET_FILTERS":
      return { ...state, filters: { ...state.filters, ...action.payload } };

    case "UPDATE_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case "ADD_COMMENT":
      return {
        ...state,
        instances: state.instances.map((instance) =>
          instance.id === action.payload.instanceId
            ? {
                ...instance,
                comments: [...instance.comments, action.payload.comment],
              }
            : instance
        ),
      };

    case "ADD_HISTORY_ENTRY":
      return {
        ...state,
        instances: state.instances.map((instance) =>
          instance.id === action.payload.instanceId
            ? {
                ...instance,
                history: [...instance.history, action.payload.entry],
              }
            : instance
        ),
      };

    default:
      return state;
  }
}

const WorkflowContext = createContext<{
  state: WorkflowContextState;
  dispatch: React.Dispatch<WorkflowContextAction>;
  // Workflow definition management
  createWorkflow: (
    workflow: Omit<WorkflowDefinition, "id" | "createdAt" | "updatedAt">
  ) => void;
  updateWorkflow: (id: string, updates: Partial<WorkflowDefinition>) => void;
  deleteWorkflow: (id: string) => void;
  activateWorkflow: (id: string) => void;
  deactivateWorkflow: (id: string) => void;
  // Workflow instance management
  startWorkflow: (
    workflowId: string,
    entityId: string,
    entityType: string,
    data?: any
  ) => Promise<string>;
  approveStep: (
    instanceId: string,
    comment?: string,
    data?: any
  ) => Promise<void>;
  rejectStep: (
    instanceId: string,
    comment: string,
    data?: any
  ) => Promise<void>;
  skipStep: (instanceId: string, reason: string) => Promise<void>;
  reassignStep: (
    instanceId: string,
    newAssignee: string,
    reason: string
  ) => Promise<void>;
  escalateStep: (instanceId: string, reason: string) => Promise<void>;
  cancelWorkflow: (instanceId: string, reason: string) => Promise<void>;
  // Task management
  getMyTasks: (filters?: any) => Promise<void>;
  claimTask: (instanceId: string) => Promise<void>;
  releaseTask: (instanceId: string) => Promise<void>;
  delegateTask: (
    instanceId: string,
    delegateTo: string,
    reason: string
  ) => Promise<void>;
  // Comments and attachments
  addComment: (
    instanceId: string,
    comment: Omit<WorkflowComment, "id" | "timestamp">
  ) => void;
  addAttachment: (instanceId: string, file: File) => Promise<string>;
  removeAttachment: (instanceId: string, attachmentId: string) => Promise<void>;
  // Greek compliance utilities
  checkAADECompliance: (instanceId: string) => Promise<boolean>;
  generateTaxDocument: (instanceId: string) => Promise<string>;
  submitToAADE: (instanceId: string) => Promise<void>;
  validateGreekRequirements: (instanceId: string) => Promise<string[]>;
  // Metrics and reporting
  getMetrics: (filters?: any) => Promise<void>;
  generateReport: (type: string, filters?: any) => Promise<string>;
  getBottlenecks: () => Array<{
    stepId: string;
    stepName: string;
    avgDuration: number;
    instances: number;
  }>;
  getUserPerformance: (userId?: string) => Promise<any>;
  // Workflow execution utilities
  executeWorkflowStep: (instanceId: string, stepId: string) => Promise<void>;
  evaluateConditions: (conditions: WorkflowCondition[], data: any) => boolean;
  executeActions: (
    actions: WorkflowAction[],
    instanceId: string
  ) => Promise<void>;
  calculateDueDate: (instanceId: string, stepId: string) => Date | null;
  // Filters and search
  setFilters: (filters: Partial<WorkflowContextState["filters"]>) => void;
  clearFilters: () => void;
  searchWorkflows: (query: string) => Promise<WorkflowInstance[]>;
  // Settings
  updateSettings: (settings: Partial<WorkflowContextState["settings"]>) => void;
  // Import/Export
  exportWorkflow: (workflowId: string) => string;
  importWorkflow: (workflowData: string) => void;
  exportInstance: (instanceId: string) => string;
} | null>(null);

export function WorkflowProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(workflowReducer, initialState);

  // Generate unique IDs
  const generateId = () =>
    `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Workflow definition management
  const createWorkflow = (
    workflow: Omit<WorkflowDefinition, "id" | "createdAt" | "updatedAt">
  ) => {
    const newWorkflow: WorkflowDefinition = {
      ...workflow,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dispatch({ type: "ADD_DEFINITION", payload: newWorkflow });
  };

  const updateWorkflow = (id: string, updates: Partial<WorkflowDefinition>) => {
    dispatch({ type: "UPDATE_DEFINITION", payload: { id, updates } });
  };

  const deleteWorkflow = (id: string) => {
    const filteredDefinitions = state.definitions.filter(
      (def) => def.id !== id
    );
    dispatch({ type: "SET_DEFINITIONS", payload: filteredDefinitions });
  };

  const activateWorkflow = (id: string) => {
    updateWorkflow(id, { isActive: true });
  };

  const deactivateWorkflow = (id: string) => {
    updateWorkflow(id, { isActive: false });
  };

  // Workflow instance management
  const startWorkflow = async (
    workflowId: string,
    entityId: string,
    entityType: string,
    data?: any
  ): Promise<string> => {
    const workflow = state.definitions.find((w) => w.id === workflowId);
    if (!workflow) {
      throw new Error("Workflow definition not found");
    }

    if (!workflow.isActive) {
      throw new Error("Workflow is not active");
    }

    const instanceId = generateId();
    const newInstance: WorkflowInstance = {
      id: instanceId,
      workflowId,
      workflowVersion: workflow.version,
      entityId,
      entityType,
      status: "PENDING",
      currentStep: 0,
      currentAssignee: workflow.steps[0]?.assignee || "",
      priority: "MEDIUM",
      startedAt: new Date().toISOString(),
      data: data || {},
      history: [],
      comments: [],
      attachments: [],
      metadata: {
        initiatedBy: "current-user-id", // Get from auth context
        companyId: "current-company-id",
        department: "default",
        totalSteps: workflow.steps.length,
        completedSteps: 0,
      },
    };

    // Add initial history entry
    const historyEntry: WorkflowHistoryEntry = {
      id: generateId(),
      stepId: "start",
      stepName: "Workflow Started",
      action: "STARTED",
      actorId: "current-user-id",
      actorName: "Current User",
      timestamp: new Date().toISOString(),
      ipAddress: "127.0.0.1",
      userAgent: navigator.userAgent,
    };

    newInstance.history.push(historyEntry);
    dispatch({ type: "ADD_INSTANCE", payload: newInstance });

    // Execute first step if it's automatic
    const firstStep = workflow.steps[0];
    if (firstStep && firstStep.assigneeType === "SYSTEM") {
      await executeWorkflowStep(instanceId, firstStep.id);
    }

    return instanceId;
  };

  const approveStep = async (
    instanceId: string,
    comment?: string,
    data?: any
  ) => {
    const instance = state.instances.find((i) => i.id === instanceId);
    if (!instance) {
      throw new Error("Workflow instance not found");
    }

    const workflow = state.definitions.find(
      (w) => w.id === instance.workflowId
    );
    if (!workflow) {
      throw new Error("Workflow definition not found");
    }

    const currentStep = workflow.steps[instance.currentStep];
    if (!currentStep) {
      throw new Error("Current step not found");
    }

    // Add history entry
    const historyEntry: WorkflowHistoryEntry = {
      id: generateId(),
      stepId: currentStep.id,
      stepName: currentStep.name,
      action: "APPROVED",
      actorId: "current-user-id",
      actorName: "Current User",
      timestamp: new Date().toISOString(),
      comment,
      data,
      ipAddress: "127.0.0.1",
      userAgent: navigator.userAgent,
    };

    dispatch({
      type: "ADD_HISTORY_ENTRY",
      payload: { instanceId, entry: historyEntry },
    });

    // Move to next step
    const nextStepIndex = instance.currentStep + 1;
    if (nextStepIndex >= workflow.steps.length) {
      // Workflow completed
      dispatch({
        type: "UPDATE_INSTANCE",
        payload: {
          id: instanceId,
          updates: {
            status: "APPROVED",
            completedAt: new Date().toISOString(),
            metadata: {
              ...instance.metadata,
              completedSteps: workflow.steps.length,
            },
          },
        },
      });
    } else {
      // Move to next step
      const nextStep = workflow.steps[nextStepIndex];
      dispatch({
        type: "UPDATE_INSTANCE",
        payload: {
          id: instanceId,
          updates: {
            currentStep: nextStepIndex,
            currentAssignee: nextStep.assignee,
            status: "IN_PROGRESS",
            metadata: {
              ...instance.metadata,
              completedSteps: nextStepIndex,
            },
          },
        },
      });

      // Execute next step if it's automatic
      if (nextStep.assigneeType === "SYSTEM") {
        await executeWorkflowStep(instanceId, nextStep.id);
      }
    }
  };

  const rejectStep = async (
    instanceId: string,
    comment: string,
    data?: any
  ) => {
    const instance = state.instances.find((i) => i.id === instanceId);
    if (!instance) {
      throw new Error("Workflow instance not found");
    }

    const workflow = state.definitions.find(
      (w) => w.id === instance.workflowId
    );
    if (!workflow) {
      throw new Error("Workflow definition not found");
    }

    const currentStep = workflow.steps[instance.currentStep];

    // Add history entry
    const historyEntry: WorkflowHistoryEntry = {
      id: generateId(),
      stepId: currentStep.id,
      stepName: currentStep.name,
      action: "REJECTED",
      actorId: "current-user-id",
      actorName: "Current User",
      timestamp: new Date().toISOString(),
      comment,
      data,
      ipAddress: "127.0.0.1",
      userAgent: navigator.userAgent,
    };

    dispatch({
      type: "ADD_HISTORY_ENTRY",
      payload: { instanceId, entry: historyEntry },
    });

    // Update instance status
    dispatch({
      type: "UPDATE_INSTANCE",
      payload: {
        id: instanceId,
        updates: {
          status: "REJECTED",
          completedAt: new Date().toISOString(),
        },
      },
    });
  };

  const skipStep = async (instanceId: string, reason: string) => {
    const instance = state.instances.find((i) => i.id === instanceId);
    if (!instance) {
      throw new Error("Workflow instance not found");
    }

    const workflow = state.definitions.find(
      (w) => w.id === instance.workflowId
    );
    if (!workflow) {
      throw new Error("Workflow definition not found");
    }

    const currentStep = workflow.steps[instance.currentStep];
    if (!currentStep.allowSkip) {
      throw new Error("This step cannot be skipped");
    }

    // Add history entry
    const historyEntry: WorkflowHistoryEntry = {
      id: generateId(),
      stepId: currentStep.id,
      stepName: currentStep.name,
      action: "SKIPPED",
      actorId: "current-user-id",
      actorName: "Current User",
      timestamp: new Date().toISOString(),
      comment: reason,
      ipAddress: "127.0.0.1",
      userAgent: navigator.userAgent,
    };

    dispatch({
      type: "ADD_HISTORY_ENTRY",
      payload: { instanceId, entry: historyEntry },
    });

    // Move to next step
    await approveStep(instanceId, `Skipped: ${reason}`);
  };

  const reassignStep = async (
    instanceId: string,
    newAssignee: string,
    reason: string
  ) => {
    const instance = state.instances.find((i) => i.id === instanceId);
    if (!instance) {
      throw new Error("Workflow instance not found");
    }

    const workflow = state.definitions.find(
      (w) => w.id === instance.workflowId
    );
    if (!workflow?.settings.allowReassign) {
      throw new Error("Reassignment is not allowed for this workflow");
    }

    // Add history entry
    const historyEntry: WorkflowHistoryEntry = {
      id: generateId(),
      stepId: workflow.steps[instance.currentStep].id,
      stepName: workflow.steps[instance.currentStep].name,
      action: "REASSIGNED",
      actorId: "current-user-id",
      actorName: "Current User",
      timestamp: new Date().toISOString(),
      comment: reason,
      data: { newAssignee },
      ipAddress: "127.0.0.1",
      userAgent: navigator.userAgent,
    };

    dispatch({
      type: "ADD_HISTORY_ENTRY",
      payload: { instanceId, entry: historyEntry },
    });

    // Update assignee
    dispatch({
      type: "UPDATE_INSTANCE",
      payload: {
        id: instanceId,
        updates: { currentAssignee: newAssignee },
      },
    });
  };

  const escalateStep = async (instanceId: string, reason: string) => {
    const instance = state.instances.find((i) => i.id === instanceId);
    if (!instance) {
      throw new Error("Workflow instance not found");
    }

    const workflow = state.definitions.find(
      (w) => w.id === instance.workflowId
    );
    if (!workflow) {
      throw new Error("Workflow definition not found");
    }

    const currentStep = workflow.steps[instance.currentStep];
    if (!currentStep.escalation?.enabled) {
      throw new Error("Escalation is not enabled for this step");
    }

    // Add history entry
    const historyEntry: WorkflowHistoryEntry = {
      id: generateId(),
      stepId: currentStep.id,
      stepName: currentStep.name,
      action: "ESCALATED",
      actorId: "current-user-id",
      actorName: "Current User",
      timestamp: new Date().toISOString(),
      comment: reason,
      data: { escalatedTo: currentStep.escalation.escalateTo },
      ipAddress: "127.0.0.1",
      userAgent: navigator.userAgent,
    };

    dispatch({
      type: "ADD_HISTORY_ENTRY",
      payload: { instanceId, entry: historyEntry },
    });

    // Update assignee to escalation target
    dispatch({
      type: "UPDATE_INSTANCE",
      payload: {
        id: instanceId,
        updates: {
          currentAssignee: currentStep.escalation.escalateTo,
          priority: "URGENT",
        },
      },
    });
  };

  const cancelWorkflow = async (instanceId: string, reason: string) => {
    const instance = state.instances.find((i) => i.id === instanceId);
    if (!instance) {
      throw new Error("Workflow instance not found");
    }

    // Add history entry
    const historyEntry: WorkflowHistoryEntry = {
      id: generateId(),
      stepId: "cancel",
      stepName: "Workflow Cancelled",
      action: "CANCELLED" as any,
      actorId: "current-user-id",
      actorName: "Current User",
      timestamp: new Date().toISOString(),
      comment: reason,
      ipAddress: "127.0.0.1",
      userAgent: navigator.userAgent,
    };

    dispatch({
      type: "ADD_HISTORY_ENTRY",
      payload: { instanceId, entry: historyEntry },
    });

    // Update status
    dispatch({
      type: "UPDATE_INSTANCE",
      payload: {
        id: instanceId,
        updates: {
          status: "CANCELLED",
          completedAt: new Date().toISOString(),
        },
      },
    });
  };

  // Task management
  const getMyTasks = async (filters?: any) => {
    // In a real implementation, fetch from API
    const myTasks = state.instances.filter(
      (instance) =>
        instance.currentAssignee === "current-user-id" &&
        instance.status === "IN_PROGRESS"
    );

    dispatch({ type: "SET_MY_TASKS", payload: myTasks });
  };

  const claimTask = async (instanceId: string) => {
    // In a real implementation, claim task from API
    dispatch({
      type: "UPDATE_INSTANCE",
      payload: {
        id: instanceId,
        updates: { currentAssignee: "current-user-id" },
      },
    });
  };

  const releaseTask = async (instanceId: string) => {
    // In a real implementation, release task via API
    dispatch({
      type: "UPDATE_INSTANCE",
      payload: {
        id: instanceId,
        updates: { currentAssignee: "" },
      },
    });
  };

  const delegateTask = async (
    instanceId: string,
    delegateTo: string,
    reason: string
  ) => {
    await reassignStep(instanceId, delegateTo, `Delegated: ${reason}`);
  };

  // Comments and attachments
  const addComment = (
    instanceId: string,
    comment: Omit<WorkflowComment, "id" | "timestamp">
  ) => {
    const newComment: WorkflowComment = {
      ...comment,
      id: generateId(),
      timestamp: new Date().toISOString(),
    };

    dispatch({
      type: "ADD_COMMENT",
      payload: { instanceId, comment: newComment },
    });
  };

  const addAttachment = async (
    instanceId: string,
    file: File
  ): Promise<string> => {
    // In a real implementation, upload file and return attachment ID
    const attachmentId = generateId();

    const instance = state.instances.find((i) => i.id === instanceId);
    if (instance) {
      dispatch({
        type: "UPDATE_INSTANCE",
        payload: {
          id: instanceId,
          updates: {
            attachments: [...instance.attachments, attachmentId],
          },
        },
      });
    }

    return attachmentId;
  };

  const removeAttachment = async (instanceId: string, attachmentId: string) => {
    const instance = state.instances.find((i) => i.id === instanceId);
    if (instance) {
      dispatch({
        type: "UPDATE_INSTANCE",
        payload: {
          id: instanceId,
          updates: {
            attachments: instance.attachments.filter(
              (id) => id !== attachmentId
            ),
          },
        },
      });
    }
  };

  // Greek compliance utilities
  const checkAADECompliance = async (instanceId: string): Promise<boolean> => {
    // In a real implementation, check AADE compliance
    return true;
  };

  const generateTaxDocument = async (instanceId: string): Promise<string> => {
    // In a real implementation, generate tax document
    return "tax-document-id";
  };

  const submitToAADE = async (instanceId: string) => {
    // In a real implementation, submit to AADE
    console.log("Submitting to AADE:", instanceId);
  };

  const validateGreekRequirements = async (
    instanceId: string
  ): Promise<string[]> => {
    // In a real implementation, validate Greek requirements
    return [];
  };

  // Metrics and reporting
  const getMetrics = async (filters?: any) => {
    // In a real implementation, fetch metrics from API
    const mockMetrics: WorkflowMetrics = {
      totalWorkflows: state.instances.length,
      activeWorkflows: state.instances.filter((i) => i.status === "IN_PROGRESS")
        .length,
      completedWorkflows: state.instances.filter((i) => i.status === "APPROVED")
        .length,
      avgCompletionTime: 1440, // 24 hours
      bottlenecks: [],
      userPerformance: [],
      complianceMetrics: {
        aadeCompliance: 95,
        auditTrailComplete: 100,
        retentionCompliance: 98,
      },
    };

    dispatch({ type: "SET_METRICS", payload: mockMetrics });
  };

  const generateReport = async (
    type: string,
    filters?: any
  ): Promise<string> => {
    // In a real implementation, generate report
    return `Workflow report (${type}) generated at ${new Date().toISOString()}`;
  };

  const getBottlenecks = () => {
    return state.metrics?.bottlenecks || [];
  };

  const getUserPerformance = async (userId?: string) => {
    // In a real implementation, get user performance data
    return { performance: "data" };
  };

  // Workflow execution utilities
  const executeWorkflowStep = async (instanceId: string, stepId: string) => {
    // In a real implementation, execute workflow step
    console.log("Executing workflow step:", instanceId, stepId);
  };

  const evaluateConditions = (
    conditions: WorkflowCondition[],
    data: any
  ): boolean => {
    return conditions.every((condition) => {
      const fieldValue = data[condition.field];

      switch (condition.operator) {
        case "EQUALS":
          return fieldValue === condition.value;
        case "NOT_EQUALS":
          return fieldValue !== condition.value;
        case "GREATER_THAN":
          return fieldValue > condition.value;
        case "LESS_THAN":
          return fieldValue < condition.value;
        case "CONTAINS":
          return String(fieldValue).includes(condition.value);
        case "EXISTS":
          return fieldValue !== undefined && fieldValue !== null;
        default:
          return false;
      }
    });
  };

  const executeActions = async (
    actions: WorkflowAction[],
    instanceId: string
  ) => {
    // In a real implementation, execute workflow actions
    for (const action of actions) {
      console.log("Executing action:", action.type, action.parameters);
    }
  };

  const calculateDueDate = (
    instanceId: string,
    stepId: string
  ): Date | null => {
    const instance = state.instances.find((i) => i.id === instanceId);
    if (!instance) return null;

    const workflow = state.definitions.find(
      (w) => w.id === instance.workflowId
    );
    if (!workflow) return null;

    const step = workflow.steps.find((s) => s.id === stepId);
    if (!step?.timeoutMinutes) return null;

    return new Date(Date.now() + step.timeoutMinutes * 60 * 1000);
  };

  // Filters and search
  const setFilters = (filters: Partial<WorkflowContextState["filters"]>) => {
    dispatch({ type: "SET_FILTERS", payload: filters });
  };

  const clearFilters = () => {
    dispatch({ type: "SET_FILTERS", payload: {} });
  };

  const searchWorkflows = async (
    query: string
  ): Promise<WorkflowInstance[]> => {
    // In a real implementation, search workflows
    return state.instances.filter(
      (instance) =>
        instance.entityId.includes(query) || instance.entityType.includes(query)
    );
  };

  // Settings
  const updateSettings = (
    settings: Partial<WorkflowContextState["settings"]>
  ) => {
    dispatch({ type: "UPDATE_SETTINGS", payload: settings });
  };

  // Import/Export
  const exportWorkflow = (workflowId: string): string => {
    const workflow = state.definitions.find((w) => w.id === workflowId);
    return JSON.stringify(workflow, null, 2);
  };

  const importWorkflow = (workflowData: string) => {
    try {
      const workflow = JSON.parse(workflowData);
      workflow.id = generateId();
      workflow.createdAt = new Date().toISOString();
      workflow.updatedAt = new Date().toISOString();
      dispatch({ type: "ADD_DEFINITION", payload: workflow });
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: "Invalid workflow data" });
    }
  };

  const exportInstance = (instanceId: string): string => {
    const instance = state.instances.find((i) => i.id === instanceId);
    return JSON.stringify(instance, null, 2);
  };

  // Effects
  useEffect(() => {
    // Load initial data
    getMyTasks();
    getMetrics();
  }, []);

  const contextValue = {
    state,
    dispatch,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    activateWorkflow,
    deactivateWorkflow,
    startWorkflow,
    approveStep,
    rejectStep,
    skipStep,
    reassignStep,
    escalateStep,
    cancelWorkflow,
    getMyTasks,
    claimTask,
    releaseTask,
    delegateTask,
    addComment,
    addAttachment,
    removeAttachment,
    checkAADECompliance,
    generateTaxDocument,
    submitToAADE,
    validateGreekRequirements,
    getMetrics,
    generateReport,
    getBottlenecks,
    getUserPerformance,
    executeWorkflowStep,
    evaluateConditions,
    executeActions,
    calculateDueDate,
    setFilters,
    clearFilters,
    searchWorkflows,
    updateSettings,
    exportWorkflow,
    importWorkflow,
    exportInstance,
  };

  return (
    <WorkflowContext.Provider value={contextValue}>
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error("useWorkflow must be used within a WorkflowProvider");
  }
  return context;
}

export default WorkflowContext;
