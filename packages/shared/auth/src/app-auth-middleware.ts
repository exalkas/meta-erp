/**
 * App-Specific Authentication Middleware
 * Handles authentication and authorization for each of the 5 apps
 */

import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// App definitions
export enum AppName {
  ADMIN = "admin",
  CLIENT = "client",
  SETUP = "setup",
  STAFF_SUPPORT = "staff-support",
  USER_SUPPORT = "user-support",
}

export enum UserRole {
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
  COMPANY_ADMIN = "company_admin",
  MANAGER = "manager",
  EMPLOYEE = "employee",
  VIEWER = "viewer",
  CLIENT = "client",
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  company_id: string;
  is_super_user: boolean;
  is_active: boolean;
  permissions: string[];
  can_be_deleted: boolean;
  can_change_password: boolean;
}

export interface AuthContext {
  user: User;
  app: AppName;
  permissions: string[];
  hasAccess: boolean;
}

// App access configuration
const APP_ACCESS_CONFIG = {
  [AppName.ADMIN]: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  [AppName.CLIENT]: [
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.COMPANY_ADMIN,
    UserRole.MANAGER,
    UserRole.EMPLOYEE,
    UserRole.VIEWER,
    UserRole.CLIENT,
  ],
  [AppName.SETUP]: [
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.COMPANY_ADMIN,
  ],
  [AppName.STAFF_SUPPORT]: [UserRole.SUPER_ADMIN, UserRole.ADMIN],
  [AppName.USER_SUPPORT]: [
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.COMPANY_ADMIN,
  ],
};

// App-specific permissions
const APP_PERMISSIONS = {
  [AppName.ADMIN]: {
    [UserRole.SUPER_ADMIN]: ["*"], // All permissions
    [UserRole.ADMIN]: ["*"], // All permissions for admin role
  },
  [AppName.CLIENT]: {
    [UserRole.SUPER_ADMIN]: ["*"],
    [UserRole.ADMIN]: ["*"], // All permissions for admin role
    [UserRole.COMPANY_ADMIN]: [
      "company:*",
      "users:*",
      "settings:*",
      "reports:*",
    ],
    [UserRole.MANAGER]: [
      "users:read",
      "customers:*",
      "products:*",
      "invoices:*",
      "reports:*",
    ],
    [UserRole.EMPLOYEE]: [
      "customers:read",
      "customers:write",
      "products:read",
      "invoices:read",
      "invoices:write",
    ],
    [UserRole.VIEWER]: [
      "customers:read",
      "products:read",
      "invoices:read",
      "reports:read",
    ],
    [UserRole.CLIENT]: ["invoices:read", "profile:read", "profile:write"],
  },
  [AppName.SETUP]: {
    [UserRole.SUPER_ADMIN]: ["*"],
    [UserRole.ADMIN]: ["*"], // All permissions for admin role
    [UserRole.COMPANY_ADMIN]: [
      "company:setup",
      "modules:configure",
      "integrations:setup",
    ],
  },
  [AppName.STAFF_SUPPORT]: {
    [UserRole.SUPER_ADMIN]: ["*"],
    [UserRole.ADMIN]: ["*"], // All permissions for admin role
  },
  [AppName.USER_SUPPORT]: {
    [UserRole.SUPER_ADMIN]: ["*"],
    [UserRole.ADMIN]: ["*"], // All permissions for admin role
    [UserRole.COMPANY_ADMIN]: [
      "tickets:read",
      "tickets:create",
      "company:support",
    ],
  },
};

class AppAuthMiddleware {
  private jwtSecret: Uint8Array;

  constructor() {
    // Require JWT_SECRET_KEY from environment - no fallbacks
    const secret = process.env.JWT_SECRET_KEY;
    if (!secret) {
      throw new Error("JWT_SECRET_KEY must be set in environment variables");
    }
    this.jwtSecret = new TextEncoder().encode(secret);
  }

  /**
   * Middleware for Next.js apps
   */
  async middleware(request: NextRequest, app: AppName): Promise<NextResponse> {
    try {
      // Get token from Authorization header
      const authHeader = request.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return this.createUnauthorizedResponse(
          "Missing or invalid authorization header"
        );
      }

      const token = authHeader.replace("Bearer ", "");
      const authContext = await this.validateToken(token, app);

      if (!authContext.hasAccess) {
        return this.createForbiddenResponse(
          "Insufficient permissions for this application"
        );
      }

      // Add auth context to request headers for downstream use
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-user-id", authContext.user.id);
      requestHeaders.set("x-user-role", authContext.user.role);
      requestHeaders.set("x-company-id", authContext.user.company_id);
      requestHeaders.set("x-app-name", app);
      requestHeaders.set(
        "x-user-permissions",
        JSON.stringify(authContext.permissions)
      );

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      console.error("Authentication error:", error);
      return this.createUnauthorizedResponse("Authentication failed");
    }
  }

  /**
   * Validate JWT token and check app access
   */
  async validateToken(token: string, app: AppName): Promise<AuthContext> {
    try {
      // Verify JWT token
      const { payload } = await jwtVerify(token, this.jwtSecret);

      // Extract user information from token
      const user: User = {
        id: payload.user_id as string,
        username: payload.username as string,
        email: payload.email as string,
        role: payload.role as UserRole,
        company_id: payload.company_id as string,
        is_super_user: (payload.is_super_user as boolean) || false,
        is_active: payload.is_active as boolean,
        permissions: (payload.permissions as string[]) || [],
        can_be_deleted: (payload.can_be_deleted as boolean) || true,
        can_change_password: (payload.can_change_password as boolean) || true,
      };

      // Check if user has access to the app
      const hasAccess = this.checkAppAccess(user, app);

      // Get app-specific permissions
      const permissions = this.getAppPermissions(user, app);

      return {
        user,
        app,
        permissions,
        hasAccess,
      };
    } catch (error) {
      throw new Error("Invalid or expired token");
    }
  }

  /**
   * Check if user has access to specific app
   */
  checkAppAccess(user: User, app: AppName): boolean {
    const allowedRoles = APP_ACCESS_CONFIG[app] || [];
    return allowedRoles.includes(user.role);
  }

  /**
   * Get app-specific permissions for user
   */
  getAppPermissions(user: User, app: AppName): string[] {
    const appPermissions = APP_PERMISSIONS[app] || {};
    return appPermissions[user.role as keyof typeof appPermissions] || [];
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(user: User, app: AppName, permission: string): boolean {
    const permissions = this.getAppPermissions(user, app);

    // Super admin or wildcard permissions
    if (permissions.includes("*")) {
      return true;
    }

    // Check specific permission
    return permissions.includes(permission);
  }

  /**
   * Create unauthorized response
   */
  private createUnauthorizedResponse(message: string): NextResponse {
    return NextResponse.json({ error: message }, { status: 401 });
  }

  /**
   * Create forbidden response
   */
  private createForbiddenResponse(message: string): NextResponse {
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

// Create singleton instance
export const appAuthMiddleware = new AppAuthMiddleware();

// Middleware factory functions for each app
export const createAdminMiddleware = () => (request: NextRequest) =>
  appAuthMiddleware.middleware(request, AppName.ADMIN);

export const createClientMiddleware = () => (request: NextRequest) =>
  appAuthMiddleware.middleware(request, AppName.CLIENT);

export const createSetupMiddleware = () => (request: NextRequest) =>
  appAuthMiddleware.middleware(request, AppName.SETUP);

export const createStaffSupportMiddleware = () => (request: NextRequest) =>
  appAuthMiddleware.middleware(request, AppName.STAFF_SUPPORT);

export const createUserSupportMiddleware = () => (request: NextRequest) =>
  appAuthMiddleware.middleware(request, AppName.USER_SUPPORT);

// React hooks for frontend use
export const useAuth = (app: AppName) => {
  // This would be implemented with React context
  // For now, returning a placeholder
  return {
    user: null,
    permissions: [],
    hasAccess: false,
    hasPermission: (permission: string) => false,
    login: async (credentials: any) => {},
    logout: async () => {},
  };
};

// Permission checking utility
export const checkPermission = (
  user: User,
  app: AppName,
  permission: string
): boolean => {
  return appAuthMiddleware.hasPermission(user, app, permission);
};

// App access utility
export const checkAppAccess = (user: User, app: AppName): boolean => {
  return appAuthMiddleware.checkAppAccess(user, app);
};

export default appAuthMiddleware;
