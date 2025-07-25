/**
 * Theme Context for Dark/Light Mode Support
 * Provides theme management with localStorage persistence
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

export type Theme = "light" | "dark";

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_STORAGE_KEY = "ui_theme";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
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

const getStoredTheme = (): Theme | null => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === "light" || stored === "dark") {
        return stored;
      }
    } catch (error) {
      console.warn("Failed to read theme from localStorage:", error);
    }
  }
  return null;
};

const storeTheme = (theme: Theme): void => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
      console.warn("Failed to store theme in localStorage:", error);
    }
  }
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = "light",
}) => {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [isClient, setIsClient] = useState(false);

  // Fix hydration mismatch by updating theme after mount
  useEffect(() => {
    setIsClient(true);

    // Only check stored/system theme after client mount
    const storedTheme = getStoredTheme();
    if (storedTheme) {
      setThemeState(storedTheme);
    } else {
      const systemTheme = detectSystemTheme();
      setThemeState(systemTheme);
    }
  }, []);

  // Apply theme to document only on client
  useEffect(() => {
    if (isClient) {
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(theme);
    }
  }, [theme, isClient]);

  // Listen for system theme changes only on client
  useEffect(() => {
    if (!isClient) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't manually set a preference
      const storedTheme = getStoredTheme();
      if (!storedTheme) {
        setThemeState(e.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [isClient]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    storeTheme(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
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
