import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";

export interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info" | "compliance";
  title: string;
  message: string;
  priority: "low" | "medium" | "high" | "urgent";
  category:
    | "system"
    | "user"
    | "business"
    | "compliance"
    | "aade"
    | "financial";
  actions?: NotificationAction[];
  metadata?: {
    companyId?: string;
    userId?: string;
    documentId?: string;
    module?: string;
    feature?: string;
    aadeReference?: string;
    vatPeriod?: string;
    amount?: number;
    currency?: string;
  };
  isRead: boolean;
  isPersistent: boolean;
  autoClose: boolean;
  duration?: number;
  createdAt: string;
  expiresAt?: string;
}

export interface NotificationAction {
  id: string;
  label: string;
  type: "primary" | "secondary" | "destructive";
  onClick: () => void;
  requiresConfirmation?: boolean;
  confirmationText?: string;
}

export interface NotificationSettings {
  enableSound: boolean;
  enableDesktop: boolean;
  enableEmail: boolean;
  enableSms: boolean;
  categories: {
    system: boolean;
    user: boolean;
    business: boolean;
    compliance: boolean;
    aade: boolean;
    financial: boolean;
  };
  priorities: {
    low: boolean;
    medium: boolean;
    high: boolean;
    urgent: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  complianceAlerts: {
    enabled: boolean;
    beforeDeadline: number; // days
    overdueReminders: boolean;
  };
}

interface NotificationContextState {
  notifications: Notification[];
  unreadCount: number;
  settings: NotificationSettings;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  lastSync: string | null;
}

type NotificationReducerAction =
  | { type: "ADD_NOTIFICATION"; payload: Notification }
  | { type: "REMOVE_NOTIFICATION"; payload: string }
  | { type: "MARK_AS_READ"; payload: string }
  | { type: "MARK_ALL_AS_READ" }
  | { type: "CLEAR_NOTIFICATIONS" }
  | { type: "SET_NOTIFICATIONS"; payload: Notification[] }
  | { type: "UPDATE_SETTINGS"; payload: Partial<NotificationSettings> }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_CONNECTION_STATUS"; payload: boolean }
  | { type: "SET_LAST_SYNC"; payload: string };

const defaultSettings: NotificationSettings = {
  enableSound: true,
  enableDesktop: true,
  enableEmail: true,
  enableSms: false,
  categories: {
    system: true,
    user: true,
    business: true,
    compliance: true,
    aade: true,
    financial: true,
  },
  priorities: {
    low: true,
    medium: true,
    high: true,
    urgent: true,
  },
  quietHours: {
    enabled: false,
    startTime: "22:00",
    endTime: "08:00",
  },
  complianceAlerts: {
    enabled: true,
    beforeDeadline: 7,
    overdueReminders: true,
  },
};

const initialState: NotificationContextState = {
  notifications: [],
  unreadCount: 0,
  settings: defaultSettings,
  loading: false,
  error: null,
  isConnected: false,
  lastSync: null,
};

function notificationReducer(
  state: NotificationContextState,
  action: NotificationReducerAction
): NotificationContextState {
  switch (action.type) {
    case "ADD_NOTIFICATION":
      const newNotifications = [action.payload, ...state.notifications];
      return {
        ...state,
        notifications: newNotifications,
        unreadCount: newNotifications.filter((n) => !n.isRead).length,
      };

    case "REMOVE_NOTIFICATION":
      const filteredNotifications = state.notifications.filter(
        (n) => n.id !== action.payload
      );
      return {
        ...state,
        notifications: filteredNotifications,
        unreadCount: filteredNotifications.filter((n) => !n.isRead).length,
      };

    case "MARK_AS_READ":
      const updatedNotifications = state.notifications.map((n) =>
        n.id === action.payload ? { ...n, isRead: true } : n
      );
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: updatedNotifications.filter((n) => !n.isRead).length,
      };

    case "MARK_ALL_AS_READ":
      const allReadNotifications = state.notifications.map((n) => ({
        ...n,
        isRead: true,
      }));
      return {
        ...state,
        notifications: allReadNotifications,
        unreadCount: 0,
      };

    case "CLEAR_NOTIFICATIONS":
      return {
        ...state,
        notifications: [],
        unreadCount: 0,
      };

    case "SET_NOTIFICATIONS":
      return {
        ...state,
        notifications: action.payload,
        unreadCount: action.payload.filter((n) => !n.isRead).length,
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

    case "SET_CONNECTION_STATUS":
      return { ...state, isConnected: action.payload };

    case "SET_LAST_SYNC":
      return { ...state, lastSync: action.payload };

    default:
      return state;
  }
}

const NotificationContext = createContext<{
  state: NotificationContextState;
  dispatch: React.Dispatch<NotificationReducerAction>;
  // Notification management
  addNotification: (
    notification: Omit<Notification, "id" | "createdAt" | "isRead">
  ) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  // Settings management
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  // Utility functions
  getNotificationsByCategory: (category: string) => Notification[];
  getUnreadNotifications: () => Notification[];
  getUrgentNotifications: () => Notification[];
  // Axiologic specific notifications
  addComplianceAlert: (message: string, metadata?: any) => void;
  addAADENotification: (message: string, reference?: string) => void;
  addFinancialAlert: (
    message: string,
    amount?: number,
    currency?: string
  ) => void;
  addVATNotification: (message: string, period?: string) => void;
  // System notifications
  addSystemNotification: (
    message: string,
    type?: "success" | "error" | "warning" | "info"
  ) => void;
  // Real-time features
  connectToNotificationService: () => void;
  disconnectFromNotificationService: () => void;
  syncNotifications: () => Promise<void>;
} | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Generate unique notification ID
  const generateId = () =>
    `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Core notification functions
  const addNotification = (
    notification: Omit<Notification, "id" | "createdAt" | "isRead">
  ) => {
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    dispatch({ type: "ADD_NOTIFICATION", payload: newNotification });

    // Handle auto-close
    if (newNotification.autoClose && newNotification.duration) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, newNotification.duration);
    }

    // Handle browser notifications
    if (state.settings.enableDesktop && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(newNotification.title, {
          body: newNotification.message,
          icon: "/favicon.ico",
        });
      }
    }

    // Handle sound notifications
    if (state.settings.enableSound) {
      // In a real implementation, play notification sound
    }
  };

  const removeNotification = (id: string) => {
    dispatch({ type: "REMOVE_NOTIFICATION", payload: id });
  };

  const markAsRead = (id: string) => {
    dispatch({ type: "MARK_AS_READ", payload: id });
  };

  const markAllAsRead = () => {
    dispatch({ type: "MARK_ALL_AS_READ" });
  };

  const clearNotifications = () => {
    dispatch({ type: "CLEAR_NOTIFICATIONS" });
  };

  const updateSettings = (settings: Partial<NotificationSettings>) => {
    dispatch({ type: "UPDATE_SETTINGS", payload: settings });
  };

  // Utility functions
  const getNotificationsByCategory = (category: string) => {
    return state.notifications.filter((n) => n.category === category);
  };

  const getUnreadNotifications = () => {
    return state.notifications.filter((n) => !n.isRead);
  };

  const getUrgentNotifications = () => {
    return state.notifications.filter((n) => n.priority === "urgent");
  };

  // Axiologic specific notifications
  const addComplianceAlert = (message: string, metadata?: any) => {
    addNotification({
      type: "compliance",
      title: "Compliance Alert",
      message,
      priority: "high",
      category: "compliance",
      metadata,
      isPersistent: true,
      autoClose: false,
    });
  };

  const addAADENotification = (message: string, reference?: string) => {
    addNotification({
      type: "info",
      title: "AADE Notification",
      message,
      priority: "medium",
      category: "aade",
      metadata: { aadeReference: reference },
      isPersistent: true,
      autoClose: false,
    });
  };

  const addFinancialAlert = (
    message: string,
    amount?: number,
    currency?: string
  ) => {
    addNotification({
      type: "warning",
      title: "Financial Alert",
      message,
      priority: "high",
      category: "financial",
      metadata: { amount, currency },
      isPersistent: true,
      autoClose: false,
    });
  };

  const addVATNotification = (message: string, period?: string) => {
    addNotification({
      type: "compliance",
      title: "VAT Notification",
      message,
      priority: "high",
      category: "compliance",
      metadata: { vatPeriod: period },
      isPersistent: true,
      autoClose: false,
    });
  };

  const addSystemNotification = (
    message: string,
    type: "success" | "error" | "warning" | "info" = "info"
  ) => {
    addNotification({
      type,
      title: "System Notification",
      message,
      priority: "medium",
      category: "system",
      isPersistent: false,
      autoClose: true,
      duration: 5000,
    });
  };

  // Real-time features
  const connectToNotificationService = () => {
    // In a real implementation, connect to WebSocket or SSE
    dispatch({ type: "SET_CONNECTION_STATUS", payload: true });
  };

  const disconnectFromNotificationService = () => {
    // In a real implementation, disconnect from WebSocket or SSE
    dispatch({ type: "SET_CONNECTION_STATUS", payload: false });
  };

  const syncNotifications = async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      // In a real implementation, fetch notifications from server
      dispatch({ type: "SET_LAST_SYNC", payload: new Date().toISOString() });
    } catch (error) {
      dispatch({
        type: "SET_ERROR",
        payload:
          error instanceof Error
            ? error.message
            : "Failed to sync notifications",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  // Request notification permission on mount
  useEffect(() => {
    if (state.settings.enableDesktop && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, [state.settings.enableDesktop]);

  // Clean up expired notifications
  useEffect(() => {
    const cleanupExpired = () => {
      const now = new Date();
      const validNotifications = state.notifications.filter((n) => {
        if (!n.expiresAt) return true;
        return new Date(n.expiresAt) > now;
      });

      if (validNotifications.length !== state.notifications.length) {
        dispatch({ type: "SET_NOTIFICATIONS", payload: validNotifications });
      }
    };

    const interval = setInterval(cleanupExpired, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [state.notifications]);

  const contextValue = {
    state,
    dispatch,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    updateSettings,
    getNotificationsByCategory,
    getUnreadNotifications,
    getUrgentNotifications,
    addComplianceAlert,
    addAADENotification,
    addFinancialAlert,
    addVATNotification,
    addSystemNotification,
    connectToNotificationService,
    disconnectFromNotificationService,
    syncNotifications,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
}

export default NotificationContext;
