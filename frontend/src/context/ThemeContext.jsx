import React, {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const ThemeContext = createContext({
  theme: "light",
  toggleTheme: () => {},
  setTheme: () => {},
});

const getInitialTheme = () => {
  if (typeof window === "undefined") return "light";
  const saved = window.localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);
  const didMountRef = useRef(false);

  useLayoutEffect(() => {
    if (typeof document === "undefined") return;
    const body = document.body;
    body.dataset.theme = theme;

    try {
      window.localStorage.setItem("theme", theme);
    } catch {
      // Ignore storage failures (quota, private mode, etc.)
    }

    if (didMountRef.current) {
      body.classList.add("theme-transition");
      const timer = window.setTimeout(() => {
        body.classList.remove("theme-transition");
      }, 350);
      return () => window.clearTimeout(timer);
    }

    didMountRef.current = true;
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
