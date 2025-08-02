/**
 * useRoleOnboarding - Hook for managing role onboarding workflow
 * Handles multi-step role selection and creation process
 */

import { useState, useCallback, useMemo } from "react";
import { RoleTemplate } from "../components/roles/RoleTemplateCard";
import {
  useRoleTemplates,
  useCreateTenantRole,
  useVerticals,
} from "./useRoleTemplates";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

export interface SelectedRole extends RoleTemplate {
  customName?: string;
  customDisplayName?: string;
  customDescription?: string;
  selected: boolean;
}

export interface OnboardingState {
  // Current step
  currentStep: number;
  steps: OnboardingStep[];

  // Vertical selection
  selectedVertical?: string;

  // Role selection
  selectedRoles: SelectedRole[];

  // Customization
  roleCustomizations: Record<
    string,
    {
      customName?: string;
      customDisplayName?: string;
      customDescription?: string;
    }
  >;

  // Progress
  isComplete: boolean;
  canProceed: boolean;
}

const defaultSteps: OnboardingStep[] = [
  {
    id: "vertical",
    title: "Choose Industry",
    description: "Select your business vertical to see relevant roles",
    completed: false,
    current: true,
  },
  {
    id: "roles",
    title: "Select Roles",
    description: "Choose roles that match your team structure",
    completed: false,
    current: false,
  },
  {
    id: "customize",
    title: "Customize",
    description: "Customize role names and descriptions",
    completed: false,
    current: false,
  },
  {
    id: "create",
    title: "Create Roles",
    description: "Review and create your roles",
    completed: false,
    current: false,
  },
];

export function useRoleOnboarding(tenantId: string) {
  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedVertical, setSelectedVertical] = useState<string>();
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [roleCustomizations, setRoleCustomizations] = useState<
    Record<
      string,
      {
        customName?: string;
        customDisplayName?: string;
        customDescription?: string;
      }
    >
  >({});

  // Hooks
  const { data: verticals, isLoading: isLoadingVerticals } = useVerticals();
  const { data: templates, isLoading: isLoadingTemplates } =
    useRoleTemplates(selectedVertical);
  const createRole = useCreateTenantRole();

  // Computed state
  const steps = useMemo(() => {
    return defaultSteps.map((step, index) => ({
      ...step,
      completed: index < currentStep,
      current: index === currentStep,
    }));
  }, [currentStep]);

  const selectedRoles = useMemo(() => {
    return (
      templates
        ?.filter((template: RoleTemplate) =>
          selectedRoleIds.includes(template.role_id)
        )
        .map((template: RoleTemplate) => ({
          ...template,
          ...roleCustomizations[template.role_id],
          selected: true,
        })) || []
    );
  }, [templates, selectedRoleIds, roleCustomizations]);

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 0: // Vertical selection
        return !!selectedVertical;
      case 1: // Role selection
        return selectedRoleIds.length > 0;
      case 2: // Customization
        return true; // Always can proceed from customization
      case 3: // Create roles
        return selectedRoles.length > 0;
      default:
        return false;
    }
  }, [currentStep, selectedVertical, selectedRoleIds, selectedRoles]);

  const isComplete = currentStep >= steps.length;

  // Actions
  const selectVertical = useCallback((vertical: string) => {
    setSelectedVertical(vertical);
    setSelectedRoleIds([]); // Clear selected roles when changing vertical
  }, []);

  const toggleRoleSelection = useCallback((roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  }, []);

  const selectAllRecommendedRoles = useCallback(() => {
    if (!templates) return;

    // Select roles based on business logic (e.g., critical compliance level)
    const recommendedRoles = templates
      .filter(
        (template: RoleTemplate) =>
          template.compliance_level === "critical" ||
          template.hierarchy_level <= 4
      )
      .map((template: RoleTemplate) => template.role_id);

    setSelectedRoleIds(recommendedRoles);
  }, [templates]);

  const customizeRole = useCallback(
    (
      roleId: string,
      customizations: {
        customName?: string;
        customDisplayName?: string;
        customDescription?: string;
      }
    ) => {
      setRoleCustomizations((prev) => ({
        ...prev,
        [roleId]: {
          ...prev[roleId],
          ...customizations,
        },
      }));
    },
    []
  );

  const nextStep = useCallback(() => {
    if (canProceed && currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [canProceed, currentStep, steps.length]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback(
    (stepIndex: number) => {
      if (stepIndex >= 0 && stepIndex < steps.length) {
        setCurrentStep(stepIndex);
      }
    },
    [steps.length]
  );

  const createSelectedRoles = useCallback(async () => {
    if (!tenantId || selectedRoles.length === 0) return;

    const createPromises = selectedRoles.map((role: SelectedRole) =>
      createRole.mutateAsync({
        tenantId,
        templateRoleId: role.role_id,
        customName: role.customName,
        customDisplayName: role.customDisplayName,
        customDescription: role.customDescription,
      })
    );

    try {
      await Promise.all(createPromises);
      setCurrentStep(steps.length); // Mark as complete
      return true;
    } catch (error) {
      console.error("Failed to create roles:", error);
      return false;
    }
  }, [tenantId, selectedRoles, createRole, steps.length]);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setSelectedVertical(undefined);
    setSelectedRoleIds([]);
    setRoleCustomizations({});
  }, []);

  // Get recommendations for current vertical
  const getRecommendedRoles = useCallback(() => {
    if (!templates) return [];

    // Business logic for recommendations
    return templates
      .filter(
        (template: RoleTemplate) =>
          template.compliance_level === "critical" ||
          ["owner", "manager", "admin"].some((keyword) =>
            template.role_name.toLowerCase().includes(keyword)
          )
      )
      .slice(0, 5); // Top 5 recommendations
  }, [templates]);

  return {
    // State
    currentStep,
    steps,
    selectedVertical,
    selectedRoles,
    roleCustomizations,
    isComplete,
    canProceed,

    // Data
    verticals: verticals || [],
    templates: templates || [],
    recommendedRoles: getRecommendedRoles(),

    // Loading states
    isLoadingVerticals,
    isLoadingTemplates,
    isCreatingRoles: createRole.isPending,

    // Actions
    selectVertical,
    toggleRoleSelection,
    selectAllRecommendedRoles,
    customizeRole,
    nextStep,
    prevStep,
    goToStep,
    createSelectedRoles,
    reset,

    // Computed helpers
    getSelectedRoleCount: () => selectedRoleIds.length,
    getRoleCustomization: (roleId: string) => roleCustomizations[roleId] || {},
    isRoleSelected: (roleId: string) => selectedRoleIds.includes(roleId),
    getProgress: () => ((currentStep + 1) / steps.length) * 100,
  };
}

export default useRoleOnboarding;
