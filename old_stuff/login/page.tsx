"use client";

import React, { useState, useEffect } from "react";
import {
  LoginForm,
  AppName,
  useAuth,
  LanguageSelector,
  useLanguage,
  useTranslation,
  ThemeSelector,
  useTheme,
  Logo,
} from "@erp/shared-ui";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const { login, isLoading, error, clearError } = useAuth();
  const { language } = useLanguage();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Track client-side hydration
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Use stable theme during SSR
  const displayTheme = isClient ? theme : "light";

  const handleLogin = async (data: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }) => {
    try {
      // Clear any previous errors
      clearError();

      console.log("Attempting login...");

      // Call the real authentication login function
      await login(data);

      console.log("Login successful, redirecting...");

      // Get redirect URL from query params or default to dashboard
      const redirectTo = searchParams.get("redirect") || "/dashboard";

      console.log("Redirecting to:", redirectTo);

      // Wait for cookie to be set before redirecting
      const waitForCookie = () => {
        let attempts = 0;
        const maxAttempts = 20; // 1 second total wait time

        const checkCookie = () => {
          const hasCookie = document.cookie.includes("auth_token=");
          attempts++;

          if (hasCookie) {
            console.log("Cookie confirmed, redirecting...");
            router.push(redirectTo);
          } else if (attempts >= maxAttempts) {
            console.log("Cookie timeout, redirecting anyway...");
            router.push(redirectTo);
          } else {
            // Check again in 50ms
            setTimeout(checkCookie, 50);
          }
        };
        checkCookie();
      };

      waitForCookie();
    } catch (error) {
      // Error is already handled by the AuthContext and will show in LoginForm
      console.error("Login failed:", error);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 transition-colors ${
        displayTheme === "dark"
          ? "bg-gradient-to-br from-gray-900 to-gray-800"
          : "bg-gradient-to-br from-maritime-blue to-blue-900"
      }`}
    >
      {/* Theme and Language Selectors - Top Right */}
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
        <ThemeSelector variant="toggle" size="sm" />
        <LanguageSelector
          variant="dropdown"
          size="sm"
          showFlag={true}
          showNativeName={true}
          theme={displayTheme}
        />
      </div>

      <div className="w-full max-w-lg lg:max-w-xl xl:max-w-2xl">
        {/* Login Form Container with proper spacing */}
        <div
          className={`rounded-2xl shadow-2xl overflow-hidden transition-colors ${
            displayTheme === "dark" ? "bg-gray-800" : "bg-white"
          }`}
        >
          {/* Header Section - More compact */}
          <div
            className={`px-8 py-8 text-center transition-colors ${
              displayTheme === "dark"
                ? "bg-gradient-to-r from-gray-700 to-gray-600"
                : "bg-gradient-to-r from-maritime-blue to-blue-700"
            }`}
          >
            <div className="mx-auto mb-4 flex items-center justify-center">
              <Logo size="lg" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
              Axiologic
            </h1>
            <p
              className={`${
                displayTheme === "dark" ? "text-gray-200" : "text-blue-100"
              }`}
            >
              {t("company_description", { ns: "auth" })}
            </p>
          </div>

          {/* Form Section - Reduced padding */}
          <div className="px-8 py-6 lg:px-10 lg:py-8">
            <div className="mb-4 text-center">
              <h2
                className={`text-xl lg:text-2xl font-bold mb-2 transition-colors ${
                  displayTheme === "dark" ? "text-white" : "text-gray-800"
                }`}
              >
                {t("welcome", { ns: "auth" })}
              </h2>
              <p
                className={`transition-colors ${
                  displayTheme === "dark" ? "text-gray-300" : "text-gray-600"
                }`}
              >
                {t("sign_in_prompt", { ns: "auth" })}
              </p>
            </div>

            <LoginForm
              app={AppName.CLIENT}
              onLogin={handleLogin}
              isLoading={isLoading}
              error={error}
              language={language}
            />
          </div>
        </div>

        {/* Footer with copyright */}
        <div className="text-center mt-6">
          <p
            className={`text-sm transition-colors ${
              displayTheme === "dark" ? "text-gray-300" : "text-blue-100"
            }`}
          >
            © {new Date().getFullYear()} Alkas Software.{" "}
            {t("all_rights_reserved", { ns: "auth" })}
          </p>
        </div>
      </div>
    </div>
  );
}
