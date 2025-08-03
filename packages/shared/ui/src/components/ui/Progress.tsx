/**
 * Generic Progress Component - Metadata-Driven
 * Universal progress indicator for any process or data loading
 */

import React from "react";
import { CheckCircle, Circle, Clock } from "lucide-react";

export interface ProgressStep {
  id: string;
  label: string;
  description?: string;
  status: "pending" | "active" | "completed" | "error";
  icon?: React.ReactNode;
}

interface ProgressProps {
  // Basic Progress
  value: number; // 0-100
  max?: number;

  // Variants
  variant?: "linear" | "circular" | "stepped" | "dots";
  size?: "sm" | "md" | "lg" | "xl";

  // Styling
  color?: "blue" | "green" | "yellow" | "red" | "purple" | "gray";
  showPercentage?: boolean;
  showValue?: boolean;
  animated?: boolean;
  striped?: boolean;

  // Labels
  label?: string;
  description?: string;
  status?: "normal" | "success" | "warning" | "error";

  // Stepped Progress
  steps?: ProgressStep[];
  currentStep?: number;

  // Circular specific
  strokeWidth?: number;
  radius?: number;

  // Accessibility
  ariaLabel?: string;
  ariaValueText?: string;

  // Styling
  className?: string;

  // Callbacks
  onStepClick?: (stepIndex: number) => void;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  variant = "linear",
  size = "md",
  color = "blue",
  showPercentage = false,
  showValue = false,
  animated = false,
  striped = false,
  label,
  description,
  status = "normal",
  steps = [],
  currentStep = 0,
  strokeWidth,
  radius,
  ariaLabel,
  ariaValueText,
  className = "",
  onStepClick,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const getColorClasses = () => {
    const baseColors = {
      blue: "bg-blue-600",
      green: "bg-green-600",
      yellow: "bg-yellow-600",
      red: "bg-red-600",
      purple: "bg-purple-600",
      gray: "bg-gray-600",
    };

    const bgColors = {
      blue: "bg-blue-100",
      green: "bg-green-100",
      yellow: "bg-yellow-100",
      red: "bg-red-100",
      purple: "bg-purple-100",
      gray: "bg-gray-100",
    };

    return {
      bar: baseColors[color],
      background: bgColors[color],
    };
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return { height: "h-1", text: "text-xs" };
      case "lg":
        return { height: "h-4", text: "text-base" };
      case "xl":
        return { height: "h-6", text: "text-lg" };
      default:
        return { height: "h-2", text: "text-sm" };
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <Circle className="h-4 w-4 text-red-600" />;
      case "warning":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const colors = getColorClasses();
  const sizeClasses = getSizeClasses();

  // Linear Progress
  const renderLinearProgress = () => (
    <div className="w-full">
      {/* Label */}
      {(label || showPercentage || showValue) && (
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            {label && (
              <span className={`font-medium text-gray-700 ${sizeClasses.text}`}>
                {label}
              </span>
            )}
          </div>
          <div className={`${sizeClasses.text} text-gray-600`}>
            {showPercentage && `${Math.round(percentage)}%`}
            {showValue && `${value}/${max}`}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div
        className={`w-full ${colors.background} rounded-full ${sizeClasses.height} overflow-hidden`}
      >
        <div
          className={`
            ${colors.bar} ${sizeClasses.height} rounded-full transition-all duration-300 ease-out
            ${animated ? "animate-pulse" : ""}
            ${striped ? "bg-gradient-to-r from-transparent via-white to-transparent bg-[length:2rem_100%] animate-[progress-stripes_1s_linear_infinite]" : ""}
          `}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={ariaLabel}
          aria-valuetext={
            ariaValueText || `${Math.round(percentage)}% complete`
          }
        />
      </div>

      {/* Description */}
      {description && (
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      )}
    </div>
  );

  // Circular Progress
  const renderCircularProgress = () => {
    const circularSize =
      size === "sm" ? 40 : size === "lg" ? 80 : size === "xl" ? 100 : 60;
    const circularStroke =
      strokeWidth || (size === "sm" ? 3 : size === "lg" ? 6 : 4);
    const circularRadius = radius || (circularSize - circularStroke * 2) / 2;
    const circumference = circularRadius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="flex flex-col items-center">
        <div className="relative">
          <svg
            width={circularSize}
            height={circularSize}
            className="transform -rotate-90"
          >
            {/* Background circle */}
            <circle
              cx={circularSize / 2}
              cy={circularSize / 2}
              r={circularRadius}
              stroke="currentColor"
              strokeWidth={circularStroke}
              fill="transparent"
              className="text-gray-200"
            />

            {/* Progress circle */}
            <circle
              cx={circularSize / 2}
              cy={circularSize / 2}
              r={circularRadius}
              stroke="currentColor"
              strokeWidth={circularStroke}
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={colors.bar.replace("bg-", "text-")}
              style={{
                transition: "stroke-dashoffset 0.3s ease-out",
              }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`font-bold ${sizeClasses.text}`}>
              {showPercentage
                ? `${Math.round(percentage)}%`
                : showValue
                  ? `${value}/${max}`
                  : Math.round(percentage)}
            </span>
          </div>
        </div>

        {label && (
          <span
            className={`mt-2 font-medium text-gray-700 ${sizeClasses.text}`}
          >
            {label}
          </span>
        )}

        {description && (
          <p className="text-xs text-gray-500 mt-1 text-center">
            {description}
          </p>
        )}
      </div>
    );
  };

  // Stepped Progress
  const renderSteppedProgress = () => (
    <div className="w-full">
      {label && (
        <h3 className={`font-medium text-gray-700 mb-4 ${sizeClasses.text}`}>
          {label}
        </h3>
      )}

      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = step.status === "completed";
          const isActive = step.status === "active" || index === currentStep;
          const isError = step.status === "error";
          const isClickable = onStepClick && (isCompleted || isActive);

          return (
            <React.Fragment key={step.id}>
              <div
                className={`flex flex-col items-center ${
                  isClickable ? "cursor-pointer" : ""
                }`}
                onClick={() => isClickable && onStepClick(index)}
              >
                {/* Step Circle */}
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors
                    ${
                      isCompleted
                        ? `${colors.bar} border-transparent text-white`
                        : isActive
                          ? `border-${color}-600 bg-${color}-50 text-${color}-600`
                          : isError
                            ? "border-red-600 bg-red-50 text-red-600"
                            : "border-gray-300 bg-gray-50 text-gray-400"
                    }
                  `}
                >
                  {step.icon ? (
                    step.icon
                  ) : isCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>

                {/* Step Label */}
                <div className="mt-2 text-center">
                  <p
                    className={`text-xs font-medium ${
                      isActive ? "text-gray-900" : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-400 mt-1">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    flex-1 h-0.5 mx-4 mt-4 transition-colors
                    ${isCompleted ? colors.bar : "bg-gray-200"}
                  `}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {description && (
        <p className="text-sm text-gray-600 mt-4 text-center">{description}</p>
      )}
    </div>
  );

  // Dots Progress
  const renderDotsProgress = () => {
    const totalDots = Math.max(steps.length, 10);
    const activeDots = Math.round((percentage / 100) * totalDots);

    return (
      <div className="w-full">
        {label && (
          <div className="flex justify-between items-center mb-3">
            <span className={`font-medium text-gray-700 ${sizeClasses.text}`}>
              {label}
            </span>
            {showPercentage && (
              <span className={`${sizeClasses.text} text-gray-600`}>
                {Math.round(percentage)}%
              </span>
            )}
          </div>
        )}

        <div className="flex gap-1">
          {Array.from({ length: totalDots }, (_, index) => (
            <div
              key={index}
              className={`
                w-2 h-2 rounded-full transition-colors duration-200
                ${index < activeDots ? colors.bar : colors.background}
              `}
            />
          ))}
        </div>

        {description && (
          <p className="text-xs text-gray-500 mt-2">{description}</p>
        )}
      </div>
    );
  };

  const renderProgress = () => {
    switch (variant) {
      case "circular":
        return renderCircularProgress();
      case "stepped":
        return renderSteppedProgress();
      case "dots":
        return renderDotsProgress();
      default:
        return renderLinearProgress();
    }
  };

  return (
    <div className={className} role="progressbar">
      {renderProgress()}
    </div>
  );
};

export default Progress;
