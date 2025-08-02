/**
 * Role Onboarding Page - Multi-step role setup for new tenants
 * Phase 5B: Vertical-specific onboarding workflow
 */

"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Star,
  Users,
  Building2,
  Sparkles,
  ArrowRight,
} from "lucide-react";

// Import our components and hooks
import VerticalFilter from "@/components/roles/VerticalFilter";
import RoleTemplateCard from "@/components/roles/RoleTemplateCard";
import { useRoleOnboarding } from "@/hooks/useRoleOnboarding";

// Mock tenant ID - in real app this would come from auth context
const TENANT_ID = "89f84fea-b5b9-413c-945b-002c7fd9555d";

export default function RoleOnboardingPage() {
  const {
    currentStep,
    steps,
    selectedVertical,
    selectedRoles,
    templates,
    verticals,
    recommendedRoles,
    canProceed,
    isComplete,
    isLoadingTemplates,
    isCreatingRoles,
    selectVertical,
    toggleRoleSelection,
    selectAllRecommendedRoles,
    customizeRole,
    nextStep,
    prevStep,
    createSelectedRoles,
    reset,
    getSelectedRoleCount,
    isRoleSelected,
    getProgress,
  } = useRoleOnboarding(TENANT_ID);

  // Step 1: Choose Industry Vertical
  const renderVerticalSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Choose Your Industry
        </h2>
        <p className="text-gray-600">
          Select your business vertical to see relevant role templates
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {verticals.map((vertical) => (
          <Card
            key={vertical.key}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedVertical === vertical.key
                ? "ring-2 ring-blue-500 border-blue-300"
                : "hover:border-gray-300"
            }`}
            onClick={() => selectVertical(vertical.key)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <Building2 className="h-8 w-8 text-blue-500" />
                {selectedVertical === vertical.key && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
              </div>
              <h3 className="font-semibold text-lg mb-2">{vertical.label}</h3>
              <p className="text-sm text-gray-600 mb-3">
                {vertical.count} role templates available
              </p>
              <Badge variant="secondary" className="text-xs">
                {vertical.key === "general" ? "Universal" : "Specialized"}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedVertical && (
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 bg-green-50 text-green-700 rounded-lg">
            <CheckCircle className="h-4 w-4 mr-2" />
            Selected: {verticals.find((v) => v.key === selectedVertical)?.label}
          </div>
        </div>
      )}
    </div>
  );

  // Step 2: Select Roles
  const renderRoleSelection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Select Your Roles
          </h2>
          <p className="text-gray-600">
            Choose roles that match your team structure
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">
            {getSelectedRoleCount()} roles selected
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={selectAllRecommendedRoles}
            className="mt-1"
          >
            <Star className="h-3 w-3 mr-1" />
            Select Recommended
          </Button>
        </div>
      </div>

      {/* Recommended Roles */}
      {recommendedRoles.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium text-blue-900">Recommended for You</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recommendedRoles.map((role) => (
              <div
                key={role.role_id}
                className="flex items-center justify-between bg-white p-3 rounded border"
              >
                <div>
                  <p className="font-medium text-sm">{role.display_name}</p>
                  <p className="text-xs text-gray-600">
                    {role.compliance_level} • Level {role.hierarchy_level}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={isRoleSelected(role.role_id) ? "default" : "outline"}
                  onClick={() => toggleRoleSelection(role.role_id)}
                >
                  {isRoleSelected(role.role_id) ? "Selected" : "Select"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Available Roles */}
      <div>
        <h3 className="font-medium text-gray-900 mb-4">All Available Roles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <RoleTemplateCard
              key={template.role_id}
              template={template}
              onSelect={() => toggleRoleSelection(template.role_id)}
              selected={isRoleSelected(template.role_id)}
              showActions={true}
            />
          ))}
        </div>
      </div>
    </div>
  );

  // Step 3: Customize Roles
  const renderCustomization = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Customize Your Roles
        </h2>
        <p className="text-gray-600">
          Fine-tune role names and descriptions for your organization
        </p>
      </div>

      <div className="space-y-4">
        {selectedRoles.map((role) => (
          <Card key={role.role_id}>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-lg">{role.display_name}</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {role.description}
                  </p>
                  <div className="flex gap-2">
                    <Badge variant="secondary">
                      {role.vertical || "General"}
                    </Badge>
                    <Badge variant="outline">{role.compliance_level}</Badge>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Custom Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder={role.role_name}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      onChange={(e) =>
                        customizeRole(role.role_id, {
                          customName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Custom Display Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder={role.display_name}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      onChange={(e) =>
                        customizeRole(role.role_id, {
                          customDisplayName: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Step 4: Review and Create
  const renderReviewAndCreate = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Review & Create Roles
        </h2>
        <p className="text-gray-600">
          Review your selections and create your team roles
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Ready to Create {selectedRoles.length} Roles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {selectedRoles.map((role) => (
              <div
                key={role.role_id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded"
              >
                <div>
                  <p className="font-medium">
                    {role.customDisplayName || role.display_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {role.vertical || "General"} • {role.compliance_level}
                  </p>
                </div>
                <Badge variant="outline">Level {role.hierarchy_level}</Badge>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>What happens next:</strong> These roles will be created in
              your tenant workspace. You can assign them to team members and
              modify permissions as needed.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button
          size="lg"
          onClick={createSelectedRoles}
          disabled={isCreatingRoles}
          className="min-w-[200px]"
        >
          {isCreatingRoles ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating Roles...
            </>
          ) : (
            <>
              <Users className="h-4 w-4 mr-2" />
              Create {selectedRoles.length} Roles
            </>
          )}
        </Button>
      </div>
    </div>
  );

  // Success State
  const renderSuccess = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Roles Created Successfully!
        </h2>
        <p className="text-gray-600">
          Your team roles are now ready. You can start assigning them to team
          members.
        </p>
      </div>
      <div className="flex gap-4 justify-center">
        <Button asChild>
          <a href="/roles/manage">
            <Users className="h-4 w-4 mr-2" />
            Manage Roles
          </a>
        </Button>
        <Button variant="outline" onClick={reset}>
          Setup Another Business
        </Button>
      </div>
    </div>
  );

  const currentStepContent = () => {
    if (isComplete) return renderSuccess();

    switch (currentStep) {
      case 0:
        return renderVerticalSelection();
      case 1:
        return renderRoleSelection();
      case 2:
        return renderCustomization();
      case 3:
        return renderReviewAndCreate();
      default:
        return renderVerticalSelection();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Role Setup</h1>
          <Badge variant="outline">
            Step {currentStep + 1} of {steps.length}
          </Badge>
        </div>

        <Progress value={getProgress()} className="mb-4" />

        <div className="flex justify-between text-sm">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center gap-2 ${
                step.completed
                  ? "text-green-600"
                  : step.current
                    ? "text-blue-600"
                    : "text-gray-400"
              }`}
            >
              {step.completed ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    step.current
                      ? "border-blue-600 bg-blue-600"
                      : "border-gray-300"
                  }`}
                />
              )}
              <span className="hidden sm:inline">{step.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardContent className="p-8">
          {isLoadingTemplates ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading role templates...</p>
            </div>
          ) : (
            currentStepContent()
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      {!isComplete && !isLoadingTemplates && (
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <Button onClick={nextStep} disabled={!canProceed}>
            {currentStep === steps.length - 1 ? "Create Roles" : "Next"}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
