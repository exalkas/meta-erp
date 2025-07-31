/**
 * Authentication Guard Hook
 *
 * Provides authentication state management and route protection utilities
 * for React components. Works in conjunction with Next.js middleware for
 * comprehensive authentication flow.
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: string;
}

interface AuthUser {
  user_id: string;
  tenant_id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  status: string;
  compliance_level: string;
  // ... other user fields
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  tokens: AuthTokens | null;
  error: string | null;
}

interface AuthGuardResult extends AuthState {
  login: (tokens: AuthTokens, user: AuthUser) => void;
  logout: () => void;
  refreshAuth: () => Promise<boolean>;
  checkAuthStatus: () => boolean;
}

/**
 * Custom hook for authentication guard functionality
 *
 * @param redirectToLogin - Whether to redirect to login if not authenticated
 * @param requiredRoles - Array of roles required to access the component
 * @returns AuthGuardResult with auth state and utility functions
 */
export function useAuthGuard(
  redirectToLogin: boolean = true,
  requiredRoles: string[] = []
): AuthGuardResult {
  const router = useRouter();

  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    tokens: null,
    error: null,
  });

  // Check if tokens are expired
  const isTokenExpired = useCallback((tokens: AuthTokens): boolean => {
    if (!tokens.expiresAt) return true;

    const expiryTime = new Date(tokens.expiresAt).getTime();
    const currentTime = Date.now();
    const bufferTime = 60 * 1000; // 1 minute buffer

    return currentTime >= expiryTime - bufferTime;
  }, []);

  // Check current authentication status
  const checkAuthStatus = useCallback((): boolean => {
    try {
      if (typeof window === "undefined") return false;

      const storedTokens = localStorage.getItem("auth_tokens");
      const storedUser = localStorage.getItem("auth_user");

      if (!storedTokens || !storedUser) {
        console.log("🔍 No stored auth data found");
        return false;
      }

      const tokens: AuthTokens = JSON.parse(storedTokens);
      const user: AuthUser = JSON.parse(storedUser);

      // Check if tokens are expired
      if (isTokenExpired(tokens)) {
        console.log("🕒 Stored tokens are expired");
        localStorage.removeItem("auth_tokens");
        localStorage.removeItem("auth_user");
        return false;
      }

      // Check role requirements
      if (requiredRoles.length > 0) {
        const userRole = user.compliance_level || "basic";
        if (!requiredRoles.includes(userRole)) {
          console.log(
            `❌ User role '${userRole}' not in required roles:`,
            requiredRoles
          );
          setAuthState((prev) => ({
            ...prev,
            error: `Access denied. Required role: ${requiredRoles.join(" or ")}`,
          }));
          return false;
        }
      }

      // Update auth state with valid data
      setAuthState({
        isAuthenticated: true,
        isLoading: false,
        user,
        tokens,
        error: null,
      });

      console.log("✅ User authenticated:", user.email);
      return true;
    } catch (error) {
      console.error("❌ Error checking auth status:", error);
      localStorage.removeItem("auth_tokens");
      localStorage.removeItem("auth_user");
      return false;
    }
  }, [isTokenExpired, requiredRoles]);

  // Login function to store auth data
  const login = useCallback((tokens: AuthTokens, user: AuthUser) => {
    console.log("🔐 Storing authentication data for:", user.email);

    localStorage.setItem("auth_tokens", JSON.stringify(tokens));
    localStorage.setItem("auth_user", JSON.stringify(user));

    // Set HTTP-only cookie for middleware
    const isSecure = window.location.protocol === "https:";
    const cookieValue = `auth_token=${tokens.accessToken}; path=/; SameSite=lax${isSecure ? "; Secure" : ""}`;
    console.log("🍪 Setting auth cookie:", cookieValue);
    document.cookie = cookieValue;

    setAuthState({
      isAuthenticated: true,
      isLoading: false,
      user,
      tokens,
      error: null,
    });
  }, []);

  // Logout function to clear auth data
  const logout = useCallback(() => {
    console.log("🚪 Logging out user");

    // Clear localStorage
    localStorage.removeItem("auth_tokens");
    localStorage.removeItem("auth_user");

    // Clear cookie
    document.cookie =
      "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    // Reset auth state
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      tokens: null,
      error: null,
    });

    // Redirect to login
    if (redirectToLogin) {
      router.push("/login");
    }
  }, [router, redirectToLogin]);

  // Refresh authentication (attempt token refresh)
  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      const storedTokens = localStorage.getItem("auth_tokens");
      if (!storedTokens) return false;

      const tokens: AuthTokens = JSON.parse(storedTokens);

      // Import auth client dynamically to avoid SSR issues
      const { authApiClient } = await import("../services/authApiClient");

      console.log("🔄 Attempting to refresh authentication");

      // Try to refresh the token
      const refreshResult = await authApiClient.refreshToken(
        tokens.refreshToken
      );

      // If we get here without an error, the refresh was successful
      if (refreshResult.access_token) {
        console.log("✅ Token refresh successful");

        // Update stored tokens
        const newTokens = {
          accessToken: refreshResult.access_token,
          refreshToken: refreshResult.refresh_token || tokens.refreshToken,
          expiresIn: refreshResult.expires_in,
          expiresAt: new Date(
            Date.now() + refreshResult.expires_in * 1000
          ).toISOString(),
        };

        localStorage.setItem("auth_tokens", JSON.stringify(newTokens));

        // Update cookie
        const isSecure = window.location.protocol === "https:";
        const cookieValue = `auth_token=${newTokens.accessToken}; path=/; SameSite=lax${isSecure ? "; Secure" : ""}`;
        console.log("🍪 Updating auth cookie:", cookieValue);
        document.cookie = cookieValue;

        setAuthState((prev) => ({
          ...prev,
          tokens: newTokens,
          isAuthenticated: true,
          error: null,
        }));

        return true;
      } else {
        console.log("❌ Token refresh failed");
        logout();
        return false;
      }
    } catch (error) {
      console.error("❌ Error during token refresh:", error);
      logout();
      return false;
    }
  }, [logout]);

  // Initialize auth state on mount
  useEffect(() => {
    console.log("🔍 Initializing auth guard...");

    const isAuthenticated = checkAuthStatus();

    if (!isAuthenticated) {
      setAuthState((prev) => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
      }));

      // Redirect to login if required and not authenticated
      if (redirectToLogin && typeof window !== "undefined") {
        const currentPath = window.location.pathname;

        // Don't redirect if already on login page
        if (currentPath !== "/login") {
          console.log("🚪 Redirecting to login page");
          router.push(`/login?redirectTo=${encodeURIComponent(currentPath)}`);
        }
      }
    }
  }, [checkAuthStatus, redirectToLogin, router]);

  // Set up token refresh interval
  useEffect(() => {
    if (!authState.isAuthenticated || !authState.tokens) return;

    const refreshInterval = setInterval(() => {
      if (isTokenExpired(authState.tokens!)) {
        console.log("🔄 Token expired, attempting refresh...");
        refreshAuth();
      }
    }, 60000); // Check every minute

    return () => clearInterval(refreshInterval);
  }, [
    authState.isAuthenticated,
    authState.tokens,
    isTokenExpired,
    refreshAuth,
  ]);

  return {
    ...authState,
    login,
    logout,
    refreshAuth,
    checkAuthStatus,
  };
}
