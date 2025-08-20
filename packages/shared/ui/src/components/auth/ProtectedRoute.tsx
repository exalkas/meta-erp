/**
 * Protected Route Component
 *
 * A higher-order component that wraps other components to provide
 * authentication protection. Works with useAuthGuard hook and
 * Next.js middleware for comprehensive route protection.
 */

import React from "react";
import { useAuthGuard } from "../../hooks/useAuthGuard";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[]; // Permission-based access control
  fallback?: React.ReactNode;
  redirectToLogin?: boolean;
  showLoadingSpinner?: boolean;
}

/**
 * LoadingSpinner component for auth loading states
 */
const LoadingSpinner: React.FC<{ message?: string }> = ({
  message = "Verifying authentication...",
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  </div>
);

/**
 * AccessDenied component for role-based access failures
 */
const AccessDenied: React.FC<{
  error: string;
  onRetry?: () => void;
  onLogin?: () => void;
}> = ({ error, onRetry, onLogin }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center max-w-md mx-auto p-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-red-800 mb-2">
          🚫 Access Denied
        </h2>
        <p className="text-red-700 mb-4">{error}</p>
        <div className="flex space-x-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          )}
          {onLogin && (
            <button
              onClick={onLogin}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
);

/**
 * ProtectedRoute Component
 *
 * Wraps child components with authentication protection. Handles:
 * - Authentication verification
 * - Role-based access control
 * - Loading states
 * - Error states
 * - Automatic login redirects
 *
 * @param children - The protected content to render
 * @param requiredPermissions - Array of permissions required to access this route
 * @param fallback - Custom component to show while loading or if access denied
 * @param redirectToLogin - Whether to redirect to login if not authenticated
 * @param showLoadingSpinner - Whether to show loading spinner during auth check
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermissions = [],
  fallback,
  redirectToLogin = true,
  showLoadingSpinner = true,
}) => {
  const { isAuthenticated, isLoading, user, error, checkAuthStatus, logout } =
    useAuthGuard(redirectToLogin, requiredPermissions);

  // Show loading state during authentication check
  if (isLoading) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showLoadingSpinner) {
      return <LoadingSpinner message="Verifying your access..." />;
    }

    return null;
  }

  // Show error state if there's an access error
  if (error) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <AccessDenied
        error={error}
        onRetry={checkAuthStatus}
        onLogin={() => logout()} // This will redirect to login
      />
    );
  }

  // Show access denied if not authenticated and not redirecting
  if (!isAuthenticated && !redirectToLogin) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <AccessDenied
        error="You must be logged in to access this content."
        onLogin={() => (window.location.href = "/login")}
      />
    );
  }

  // If authenticated, render the protected content
  if (isAuthenticated && user) {
    console.log(`✅ ProtectedRoute: Access granted to ${user.email}`);
    return <>{children}</>;
  }

  // Fallback to loading spinner if we get here
  return showLoadingSpinner ? <LoadingSpinner /> : null;
};

/**
 * Higher-order component version of ProtectedRoute
 *
 * @param Component - The component to protect
 * @param options - Protection options
 * @returns Protected component
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, "children"> = {}
) {
  const ProtectedComponent = (props: P) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );

  ProtectedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;

  return ProtectedComponent;
}

/**
 * Role-based access control component
 *
 * @param children - Content to show if user has required role
 * @param requiredRoles - Array of roles that grant access
 * @param fallback - Content to show if access denied
 * @param user - User object (optional, will use auth context if not provided)
 */
export const RoleGuard: React.FC<{
  children: React.ReactNode;
  requiredRoles: string[];
  fallback?: React.ReactNode;
  user?: { compliance_level?: string };
}> = ({ children, requiredRoles, fallback = null, user: propUser }) => {
  const { user: contextUser } = useAuthGuard(false); // Don't redirect for role checks
  const user = propUser || contextUser;

  if (!user) {
    return <>{fallback}</>;
  }

  const userRole = user.compliance_level || "basic";
  const hasRequiredRole = requiredRoles.includes(userRole);

  if (!hasRequiredRole) {
    console.log(
      `🚫 RoleGuard: User role '${userRole}' not in required roles:`,
      requiredRoles
    );
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
