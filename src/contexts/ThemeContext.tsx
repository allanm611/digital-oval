import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const defaultThemeContext: ThemeContextType = {
  theme: "light",
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
      if (parsed.theme === "light" || parsed.theme === "dark") {
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

const persistTheme = (theme: Theme) => {
  try {
    const storedSettings = localStorage.getItem(APP_SETTINGS_KEY);
    const parsed = storedSettings ? JSON.parse(storedSettings) : {};
    localStorage.setItem(
      APP_SETTINGS_KEY,
      JSON.stringify({ ...parsed, theme }),
    );
    localStorage.setItem("theme", theme);
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

    // Fall back to system preference.
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }

    return "light";
  });

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("color-mode", theme);

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    persistTheme(theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const isDark = theme === "dark";

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
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
