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

export interface ThemeData {
  theme_id: string;
  name: string;
  description?: string;
  is_default: boolean;
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
  tenantId?: string; // NEW: For metadata API
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
  defaultTheme = "maritime-theme",
  tenantId,
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
        `/api/metadata/themes?tenant_id=${tenantId || ""}&active_only=true`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch themes: ${response.status}`);
      }

      const themes = await response.json();
      setAvailableThemes(themes);

      console.log(`✅ Loaded ${themes.length} available themes`);

      return themes;
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
    async (themeName: string) => {
      setIsLoading(true);
      setError(undefined);

      try {
        console.log(`🎨 Fetching theme data: ${themeName}`);

        const response = await fetch(
          `/api/metadata/themes/${themeName}?tenant_id=${tenantId || ""}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch theme: ${response.status}`);
        }

        const themeData = await response.json();
        setThemeData(themeData);

        // Apply CSS custom properties with null safety
        if (themeData && themeData.properties) {
          applyCSSProperties(themeData.properties);
          console.log(`✅ Applied theme: ${themeData.name}`);
        } else {
          console.warn(`⚠️ Theme ${themeName} has no properties to apply`);
        }

        return themeData;
      } catch (err) {
        console.error(`❌ Failed to load theme ${themeName}:`, err);
        setError(err instanceof Error ? err.message : "Unknown error");

        // Fallback to default light/dark mode
        const fallbackTheme = themeName.includes("dark") ? "dark" : "light";
        applyFallbackTheme(fallbackTheme);

        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [tenantId]
  );

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
      // Load available themes first
      fetchAvailableThemes().then((themes) => {
        let selectedTheme = defaultTheme;

        // Try to get from localStorage first
        const stored = getStoredTheme();
        if (stored) {
          selectedTheme = stored;
        } else {
          // Try to get default theme from available themes
          const defaultFromAPI = themes.find((t: ThemeData) => t.is_default);
          if (defaultFromAPI) {
            selectedTheme = defaultFromAPI.name;
          }
        }

        setThemeState(selectedTheme);
        fetchThemeData(selectedTheme);
      });
    }
  }, [defaultTheme, fetchAvailableThemes, fetchThemeData]);

  // NEW: Set theme with metadata loading
  const setTheme = useCallback(
    (newTheme: string) => {
      setThemeState(newTheme);
      storeTheme(newTheme);
      fetchThemeData(newTheme);
    },
    [fetchThemeData]
  );

  // NEW: Toggle between available themes (if only 2) or light/dark fallback
  const toggleTheme = useCallback(() => {
    if (availableThemes.length === 2) {
      // Toggle between the two available themes
      const currentIndex = availableThemes.findIndex((t) => t.name === theme);
      const nextIndex = (currentIndex + 1) % availableThemes.length;
      const nextTheme = availableThemes[nextIndex].name;
      setTheme(nextTheme);
    } else {
      // Fallback to light/dark toggle
      const newMode = theme.includes("dark") ? "light" : "dark";
      setTheme(newMode);
    }
  }, [theme, availableThemes, setTheme]);

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
