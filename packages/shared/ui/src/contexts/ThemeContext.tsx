/**
 * Theme Context for Metadata-Driven Theme Support
 * Provides theme management with metadata API integration and CSS custom properties
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

export type Theme = "light" | "dark" | string; // Allow custom theme names

// New interfaces to match the API
export interface ThemeVariantData {
  variant_id: string;
  base_theme_id: string;
  variant_name: string; // light, dark
  display_name: string;
  description?: string;
  is_default: boolean;
  is_active: boolean;
  supports_auto_switch: boolean;
  css_class_prefix?: string;
  media_query?: string;
  properties: Record<string, string>; // CSS custom properties
}

export interface BaseThemeData {
  base_theme_id: string;
  name: string; // professional, default
  display_name: string;
  description?: string;
  category?: string;
  is_system_theme: boolean;
  is_active: boolean;
  is_featured: boolean;
  version?: string;
  variants: ThemeVariantData[];
  tenant_id?: string;
}

// Flattened theme structure for easier use in components
export interface ThemeData {
  id: string; // base_theme_name/variant_name (e.g., "professional/dark")
  name: string; // display name
  description?: string;
  is_default: boolean;
  base_theme_name: string; // professional, default
  variant_name: string; // light, dark
  properties: Record<string, string>; // CSS custom properties
}

export interface ThemeContextValue {
  theme: string; // Current theme name
  themeData: ThemeData | null; // Current theme metadata
  availableThemes: ThemeData[]; // All available themes
  setTheme: (themeName: string) => void;
  toggleTheme: () => void;
  isLoading: boolean;
  error?: string;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_STORAGE_KEY = "ui_theme";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: string;
  tenantId?: string;
  userId?: string; // NEW: For user preferences
}

// Theme detection utilities
const detectSystemTheme = (): Theme => {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return "light";
};

const getStoredTheme = (): string | null => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      return stored;
    } catch (error) {
      console.warn("Failed to read theme from localStorage:", error);
    }
  }
  return null;
};

const storeTheme = (theme: string): void => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.warn("Failed to store theme in localStorage:", error);
    }
  }
};

// Apply CSS custom properties to document root
const applyCSSProperties = (
  properties: Record<string, string> | undefined | null
) => {
  if (typeof document !== "undefined") {
    const root = document.documentElement;

    if (!properties) {
      console.warn("⚠️ No theme properties provided to applyCSSProperties");
      return;
    }

    // Apply each CSS custom property
    Object.entries(properties).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = "professional/light", // Updated to new format
  tenantId,
  userId,
}) => {
  const [theme, setThemeState] = useState<string>(defaultTheme);
  const [themeData, setThemeData] = useState<ThemeData | null>(null);
  const [availableThemes, setAvailableThemes] = useState<ThemeData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isClient, setIsClient] = useState(false);

  // NEW: Fetch available themes from metadata API
  const fetchAvailableThemes = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      console.log(
        `🎨 Fetching available themes for tenant: ${tenantId || "global"}`
      );

      const response = await fetch(
        `http://localhost:8000/metadata/themes?tenant_id=${tenantId || ""}&active_only=true`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch themes: ${response.status}`);
      }

      const baseThemes: BaseThemeData[] = await response.json();

      // Flatten base themes and variants into individual theme options
      const flattenedThemes: ThemeData[] = [];

      baseThemes.forEach((baseTheme) => {
        baseTheme.variants.forEach((variant) => {
          flattenedThemes.push({
            id: `${baseTheme.name}/${variant.variant_name}`,
            name: `${baseTheme.display_name} - ${variant.display_name}`,
            description: variant.description || baseTheme.description,
            is_default: variant.is_default,
            base_theme_name: baseTheme.name,
            variant_name: variant.variant_name,
            properties: variant.properties,
          });
        });
      });

      setAvailableThemes(flattenedThemes);

      console.log(
        `✅ Loaded ${flattenedThemes.length} theme variants from ${baseThemes.length} base themes`
      );

      return flattenedThemes;
    } catch (err) {
      console.error(`❌ Failed to load themes:`, err);
      setError(err instanceof Error ? err.message : "Unknown error");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  // NEW: Fetch specific theme data from metadata API
  const fetchThemeData = useCallback(
    async (themeId: string) => {
      setIsLoading(true);
      setError(undefined);

      try {
        console.log(`🎨 Fetching theme data: ${themeId}`);

        // Handle both old format (themeName) and new format (baseTheme/variant)
        let baseThemeName: string;
        let variantName: string;

        if (themeId.includes("/")) {
          // New format: "professional/dark"
          [baseThemeName, variantName] = themeId.split("/");
        } else {
          // Try to map old format or find from available themes
          const foundTheme = availableThemes.find(
            (t) =>
              t.id === themeId ||
              t.base_theme_name === themeId ||
              t.variant_name === themeId
          );

          if (foundTheme) {
            baseThemeName = foundTheme.base_theme_name;
            variantName = foundTheme.variant_name;
          } else {
            // Fallback mapping for common names (works even without availableThemes)
            switch (themeId) {
              case "light":
                baseThemeName = "default";
                variantName = "light";
                break;
              case "dark":
                baseThemeName = "default";
                variantName = "dark";
                break;
              case "professional":
              case "professional-theme":
                baseThemeName = "professional";
                variantName = "light";
                break;
              case "professional-light":
                baseThemeName = "professional";
                variantName = "light";
                break;
              case "professional-dark":
                baseThemeName = "professional";
                variantName = "dark";
                break;
              default:
                // Default fallback
                baseThemeName = "professional"; // Use professional as default business theme
                variantName = "light";
                break;
            }
          }
        }

        console.log(
          `🎨 Mapped theme '${themeId}' to '${baseThemeName}/${variantName}'`
        );

        const response = await fetch(
          `http://localhost:8000/metadata/themes/${baseThemeName}/${variantName}?tenant_id=${tenantId || ""}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch theme: ${response.status}`);
        }

        const variantData: ThemeVariantData = await response.json();

        // Convert to our ThemeData format
        const themeData: ThemeData = {
          id: `${baseThemeName}/${variantName}`,
          name: variantData.display_name,
          description: variantData.description,
          is_default: variantData.is_default,
          base_theme_name: baseThemeName,
          variant_name: variantName,
          properties: variantData.properties,
        };

        setThemeData(themeData);

        // Apply CSS custom properties with null safety
        if (themeData && themeData.properties) {
          applyCSSProperties(themeData.properties);
          console.log(`✅ Applied theme: ${themeData.name} (${themeData.id})`);
        } else {
          console.warn(`⚠️ Theme ${themeId} has no properties to apply`);
        }

        return themeData;
      } catch (err) {
        console.error(`❌ Failed to load theme ${themeId}:`, err);
        setError(err instanceof Error ? err.message : "Unknown error");

        // Fallback to default light/dark mode
        const fallbackTheme = themeId.includes("dark") ? "dark" : "light";
        applyFallbackTheme(fallbackTheme);

        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [tenantId] // Removed availableThemes dependency to avoid circular deps - we have fallback mapping
  );

  // NEW: Fetch user's theme preferences with intelligent fallback
  const fetchUserThemePreferences = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      console.log(
        `🎨 Fetching user theme preferences for user: ${userId}, tenant: ${tenantId}`
      );

      const response = await fetch(
        `http://localhost:8000/metadata/themes/user-preferences?user_id=${userId || ""}&tenant_id=${tenantId || ""}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch user preferences: ${response.status}`);
      }

      const variantData: ThemeVariantData = await response.json();

      // Convert to our ThemeData format
      const themeData: ThemeData = {
        id: `${variantData.base_theme_id}/${variantData.variant_name}`,
        name: variantData.display_name,
        description: variantData.description,
        is_default: variantData.is_default,
        base_theme_name: "professional", // TODO: Extract from API response
        variant_name: variantData.variant_name,
        properties: variantData.properties,
      };

      setThemeData(themeData);
      setThemeState(`${themeData.base_theme_name}/${themeData.variant_name}`);

      // Apply CSS custom properties
      if (themeData && themeData.properties) {
        applyCSSProperties(themeData.properties);
        console.log(`✅ Applied user theme preference: ${themeData.name}`);
      }

      return themeData;
    } catch (err) {
      console.error(`❌ Failed to load user theme preferences:`, err);

      // Fallback to default theme loading
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [tenantId, userId]);

  // NEW: Apply fallback theme for light/dark mode
  const applyFallbackTheme = (mode: "light" | "dark") => {
    const fallbackProperties =
      mode === "dark"
        ? {
            "--background": "222.2 84% 4.9%",
            "--foreground": "210 40% 98%",
            "--primary-color": "217.2 91.2% 59.8%",
            "--card": "222.2 84% 4.9%",
            "--border": "217.2 32.6% 17.5%",
          }
        : {
            "--background": "0 0% 100%",
            "--foreground": "222.2 84% 4.9%",
            "--primary-color": "203 100% 45%",
            "--card": "0 0% 100%",
            "--border": "214.3 31.8% 91.4%",
          };

    applyCSSProperties(fallbackProperties);

    // Also apply the old class-based approach for compatibility
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(mode);
  };

  // Initialize themes on mount
  useEffect(() => {
    setIsClient(true);

    if (typeof window !== "undefined") {
      // NEW: Try user preferences first
      if (userId) {
        console.log("🎨 Using user preferences approach");
        fetchUserThemePreferences().then((userTheme) => {
          if (!userTheme) {
            // Fallback to available themes approach
            console.log("🎨 Falling back to available themes approach");
            fetchAvailableThemes().then((themes) => {
              let selectedTheme = defaultTheme;
              const stored = getStoredTheme();
              if (stored) {
                selectedTheme = stored;
              } else {
                const defaultFromAPI = themes.find(
                  (t: ThemeData) => t.is_default
                );
                if (defaultFromAPI) {
                  selectedTheme = defaultFromAPI.id;
                }
              }
              setThemeState(selectedTheme);
              fetchThemeData(selectedTheme);
            });
          }
        });
      } else {
        // LEGACY: Use available themes approach when no user
        console.log("🎨 Using legacy available themes approach (no user)");
        fetchAvailableThemes().then((themes) => {
          let selectedTheme = defaultTheme;
          const stored = getStoredTheme();
          if (stored) {
            selectedTheme = stored;
          } else {
            const defaultFromAPI = themes.find((t: ThemeData) => t.is_default);
            if (defaultFromAPI) {
              selectedTheme = defaultFromAPI.id;
            }
          }
          setThemeState(selectedTheme);
          fetchThemeData(selectedTheme);
        });
      }
    }
  }, [
    defaultTheme,
    userId,
    fetchAvailableThemes,
    fetchThemeData,
    fetchUserThemePreferences,
  ]);

  // NEW: Set theme with metadata loading
  const setTheme = useCallback(
    (newTheme: string) => {
      setThemeState(newTheme);
      storeTheme(newTheme);
      fetchThemeData(newTheme);
    },
    [fetchThemeData]
  );

  // NEW: Toggle between light/dark variants of current base theme
  const toggleTheme = useCallback(() => {
    if (!themeData) {
      // Fallback if no theme data
      const newMode = theme.includes("dark") ? "light" : "dark";
      setTheme(newMode);
      return;
    }

    // Find the opposite variant of the current base theme
    const currentBaseTheme = themeData.base_theme_name;
    const currentVariant = themeData.variant_name;
    const targetVariant = currentVariant === "light" ? "dark" : "light";

    // Look for the target variant in available themes
    const targetTheme = availableThemes.find(
      (t) =>
        t.base_theme_name === currentBaseTheme &&
        t.variant_name === targetVariant
    );

    if (targetTheme) {
      setTheme(targetTheme.id);
    } else {
      // Fallback to system light/dark toggle
      const newMode = currentVariant === "light" ? "dark" : "light";
      setTheme(`default/${newMode}`);
    }
  }, [theme, themeData, availableThemes, setTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeData,
        availableThemes,
        setTheme,
        toggleTheme,
        isLoading,
        error,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export default ThemeProvider;
