import type { Decorator, Preview } from "@storybook/nextjs";
import * as React from "react";
import { Inter, JetBrains_Mono } from "next/font/google";

import { DEFAULT_LOCALE } from "@/shared/i18n";
import { I18nProvider } from "@/shared/i18n-context";
import "@/app/styles/global.css";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });

/**
 * Applies the app's `data-theme` attribute and font variables around every story. Mirrors the
 * real root layout, which puts the font variable classes on `<html>` (see `src/app/layout.tsx`)
 * so that `body`'s `font-sans` rule (see `global.css`) can resolve `var(--font-inter)` - a class
 * placed lower in the tree (e.g. directly on the story wrapper) would be invisible to `body`,
 * since CSS custom properties only inherit downward.
 * @param {() => import("react").ReactNode} Story - The story being rendered.
 * @param {object} context - Storybook render context, including the active `theme` global.
 * @returns {import("react").ReactNode} The themed story subtree.
 */
const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme as "dark" | "light";

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.add(inter.variable, jetbrainsMono.variable);
  }, [theme]);

  return (
    <I18nProvider locale={DEFAULT_LOCALE}>
      <div className="p-8">
        <Story />
      </div>
    </I18nProvider>
  );
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  globalTypes: {
    theme: {
      description: "Тема оформления (data-theme на <html>)",
      toolbar: {
        title: "Тема",
        icon: "mirror",
        items: [
          { value: "dark", icon: "moon", title: "Тёмная" },
          { value: "light", icon: "sun", title: "Светлая" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: "dark" },
  decorators: [withTheme],
};

export default preview;
