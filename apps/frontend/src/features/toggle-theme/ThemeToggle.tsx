"use client";

// Слой features: переключение светлой/тёмной темы приложения.
import { useLayoutEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/shared/ui/button";

type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

// Должен совпадать с data-theme по умолчанию на <html> в app/layout.tsx: и сервер,
// и первый клиентский рендер обязаны стартовать с одного и того же значения, иначе
// React увидит расхождение при гидратации (реальная тема применяется чуть позже,
// в useLayoutEffect, до отрисовки кадра — см. читаемый ниже readStoredTheme).
const DEFAULT_THEME: Theme = "dark";

/**
 * Reads the persisted theme choice from `localStorage`, if any.
 * @returns {Theme | null} The stored theme, or `null` when unset/unavailable.
 */
function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
}

/**
 * Applies the theme to the document and persists it for the next visit.
 * @param {Theme} theme - The theme to apply.
 * @returns {void}
 */
function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);

  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // LocalStorage недоступен
  }
}

/**
 * Header button that toggles between the light and dark theme.
 * @returns {import('react').ReactNode} The theme toggle button.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);

  useLayoutEffect(() => {
    // Синхронизируется с тем, что anti-flash inline-скрипт в layout.tsx уже применил
    // к <html> до гидратации. Заодно переприменяет атрибут в dev Strict Mode, где React
    // при повторном монтировании сбрасывает атрибуты <html>, выставленные вне JSX.
    const stored = readStoredTheme();
    if (stored) {
      setTheme(stored);
      document.documentElement.setAttribute("data-theme", stored);
    }
  }, []);

  /**
   * Flips the active theme and persists the choice.
   * @returns {void}
   */
  function handleToggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      aria-label={theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему"}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
