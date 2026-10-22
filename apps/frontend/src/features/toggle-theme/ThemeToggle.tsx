"use client";

// Слой features: переключение светлой/тёмной темы приложения.
import { useLayoutEffect } from "react";
import { Moon, Sun } from "lucide-react";

import { usePreferencesStore } from "@/shared/model/preferences-store";
import { Button } from "@/shared/ui/button";
import { useTranslations } from "@/shared/i18n-context";

/**
 * Header button that toggles between the light and dark theme.
 * @returns {import('react').ReactNode} The theme toggle button.
 */
export function ThemeToggle() {
  const theme = usePreferencesStore((state) => state.theme);
  const initializeTheme = usePreferencesStore((state) => state.initializeTheme);
  const toggleTheme = usePreferencesStore((state) => state.toggleTheme);
  const t = useTranslations("theme");

  useLayoutEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? t("enableLight") : t("enableDark")}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
