"use client";

import React, { useState } from "react";
import {
  QuestionMarkCircleIcon,
  PlayIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { useOnboarding } from "@/lib/contexts/OnboardingContext";
import { useRouter, usePathname } from "next/navigation";
import { Modal } from "@/components/shared";

interface OnboardingHelpProps {
  className?: string;
  variant?: "button" | "floating" | "menu";
}

export default function OnboardingHelp({
  className = "",
  variant = "floating",
}: OnboardingHelpProps) {
  const { state, startOnboarding, resetOnboarding, getProgress } =
    useOnboarding();
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Only show help button on dashboard
  const isDashboard = pathname === "/dashboard";
  if (!isDashboard && variant === "floating") {
    return null; // Don't show floating button outside dashboard
  }

  const handleStartTour = () => {
    setShowModal(false);
    // Always go to dashboard first for the tour
    if (!isDashboard) {
      router.push("/dashboard");
      // Small delay to allow navigation to complete
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => startOnboarding(false), 200);
      }, 100);
    } else {
      // Scroll to top first
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => startOnboarding(false), 200); // Resume from where they left off
    }
  };

  const handleRestartTour = () => {
    setShowModal(false);
    // Always go to dashboard first for the tour
    if (!isDashboard) {
      router.push("/dashboard");
      // Small delay to allow navigation to complete
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => startOnboarding(true), 200);
      }, 100);
    } else {
      // Scroll to top first
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => startOnboarding(true), 200); // Start from beginning
    }
  };

  const renderButton = () => {
    switch (variant) {
      case "button":
        return (
          <button
            onClick={() => setShowModal(true)}
            className={`inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 ${className}`}
          >
            <QuestionMarkCircleIcon className="h-4 w-4 mr-2" />
            Need Help?
          </button>
        );

      case "menu":
        return (
          <button
            onClick={() => setShowModal(true)}
            className={`flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left ${className}`}
          >
            <QuestionMarkCircleIcon className="h-4 w-4 mr-3" />
            App Tutorial
          </button>
        );

      case "floating":
      default:
        return (
          <button
            onClick={() => setShowModal(true)}
            className={`onboarding-help-button fixed bottom-6 right-6 z-40 p-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 ${className}`}
            title="Need help? Start the tutorial"
          >
            <QuestionMarkCircleIcon className="h-6 w-6" />
          </button>
        );
    }
  };

  return (
    <>
      {renderButton()}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="App Tutorial & Help"
        size="md"
      >
        <div className="space-y-6">
          {/* Progress indicator */}
          {state.hasCompletedOnboarding && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    Tutorial completed! ({getProgress()}%)
                  </p>
                </div>
              </div>
            </div>
          )}

          {!state.hasCompletedOnboarding && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <QuestionMarkCircleIcon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-800">
                    Tutorial in progress ({getProgress()}% complete)
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    You can resume where you left off or start over.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-600">
            <p className="mb-4">
              Our interactive tutorial will guide you through the key features
              of the platform:
            </p>
            <ul className="space-y-2">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Dashboard overview and navigation
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Market data and asset information
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                How to place your first order
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Education center and resources
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Profile setup and preferences
              </li>
            </ul>
          </div>

          <div className="flex space-x-3">
            {!state.hasCompletedOnboarding ? (
              <>
                <button
                  onClick={handleStartTour}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Continue Tutorial
                </button>
                <button
                  onClick={handleRestartTour}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Start Over
                </button>
              </>
            ) : (
              <button
                onClick={handleRestartTour}
                className="w-full inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Restart Tutorial
              </button>
            )}
          </div>

          <div className="text-xs text-gray-500 text-center">
            You can access this tutorial anytime from the help button on your
            dashboard.
          </div>
        </div>
      </Modal>
    </>
  );
}
