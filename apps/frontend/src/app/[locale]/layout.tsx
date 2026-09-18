import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { isLocale, SUPPORTED_LOCALES } from "@/shared/i18n";
import { I18nProvider } from "@/shared/i18n-context";

/** Props for the localized route group. */
export interface LocaleLayoutProps {
  /** Localized page subtree. */
  children: ReactNode;
  /** Dynamic URL parameters. */
  params: Promise<{
    /** Locale captured from the URL. */
    locale: string;
  }>;
}

/**
 * Generates the known locale route variants.
 * @returns {Array} Supported locale parameters.
 */
export function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

/**
 * Rejects unsupported locale URL segments.
 * @param {LocaleLayoutProps} props - Localized layout properties.
 * @returns {Promise<ReactNode>} Localized page subtree.
 */
export default async function LocaleLayout(props: LocaleLayoutProps): Promise<ReactNode> {
  const { locale } = await props.params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <I18nProvider locale={locale}>{props.children}</I18nProvider>;
}
