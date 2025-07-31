/**
 * Multi-App Login Form Component
 * Reusable login form with Greek localization and app-specific styling
 */

import React, { useState, useEffect, useMemo } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { SimplePasswordInput } from "../ui/SimplePasswordInput";
import { Alert } from "../ui/Alert";
import { Loader2 } from "lucide-react";
import { AppName, APP_CONFIGS } from "../../types";

interface LoginFormProps {
  app: AppName;
  onLogin: (data: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }) => Promise<void>;
  isLoading?: boolean;
  error?: string;
  language?: "el" | "en";
}

export const LoginForm: React.FC<LoginFormProps> = ({
  app,
  onLogin,
  isLoading = false,
  error,
  language = "el",
}) => {
  console.log("🏗️ LoginForm: Component rendered with props:", {
    hasOnLogin: !!onLogin,
    onLoginType: typeof onLogin,
    app,
    language,
    isLoading,
    hasError: !!error,
  });

  const [isClient, setIsClient] = useState(false);
  const config = APP_CONFIGS[app];

  // Fix hydration error by ensuring icons only render on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Create login schema with language-specific messages
  const loginSchema = useMemo(() => {
    const errorMessages = {
      email: {
        required:
          language === "el"
            ? "Το email είναι υποχρεωτικό"
            : "Email is required",
        invalid:
          language === "el" ? "Μη έγκυρη μορφή email" : "Invalid email format",
      },
      password: {
        required:
          language === "el"
            ? "Ο κωδικός είναι υποχρεωτικός"
            : "Password is required",
        minLength:
          language === "el"
            ? "Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες"
            : "Password must be at least 8 characters",
      },
    };

    return z.object({
      email: z
        .string()
        .min(1, { message: errorMessages.email.required })
        .email({ message: errorMessages.email.invalid }),
      password: z
        .string()
        .min(1, { message: errorMessages.password.required })
        .min(8, { message: errorMessages.password.minLength }),
      rememberMe: z.boolean().optional().default(false),
    });
  }, [language]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<{
    email: string;
    password: string;
    rememberMe?: boolean;
  }>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit: SubmitHandler<{
    email: string;
    password: string;
    rememberMe?: boolean;
  }> = async (data) => {
    console.log("🚀 LoginForm: Form submitted with data:", {
      email: data.email,
      rememberMe: data.rememberMe,
      hasOnLogin: !!onLogin,
      onLoginType: typeof onLogin,
    });

    try {
      console.log("🔐 LoginForm: Calling onLogin callback...");
      await onLogin(data);
      console.log("✅ LoginForm: onLogin callback completed successfully");
    } catch (error) {
      console.error("❌ LoginForm: Login failed:", error);
    }
  };

  const t = (key: string) => {
    const translations = {
      el: {
        signIn: "Σύνδεση",
        signInTo: "Σύνδεση στο",
        email: "Email",
        password: "Κωδικός Πρόσβασης",
        rememberMe: "Θυμήσου με",
        forgotPassword: "Ξεχάσατε τον κωδικό σας;",
        signInButton: "Σύνδεση",
        signingIn: "Συνδέεται...",
        noAccount: "Δεν έχω λογαριασμό",
        createAccount: "Δημιουργία λογαριασμού",
        showPassword: "Εμφάνιση κωδικού",
        hidePassword: "Απόκρυψη κωδικού",
      },
      en: {
        signIn: "Sign In",
        signInTo: "Sign in to",
        email: "Email",
        password: "Password",
        rememberMe: "Remember me",
        forgotPassword: "",
        signInButton: "Sign In",
        signingIn: "Signing in...",
        noAccount: "I don't have an account",
        createAccount: "Create account",
        showPassword: "Show password",
        hidePassword: "Hide password",
      },
    };
    return (
      translations[language][
        key as keyof (typeof translations)[typeof language]
      ] || key
    );
  };

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Error Alert */}
        {error && <Alert type="error" variant="filled" message={error} />}

        {/* Email Field */}
        <div className="space-y-3">
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-gray-800 mb-2"
          >
            {t("email")}
          </label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              {...register("email")}
              className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:ring-2 focus:ring-[#0066CC]/20 focus:border-[#0066CC] bg-white text-gray-900 ${
                errors.email
                  ? "border-red-500 focus:border-red-500 focus:ring-red-100"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            />
          </div>
          {errors.email && (
            <p
              className="text-sm flex items-center gap-1 mt-1"
              style={{ color: "#dc2626" }}
            >
              <span
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: "#dc2626" }}
              ></span>
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-3 mt-4">
          <label
            htmlFor="password"
            className="block text-sm font-semibold text-gray-800 mb-2"
          >
            {t("password")}
          </label>

          <SimplePasswordInput
            id="password"
            placeholder="••••••••"
            {...register("password")}
            error={!!errors.password}
          />

          {errors.password && (
            <p
              className="text-sm flex items-center gap-1 mt-1"
              style={{ color: "#dc2626" }}
            >
              <span
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: "#dc2626" }}
              ></span>
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              {...register("rememberMe")}
              className="h-4 w-4 text-[#0066CC] focus:ring-[#0066CC]/20 border-gray-300 rounded transition-colors"
            />
            <label
              htmlFor="remember-me"
              className="ml-3 text-sm text-gray-700 cursor-pointer"
            >
              {t("rememberMe")}
            </label>
          </div>
          <button
            type="button"
            className="text-sm font-medium transition-colors underline"
            style={{
              color: "#0066CC",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#0052a3")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#0066CC")}
          >
            {t("forgotPassword")}
          </button>
        </div>

        {/* Login Button */}
        <div className="pt-4 mt-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#0066CC] hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none disabled:opacity-70 shadow-lg hover:shadow-xl"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                {isClient && <Loader2 className="h-5 w-5 animate-spin" />}
                <span>{t("signingIn")}</span>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <span>{t("signInButton")}</span>
              </div>
            )}
          </Button>
        </div>
      </form>

      {/* Don't have an account section */}
      <div className="text-center pt-4 border-t border-gray-100 mt-4">
        <p className="text-sm text-gray-600">
          {t("noAccount")}{" "}
          <a
            href="/"
            className="text-sm font-medium transition-colors"
            style={{
              color: "#0066CC",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#0052a3")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#0066CC")}
          >
            {t("createAccount")}
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
