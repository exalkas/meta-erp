"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  TranslationProvider,
  ThemeProvider,
  ProtectedRoute,
} from "@erp/shared-ui";

/**
 * Blueprint Review & Approval Page
 *
 * Reviews the generated application blueprint and provides approval workflow
 */

export default function BlueprintReviewPage() {
  const params = useParams();
  const router = useRouter();
  const [blueprint, setBlueprint] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tenantId = "89f84fea-b5b9-413c-945b-002c7fd9555d";
  const userId = "01111111-1111-1111-1111-111111111111";
  const blueprintId = params.blueprintId as string;

  useEffect(() => {
    // Try to get blueprint from session storage first (from requirements form)
    if (typeof window !== "undefined") {
      const storedBlueprint = sessionStorage.getItem("app-builder-blueprint");
      if (storedBlueprint) {
        try {
          const parsed = JSON.parse(storedBlueprint);
          setBlueprint(parsed);
          setLoading(false);
          return;
        } catch (e) {
          console.error("Failed to parse stored blueprint:", e);
        }
      }
    }

    // TODO: Fetch blueprint from API if not in session storage
    // This would call: GET /api/v1/app-builder/blueprints/{blueprintId}

    // For now, show a placeholder
    setLoading(false);
    setError("Blueprint not found. Please start from the requirements form.");
  }, [blueprintId]);

  if (loading) {
    return (
      <ProtectedRoute
        requiredPermissions={["TENANT.APPLICATIONS.BUILDER.ACCESS"]}
        redirectToLogin={true}
      >
        <TranslationProvider tenantId={tenantId}>
          <ThemeProvider tenantId={tenantId} userId={userId}>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </ThemeProvider>
        </TranslationProvider>
      </ProtectedRoute>
    );
  }

  if (error || !blueprint) {
    return (
      <ProtectedRoute
        requiredPermissions={["TENANT.APPLICATIONS.BUILDER.ACCESS"]}
        redirectToLogin={true}
      >
        <TranslationProvider tenantId={tenantId}>
          <ThemeProvider tenantId={tenantId} userId={userId}>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
                <h2 className="text-xl font-semibold text-red-600 mb-4">
                  Blueprint Not Found
                </h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <button
                  onClick={() => router.push("/app-builder")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Start New Application
                </button>
              </div>
            </div>
          </ThemeProvider>
        </TranslationProvider>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute
      requiredPermissions={["TENANT.APPLICATIONS.BUILDER.ACCESS"]}
      redirectToLogin={true}
    >
      <TranslationProvider tenantId={tenantId}>
        <ThemeProvider tenantId={tenantId} userId={userId}>
          <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Application Blueprint Review
                </h1>
                <p className="text-gray-600">
                  Review the generated blueprint for: {blueprint.project_name}
                </p>
              </div>

              {/* Blueprint Overview */}
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Blueprint Overview
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-2">Timeline</h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {blueprint.estimated_timeline_days} days
                    </p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-medium text-green-900 mb-2">
                      Cost Estimate
                    </h3>
                    <p className="text-2xl font-bold text-green-600">
                      ${blueprint.estimated_cost?.toLocaleString() || "TBD"}
                    </p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-medium text-purple-900 mb-2">
                      Complexity
                    </h3>
                    <p className="text-2xl font-bold text-purple-600">
                      {(blueprint.complexity_score * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Selected Template */}
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Selected Template
                </h2>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900">
                    {blueprint.selected_template?.name}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    {blueprint.selected_template?.description}
                  </p>
                  <div className="mt-3">
                    <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                      {blueprint.selected_template?.app_type}
                    </span>
                  </div>
                </div>
              </div>

              {/* Selected Components */}
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Selected Components
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {blueprint.selected_components?.map(
                    (component: any, index: number) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <h3 className="font-medium text-gray-900">
                          {component.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {component.category}
                        </p>
                        <p className="text-xs text-blue-600 mt-2">
                          {component.installation_time_hours}h installation
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Recommendations */}
              {blueprint.recommendations &&
                blueprint.recommendations.length > 0 && (
                  <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Recommendations
                    </h2>

                    <ul className="space-y-2">
                      {blueprint.recommendations.map(
                        (rec: string, index: number) => (
                          <li
                            key={index}
                            className="flex items-start space-x-2"
                          >
                            <span className="text-blue-600 mt-1">•</span>
                            <span className="text-gray-700">{rec}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

              {/* Risk Factors */}
              {blueprint.risk_factors && blueprint.risk_factors.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Risk Factors
                  </h2>

                  <ul className="space-y-2">
                    {blueprint.risk_factors.map(
                      (risk: string, index: number) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-red-600 mt-1">⚠</span>
                          <span className="text-gray-700">{risk}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Approval Actions
                </h2>

                <div className="flex justify-between items-center">
                  <div className="flex space-x-4">
                    <button
                      onClick={() => router.push("/app-builder")}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Modify Requirements
                    </button>
                  </div>

                  <div className="flex space-x-4">
                    <button className="px-4 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50">
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Start build process
                        alert(
                          "Build process would start here. This will be implemented in the next task."
                        );
                      }}
                      className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Approve & Start Build
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ThemeProvider>
      </TranslationProvider>
    </ProtectedRoute>
  );
}
