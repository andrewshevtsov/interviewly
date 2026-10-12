// Слой entities: сборка параметров запроса витрины
import type { ShowcaseFilters } from "./index";

/**
 * Сколько карточек запрашивать за раз ("показать ещё" подгружает следующую порцию).
 */
export const SHOWCASE_PAGE_SIZE = 12;

/**
 * Собирает query-параметры `GET /showcase/cards`: повторяющиеся `level` и `stack`,
 * поиск `q` (только если не пустой), размер страницы и курсор.
 * @param {ShowcaseFilters} filters - Выбранные фильтры.
 * @param {string} [cursor] - Курсор следующей страницы из предыдущего ответа.
 * @returns {URLSearchParams} Параметры запроса.
 */
export function buildShowcaseParams(filters: ShowcaseFilters, cursor?: string): URLSearchParams {
  const params = new URLSearchParams();

  filters.levels.forEach((level) => params.append("level", level));
  filters.stack.forEach((tag) => params.append("stack", tag));

  const query = filters.query.trim();
  if (query) {
    params.set("q", query);
  }

  params.set("limit", String(SHOWCASE_PAGE_SIZE));
  if (cursor) {
    params.set("cursor", cursor);
  }

  return params;
}
