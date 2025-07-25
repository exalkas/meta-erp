import React, { useState, useEffect, forwardRef } from "react";
import { Eye, EyeOff } from "lucide-react";

interface SimplePasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  error?: boolean;
}

export const SimplePasswordInput = forwardRef<
  HTMLInputElement,
  SimplePasswordInputProps
>(({ className = "", error = false, ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="relative">
      <input
        ref={ref}
        type={showPassword ? "text" : "password"}
        className={`w-full px-3 py-2 pr-10 rounded-md border transition-colors 
        focus:outline-none focus:ring-2 focus:ring-blue-500 
        focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed 
        border-gray-300 bg-white text-gray-900 ${
          error
            ? "border-red-500 focus:border-red-500 focus:ring-red-100"
            : "border-gray-200 hover:border-gray-300"
        } ${className}`}
        style={{
          minHeight: "40px",
          fontSize: "16px",
          lineHeight: "1.5",
        }}
        {...props}
      />

      {isClient && (
        <button
          type="button"
          onClick={togglePassword}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800 transition-colors focus:outline-none"
          tabIndex={-1}
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5 text-gray-600" />
          ) : (
            <Eye className="h-5 w-5 text-gray-600" />
          )}
        </button>
      )}
    </div>
  );
});

SimplePasswordInput.displayName = "SimplePasswordInput";
