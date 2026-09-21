import { headers } from "next/headers";

import {
  createTranslator,
  type Locale,
  type MessageGroupName,
  REQUEST_LOCALE_HEADER_NAME,
  resolveLocale,
  type Translator,
} from "@/shared/i18n";

/**
 * Returns the locale derived from the current request URL.
 * @returns {Promise<Locale>} Current request locale.
 */
export async function getRequestLocale(): Promise<Locale> {
  const requestHeaders = await headers();

  return resolveLocale(requestHeaders.get(REQUEST_LOCALE_HEADER_NAME));
}

/**
 * Returns a translator bound to the locale from the current request URL.
 * @param {string} group - Dictionary section.
 * @returns {Promise<Translator>} Translator for the selected group.
 */
export async function getServerTranslations<Group extends MessageGroupName>(
  group: Group,
): Promise<Translator<Group>> {
  const locale = await getRequestLocale();

  return createTranslator(group, locale);
}
