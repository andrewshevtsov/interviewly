import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
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
 */
export const metadata: Metadata = {
  title: "Interviewly",
  description: "Сервис проведения технических и мок-интервью",
};

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
export default function RootLayout(props: RootLayoutProps) {
  return (
    <html lang="ru" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>{props.children}</body>
    </html>
  );
}
