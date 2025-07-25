/**
 * Authentication Context for Multi-App Axiologic System
 * Handles JWT authentication, token management, and user session
 * Used by all 6 apps: admin, client, setup, staff-support, user-support, marketing
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { AppName } from "../types/constants";

// Authentication types
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  companyId: string;
  permissions: string[];
  isActive: boolean;
  canBeDeleted: boolean;
  canChangePassword: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: string;
}

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthState {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  app: AppName;
  hasAppAccess: boolean;
  sessionExpiresAt: string | null;
}

interface AuthContextValue extends AuthState {
  // Authentication actions
  login: (data: LoginData) => Promise<void>;
  logout: (logoutAllDevices?: boolean) => Promise<void>;
  refreshToken: () => Promise<void>;
  validateToken: () => Promise<boolean>;

  // User management
  getCurrentUser: () => Promise<void>;
  updateProfile: (data: Partial<AuthUser>) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;

  // Session management
  checkSession: () => void;
  extendSession: () => Promise<void>;
  clearError: () => void;

  // App-specific
  checkAppAccess: (app: AppName) => boolean;
  hasPermission: (permission: string) => boolean;

  // Token utilities
  getAccessToken: () => string | null;
  isTokenExpired: () => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Auth API client
class AuthApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || "http://localhost:8001";
  }

  async login(
    data: LoginData
  ): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        remember_me: data.rememberMe || false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Login failed");
    }

    const responseData = await response.json();

    // Map auth service response to expected format
    const user: AuthUser = {
      id: responseData.user.id,
      email: responseData.user.email,
      name:
        responseData.user.full_name ||
        `${responseData.user.first_name} ${responseData.user.last_name}`,
      role: responseData.user.role,
      companyId: responseData.user.company_id,
      permissions: [
        ...(responseData.user.permissions || []),
        ...(responseData.user.custom_permissions || []),
      ],
      isActive: responseData.user.is_active,
      canBeDeleted: responseData.user.can_be_deleted !== false,
      canChangePassword: responseData.user.can_change_password !== false,
      lastLogin: responseData.user.last_login,
      createdAt: responseData.user.created_at,
      updatedAt: responseData.user.updated_at,
    };

    const tokens: AuthTokens = {
      accessToken: responseData.access_token,
      refreshToken: responseData.refresh_token,
      tokenType: responseData.token_type,
      expiresIn: responseData.expires_in,
      expiresAt: new Date(
        Date.now() + responseData.expires_in * 1000
      ).toISOString(),
    };

    return { user, tokens };
  }

  async logout(
    accessToken: string,
    refreshToken: string,
    logoutAllDevices = false
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
        logout_all_devices: logoutAllDevices,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Logout failed");
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Token refresh failed");
    }

    const responseData = await response.json();

    return {
      accessToken: responseData.access_token,
      refreshToken: refreshToken, // Keep the same refresh token
      tokenType: responseData.token_type,
      expiresIn: responseData.expires_in,
      expiresAt: new Date(
        Date.now() + responseData.expires_in * 1000
      ).toISOString(),
    };
  }

  async validateToken(token: string): Promise<{
    valid: boolean;
    user?: AuthUser;
    permissions?: string[];
  }> {
    const response = await fetch(`${this.baseUrl}/auth/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { valid: false };
    }

    return response.json();
  }

  async getCurrentUser(token: string): Promise<AuthUser> {
    const response = await fetch(`${this.baseUrl}/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to get user info");
    }

    const responseData = await response.json();
    const userData = responseData.user || responseData;

    return {
      id: userData.id,
      email: userData.email,
      name:
        userData.full_name || `${userData.first_name} ${userData.last_name}`,
      role: userData.role,
      companyId: userData.company_id,
      permissions: [
        ...(userData.permissions || []),
        ...(userData.custom_permissions || []),
      ],
      isActive: userData.is_active,
      canBeDeleted: userData.can_be_deleted !== false,
      canChangePassword: userData.can_change_password !== false,
      lastLogin: userData.last_login,
      createdAt: userData.created_at,
      updatedAt: userData.updated_at,
    };
  }

  async changePassword(
    token: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/auth/password/change`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Password change failed");
    }
  }
}

const authApi = new AuthApiClient();

// Token storage utilities
const TOKEN_STORAGE_KEY = "auth_tokens";
const USER_STORAGE_KEY = "auth_user";

const getStoredTokens = (): AuthTokens | null => {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const setStoredTokens = (tokens: AuthTokens | null): void => {
  if (typeof window === "undefined") return;

  if (tokens) {
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
    // Also set as cookie for middleware access
    document.cookie = `auth_token=${tokens.accessToken}; path=/; max-age=${tokens.expiresIn}; SameSite=strict`;
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    // Clear cookie
    document.cookie = `auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=strict`;
  }
};

const getStoredUser = (): AuthUser | null => {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const setStoredUser = (user: AuthUser | null): void => {
  if (typeof window === "undefined") return;

  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
};

// App access configuration - support both uppercase and lowercase role formats
const APP_ACCESS_CONFIG = {
  [AppName.ADMIN]: ["super_admin", "SUPER_ADMIN", "admin", "ADMIN"],
  [AppName.CLIENT]: [
    "super_admin",
    "SUPER_ADMIN",
    "admin",
    "ADMIN",
    "company_admin",
    "COMPANY_ADMIN",
    "manager",
    "MANAGER",
    "employee",
    "EMPLOYEE",
    "viewer",
    "VIEWER",
    "client",
    "CLIENT",
  ],
  [AppName.SETUP]: [
    "super_admin",
    "SUPER_ADMIN",
    "admin",
    "ADMIN",
    "company_admin",
    "COMPANY_ADMIN",
  ],
  [AppName.STAFF_SUPPORT]: ["super_admin", "SUPER_ADMIN", "admin", "ADMIN"],
  [AppName.USER_SUPPORT]: [
    "super_admin",
    "SUPER_ADMIN",
    "admin",
    "ADMIN",
    "company_admin",
    "COMPANY_ADMIN",
  ],
};

// Provider Props
interface AuthProviderProps {
  children: ReactNode;
  app: AppName;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  app,
}) => {
  const [state, setState] = useState<AuthState>(() => {
    const tokens = getStoredTokens();
    const user = getStoredUser();

    return {
      user,
      tokens,
      isAuthenticated: !!(tokens && user),
      isLoading: false,
      error: null,
      app,
      hasAppAccess: false,
      sessionExpiresAt: tokens?.expiresAt || null,
    };
  });

  // Check if user has access to the current app
  const checkAppAccess = useCallback(
    (targetApp: AppName) => {
      if (!state.user) return false;

      const allowedRoles = APP_ACCESS_CONFIG[targetApp] || [];
      return allowedRoles.includes(state.user.role);
    },
    [state.user]
  );

  // Check if user has specific permission
  const hasPermission = useCallback(
    (permission: string) => {
      if (!state.user) return false;

      return (
        state.user.permissions.includes(permission) ||
        state.user.permissions.includes("*")
      );
    },
    [state.user]
  );

  // Check if token is expired
  const isTokenExpired = useCallback(() => {
    if (!state.tokens) return true;

    const now = new Date().getTime();
    const expiresAt = new Date(state.tokens.expiresAt).getTime();

    return now >= expiresAt;
  }, [state.tokens]);

  // Get access token
  const getAccessToken = useCallback(() => {
    return state.tokens?.accessToken || null;
  }, [state.tokens]);

  // Login function
  const login = useCallback(
    async (data: LoginData) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await authApi.login(data);

        // Store tokens and user
        setStoredTokens(response.tokens);
        setStoredUser(response.user);

        // Check app access with the actual user data (not state.user which is still null)
        const allowedRoles = APP_ACCESS_CONFIG[app] || [];
        const hasAccess = allowedRoles.includes(response.user.role);

        if (!hasAccess) {
          throw new Error(
            `Access denied. You don't have permission to access the ${app} application. Your role '${response.user.role}' is not allowed.`
          );
        }

        setState((prev) => ({
          ...prev,
          user: response.user,
          tokens: response.tokens,
          isAuthenticated: true,
          isLoading: false,
          hasAppAccess: hasAccess,
          sessionExpiresAt: response.tokens.expiresAt,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Login failed",
          isLoading: false,
        }));

        // Clear stored data on error
        setStoredTokens(null);
        setStoredUser(null);

        throw error;
      }
    },
    [app, checkAppAccess]
  );

  // Logout function
  const logout = useCallback(
    async (logoutAllDevices = false) => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        if (state.tokens?.accessToken && state.tokens?.refreshToken) {
          await authApi.logout(
            state.tokens.accessToken,
            state.tokens.refreshToken,
            logoutAllDevices
          );
        }
      } catch (error) {
        console.error("Logout API call failed:", error);
      } finally {
        // Clear local state and storage regardless of API success
        setStoredTokens(null);
        setStoredUser(null);

        setState({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          app,
          hasAppAccess: false,
          sessionExpiresAt: null,
        });
      }
    },
    [state.tokens, app]
  );

  // Refresh token function
  const refreshToken = useCallback(async () => {
    if (!state.tokens?.refreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      const newTokens = await authApi.refreshToken(state.tokens.refreshToken);

      setStoredTokens(newTokens);

      setState((prev) => ({
        ...prev,
        tokens: newTokens,
        sessionExpiresAt: newTokens.expiresAt,
      }));
    } catch (error) {
      // If refresh fails, logout user
      await logout();
      throw error;
    }
  }, [state.tokens, logout]);

  // Validate token function
  const validateToken = useCallback(async (): Promise<boolean> => {
    if (!state.tokens?.accessToken) return false;

    try {
      const result = await authApi.validateToken(state.tokens.accessToken);
      return result.valid;
    } catch {
      return false;
    }
  }, [state.tokens]);

  // Get current user info
  const getCurrentUser = useCallback(async () => {
    if (!state.tokens?.accessToken) return;

    try {
      const user = await authApi.getCurrentUser(state.tokens.accessToken);

      setStoredUser(user);

      setState((prev) => ({
        ...prev,
        user,
        hasAppAccess: checkAppAccess(app),
      }));
    } catch (error) {
      console.error("Failed to get current user:", error);
    }
  }, [state.tokens, app, checkAppAccess]);

  // Update profile function
  const updateProfile = useCallback(
    async (data: Partial<AuthUser>) => {
      // This would typically call an API endpoint to update profile
      // For now, just update local state
      if (state.user) {
        const updatedUser = { ...state.user, ...data };

        setStoredUser(updatedUser);

        setState((prev) => ({
          ...prev,
          user: updatedUser,
        }));
      }
    },
    [state.user]
  );

  // Change password function
  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!state.tokens?.accessToken) {
        throw new Error("Not authenticated");
      }

      await authApi.changePassword(
        state.tokens.accessToken,
        currentPassword,
        newPassword
      );
    },
    [state.tokens]
  );

  // Check session validity
  const checkSession = useCallback(() => {
    if (state.isAuthenticated && isTokenExpired()) {
      // Try to refresh token automatically
      refreshToken().catch(() => {
        // If refresh fails, logout user
        logout();
      });
    }
  }, [state.isAuthenticated, isTokenExpired, refreshToken, logout]);

  // Extend session
  const extendSession = useCallback(async () => {
    await refreshToken();
  }, [refreshToken]);

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Effect to check app access when user changes
  useEffect(() => {
    if (state.user) {
      const hasAccess = checkAppAccess(app);
      setState((prev) => ({ ...prev, hasAppAccess: hasAccess }));
    }
  }, [state.user, app, checkAppAccess]);

  // Effect to set up session monitoring
  useEffect(() => {
    if (state.isAuthenticated) {
      const interval = setInterval(checkSession, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [state.isAuthenticated, checkSession]);

  // Effect to initialize authentication state
  useEffect(() => {
    const initAuth = async () => {
      const tokens = getStoredTokens();
      const user = getStoredUser();

      if (tokens && user) {
        // Check if tokens are still valid
        if (isTokenExpired()) {
          // Try to refresh
          try {
            await refreshToken();
          } catch {
            // If refresh fails, clear stored data
            setStoredTokens(null);
            setStoredUser(null);
          }
        } else {
          // Validate existing token
          const isValid = await validateToken();
          if (!isValid) {
            setStoredTokens(null);
            setStoredUser(null);
            setState((prev) => ({
              ...prev,
              isAuthenticated: false,
              user: null,
              tokens: null,
            }));
          }
        }
      }
    };

    initAuth();
  }, []);

  const contextValue: AuthContextValue = {
    ...state,
    login,
    logout,
    refreshToken,
    validateToken,
    getCurrentUser,
    updateProfile,
    changePassword,
    checkSession,
    extendSession,
    clearError,
    checkAppAccess,
    hasPermission,
    getAccessToken,
    isTokenExpired,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// Hook to use authentication context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Export types for use in other components
export type { AuthContextValue };
