import React, { useState } from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import { Button } from "../ui/Button";
import { Card, CardHeader, CardContent } from "../ui/Card";
import { Language } from "../../types";
import { DynamicForm, DynamicFormSchema } from "./DynamicForm";

export interface WizardStep {
  id: string;
  title: Record<Language, string>;
  description?: Record<Language, string>;
  form: DynamicFormSchema;
  validation?: (values: Record<string, any>) => Record<string, string>;
  optional?: boolean;
}

export interface FormWizardProps {
  steps: WizardStep[];
  onComplete?: (allValues: Record<string, any>) => void;
  onStepChange?: (stepIndex: number, stepId: string) => void;
  initialValues?: Record<string, any>;
  showProgress?: boolean;
  allowBackward?: boolean;
  showStepNumbers?: boolean;
  className?: string;
}

export const FormWizard: React.FC<FormWizardProps> = ({
  steps,
  onComplete,
  onStepChange,
  initialValues = {},
  showProgress = true,
  allowBackward = true,
  showStepNumbers = true,
  className = "",
}) => {
  const { t, language } = useTranslation();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [stepValues, setStepValues] = useState<
    Record<string, Record<string, any>>
  >(
    steps.reduce((acc, step) => {
      acc[step.id] = initialValues[step.id] || {};
      return acc;
    }, {} as Record<string, Record<string, any>>)
  );
  const [stepErrors, setStepErrors] = useState<
    Record<string, Record<string, string>>
  >({});
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  const handleStepValueChange = (fieldName: string, value: any) => {
    setStepValues((prev) => ({
      ...prev,
      [currentStep.id]: {
        ...prev[currentStep.id],
        [fieldName]: value,
      },
    }));

    // Clear field error when value changes
    if (stepErrors[currentStep.id]?.[fieldName]) {
      setStepErrors((prev) => ({
        ...prev,
        [currentStep.id]: {
          ...prev[currentStep.id],
          [fieldName]: "",
        },
      }));
    }
  };

  const validateCurrentStep = (): boolean => {
    const currentValues = stepValues[currentStep.id] || {};
    let errors: Record<string, string> = {};

    // Required field validation
    currentStep.form.fields.forEach((field) => {
      if (field.required && !currentValues[field.name]) {
        errors[field.name] = t("required");
      }
    });

    // Custom validation
    if (currentStep.validation) {
      const customErrors = currentStep.validation(currentValues);
      errors = { ...errors, ...customErrors };
    }

    setStepErrors((prev) => ({
      ...prev,
      [currentStep.id]: errors,
    }));

    return Object.keys(errors).length === 0;
  };

  const goToNextStep = () => {
    if (validateCurrentStep()) {
      setCompletedSteps((prev) => new Set([...prev, currentStep.id]));

      if (isLastStep) {
        // Complete the wizard
        const allValues = steps.reduce((acc, step) => {
          acc[step.id] = stepValues[step.id] || {};
          return acc;
        }, {} as Record<string, any>);
        onComplete?.(allValues);
      } else {
        const nextIndex = currentStepIndex + 1;
        setCurrentStepIndex(nextIndex);
        onStepChange?.(nextIndex, steps[nextIndex].id);
      }
    }
  };

  const goToPreviousStep = () => {
    if (!isFirstStep && allowBackward) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      onStepChange?.(prevIndex, steps[prevIndex].id);
    }
  };

  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      // Can only go to previous steps or the next step if current is valid
      if (stepIndex <= currentStepIndex || validateCurrentStep()) {
        setCurrentStepIndex(stepIndex);
        onStepChange?.(stepIndex, steps[stepIndex].id);
      }
    }
  };

  const getStepStatus = (
    step: WizardStep,
    index: number
  ): "completed" | "current" | "pending" | "disabled" => {
    if (completedSteps.has(step.id)) return "completed";
    if (index === currentStepIndex) return "current";
    if (index < currentStepIndex) return "completed";
    return "pending";
  };

  const ProgressIndicator: React.FC = () => {
    if (!showProgress) return null;

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(step, index);
            const isClickable = allowBackward && index <= currentStepIndex;

            return (
              <div key={step.id} className="flex items-center flex-1">
                {/* Step Circle */}
                <div
                  className={`
                    relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                    ${isClickable ? "cursor-pointer" : "cursor-default"}
                    ${
                      status === "completed"
                        ? "bg-green-500 border-green-500 text-white"
                        : status === "current"
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "bg-white border-gray-300 text-gray-500"
                    }
                  `}
                  onClick={() => isClickable && goToStep(index)}
                >
                  {status === "completed" ? (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : showStepNumbers ? (
                    <span className="text-sm font-medium">{index + 1}</span>
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-current" />
                  )}
                </div>

                {/* Step Label */}
                <div className="ml-3 flex-1">
                  <div
                    className={`text-sm font-medium ${
                      status === "current"
                        ? "text-blue-600"
                        : status === "completed"
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    {step.title[language] || step.title.en}
                  </div>
                  {step.description && (
                    <div className="text-xs text-gray-400">
                      {step.description[language] || step.description.en}
                    </div>
                  )}
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={`
                    ml-4 flex-1 h-0.5 
                    ${index < currentStepIndex ? "bg-green-500" : "bg-gray-300"}
                  `}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="mt-4 bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      <ProgressIndicator />

      <Card>
        <CardHeader>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {currentStep.title[language] || currentStep.title.en}
            </h2>
            {currentStep.description && (
              <p className="mt-1 text-sm text-gray-600">
                {currentStep.description[language] ||
                  currentStep.description.en}
              </p>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <DynamicForm
            schema={currentStep.form}
            values={stepValues[currentStep.id] || {}}
            errors={stepErrors[currentStep.id] || {}}
            onChange={handleStepValueChange}
            onSubmit={goToNextStep}
          />

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200">
            <div>
              {!isFirstStep && allowBackward && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={goToPreviousStep}
                  leftIcon={
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  }
                >
                  {t("previous")}
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {/* Step Counter */}
              <span className="text-sm text-gray-500">
                {currentStepIndex + 1} {t("of")} {steps.length}
              </span>

              {/* Next/Complete Button */}
              <Button
                type="button"
                onClick={goToNextStep}
                rightIcon={
                  !isLastStep ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  ) : undefined
                }
              >
                {isLastStep ? t("complete") : t("next")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FormWizard;
