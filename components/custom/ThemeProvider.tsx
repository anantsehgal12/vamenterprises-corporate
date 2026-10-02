"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark";
type ThemeContextValue = { theme: ThemeMode; setTheme: (theme: ThemeMode) => void; mounted: boolean };
const STORAGE_KEY = "vam-enterprises-theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: ThemeMode) {
  const adminRoot = document.getElementById("admin-root");
  if (!adminRoot) return;
  adminRoot.classList.toggle("dark", theme === "dark");
  adminRoot.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY);
    const initialTheme: ThemeMode = savedTheme === "dark" ? "dark" : "light";
    applyTheme(initialTheme);
    setThemeState(initialTheme);
    setMounted(true);
  }, []);

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
    window.localStorage.setItem(STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme, mounted }}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useAppTheme must be used within ThemeProvider.");
  return context;
}
