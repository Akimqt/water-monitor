import { useEffect, useState } from "react";

const STORAGE_KEY = "wm-theme";

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem(STORAGE_KEY) as "light" | "dark") ?? "light";
    }
    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
  };

  return { theme, toggleTheme };
}
