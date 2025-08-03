/**
 * Generic Wizard Component - Metadata-Driven
 * Universal multi-step process handler for any workflow
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "./Card";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Progress } from "./Progress";
import {
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Circle,
  AlertCircle,
  Clock,
  Play,
} from "lucide-react";

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  component: string; // Component type to render for this step
  props?: Record<string, any>; // Props to pass to the step component
  validation?: {
    required?: boolean;
    minSelection?: number;
    maxSelection?: number;
    customValidator?: string; // Function name for custom validation
  };
  condition?: Record<string, any>; // Conditional logic for showing this step
  icon?: React.ReactNode;
  estimatedTime?: string; // e.g., "2 min"
}

export interface WizardState {
  currentStep: number;
  stepData: Record<string, any>;
  isComplete: boolean;
  canProceed: boolean;
  isProcessing: boolean;
}

interface WizardProps {
  // Configuration
  steps: WizardStep[];
  title?: string;
  description?: string;

  // Behavior
  allowBackNavigation?: boolean;
  showProgress?: boolean;
  showStepNumbers?: boolean;
  showEstimatedTime?: boolean;
  autoAdvance?: boolean; // Auto-advance when step is valid
  persistState?: boolean; // Save state to localStorage

  // API
  onStepChange?: (step: number, stepData: any) => void;
  onStepValidate?: (step: number, data: any) => boolean | Promise<boolean>;
  onComplete?: (allData: Record<string, any>) => void | Promise<void>;
  onCancel?: () => void;

  // Styling
  className?: string;
  layout?: "default" | "sidebar" | "minimal";

  // Initial state
  initialStep?: number;
  initialData?: Record<string, any>;
}

export const Wizard: React.FC<WizardProps> = ({
  steps,
  title,
  description,
  allowBackNavigation = true,
  showProgress = true,
  showStepNumbers = true,
  showEstimatedTime = false,
  autoAdvance = false,
  persistState = false,
  onStepChange,
  onStepValidate,
  onComplete,
  onCancel,
  className = "",
  layout = "default",
  initialStep = 0,
  initialData = {},
}) => {
  const [state, setState] = useState<WizardState>({
    currentStep: initialStep,
    stepData: initialData,
    isComplete: false,
    canProceed: false,
    isProcessing: false,
  });

  const storageKey = `wizard-state-${steps.map((s) => s.id).join("-")}`;

  // Load persisted state
  useEffect(() => {
    if (persistState && typeof window !== "undefined") {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsedState = JSON.parse(saved);
          setState((prev) => ({ ...prev, ...parsedState }));
        } catch (e) {
          console.warn("Failed to load wizard state:", e);
        }
      }
    }
  }, [persistState, storageKey]);

  // Save state to localStorage
  useEffect(() => {
    if (persistState && typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(state));
    }
  }, [state, persistState, storageKey]);

  // Get visible steps (considering conditions)
  const visibleSteps = React.useMemo(() => {
    return steps.filter((step) => {
      if (!step.condition) return true;

      // Simple condition evaluation
      // In a real implementation, you'd want a more sophisticated condition engine
      return Object.entries(step.condition).every(([key, value]) => {
        return state.stepData[key] === value;
      });
    });
  }, [steps, state.stepData]);

  const currentStepData = visibleSteps[state.currentStep];
  const isFirstStep = state.currentStep === 0;
  const isLastStep = state.currentStep === visibleSteps.length - 1;

  // Calculate progress
  const progress = ((state.currentStep + 1) / visibleSteps.length) * 100;

  // Validate current step
  const validateCurrentStep = async (data: any): Promise<boolean> => {
    if (!currentStepData) return false;

    // Built-in validation
    const validation = currentStepData.validation;
    if (validation) {
      if (validation.required && (!data || Object.keys(data).length === 0)) {
        return false;
      }

      if (
        validation.minSelection &&
        Array.isArray(data) &&
        data.length < validation.minSelection
      ) {
        return false;
      }

      if (
        validation.maxSelection &&
        Array.isArray(data) &&
        data.length > validation.maxSelection
      ) {
        return false;
      }
    }

    // Custom validation
    if (onStepValidate) {
      return await onStepValidate(state.currentStep, data);
    }

    return true;
  };

  // Update step data
  const updateStepData = async (stepId: string, data: any) => {
    const newStepData = { ...state.stepData, [stepId]: data };
    const isValid = await validateCurrentStep(data);

    setState((prev) => ({
      ...prev,
      stepData: newStepData,
      canProceed: isValid,
    }));

    onStepChange?.(state.currentStep, newStepData);

    // Auto-advance if enabled and valid
    if (autoAdvance && isValid && !isLastStep) {
      setTimeout(() => nextStep(), 500);
    }
  };

  // Navigate to next step
  const nextStep = async () => {
    if (!state.canProceed || state.isProcessing) return;

    if (isLastStep) {
      // Complete wizard
      setState((prev) => ({ ...prev, isProcessing: true }));

      try {
        await onComplete?.(state.stepData);
        setState((prev) => ({
          ...prev,
          isComplete: true,
          isProcessing: false,
        }));

        // Clear persisted state on completion
        if (persistState && typeof window !== "undefined") {
          localStorage.removeItem(storageKey);
        }
      } catch (error) {
        console.error("Wizard completion failed:", error);
        setState((prev) => ({ ...prev, isProcessing: false }));
      }
    } else {
      // Move to next step
      setState((prev) => ({
        ...prev,
        currentStep: prev.currentStep + 1,
        canProceed: false,
      }));
    }
  };

  // Navigate to previous step
  const prevStep = () => {
    if (isFirstStep || !allowBackNavigation) return;

    setState((prev) => ({
      ...prev,
      currentStep: prev.currentStep - 1,
      canProceed: true,
    }));
  };

  // Jump to specific step
  const goToStep = (stepIndex: number) => {
    if (stepIndex < 0 || stepIndex >= visibleSteps.length) return;

    setState((prev) => ({
      ...prev,
      currentStep: stepIndex,
      canProceed: false,
    }));
  };

  // Reset wizard
  const reset = () => {
    setState({
      currentStep: 0,
      stepData: {},
      isComplete: false,
      canProceed: false,
      isProcessing: false,
    });

    if (persistState && typeof window !== "undefined") {
      localStorage.removeItem(storageKey);
    }
  };

  // Render step indicator
  const renderStepIndicator = () => (
    <div className="flex justify-between text-sm mb-6">
      {visibleSteps.map((step, index) => {
        const isCompleted = index < state.currentStep;
        const isCurrent = index === state.currentStep;
        const isAccessible = index <= state.currentStep;

        return (
          <div
            key={step.id}
            className={`flex items-center gap-2 cursor-pointer ${
              isCompleted
                ? "text-green-600"
                : isCurrent
                  ? "text-blue-600"
                  : "text-gray-400"
            }`}
            onClick={() => isAccessible && goToStep(index)}
          >
            {isCompleted ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  isCurrent ? "border-blue-600 bg-blue-600" : "border-gray-300"
                }`}
              >
                {showStepNumbers && (
                  <span
                    className={`text-xs ${isCurrent ? "text-white" : "text-gray-400"}`}
                  >
                    {index + 1}
                  </span>
                )}
              </div>
            )}
            <div className="hidden sm:block">
              <div className="font-medium">{step.title}</div>
              {showEstimatedTime && step.estimatedTime && (
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {step.estimatedTime}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  // Render current step content
  const renderStepContent = () => {
    if (!currentStepData) return null;

    // In a real implementation, you'd dynamically render the component
    // specified in currentStepData.component using your component registry
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {currentStepData.title}
          </h2>
          {currentStepData.description && (
            <p className="text-gray-600">{currentStepData.description}</p>
          )}
        </div>

        {/* Placeholder for dynamic component rendering */}
        <div className="min-h-[300px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center">
            <Play className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">
              Component: <code>{currentStepData.component}</code>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              This would render the actual step component dynamically
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Render navigation
  const renderNavigation = () => (
    <div className="flex justify-between items-center mt-6">
      <div className="flex gap-2">
        {allowBackNavigation && !isFirstStep && (
          <Button variant="outline" onClick={prevStep}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
        )}

        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          onClick={nextStep}
          disabled={!state.canProceed || state.isProcessing}
          className="min-w-[120px]"
        >
          {state.isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : isLastStep ? (
            "Complete"
          ) : (
            <>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );

  // Success state
  if (state.isComplete) {
    return (
      <div className={`max-w-4xl mx-auto ${className}`}>
        <Card>
          <CardContent className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Completed Successfully!
            </h2>
            <p className="text-gray-600 mb-6">
              Your process has been completed successfully.
            </p>
            <div className="flex gap-4 justify-center">
              <Button onClick={reset} variant="outline">
                Start Over
              </Button>
              <Button onClick={() => (window.location.href = "/")}>
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`max-w-6xl mx-auto ${className}`}>
      {/* Header */}
      {(title || description) && (
        <div className="text-center mb-8">
          {title && (
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          )}
          {description && <p className="text-gray-600">{description}</p>}
        </div>
      )}

      {/* Progress */}
      {showProgress && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700">
              Step {state.currentStep + 1} of {visibleSteps.length}
            </span>
            <Badge variant="outline">{Math.round(progress)}% Complete</Badge>
          </div>
          <Progress
            value={progress}
            variant="linear"
            color="blue"
            showPercentage={false}
            animated={state.isProcessing}
            className="mb-4"
          />
          {renderStepIndicator()}
        </div>
      )}

      {/* Main Content */}
      <Card>
        <CardContent className="p-8">{renderStepContent()}</CardContent>
      </Card>

      {/* Navigation */}
      {renderNavigation()}
    </div>
  );
};

// Hook for using wizard state in step components
export const useWizardContext = () => {
  // This would be provided by a WizardProvider in a real implementation
  return {
    updateStepData: (data: any) => console.log("Update step data:", data),
    goToStep: (step: number) => console.log("Go to step:", step),
    stepData: {},
  };
};

export default Wizard;
