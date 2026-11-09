"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const syncTheme = () => {
      const savedTheme =
        localStorage.getItem("toota-theme") || localStorage.getItem("theme");
      const prefersDark =
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      const shouldBeDark =
        savedTheme === "dark" ||
        (!savedTheme && prefersDark) ||
        document.documentElement.classList.contains("dark") ||
        document.documentElement.dataset.theme === "dark";

      if (shouldBeDark) {
        document.documentElement.classList.add("dark");
        document.documentElement.dataset.theme = "dark";
        setIsDark(true);
      } else {
        document.documentElement.classList.remove("dark");
        document.documentElement.dataset.theme = "light";
        setIsDark(false);
      }
    };

    syncTheme();
    window.addEventListener("themechange", syncTheme);
    return () => window.removeEventListener("themechange", syncTheme);
  }, []);

  const toggleTheme = () => {
    const nextIsDark = !isDark;
    const mode = nextIsDark ? "dark" : "light";

    if (nextIsDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.dataset.theme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.dataset.theme = "light";
    }

    localStorage.setItem("theme", mode);
    localStorage.setItem("toota-theme", mode);
    setIsDark(nextIsDark);
    window.dispatchEvent(new Event("themechange"));
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle Dark/Light Mode"
      className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-primary transition-all cursor-pointer"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-amber-400" />
      ) : (
        <Moon className="w-5 h-5 text-on-surface-variant" />
      )}
    </button>
  );
}
