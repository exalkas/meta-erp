/**
 * useRoleTemplates - Hook for managing role template data
 * Integrates with our 100% functional Role Management API
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RoleTemplate } from "../components/roles/RoleTemplateCard";

// API Base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// API Client
const apiClient = {
  async get(url: string) {
    const response = await fetch(`${API_BASE}${url}`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  },

  async post(url: string, data: any) {
    const response = await fetch(`${API_BASE}${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  },

  async delete(url: string) {
    const response = await fetch(`${API_BASE}${url}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  },
};

// Query Keys
export const roleQueryKeys = {
  all: ["roles"] as const,
  templates: () => [...roleQueryKeys.all, "templates"] as const,
  templatesByVertical: (vertical?: string) =>
    [...roleQueryKeys.templates(), "by-vertical", vertical] as const,
  templatesGrouped: () => [...roleQueryKeys.templates(), "grouped"] as const,
  tenantRoles: (tenantId: string) =>
    [...roleQueryKeys.all, "tenant", tenantId] as const,
};

// Hook: Get all role templates
export function useRoleTemplates(vertical?: string) {
  return useQuery({
    queryKey: roleQueryKeys.templatesByVertical(vertical),
    queryFn: async (): Promise<RoleTemplate[]> => {
      const url = vertical
        ? `/roles/templates?vertical=${vertical}`
        : "/roles/templates";
      return apiClient.get(url);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook: Get role templates grouped by vertical
export function useRoleTemplatesGrouped() {
  return useQuery({
    queryKey: roleQueryKeys.templatesGrouped(),
    queryFn: async () => {
      return apiClient.get("/roles/templates/by-vertical");
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Hook: Get available verticals with counts
export function useVerticals() {
  const { data: groupedTemplates, ...rest } = useRoleTemplatesGrouped();

  const verticals =
    groupedTemplates?.map(
      (group: {
        vertical: string;
        vertical_display_name: string;
        role_count: number;
        roles: RoleTemplate[];
      }) => ({
        key: group.vertical || "general",
        label: group.vertical_display_name,
        count: group.role_count,
        roles: group.roles,
      })
    ) || [];

  return {
    data: verticals,
    ...rest,
  };
}

// Hook: Get tenant roles
export function useTenantRoles(tenantId: string) {
  return useQuery({
    queryKey: roleQueryKeys.tenantRoles(tenantId),
    queryFn: async () => {
      return apiClient.get(`/roles/tenant/${tenantId}`);
    },
    enabled: !!tenantId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook: Create tenant role from template
export function useCreateTenantRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      tenantId: string;
      templateRoleId: string;
      customName?: string;
      customDisplayName?: string;
      customDescription?: string;
    }) => {
      const { tenantId, templateRoleId, ...customizations } = params;

      return apiClient.post(`/roles/tenant/${tenantId}/create-from-template`, {
        template_role_id: templateRoleId,
        custom_name: customizations.customName,
        custom_display_name: customizations.customDisplayName,
        custom_description: customizations.customDescription,
      });
    },
    onSuccess: (
      data: unknown,
      variables: {
        tenantId: string;
        templateRoleId: string;
        customName?: string;
        customDisplayName?: string;
        customDescription?: string;
      }
    ) => {
      // Invalidate tenant roles to refetch updated list
      queryClient.invalidateQueries({
        queryKey: roleQueryKeys.tenantRoles(variables.tenantId),
      });
    },
  });
}

// Hook: Delete tenant role
export function useDeleteTenantRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { tenantId: string; roleId: string }) => {
      const { tenantId, roleId } = params;
      return apiClient.delete(`/roles/tenant/${tenantId}/role/${roleId}`);
    },
    onSuccess: (
      data: unknown,
      variables: { tenantId: string; roleId: string }
    ) => {
      // Invalidate tenant roles to refetch updated list
      queryClient.invalidateQueries({
        queryKey: roleQueryKeys.tenantRoles(variables.tenantId),
      });
    },
  });
}

// Hook: API health check
export function useRoleApiHealth() {
  return useQuery({
    queryKey: ["roles", "health"],
    queryFn: async () => {
      return apiClient.get("/roles/health");
    },
    staleTime: 30 * 1000, // 30 seconds
    retry: 3,
  });
}

// Combined hook for role management dashboard
export function useRoleManagement(tenantId: string) {
  const templates = useRoleTemplates();
  const tenantRoles = useTenantRoles(tenantId);
  const createRole = useCreateTenantRole();
  const deleteRole = useDeleteTenantRole();
  const verticals = useVerticals();

  return {
    // Data
    templates: templates.data || [],
    tenantRoles: tenantRoles.data || [],
    verticals: verticals.data || [],

    // Loading states
    isLoadingTemplates: templates.isLoading,
    isLoadingTenantRoles: tenantRoles.isLoading,
    isLoadingVerticals: verticals.isLoading,

    // Error states
    templatesError: templates.error,
    tenantRolesError: tenantRoles.error,
    verticalsError: verticals.error,

    // Mutations
    createRole: createRole.mutate,
    deleteRole: deleteRole.mutate,
    isCreatingRole: createRole.isPending,
    isDeletingRole: deleteRole.isPending,

    // Refetch functions
    refetchTemplates: templates.refetch,
    refetchTenantRoles: tenantRoles.refetch,
    refetchVerticals: verticals.refetch,
  };
}

export default useRoleTemplates;
