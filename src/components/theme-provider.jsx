import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

/**
 * @typedef {("dark" | "light")} Theme
 * @typedef {{ children: ReactNode defaultTheme?: Theme storageKey?: string }} ThemeProviderProps
 * @typedef {{ theme: Theme; setTheme: (theme: Theme) => void }} ThemeProviderState
 */

/**
 * @type {ThemeProviderState}
 */
const initialState = {
  theme: "light",
  setTheme: () => null,
};

const ThemeProviderContext = createContext(initialState);

/**
 * @param {ThemeProviderProps} props
 */
export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "vite-ui-theme",
  ...props
}) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem(storageKey) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");

    if (theme === "light") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

/**
 * @returns {ThemeProviderState}
 */
export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
