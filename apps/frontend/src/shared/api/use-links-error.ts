// Слой shared: backend не принимает ссылки в текстах, которые видят другие пользователи (защита от фишинга)
import { useTranslations } from "@/shared/i18n-context";

import { getHttpMessage } from "./http-client";

// Фрагмент сообщения валидатора `NoLinks` на backend
const LINKS_ERROR_FRAGMENT = "must not contain links";

/**
 * Текст ошибки, если backend отклонил форму из-за ссылки в одном из полей.
 * @param {unknown} error - Ошибка мутации; `null`, пока запрос не падал.
 * @returns {string | null} Переведённое сообщение или `null`, если причина в другом.
 */
export function useLinksError(error: unknown): string | null {
  const common = useTranslations("common");

  return getHttpMessage(error).includes(LINKS_ERROR_FRAGMENT) ? common("linksNotAllowed") : null;
}
