import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import "@/styles/global.css";

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
 * Next.js App Router root layout.
 * @param {RootLayoutProps} props - Props for the root layout.
 * @returns {ReactNode} Корневой layout с навигацией и дочерними страницами.
 */
export default function RootLayout(props: RootLayoutProps) {
  return (
    <html lang="ru">
      <body>
        <nav>
          <Link href="/">Interviewly</Link>
        </nav>
        {props.children}
      </body>
    </html>
  );
}
