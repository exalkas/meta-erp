"use client";

import React, { useEffect, useCallback } from "react";
import Joyride, { ACTIONS, EVENTS, STATUS, CallBackProps } from "react-joyride";
import { useOnboarding } from "@/lib/contexts/OnboardingContext";

interface OnboardingTourProps {
  showSkipButton?: boolean;
  showProgress?: boolean;
}

export default function OnboardingTour({
  showSkipButton = true,
  showProgress = true,
}: OnboardingTourProps) {
  const { state, nextStep, prevStep, skipOnboarding, completeStep } =
    useOnboarding();

  const handleJoyrideCallback = useCallback(
    (data: CallBackProps) => {
      const { action, index, status, type } = data;

      console.log("Joyride callback:", { action, index, status, type });

      // Handle tour completion/skip
      if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
        skipOnboarding();
        return;
      }

      // Handle close button
      if (action === ACTIONS.CLOSE) {
        skipOnboarding();
        return;
      }

      // Handle target not found - still advance if user clicks next
      if (type === EVENTS.TARGET_NOT_FOUND && action === ACTIONS.NEXT) {
        console.warn(
          `Target not found for step ${index}: ${state.steps[index]?.target}`
        );
        // Mark current step as completed even if target not found
        const stepId = state.steps[index]?.id;
        if (stepId) {
          completeStep(stepId);
        }
        nextStep();
        return;
      }

      // Handle step navigation
      if (action === ACTIONS.NEXT) {
        // Mark current step as completed
        const stepId = state.steps[index]?.id;
        if (stepId) {
          completeStep(stepId);
        }
        nextStep();
      } else if (action === ACTIONS.PREV) {
        prevStep();
      }
    },
    [state.steps, completeStep, nextStep, prevStep, skipOnboarding]
  );

  // Scroll to top when tour starts
  useEffect(() => {
    if (state.isActive && state.currentStep === 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [state.isActive, state.currentStep]);

  // Convert our onboarding steps to Joyride format
  const joyrideSteps = state.steps.map((step, index) => ({
    target: "body", // Always use body to center all tooltips
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
        <p className="text-gray-600">{step.description}</p>
        {step.optional && (
          <p className="text-sm text-blue-600 font-medium">
            📘 Optional step - You can skip this if you want
          </p>
        )}
      </div>
    ),
    placement: "center" as const, // Center all steps
    disableBeacon: true,
    hideBackButton: index === 0, // Hide back button on first step
    styles: {
      tooltip: {
        width: "420px",
        maxWidth: "90vw",
      },
    },
  }));

  if (!state.isActive || joyrideSteps.length === 0) {
    return null;
  }

  return (
    <Joyride
      steps={joyrideSteps}
      stepIndex={state.currentStep}
      run={state.isActive}
      callback={handleJoyrideCallback}
      continuous={true}
      showSkipButton={showSkipButton}
      showProgress={showProgress}
      scrollToFirstStep={false}
      disableScrolling={true}
      spotlightClicks={false}
      hideCloseButton={false}
      disableCloseOnEsc={false}
      styles={{
        options: {
          primaryColor: "#10b981", // Green-500 to match your brand
          backgroundColor: "#ffffff",
          textColor: "#374151",
          overlayColor: "rgba(0, 0, 0, 0.5)",
          arrowColor: "#ffffff",
          beaconSize: 36,
          zIndex: 10000,
        },
        overlay: {
          mixBlendMode: "normal",
        },
        spotlight: {
          borderRadius: 4,
        },
        tooltip: {
          borderRadius: 8,
          fontSize: 14,
          padding: 20,
          maxWidth: "400px",
        },
        tooltipContainer: {
          textAlign: "left",
        },
        tooltipTitle: {
          fontSize: 18,
          fontWeight: 600,
          marginBottom: 8,
        },
        buttonNext: {
          backgroundColor: "#10b981",
          color: "#ffffff",
          borderRadius: 6,
          padding: "8px 16px",
          border: "none",
          fontSize: 14,
          fontWeight: 500,
        },
        buttonBack: {
          color: "#6b7280",
          backgroundColor: "transparent",
          border: "1px solid #d1d5db",
          borderRadius: 6,
          padding: "8px 16px",
          fontSize: 14,
          fontWeight: 500,
        },
        buttonSkip: {
          color: "#6b7280",
          backgroundColor: "transparent",
          fontSize: 14,
        },
      }}
      locale={{
        back: "Previous",
        close: "Close",
        last: "Finish",
        next: "Next",
        open: "Open dialog",
        skip: "Skip tour",
      }}
    />
  );
}
