// Слой entities: запросы к витрине участников. Импортирует только entities (свой слайс) и shared
import { httpClient } from "@/shared/api/http-client";

import { buildShowcaseParams } from "./showcase-query";
import type { ParticipantsPage, ShowcaseFilters } from "./index";

export const participantApi = {
  /**
   * Загружает страницу карточек витрины.
   * @param {ShowcaseFilters} filters - Уровни, стек и текст поиска.
   * @param {string} [cursor] - Курсор страницы; без него возвращается первая.
   * @returns {Promise<ParticipantsPage>} Карточки и курсор следующей страницы.
   */
  list(filters: ShowcaseFilters, cursor?: string): Promise<ParticipantsPage> {
    return httpClient
      .get<ParticipantsPage>("/showcase/cards", { params: buildShowcaseParams(filters, cursor) })
      .then((res) => res.data);
  },
};
