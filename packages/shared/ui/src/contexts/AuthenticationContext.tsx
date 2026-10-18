/**
 * Authentication Context for Multi-App Axiologic System
 * Handles JWT authentication, token management, and user session
 * Used by all 6 apps: admin, client, setup, staff-support, user-support, marketing
 *
 * UPDATED: Now connects to real FastAPI auth service at localhost:8001
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
import { authApiClient, LoginResponse } from "../services/authApiClient";

// Authentication types - Updated to match auth service response
export interface AuthUser {
  user_id: string;
  tenant_id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  status: string;
  is_verified: boolean;
  phone?: string;
  phone_verified: boolean;
  avatar_url?: string;
  timezone?: string;
  locale?: string;
  two_factor_enabled: boolean;
  passkey_enabled: boolean;
  compliance_level: string;
  last_login?: string;
  created_at: string;

  // Legacy compatibility fields
  id: string; // maps to user_id
  name: string; // maps to display_name
  role: string; // maps to compliance_level
  companyId: string; // maps to tenant_id
  permissions: string[]; // TODO: implement from roles
  isActive: boolean; // maps to status === 'active'
  canBeDeleted: boolean;
  canChangePassword: boolean;
  lastLogin?: string; // maps to last_login
  createdAt: string; // maps to created_at
  updatedAt: string; // TODO: implement
}

export interface AuthTokens {
  accessToken: string; // maps to access_token
  refreshToken: string; // maps to refresh_token
  tokenType: string; // always 'bearer'
  expiresIn: number; // maps to expires_in
  expiresAt: string; // calculated from expires_in
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

// Helper functions to map auth service response to legacy format
function mapAuthUserFromResponse(authResponse: LoginResponse): AuthUser {
  const user = authResponse.user;

  return {
    // Auth service fields
    user_id: user.user_id,
    tenant_id: user.tenant_id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    display_name: user.display_name,
    status: user.status,
    is_verified: user.is_verified,
    phone: user.phone,
    phone_verified: user.phone_verified,
    avatar_url: user.avatar_url,
    timezone: user.timezone,
    locale: user.locale,
    two_factor_enabled: user.two_factor_enabled,
    passkey_enabled: user.passkey_enabled,
    compliance_level: user.compliance_level,
    last_login: user.last_login,
    created_at: user.created_at,

    // Legacy compatibility fields
    id: user.user_id,
    name: user.display_name,
    role: user.compliance_level,
    companyId: user.tenant_id,
    permissions: [], // TODO: implement from roles/permissions
    isActive: user.status === "active",
    canBeDeleted: true, // TODO: implement from permissions
    canChangePassword: true, // TODO: implement from permissions
    lastLogin: user.last_login,
    createdAt: user.created_at,
    updatedAt: user.created_at, // TODO: implement updated_at field
  };
}

function mapAuthTokensFromResponse(authResponse: LoginResponse): AuthTokens {
  return {
    accessToken: authResponse.access_token,
    refreshToken: authResponse.refresh_token,
    tokenType: "bearer",
    expiresIn: authResponse.expires_in,
    expiresAt: new Date(
      Date.now() + authResponse.expires_in * 1000
    ).toISOString(),
  };
}

// Auth API client wrapper - now uses the dedicated authApiClient
class AuthContextApiClient {
  async login(
    data: LoginData
  ): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    try {
      console.log("🔐 AuthContext: Starting login process with auth service");

      const authResponse = await authApiClient.loginWithPassword(
        data.email,
        data.password,
        undefined, // Use default tenant_id
        "Web Browser" // Default device name
      );

      console.log("✅ AuthContext: Login successful, mapping response");

      const user = mapAuthUserFromResponse(authResponse);
      const tokens = mapAuthTokensFromResponse(authResponse);

      console.log("📥 AuthContext: Mapped user and tokens", {
        user_id: user.id,
        email: user.email,
        expires_in: tokens.expiresIn,
      });

      return { user, tokens };
    } catch (error) {
      console.error("❌ AuthContext: Login failed:", error);
      throw error;
    }
  }

  async logout(
    accessToken: string,
    refreshToken: string,
    logoutAllDevices = false
  ): Promise<void> {
    try {
      console.log("🚪 AuthContext: Starting logout process");
      await authApiClient.logout(accessToken);
      console.log("✅ AuthContext: Logout successful");
    } catch (error) {
      console.warn("⚠️ AuthContext: Logout failed, but continuing:", error);
      // Don't throw on logout failure - allow user to be logged out locally
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      console.log("🔄 AuthContext: Refreshing token");
      const authResponse = await authApiClient.refreshToken(refreshToken);
      const tokens = mapAuthTokensFromResponse(authResponse);
      console.log("✅ AuthContext: Token refresh successful");
      return tokens;
    } catch (error) {
      console.error("❌ AuthContext: Token refresh failed:", error);
      throw error;
    }
  }

  async validateToken(token: string): Promise<{
    valid: boolean;
    user?: AuthUser;
    permissions?: string[];
  }> {
    try {
      console.log("🔍 AuthContext: Validating token");
      const isValid = await authApiClient.validateSession(token);
      console.log("✅ AuthContext: Token validation result:", isValid);
      return { valid: isValid };
    } catch (error) {
      console.error("❌ AuthContext: Token validation failed:", error);
      return { valid: false };
    }
  }

  async getCurrentUser(token: string): Promise<AuthUser> {
    try {
      console.log("👤 AuthContext: Getting current user");
      const userData = await authApiClient.getCurrentUser(token);
      console.log("✅ AuthContext: User data retrieved");

      // Map the response to our AuthUser format
      const mappedUser: AuthUser = {
        // Auth service fields
        user_id: userData.user_id,
        tenant_id: userData.tenant_id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        display_name: userData.display_name,
        status: userData.status,
        is_verified: userData.is_verified,
        phone: userData.phone,
        phone_verified: userData.phone_verified,
        avatar_url: userData.avatar_url,
        timezone: userData.timezone,
        locale: userData.locale,
        two_factor_enabled: userData.two_factor_enabled,
        passkey_enabled: userData.passkey_enabled,
        compliance_level: userData.compliance_level,
        last_login: userData.last_login,
        created_at: userData.created_at,

        // Legacy compatibility fields
        id: userData.user_id,
        name: userData.display_name,
        role: userData.compliance_level,
        companyId: userData.tenant_id,
        permissions: [], // TODO: implement from roles/permissions
        isActive: userData.status === "active",
        canBeDeleted: true, // TODO: implement from permissions
        canChangePassword: true, // TODO: implement from permissions
        lastLogin: userData.last_login,
        createdAt: userData.created_at,
        updatedAt: userData.created_at, // TODO: implement updated_at field
      };

      return mappedUser;
    } catch (error) {
      console.error("❌ AuthContext: Get current user failed:", error);
      throw error;
    }
  }

  async changePassword(
    token: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // TODO: Implement password change in auth service
    console.warn(
      "⚠️ AuthContext: Password change not yet implemented in auth service"
    );
    throw new Error("Password change not yet implemented");
  }
}

const authApi = new AuthContextApiClient();

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
      isLoading: !!(tokens && user), // Start loading if we have stored auth data
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
            // Loading state will be updated by refreshToken function
          } catch {
            // If refresh fails, clear stored data
            setStoredTokens(null);
            setStoredUser(null);
            setState((prev) => ({
              ...prev,
              isAuthenticated: false,
              user: null,
              tokens: null,
              isLoading: false,
            }));
          }
        } else {
          // TEMPORARILY SKIP VALIDATION - auth service validation is placeholder
          // TODO: Implement proper token validation in auth service
          console.log(
            "🔄 AuthContext: Skipping token validation (placeholder endpoint)"
          );

          // Token is valid, finish loading
          setState((prev) => ({
            ...prev,
            isLoading: false,
          }));
        }
      } else {
        // No stored auth data, finish loading
        setState((prev) => ({
          ...prev,
          isLoading: false,
        }));
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
