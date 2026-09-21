"use client";

import type { ComponentProps } from "react";
import Link from "next/link";

import { getLocalizedHref } from "@/shared/i18n";
import { useLocale } from "@/shared/i18n-context";

/** Props for a locale-aware internal link. */
export interface LocalizedLinkProps extends Omit<ComponentProps<typeof Link>, "href"> {
  /** Internal application URL without a required locale prefix. */
  href: string;
}

/**
 * Adds the current locale to an internal application link.
 * @param {LocalizedLinkProps} props - Next.js link properties.
 * @returns {import("react").ReactNode} Locale-aware link.
 */
export function LocalizedLink(props: LocalizedLinkProps) {
  const { href, ...linkProps } = props;
  const locale = useLocale();

  return <Link {...linkProps} href={getLocalizedHref(href, locale)} />;
}
