import { useState, useEffect, useCallback, useMemo } from "react";

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action:
    | "create"
    | "read"
    | "update"
    | "delete"
    | "execute"
    | "approve"
    | "admin";
  scope?: "own" | "company" | "department" | "all";
  conditions?: Record<string, any>;

  // Greek ERP specific
  complianceLevel?: "basic" | "enhanced" | "strict";
  personalDataAccess?: boolean;
  financialDataAccess?: boolean;
  auditRequired?: boolean;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];

  // Greek ERP specific
  complianceLevel: "basic" | "enhanced" | "strict";
  requiresApproval?: boolean;
  maxDataRetention?: number; // days
  auditLog?: boolean;
}

export interface User {
  id: string;
  roles: Role[];
  department?: string;
  company: string;

  // Greek ERP specific
  complianceStatus: "compliant" | "pending" | "violation";
  lastComplianceCheck?: Date;
  personalDataAccess?: boolean;
  financialDataAccess?: boolean;
}

export interface PermissionCheck {
  resource: string;
  action: string;
  scope?: string;
  targetUserId?: string;
  targetCompanyId?: string;
  data?: any;
}

export interface PermissionResult {
  allowed: boolean;
  reason?: string;
  conditions?: Record<string, any>;

  // Greek ERP specific
  auditRequired?: boolean;
  complianceLevel?: "basic" | "enhanced" | "strict";
  personalDataWarning?: boolean;
  approvalRequired?: boolean;
}

export interface PermissionsState {
  user: User | null;
  permissions: Permission[];
  roles: Role[];
  loading: boolean;
  error: string | null;

  // Greek ERP specific
  complianceStatus: "compliant" | "pending" | "violation";
  lastAuditCheck?: Date;
  auditTrail: Array<{
    timestamp: Date;
    action: string;
    resource: string;
    userId: string;
    result: boolean;
    reason?: string;
  }>;
}

export interface PermissionsActions {
  checkPermission: (check: PermissionCheck) => PermissionResult;
  hasPermission: (resource: string, action: string, scope?: string) => boolean;
  hasRole: (roleId: string) => boolean;
  hasAnyRole: (roleIds: string[]) => boolean;
  requirePermission: (resource: string, action: string, scope?: string) => void;

  // Greek ERP specific
  checkCompliancePermission: (check: PermissionCheck) => PermissionResult;
  auditPermissionCheck: (
    check: PermissionCheck,
    result: PermissionResult
  ) => void;
  checkPersonalDataAccess: (targetUserId?: string) => boolean;
  checkFinancialDataAccess: (targetCompanyId?: string) => boolean;

  // Admin actions
  refreshPermissions: () => Promise<void>;
  updateUserRole: (roleId: string, add: boolean) => Promise<void>;
}

export const usePermissions = (
  userId: string,
  companyId: string
): PermissionsState & PermissionsActions => {
  const [state, setState] = useState<PermissionsState>({
    user: null,
    permissions: [],
    roles: [],
    loading: true,
    error: null,
    complianceStatus: "pending",
    auditTrail: [],
  });

  // Load user permissions and roles
  const loadPermissions = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // In a real app, this would make API calls
      // For now, we'll simulate with mock data
      const mockUser: User = {
        id: userId,
        roles: [
          {
            id: "user",
            name: "User",
            description: "Basic user permissions",
            permissions: [
              {
                id: "read_own_data",
                name: "Read Own Data",
                resource: "user_data",
                action: "read",
                scope: "own",
                complianceLevel: "basic",
                personalDataAccess: true,
                auditRequired: true,
              },
              {
                id: "create_invoice",
                name: "Create Invoice",
                resource: "invoice",
                action: "create",
                scope: "company",
                complianceLevel: "enhanced",
                financialDataAccess: true,
                auditRequired: true,
              },
            ],
            complianceLevel: "basic",
            auditLog: true,
          },
        ],
        department: "sales",
        company: companyId,
        complianceStatus: "compliant",
        lastComplianceCheck: new Date(),
        personalDataAccess: true,
        financialDataAccess: false,
      };

      const allPermissions = mockUser.roles.flatMap((role) => role.permissions);

      setState((prev) => ({
        ...prev,
        user: mockUser,
        permissions: allPermissions,
        roles: mockUser.roles,
        loading: false,
        complianceStatus: mockUser.complianceStatus,
        lastAuditCheck: new Date(),
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          error instanceof Error ? error.message : "Failed to load permissions",
      }));
    }
  }, [userId, companyId]);

  // Check specific permission
  const checkPermission = useCallback(
    (check: PermissionCheck): PermissionResult => {
      if (!state.user) {
        return { allowed: false, reason: "User not authenticated" };
      }

      // Find matching permissions
      const matchingPermissions = state.permissions.filter((permission) => {
        const resourceMatch =
          permission.resource === check.resource || permission.resource === "*";
        const actionMatch =
          permission.action === check.action || permission.action === "admin";

        return resourceMatch && actionMatch;
      });

      if (matchingPermissions.length === 0) {
        return { allowed: false, reason: "No matching permissions found" };
      }

      // Check scope
      for (const permission of matchingPermissions) {
        const scopeResult = checkScope(permission, check);
        if (scopeResult.allowed) {
          // Greek ERP specific checks
          const complianceResult = checkComplianceRequirements(
            permission,
            check
          );
          if (!complianceResult.allowed) {
            return complianceResult;
          }

          return {
            allowed: true,
            conditions: permission.conditions,
            auditRequired: permission.auditRequired,
            complianceLevel: permission.complianceLevel,
            personalDataWarning:
              permission.personalDataAccess && check.data?.containsPersonalData,
            approvalRequired: state.roles.some(
              (role) =>
                role.requiresApproval && role.permissions.includes(permission)
            ),
          };
        }
      }

      return { allowed: false, reason: "Insufficient scope permissions" };
    },
    [state.user, state.permissions, state.roles]
  );

  // Check scope permissions
  const checkScope = (
    permission: Permission,
    check: PermissionCheck
  ): PermissionResult => {
    if (!permission.scope || permission.scope === "all") {
      return { allowed: true };
    }

    switch (permission.scope) {
      case "own":
        if (check.targetUserId && check.targetUserId !== state.user?.id) {
          return { allowed: false, reason: "Can only access own data" };
        }
        return { allowed: true };

      case "company":
        if (
          check.targetCompanyId &&
          check.targetCompanyId !== state.user?.company
        ) {
          return { allowed: false, reason: "Can only access company data" };
        }
        return { allowed: true };

      case "department":
        // Additional department check would be implemented here
        return { allowed: true };

      default:
        return { allowed: false, reason: "Unknown scope" };
    }
  };

  // Check Greek ERP compliance requirements
  const checkComplianceRequirements = (
    permission: Permission,
    check: PermissionCheck
  ): PermissionResult => {
    if (!state.user) {
      return { allowed: false, reason: "User not authenticated" };
    }

    // Check compliance status
    if (state.user.complianceStatus === "violation") {
      return {
        allowed: false,
        reason: "User has compliance violations",
        complianceLevel: "strict",
      };
    }

    // Check personal data access
    if (permission.personalDataAccess && !state.user.personalDataAccess) {
      return {
        allowed: false,
        reason: "Personal data access not granted",
        personalDataWarning: true,
      };
    }

    // Check financial data access
    if (permission.financialDataAccess && !state.user.financialDataAccess) {
      return {
        allowed: false,
        reason: "Financial data access not granted",
        complianceLevel: "strict",
      };
    }

    return { allowed: true };
  };

  // Simple permission check
  const hasPermission = useCallback(
    (resource: string, action: string, scope?: string): boolean => {
      const result = checkPermission({ resource, action, scope });
      return result.allowed;
    },
    [checkPermission]
  );

  // Check if user has specific role
  const hasRole = useCallback(
    (roleId: string): boolean => {
      return state.roles.some((role) => role.id === roleId);
    },
    [state.roles]
  );

  // Check if user has any of the specified roles
  const hasAnyRole = useCallback(
    (roleIds: string[]): boolean => {
      return roleIds.some((roleId) => hasRole(roleId));
    },
    [hasRole]
  );

  // Require permission (throws error if not allowed)
  const requirePermission = useCallback(
    (resource: string, action: string, scope?: string): void => {
      const result = checkPermission({ resource, action, scope });
      if (!result.allowed) {
        throw new Error(`Permission denied: ${result.reason}`);
      }
    },
    [checkPermission]
  );

  // Greek ERP specific compliance check
  const checkCompliancePermission = useCallback(
    (check: PermissionCheck): PermissionResult => {
      const basicResult = checkPermission(check);
      if (!basicResult.allowed) {
        return basicResult;
      }

      // Additional Greek compliance checks
      const now = new Date();
      const lastCheck = state.user?.lastComplianceCheck;

      if (
        lastCheck &&
        now.getTime() - lastCheck.getTime() > 24 * 60 * 60 * 1000
      ) {
        return {
          allowed: false,
          reason: "Compliance check expired (24 hours)",
          complianceLevel: "strict",
        };
      }

      return basicResult;
    },
    [checkPermission, state.user]
  );

  // Audit permission check
  const auditPermissionCheck = useCallback(
    (check: PermissionCheck, result: PermissionResult): void => {
      if (!state.user) return;

      const auditEntry = {
        timestamp: new Date(),
        action: check.action,
        resource: check.resource,
        userId: state.user.id,
        result: result.allowed,
        reason: result.reason,
      };

      setState((prev) => ({
        ...prev,
        auditTrail: [...prev.auditTrail, auditEntry],
      }));

      // Log to console for Greek compliance
      console.log("[Permission Audit]", {
        companyId,
        userId: state.user.id,
        timestamp: auditEntry.timestamp.toISOString(),
        check,
        result,
      });
    },
    [state.user, companyId]
  );

  // Check personal data access
  const checkPersonalDataAccess = useCallback(
    (targetUserId?: string): boolean => {
      if (!state.user?.personalDataAccess) return false;

      // Can always access own data
      if (!targetUserId || targetUserId === state.user.id) return true;

      // Check if has permission to access other users' data
      return hasPermission("user_data", "read", "all");
    },
    [state.user, hasPermission]
  );

  // Check financial data access
  const checkFinancialDataAccess = useCallback(
    (targetCompanyId?: string): boolean => {
      if (!state.user?.financialDataAccess) return false;

      // Can access own company data
      if (!targetCompanyId || targetCompanyId === state.user.company)
        return true;

      // Check if has permission to access other companies' data
      return hasPermission("financial_data", "read", "all");
    },
    [state.user, hasPermission]
  );

  // Refresh permissions
  const refreshPermissions = useCallback(async (): Promise<void> => {
    await loadPermissions();
  }, [loadPermissions]);

  // Update user role
  const updateUserRole = useCallback(
    async (roleId: string, add: boolean): Promise<void> => {
      // This would make an API call in a real app
      console.log(
        `${add ? "Adding" : "Removing"} role ${roleId} for user ${userId}`
      );

      // Refresh permissions after role change
      await refreshPermissions();
    },
    [userId, refreshPermissions]
  );

  // Load permissions on mount
  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  // Periodic compliance check
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.user && state.user.complianceStatus === "compliant") {
        // Perform periodic compliance checks
        console.log("[Compliance Check] Periodic check for user:", userId);
      }
    }, 60 * 60 * 1000); // Every hour

    return () => clearInterval(interval);
  }, [state.user, userId]);

  return {
    ...state,
    checkPermission,
    hasPermission,
    hasRole,
    hasAnyRole,
    requirePermission,
    checkCompliancePermission,
    auditPermissionCheck,
    checkPersonalDataAccess,
    checkFinancialDataAccess,
    refreshPermissions,
    updateUserRole,
  };
};

// Helper hooks for common permission patterns
export const useAdminPermissions = (userId: string, companyId: string) => {
  const permissions = usePermissions(userId, companyId);

  const isAdmin = useMemo(() => {
    return permissions.hasRole("admin") || permissions.hasRole("super_admin");
  }, [permissions]);

  const canManageUsers = useMemo(() => {
    return permissions.hasPermission("users", "admin");
  }, [permissions]);

  const canManageCompany = useMemo(() => {
    return permissions.hasPermission("company", "admin");
  }, [permissions]);

  return {
    ...permissions,
    isAdmin,
    canManageUsers,
    canManageCompany,
  };
};

export const useGreekCompliancePermissions = (
  userId: string,
  companyId: string
) => {
  const permissions = usePermissions(userId, companyId);

  const canAccessPersonalData = useMemo(() => {
    return (
      permissions.user?.personalDataAccess &&
      permissions.user?.complianceStatus === "compliant"
    );
  }, [permissions.user]);

  const canAccessFinancialData = useMemo(() => {
    return (
      permissions.user?.financialDataAccess &&
      permissions.user?.complianceStatus === "compliant"
    );
  }, [permissions.user]);

  return {
    ...permissions,
    canAccessPersonalData,
    canAccessFinancialData,
  };
};
