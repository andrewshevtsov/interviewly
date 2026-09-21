"use client";

import { createContext, type ReactNode, useCallback, useContext, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  createTranslator,
  getLocalizedHref,
  LOCALE_COOKIE_NAME,
  type Locale,
  type MessageGroupName,
  type Translator,
} from "@/shared/i18n";

const LOCALE_COOKIE_MAX_AGE_SECONDS = "31536000";

const I18nContext = createContext<Locale | null>(null);

/** Props for {@link I18nProvider}. */
export interface I18nProviderProps {
  /** Language selected for the application. */
  locale: Locale;
  /** Application subtree that uses translations. */
  children: ReactNode;
}

/**
 * Makes the selected language available to client components.
 * @param {I18nProviderProps} props - Provider properties.
 * @returns {ReactNode} Provider-wrapped application subtree.
 */
export function I18nProvider(props: I18nProviderProps) {
  return <I18nContext.Provider value={props.locale}>{props.children}</I18nContext.Provider>;
}

/**
 * Returns the language selected for the application.
 * @returns {Locale} Current locale.
 */
export function useLocale(): Locale {
  const locale = useContext(I18nContext);

  if (!locale) {
    throw new Error("useLocale must be used inside I18nProvider");
  }

  return locale;
}

/**
 * Returns a function that changes the locale segment in the current URL.
 * @returns {(locale: Locale) => void} Language-changing function.
 */
export function useChangeLocale(): (locale: Locale) => void {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  return useCallback(
    (locale: Locale) => {
      const query = searchParams.toString();
      const hash = window.location.hash;
      const localizedPath = getLocalizedHref(pathname, locale);
      const nextUrl = `${localizedPath}${query ? `?${query}` : ""}${hash}`;

      document.cookie =
        `${LOCALE_COOKIE_NAME}=${locale}; Path=/; ` +
        `Max-Age=${LOCALE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
      document.documentElement.lang = locale;
      router.push(nextUrl);
    },
    [pathname, router, searchParams],
  );
}

/**
 * Returns a translator bound to a dictionary group and the current language.
 * @param {string} group - Dictionary section.
 * @returns {Translator} Translator for the selected group.
 */
export function useTranslations<Group extends MessageGroupName>(group: Group): Translator<Group> {
  const locale = useLocale();

  return useMemo(() => createTranslator(group, locale), [group, locale]);
}
