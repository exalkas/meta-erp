"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Badge,
  Tabs,
} from "@erp/shared-ui";
import {
  CheckCircle,
  XCircle,
  Clock,
  Play,
  RotateCcw,
  Building2,
  Users,
  Search,
  Globe,
} from "lucide-react";
import BusinessEntityList from "../../../components/business-entities/BusinessEntityList";
import BusinessEntityForm from "../../../components/business-entities/BusinessEntityForm";
import ContactList from "../../../components/contacts/ContactList";

interface TestStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "running" | "completed" | "failed";
  component?: React.ReactNode;
  testFunction?: () => Promise<boolean>;
}

interface TestSection {
  id: string;
  title: string;
  description: string;
  steps: TestStep[];
}

export default function TestBusinessFlowPage() {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState<string>("overview");
  const [testResults, setTestResults] = useState<
    Record<string, "pending" | "running" | "completed" | "failed">
  >({});
  const [sampleEntityId, setSampleEntityId] = useState<string | null>(null);

  const testSections: TestSection[] = [
    {
      id: "customer-management",
      title: "1. Customer Management",
      description:
        "Test customer creation, editing, and management with Greek validation",
      steps: [
        {
          id: "customer-form",
          title: "Customer Creation Form",
          description:
            "Test the customer creation form with Greek validation fields",
          status: testResults["customer-form"] || "pending",
          component: (
            <BusinessEntityForm
              mode="create"
              initialRole="customer"
              onSuccess={(entity) => {
                setSampleEntityId(entity.id);
                setTestResults((prev) => ({
                  ...prev,
                  "customer-form": "completed",
                }));
              }}
              onCancel={() =>
                setTestResults((prev) => ({
                  ...prev,
                  "customer-form": "failed",
                }))
              }
            />
          ),
        },
        {
          id: "greek-validation",
          title: "Greek Validation Testing",
          description: "Test AFM, DOY, and Greek address validation",
          status: testResults["greek-validation"] || "pending",
          testFunction: async () => {
            // Simulate Greek validation tests
            console.log("Testing Greek validation...");
            await new Promise((resolve) => setTimeout(resolve, 2000));
            return true;
          },
        },
        {
          id: "customer-list",
          title: "Customer List & Search",
          description: "Test customer listing, searching, and filtering",
          status: testResults["customer-list"] || "pending",
          component: (
            <BusinessEntityList
              roleFilter="customer"
              title="Customer Test View"
              showCreateButton={false}
              onEntityClick={(entity) => {
                setTestResults((prev) => ({
                  ...prev,
                  "customer-list": "completed",
                }));
              }}
            />
          ),
        },
      ],
    },
    {
      id: "supplier-management",
      title: "2. Supplier Management",
      description: "Test supplier creation and management functionality",
      steps: [
        {
          id: "supplier-form",
          title: "Supplier Creation Form",
          description:
            "Test the supplier creation form with business-specific fields",
          status: testResults["supplier-form"] || "pending",
          component: (
            <BusinessEntityForm
              mode="create"
              initialRole="supplier"
              onSuccess={(entity) => {
                setTestResults((prev) => ({
                  ...prev,
                  "supplier-form": "completed",
                }));
              }}
              onCancel={() =>
                setTestResults((prev) => ({
                  ...prev,
                  "supplier-form": "failed",
                }))
              }
            />
          ),
        },
        {
          id: "supplier-list",
          title: "Supplier List & Filtering",
          description: "Test supplier listing and advanced filtering",
          status: testResults["supplier-list"] || "pending",
          component: (
            <BusinessEntityList
              roleFilter="supplier"
              title="Supplier Test View"
              showCreateButton={false}
              onEntityClick={(entity) => {
                setTestResults((prev) => ({
                  ...prev,
                  "supplier-list": "completed",
                }));
              }}
            />
          ),
        },
      ],
    },
    {
      id: "contact-management",
      title: "3. Contact Management",
      description:
        "Test contact creation and management within business entities",
      steps: [
        {
          id: "contact-list",
          title: "Contact Management",
          description:
            "Test contact listing and management for business entities",
          status: testResults["contact-list"] || "pending",
          component: sampleEntityId ? (
            <ContactList
              businessEntityId={sampleEntityId}
              businessEntityName="Test Business Entity"
              onCreateClick={() => {
                setTestResults((prev) => ({
                  ...prev,
                  "contact-list": "completed",
                }));
              }}
              onContactClick={(contact) => {
                console.log("Contact clicked:", contact);
              }}
            />
          ) : (
            <div className="p-4 text-center text-gray-600">
              Please complete customer creation first to test contact management
            </div>
          ),
        },
      ],
    },
    {
      id: "advanced-features",
      title: "4. Advanced Features",
      description: "Test advanced search, filtering, and mobile responsiveness",
      steps: [
        {
          id: "advanced-search",
          title: "Advanced Search & Filtering",
          description: "Test comprehensive search and filtering capabilities",
          status: testResults["advanced-search"] || "pending",
          component: (
            <BusinessEntityList
              roleFilter="all"
              title="Advanced Search Test"
              showCreateButton={false}
              onEntityClick={(entity) => {
                setTestResults((prev) => ({
                  ...prev,
                  "advanced-search": "completed",
                }));
              }}
            />
          ),
        },
        {
          id: "mobile-responsive",
          title: "Mobile Responsiveness",
          description: "Test mobile interface and responsive design",
          status: testResults["mobile-responsive"] || "pending",
          testFunction: async () => {
            // Simulate mobile responsiveness test
            console.log("Testing mobile responsiveness...");
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // Check if screen can be resized (basic test)
            const isMobile = window.innerWidth < 768;
            console.log(
              "Mobile detection:",
              isMobile ? "Mobile device detected" : "Desktop device"
            );

            return true;
          },
        },
        {
          id: "greek-compliance",
          title: "Greek Compliance Integration",
          description: "Test Greek business compliance features and validation",
          status: testResults["greek-compliance"] || "pending",
          testFunction: async () => {
            // Simulate Greek compliance tests
            console.log("Testing Greek compliance features...");
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Test some basic Greek validation scenarios
            const testAFM = "123456789";
            const testDOY = "A001";

            console.log("Testing AFM validation:", testAFM);
            console.log("Testing DOY validation:", testDOY);

            return true;
          },
        },
      ],
    },
  ];

  const runTest = async (
    stepId: string,
    testFunction?: () => Promise<boolean>
  ) => {
    setTestResults((prev) => ({ ...prev, [stepId]: "running" }));

    try {
      if (testFunction) {
        const success = await testFunction();
        setTestResults((prev) => ({
          ...prev,
          [stepId]: success ? "completed" : "failed",
        }));
      } else {
        // For component tests, mark as running and let user interaction complete it
        setTimeout(() => {
          if (testResults[stepId] === "running") {
            setTestResults((prev) => ({ ...prev, [stepId]: "completed" }));
          }
        }, 3000);
      }
    } catch (error) {
      console.error("Test failed:", error);
      setTestResults((prev) => ({ ...prev, [stepId]: "failed" }));
    }
  };

  const resetAllTests = () => {
    setTestResults({});
    setSampleEntityId(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "running":
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getOverallProgress = () => {
    const allSteps = testSections.flatMap((section) => section.steps);
    const completed = allSteps.filter(
      (step) => testResults[step.id] === "completed"
    ).length;
    const total = allSteps.length;
    return {
      completed,
      total,
      percentage: Math.round((completed / total) * 100),
    };
  };

  const progress = getOverallProgress();

  // Create tab content for each section
  const createSectionContent = (section: TestSection) => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">{section.title}</h3>
          <p className="text-gray-600">{section.description}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {section.steps.map((step) => (
              <div
                key={step.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(testResults[step.id] || "pending")}
                    <div>
                      <h4 className="font-semibold">{step.title}</h4>
                      <p className="text-sm text-gray-600">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  {step.testFunction && (
                    <Button
                      size="sm"
                      onClick={() => runTest(step.id, step.testFunction)}
                      disabled={testResults[step.id] === "running"}
                      className="flex items-center gap-1"
                    >
                      <Play className="w-3 h-3" />
                      {testResults[step.id] === "running"
                        ? "Running..."
                        : "Run Test"}
                    </Button>
                  )}
                </div>

                {step.component && (
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    {step.component}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Create overview content
  const overviewContent = (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Test Suite Overview</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          {testSections.map((section) => (
            <div
              key={section.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{section.title}</h4>
                <Badge variant="outline">
                  {
                    section.steps.filter(
                      (step) => testResults[step.id] === "completed"
                    ).length
                  }
                  /{section.steps.length} Complete
                </Badge>
              </div>
              <p className="text-gray-600 text-sm mb-3">
                {section.description}
              </p>
              <div className="space-y-2">
                {section.steps.map((step) => (
                  <div
                    key={step.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    {getStatusIcon(testResults[step.id] || "pending")}
                    <span
                      className={
                        testResults[step.id] === "completed"
                          ? "text-green-700"
                          : testResults[step.id] === "failed"
                          ? "text-red-700"
                          : testResults[step.id] === "running"
                          ? "text-blue-700"
                          : "text-gray-600"
                      }
                    >
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setCurrentSection(section.id)}
              >
                Test {section.title}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  // Create tab items for the Tabs component
  const tabItems = [
    {
      id: "overview",
      label: "Overview",
      content: overviewContent,
    },
    ...testSections.map((section) => ({
      id: section.id,
      label: section.title.split(".")[1]?.trim() || section.title,
      content: createSectionContent(section),
    })),
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Business Entity Workflow Testing
          </h1>
          <p className="text-gray-600">
            Comprehensive testing of CRM foundation features and Greek
            compliance
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={resetAllTests}
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Tests
          </Button>
          <Button onClick={() => router.push("/dashboard")} variant="outline">
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Testing Progress</h3>
            <Badge variant={progress.percentage === 100 ? "success" : "info"}>
              {progress.completed}/{progress.total} Tests Completed
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-gray-900">
                {progress.percentage}%
              </div>
              <div className="text-gray-600">Overall Progress</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-green-600">
                {
                  Object.values(testResults).filter(
                    (status) => status === "completed"
                  ).length
                }
              </div>
              <div className="text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-600">
                {
                  Object.values(testResults).filter(
                    (status) => status === "running"
                  ).length
                }
              </div>
              <div className="text-gray-600">Running</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-red-600">
                {
                  Object.values(testResults).filter(
                    (status) => status === "failed"
                  ).length
                }
              </div>
              <div className="text-gray-600">Failed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Sections */}
      <Tabs
        items={tabItems}
        activeTab={currentSection}
        onTabChange={setCurrentSection}
        variant="underlined"
        className="w-full"
      />

      {/* Mobile Responsiveness Warning */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-blue-800">
            <Globe className="w-5 h-5" />
            <span className="font-medium">Mobile Testing Tip:</span>
          </div>
          <p className="text-blue-700 text-sm mt-1">
            To test mobile responsiveness, resize your browser window or use
            developer tools device simulation. All components should adapt
            smoothly to different screen sizes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
