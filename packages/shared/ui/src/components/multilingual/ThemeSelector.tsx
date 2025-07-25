import React, { useState, useEffect } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../contexts/TranslationContext";
import { Sun, Moon } from "lucide-react";

export interface ThemeSelectorProps {
  variant?: "dropdown" | "toggle" | "buttons";
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabels?: boolean;
  onThemeChange?: (theme: "light" | "dark") => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  variant = "dropdown",
  size = "md",
  className = "",
  showLabels = false,
  onThemeChange,
}) => {
  const { theme, setTheme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Fix hydration by ensuring client-side only rendering after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    onThemeChange?.(newTheme);
    setIsOpen(false);
  };

  const sizeClasses = {
    sm: "text-sm px-2 py-1.5",
    md: "text-base px-3 py-2",
    lg: "text-lg px-4 py-3",
  };

  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-7 h-7",
  };

  // Use default aria-label during SSR to prevent hydration mismatch
  const ariaLabel = isClient
    ? t("select_theme", { ns: "auth" })
    : "Select theme";

  // Use stable theme during SSR
  const displayTheme = isClient ? theme : "light";

  if (variant === "toggle") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`
          flex items-center justify-center border rounded-md
          transition-colors cursor-pointer focus:outline-none 
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${sizeClasses[size]}
          ${
            displayTheme === "dark"
              ? "bg-gray-800 text-yellow-400 border-gray-600 hover:bg-gray-700"
              : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
          }
          ${className}
        `}
        aria-label={ariaLabel}
      >
        {isClient ? (
          displayTheme === "dark" ? (
            <Sun className={iconSizes[size]} />
          ) : (
            <Moon className={iconSizes[size]} />
          )
        ) : (
          // Fallback for SSR - simple div with same dimensions
          <div
            className={`${iconSizes[size]} flex items-center justify-center`}
          >
            {/* Simple moon icon for SSR */}
            <svg
              className={iconSizes[size]}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"
              />
            </svg>
          </div>
        )}
        {showLabels && (
          <span className="ml-2">
            {displayTheme === "dark" ? "Light" : "Dark"}
          </span>
        )}
      </button>
    );
  }

  if (variant === "dropdown") {
    return (
      <div className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            flex items-center space-x-2 border rounded-md 
            focus:outline-none focus:ring-2 focus:ring-blue-500 
            focus:border-blue-500 transition-colors cursor-pointer
            ${sizeClasses[size]}
            ${
              displayTheme === "dark"
                ? "bg-gray-800 text-white border-gray-600 hover:bg-gray-700"
                : "bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
            }
          `}
          aria-label={ariaLabel}
        >
          {displayTheme === "dark" ? (
            <Moon className={iconSizes[size]} />
          ) : (
            <Sun className={iconSizes[size]} />
          )}
          {showLabels && (
            <span>{displayTheme === "dark" ? "Dark" : "Light"}</span>
          )}
          <svg
            className={`w-4 h-4 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isOpen && (
          <div
            className={`
            absolute top-full left-0 mt-1 w-full rounded-md shadow-lg z-50
            ${
              displayTheme === "dark"
                ? "bg-gray-800 border-gray-600"
                : "bg-white border-gray-300"
            }
          `}
          >
            <button
              type="button"
              onClick={() => handleThemeChange("light")}
              className={`
                w-full flex items-center space-x-2 px-3 py-2 text-left
                focus:outline-none transition-colors cursor-pointer rounded-t-md
                ${
                  displayTheme === "light"
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-700"
                }
              `}
            >
              <Sun className={iconSizes[size]} />
              <span>Light</span>
              {displayTheme === "light" && (
                <svg
                  className="w-4 h-4 text-blue-500 ml-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleThemeChange("dark")}
              className={`
                w-full flex items-center space-x-2 px-3 py-2 text-left
                focus:outline-none transition-colors cursor-pointer rounded-b-md
                ${
                  displayTheme === "dark"
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-700"
                }
              `}
            >
              <Moon className={iconSizes[size]} />
              <span>Dark</span>
              {displayTheme === "dark" && (
                <svg
                  className="w-4 h-4 text-blue-500 ml-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  if (variant === "buttons") {
    return (
      <div className={`flex space-x-1 ${className}`}>
        <button
          type="button"
          onClick={() => handleThemeChange("light")}
          className={`
            flex items-center space-x-1 border rounded-md font-medium
            transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer
            ${
              displayTheme === "light"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }
            ${sizeClasses[size]}
          `}
        >
          <Sun className={iconSizes[size]} />
          {showLabels && <span>Light</span>}
        </button>
        <button
          type="button"
          onClick={() => handleThemeChange("dark")}
          className={`
            flex items-center space-x-1 border rounded-md font-medium
            transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer
            ${
              displayTheme === "dark"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }
            ${sizeClasses[size]}
          `}
        >
          <Moon className={iconSizes[size]} />
          {showLabels && <span>Dark</span>}
        </button>
      </div>
    );
  }

  return null;
};

export default ThemeSelector;
