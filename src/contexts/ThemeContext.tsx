import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const defaultThemeContext: ThemeContextType = {
  theme: "light",
  resolvedTheme: "light",
  setTheme: () => {
    console.warn("ThemeProvider is not initialized yet.");
  },
  isDark: false,
};

const ThemeContext = createContext<ThemeContextType>(defaultThemeContext);

const APP_SETTINGS_KEY = "appSettings";

const getStoredTheme = (): Theme | null => {
  try {
    const storedSettings = localStorage.getItem(APP_SETTINGS_KEY);
    if (storedSettings) {
      const parsed = JSON.parse(storedSettings) as { theme?: string };
      if (parsed.theme === "light" || parsed.theme === "dark" || parsed.theme === "system") {
        return parsed.theme;
      }
    }

    const legacyTheme = localStorage.getItem("theme");
    if (legacyTheme === "light" || legacyTheme === "dark") {
      return legacyTheme;
    }
  } catch {
    // Ignore storage/parse issues and fall back to defaults.
  }

  return null;
};

const getSystemTheme = (): ResolvedTheme => {
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
};

const persistTheme = (theme: Theme) => {
  try {
    const storedSettings = localStorage.getItem(APP_SETTINGS_KEY);
    const parsed = storedSettings ? JSON.parse(storedSettings) : {};
    localStorage.setItem(
      APP_SETTINGS_KEY,
      JSON.stringify({ ...parsed, theme }),
    );
    // Only store resolved theme (light/dark) in legacy key for backwards compatibility
    if (theme !== "system") {
      localStorage.setItem("theme", theme);
    }
  } catch {
    // Ignore storage issues to avoid blocking UI interactions.
  }
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const storedTheme = getStoredTheme();
    if (storedTheme) {
      return storedTheme;
    }
    return "light";
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    const storedTheme = getStoredTheme();
    if (storedTheme === "system") {
      return getSystemTheme();
    }
    return (storedTheme as ResolvedTheme) || "light";
  });

  // Apply theme to document and listen for system theme changes
  useEffect(() => {
    const updateResolvedTheme = () => {
      if (theme === "system") {
        const systemTheme = getSystemTheme();
        setResolvedTheme(systemTheme);
      } else {
        setResolvedTheme(theme as ResolvedTheme);
      }
    };

    updateResolvedTheme();

    // Listen for system theme changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", updateResolvedTheme);
      return () => mediaQuery.removeEventListener("change", updateResolvedTheme);
    }
  }, [theme]);

  // Apply resolved theme to document
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("color-mode", resolvedTheme);

    if (resolvedTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    persistTheme(theme);
  }, [resolvedTheme, theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const isDark = resolvedTheme === "dark";

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
