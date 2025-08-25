"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { Bars3Icon } from "@heroicons/react/24/outline";
import DashboardNavigation from "./DashboardNavigation";
import { OnboardingProvider } from "@/lib/contexts/OnboardingContext";
import OnboardingTour from "./onboarding/OnboardingTour";
import OnboardingHelp from "./onboarding/OnboardingHelp";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [authLoading, setAuthLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check if screen is mobile size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    // Don't check auth on public pages
    const publicPages = ["/", "/login", "/signup"];
    if (publicPages.includes(pathname)) {
      setAuthLoading(false);
      return;
    }

    // Check authentication for dashboard pages
    if (!loading) {
      if (!user) {
        router.push("/login");
        return;
      }
      setAuthLoading(false);
    }
  }, [user, loading, router, pathname]);

  // Show loading spinner while checking auth
  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  // Don't show navigation on public pages
  const publicPages = ["/", "/login", "/signup"];
  if (publicPages.includes(pathname)) {
    return <>{children}</>;
  }

  // Show navigation for authenticated dashboard pages
  return (
    <OnboardingProvider>
      <div className="flex min-h-screen bg-gray-100 relative">
        <DashboardNavigation
          isMobile={isMobile}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />
        <main className="flex-1 overflow-auto min-w-0">
          {/* Mobile header with burger button */}
          {isMobile && (
            <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex justify-between items-center md:hidden">
              <div className="flex items-center">
                <div className="bg-green-600 text-white p-1.5 rounded-lg mr-2">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                </div>
                <h1 className="text-lg font-semibold text-gray-900">
                  GreenTrade
                </h1>
              </div>
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                aria-label="Open navigation menu"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
            </div>
          )}
          <div className="p-6 dashboard-container">{children}</div>
        </main>

        {/* Onboarding components */}
        <OnboardingTour />
        <OnboardingHelp />
      </div>
    </OnboardingProvider>
  );
}
