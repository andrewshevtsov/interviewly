"use client";

import { create } from "zustand";

export type Theme = "light" | "dark";

const DEFAULT_THEME: Theme = "dark";
const THEME_STORAGE_KEY = "theme";

/** Пользовательские настройки отображения клиентского интерфейса. */
interface PreferencesState {
  /** Текущая цветовая тема. */
  theme: Theme;

  /** Восстанавливает сохранённую тему после гидратации клиента. */
  initializeTheme: () => void;

  /** Применяет и сохраняет явно выбранную тему. */
  setTheme: (theme: Theme) => void;

  /** Переключает светлую и тёмную темы. */
  toggleTheme: () => void;
}

/**
 * Читает корректное сохранённое значение темы.
 * @returns {Theme | null} Сохранённая тема или `null`, если значение недоступно.
 */
function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);

    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
}

/**
 * Применяет и сохраняет выбранную тему.
 * @param {Theme} theme - Тема, которую нужно применить.
 * @returns {void}
 */
function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Даже если localStorage недоступен, настройка продолжит работать в памяти.
  }
}

/** Глобальные клиентские настройки, общие для независимых частей интерфейса. */
export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  theme: DEFAULT_THEME,

  /**
   * Синхронизирует store с темой, которую anti-flash-скрипт в `app/layout.tsx`
   * применил к `<html>` до гидратации. Заодно повторно выставляет атрибут в dev Strict
   * Mode, где React при повторном монтировании может сбросить изменения вне JSX.
   */
  initializeTheme: () => {
    const theme = readStoredTheme() ?? DEFAULT_THEME;
    set({ theme });
    document.documentElement.setAttribute("data-theme", theme);
  },

  /**
   * Применяет и сохраняет явно выбранную тему.
   * @param {Theme} theme - Тема, которую нужно применить.
   */
  setTheme: (theme) => {
    set({ theme });
    applyTheme(theme);
  },

  /** Переключает светлую и тёмную темы. */
  toggleTheme: () => {
    get().setTheme(get().theme === "dark" ? "light" : "dark");
  },
}));
