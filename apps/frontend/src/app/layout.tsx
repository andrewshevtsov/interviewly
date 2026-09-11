import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { I18nProvider } from "@/shared/i18n-context";
import { getRequestLocale, getServerTranslations } from "@/shared/i18n-server";
import { InlineScript } from "@/shared/ui/inline-script";
import "@/app/styles/global.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

/**
 * Next.js page metadata for the whole app.
 * @returns {Promise<Metadata>} Localized page metadata.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerTranslations("metadata");

  return {
    title: "Interviewly",
    description: t("description"),
  };
}

/**
 * Props for {@link RootLayout}.
 */
export interface RootLayoutProps {
  /**
   * RootPage content rendered by the active route.
   */
  children: ReactNode;
}

/**
 * Next.js App Router root layout. Navigation chrome lives per-section (see
 * `@/views/home-page/Navbar` and `app/sessions/layout.tsx`), not here, since it differs between
 * the marketing homepage and the app sections.
 * @param {RootLayoutProps} props - Пропсы корневого layout.
 * @returns {ReactNode} Корневой layout с дочерними страницами.
 */
export default async function RootLayout(props: RootLayoutProps) {
  const locale = await getRequestLocale();

  return (
    <html
      lang={locale}
      data-theme="dark"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        {/* Синхронно применяет сохранённую тему до первой отрисовки, чтобы избежать
            мигания дефолтной (тёмной) темы. См. features/toggle-theme/ThemeToggle. */}
        <InlineScript
          html={
            "(function(){try{var t=localStorage.getItem('theme');" +
            "if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}})()"
          }
        />
      </head>
      <body>
        <I18nProvider locale={locale}>{props.children}</I18nProvider>
      </body>
    </html>
  );
}
