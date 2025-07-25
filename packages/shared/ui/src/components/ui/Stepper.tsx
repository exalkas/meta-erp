import React from "react";
import { Check, ChevronRight, AlertCircle, Clock, X } from "lucide-react";

export interface StepperStep {
  id: string;
  title: string;
  description?: string;
  status?: "pending" | "current" | "completed" | "error" | "skipped";
  icon?: React.ReactNode;
  optional?: boolean;
  clickable?: boolean;
}

export interface StepperProps {
  steps: StepperStep[];
  currentStep?: number;
  onStepClick?: (stepIndex: number, step: StepperStep) => void;
  orientation?: "horizontal" | "vertical";
  variant?: "default" | "minimal" | "numbered" | "dots";
  size?: "sm" | "md" | "lg";
  showConnectors?: boolean;
  allowStepNavigation?: boolean;
  className?: string;
  stepClassName?: string;
  connectorClassName?: string;
  alternativeLabel?: boolean;
  nonLinear?: boolean;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep = 0,
  onStepClick,
  orientation = "horizontal",
  variant = "default",
  size = "md",
  showConnectors = true,
  allowStepNavigation = false,
  className = "",
  stepClassName = "",
  connectorClassName = "",
  alternativeLabel = false,
  nonLinear = false,
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return {
          step: "w-6 h-6 text-xs",
          title: "text-xs",
          description: "text-xs",
          spacing: orientation === "horizontal" ? "space-x-2" : "space-y-2",
        };
      case "lg":
        return {
          step: "w-10 h-10 text-sm",
          title: "text-base",
          description: "text-sm",
          spacing: orientation === "horizontal" ? "space-x-4" : "space-y-4",
        };
      default: // md
        return {
          step: "w-8 h-8 text-sm",
          title: "text-sm",
          description: "text-sm",
          spacing: orientation === "horizontal" ? "space-x-3" : "space-y-3",
        };
    }
  };

  const getStepIcon = (step: StepperStep, index: number) => {
    if (step.icon) return step.icon;

    switch (step.status) {
      case "completed":
        return <Check size={16} />;
      case "error":
        return <X size={16} />;
      case "skipped":
        return <ChevronRight size={16} />;
      case "current":
        return variant === "numbered" ? index + 1 : <Clock size={16} />;
      default:
        return variant === "numbered" ? index + 1 : <Clock size={16} />;
    }
  };

  const getStepStatus = (step: StepperStep, index: number) => {
    if (step.status) return step.status;

    if (index < currentStep) return "completed";
    if (index === currentStep) return "current";
    return "pending";
  };

  const getStepStyles = (status: StepperStep["status"]) => {
    switch (status) {
      case "completed":
        return {
          circle: "bg-green-600 text-white border-green-600",
          title: "text-green-600 font-medium",
          description: "text-green-600",
        };
      case "current":
        return {
          circle: "bg-[#0066CC] text-white border-[#0066CC]",
          title: "text-[#0066CC] font-medium",
          description: "text-[#0066CC]",
        };
      case "error":
        return {
          circle: "bg-red-600 text-white border-red-600",
          title: "text-red-600 font-medium",
          description: "text-red-600",
        };
      case "skipped":
        return {
          circle: "bg-gray-400 text-white border-gray-400",
          title: "text-gray-400 line-through",
          description: "text-gray-400 line-through",
        };
      default: // pending
        return {
          circle: "bg-gray-200 text-gray-600 border-gray-300",
          title: "text-gray-600",
          description: "text-gray-500",
        };
    }
  };

  const getConnectorStyles = (
    fromStatus: StepperStep["status"],
    toStatus: StepperStep["status"]
  ) => {
    if (
      fromStatus === "completed" &&
      (toStatus === "completed" || toStatus === "current")
    ) {
      return "bg-green-600";
    }
    if (fromStatus === "completed" || fromStatus === "current") {
      return "bg-[#0066CC]";
    }
    return "bg-gray-300";
  };

  const handleStepClick = (index: number, step: StepperStep) => {
    if (step.clickable || allowStepNavigation || nonLinear) {
      if (onStepClick) {
        onStepClick(index, step);
      }
    }
  };

  const sizeClasses = getSizeClasses();

  const renderStep = (step: StepperStep, index: number) => {
    const status = getStepStatus(step, index);
    const styles = getStepStyles(status);
    const isClickable = step.clickable || allowStepNavigation || nonLinear;

    return (
      <div
        key={step.id}
        className={`
          relative flex items-center
          ${orientation === "horizontal" ? "flex-col" : "flex-row"}
          ${isClickable ? "cursor-pointer" : ""}
          ${stepClassName}
        `}
        onClick={() => handleStepClick(index, step)}
        role={isClickable ? "button" : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onKeyDown={(e) => {
          if (isClickable && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            handleStepClick(index, step);
          }
        }}
      >
        {/* Step Circle */}
        <div
          className={`
            relative z-10 flex items-center justify-center rounded-full border-2 transition-all duration-200
            ${sizeClasses.step}
            ${styles.circle}
            ${isClickable ? "hover:scale-110" : ""}
          `}
        >
          {variant === "dots" ? (
            <div className="w-2 h-2 bg-current rounded-full" />
          ) : (
            getStepIcon(step, index)
          )}

          {step.optional && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-gray-400 text-white rounded-full flex items-center justify-center text-xs">
              ?
            </div>
          )}
        </div>

        {/* Step Content */}
        {variant !== "minimal" && (
          <div
            className={`
              ${
                orientation === "horizontal"
                  ? "mt-2 text-center"
                  : "ml-3 flex-1"
              }
              ${
                alternativeLabel && orientation === "horizontal"
                  ? "absolute top-full mt-2"
                  : ""
              }
            `}
          >
            <div className={`font-medium ${styles.title} ${sizeClasses.title}`}>
              {step.title}
              {step.optional && (
                <span className="ml-1 text-gray-500 font-normal">
                  (Optional)
                </span>
              )}
            </div>

            {step.description && (
              <div
                className={`mt-1 ${styles.description} ${sizeClasses.description}`}
              >
                {step.description}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderConnector = (fromIndex: number, toIndex: number) => {
    if (!showConnectors || toIndex >= steps.length) return null;

    const fromStatus = getStepStatus(steps[fromIndex], fromIndex);
    const toStatus = getStepStatus(steps[toIndex], toIndex);
    const connectorColor = getConnectorStyles(fromStatus, toStatus);

    return (
      <div
        key={`connector-${fromIndex}-${toIndex}`}
        className={`
          ${orientation === "horizontal" ? "flex-1 h-0.5" : "w-0.5 flex-1"}
          ${connectorColor}
          ${connectorClassName}
        `}
      />
    );
  };

  return (
    <div
      className={`
        ${orientation === "horizontal" ? "flex items-center" : "flex flex-col"}
        ${className}
      `}
      role="progressbar"
      aria-valuenow={currentStep + 1}
      aria-valuemin={1}
      aria-valuemax={steps.length}
      aria-label={`Step ${currentStep + 1} of ${steps.length}`}
    >
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          {renderStep(step, index)}
          {orientation === "horizontal"
            ? renderConnector(index, index + 1)
            : index < steps.length - 1 && renderConnector(index, index + 1)}
        </React.Fragment>
      ))}
    </div>
  );
};

export default Stepper;
