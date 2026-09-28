// Слой shared: куда вернуть пользователя после входа - параметр `next` страницы "/auth"
import { getLocalizedHref, type Locale } from "@/shared/i18n";

/**
 * Имя query-параметра страницы "/auth" с путём, куда вернуться после входа
 */
export const RETURN_PATH_PARAM = "next";

/**
 * Ссылка на страницу входа, после которого пользователь вернётся на `returnPath`
 * @param {string} returnPath - Внутренний путь, например "/ru/sessions/<id>"
 * @param {Locale} locale - Язык страницы входа
 * @returns {string} URL страницы входа с параметром `next`
 */
export function getAuthHref(returnPath: string, locale: Locale): string {
  const query = new URLSearchParams({ [RETURN_PATH_PARAM]: returnPath });

  return `${getLocalizedHref("/auth", locale)}?${query}`;
}

/**
 * Пропускает только внутренний путь приложения. Иначе можно увести пользователя на любой сайт сразу после входа
 * @param {unknown} value - Значение параметра `next` из URL
 * @returns {string | undefined} Путь или `undefined`, если он небезопасен
 */
export function resolveReturnPath(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.startsWith("/")) {
    return undefined;
  }

  const isOtherOrigin = value.startsWith("//") || value.startsWith("/\\");

  return isOtherOrigin ? undefined : value;
}
