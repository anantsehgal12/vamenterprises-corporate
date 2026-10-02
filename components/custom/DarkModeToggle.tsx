"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppTheme } from "@/components/custom/ThemeProvider";

export default function DarkModeToggle() {
  const { theme, setTheme, mounted } = useAppTheme();
  const isDark = mounted && theme === "dark";
  return <Button type="button" variant="outline" size="icon" aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"} title={isDark ? "Switch to light theme" : "Switch to dark theme"} onClick={() => setTheme(isDark ? "light" : "dark")} className="size-9 rounded-full border-border bg-card text-foreground shadow-none">
    {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
  </Button>;
}
