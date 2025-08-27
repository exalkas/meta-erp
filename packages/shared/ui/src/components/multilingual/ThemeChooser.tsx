import React, { useState, useEffect } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { useTranslation } from "../../contexts/TranslationContext";
import { Palette, Check, ChevronDown } from "lucide-react";

export interface ThemeChooserProps {
  variant?: "dropdown" | "grid" | "list";
  size?: "sm" | "md" | "lg";
  className?: string;
  showPreview?: boolean;
  onThemeChange?: (baseTheme: string) => void;
}

export const ThemeChooser: React.FC<ThemeChooserProps> = ({
  variant = "dropdown",
  size = "md",
  className = "",
  showPreview = true,
  onThemeChange,
}) => {
  const { theme, themeData, availableThemes, setTheme } = useTheme();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Fix hydration by ensuring client-side only rendering after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get unique base themes (group by base_theme_name)
  const baseThemes = React.useMemo(() => {
    const uniqueThemes = new Map();

    availableThemes.forEach((theme) => {
      if (!uniqueThemes.has(theme.base_theme_name)) {
        uniqueThemes.set(theme.base_theme_name, {
          name: theme.base_theme_name,
          display_name:
            theme.name?.replace(/\s+(Light|Dark)\s+Mode$/, "") ||
            theme.base_theme_name,
          description: theme.description,
          category: "business", // Default since ThemeData doesn't have category
          is_featured: false, // Default since ThemeData doesn't have is_featured
          // Find light variant for preview
          lightVariant: availableThemes.find(
            (t) =>
              t.base_theme_name === theme.base_theme_name &&
              t.variant_name === "light"
          ),
          // Find dark variant
          darkVariant: availableThemes.find(
            (t) =>
              t.base_theme_name === theme.base_theme_name &&
              t.variant_name === "dark"
          ),
        });
      }
    });

    return Array.from(uniqueThemes.values()).sort((a, b) => {
      // Featured themes first, then alphabetical
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return a.display_name.localeCompare(b.display_name);
    });
  }, [availableThemes]);

  const currentBaseTheme = themeData?.base_theme_name || "default";
  const currentVariant = themeData?.variant_name || "light";

  const handleThemeChange = (baseThemeName: string) => {
    // Find the appropriate variant (keep current variant if available, otherwise default to light)
    const targetTheme =
      availableThemes.find(
        (t) =>
          t.base_theme_name === baseThemeName &&
          t.variant_name === currentVariant
      ) ||
      availableThemes.find(
        (t) => t.base_theme_name === baseThemeName && t.variant_name === "light"
      );

    if (targetTheme) {
      setTheme(targetTheme.id);
      onThemeChange?.(baseThemeName);
    }
    setIsOpen(false);
  };

  const sizeClasses = {
    sm: "text-sm px-2 py-1.5",
    md: "text-base px-3 py-2",
    lg: "text-lg px-4 py-3",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  // Use default aria-label during SSR to prevent hydration mismatch
  const ariaLabel = isClient
    ? t("choose_theme", { ns: "common" })
    : "Choose theme";

  const currentThemeDisplay = baseThemes.find(
    (bt) => bt.name === currentBaseTheme
  );

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
              currentVariant === "dark"
                ? "bg-gray-800 text-white border-gray-600 hover:bg-gray-700"
                : "bg-white text-gray-900 border-gray-300 hover:bg-gray-50"
            }
          `}
          aria-label={ariaLabel}
        >
          <Palette className={iconSizes[size]} />
          <span>{currentThemeDisplay?.display_name || "Default"}</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div
            className={`
              absolute top-full left-0 mt-1 min-w-full border rounded-md shadow-lg z-50
              ${
                currentVariant === "dark"
                  ? "bg-gray-800 border-gray-600"
                  : "bg-white border-gray-300"
              }
            `}
          >
            {baseThemes.map((baseTheme) => (
              <button
                key={baseTheme.name}
                type="button"
                onClick={() => handleThemeChange(baseTheme.name)}
                className={`
                  w-full flex items-center space-x-3 px-3 py-2 text-left
                  focus:outline-none transition-colors cursor-pointer
                  ${
                    baseTheme.name === currentBaseTheme
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-700"
                  }
                  ${baseTheme === baseThemes[0] ? "rounded-t-md" : ""}
                  ${baseTheme === baseThemes[baseThemes.length - 1] ? "rounded-b-md" : ""}
                `}
              >
                <Palette className={iconSizes[size]} />
                <div className="flex-1">
                  <div className="font-medium">{baseTheme.display_name}</div>
                  {baseTheme.description && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {baseTheme.description}
                    </div>
                  )}
                </div>
                {showPreview && baseTheme.lightVariant && (
                  <div className="flex space-x-1">
                    {/* Light variant preview */}
                    <div
                      className="w-4 h-4 rounded border"
                      style={{
                        backgroundColor: `hsl(${
                          baseTheme.lightVariant.properties?.["--background"] ||
                          "0 0% 100%"
                        })`,
                      }}
                    />
                    {/* Dark variant preview */}
                    <div
                      className="w-4 h-4 rounded border"
                      style={{
                        backgroundColor:
                          baseTheme.darkVariant?.properties?.["--background"] ||
                          "#1f2937",
                      }}
                    />
                  </div>
                )}
                {baseTheme.name === currentBaseTheme && (
                  <Check className="w-4 h-4 text-blue-500" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (variant === "grid") {
    return (
      <div className={`grid gap-3 ${className}`}>
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          Choose Theme
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {baseThemes.map((baseTheme) => (
            <button
              key={baseTheme.name}
              type="button"
              onClick={() => handleThemeChange(baseTheme.name)}
              className={`
                relative p-3 border rounded-lg text-left
                focus:outline-none focus:ring-2 focus:ring-blue-500 
                transition-colors cursor-pointer
                ${
                  baseTheme.name === currentBaseTheme
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500"
                }
              `}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Palette className={iconSizes[size]} />
                <span className="font-medium">{baseTheme.display_name}</span>
                {baseTheme.name === currentBaseTheme && (
                  <Check className="w-4 h-4 text-blue-500 ml-auto" />
                )}
              </div>
              {baseTheme.description && (
                <p className="text-xs text-gray-500 mb-2">
                  {baseTheme.description}
                </p>
              )}
              {showPreview && (
                <div className="flex space-x-1">
                  <div
                    className="w-6 h-6 rounded border"
                    style={{
                      backgroundColor:
                        baseTheme.lightVariant?.properties?.["--background"] ||
                        "#ffffff",
                    }}
                    title="Light variant"
                  />
                  <div
                    className="w-6 h-6 rounded border"
                    style={{
                      backgroundColor:
                        baseTheme.darkVariant?.properties?.["--background"] ||
                        "#1f2937",
                    }}
                    title="Dark variant"
                  />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className={`space-y-2 ${className}`}>
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          Choose Theme
        </h3>
        {baseThemes.map((baseTheme) => (
          <button
            key={baseTheme.name}
            type="button"
            onClick={() => handleThemeChange(baseTheme.name)}
            className={`
              w-full flex items-center space-x-3 p-3 border rounded-md text-left
              focus:outline-none focus:ring-2 focus:ring-blue-500 
              transition-colors cursor-pointer
              ${
                baseTheme.name === currentBaseTheme
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500"
              }
            `}
          >
            <Palette className={iconSizes[size]} />
            <div className="flex-1">
              <div className="font-medium">{baseTheme.display_name}</div>
              {baseTheme.description && (
                <div className="text-xs text-gray-500 mt-0.5">
                  {baseTheme.description}
                </div>
              )}
            </div>
            {showPreview && (
              <div className="flex space-x-1">
                <div
                  className="w-4 h-4 rounded border"
                  style={{
                    backgroundColor:
                      baseTheme.lightVariant?.properties?.["--background"] ||
                      "#ffffff",
                  }}
                />
                <div
                  className="w-4 h-4 rounded border"
                  style={{
                    backgroundColor:
                      baseTheme.darkVariant?.properties?.["--background"] ||
                      "#1f2937",
                  }}
                />
              </div>
            )}
            {baseTheme.name === currentBaseTheme && (
              <Check className="w-4 h-4 text-blue-500" />
            )}
          </button>
        ))}
      </div>
    );
  }

  return null;
};
