// Слой entities: запросы к /profiles, отвечающие за "Витрину участников".
// Импортирует только entities (свой слайс) и shared.
import { httpClient } from "@/shared/api/http-client";
import type { Participant } from "./index";

export const participantApi = {
  /**
   * Загружает участников для "Витрины": профили со статусом, числом сессий и рейтингом.
   * @returns {Promise<Participant[]>} Все участники.
   */
  getShowcase(): Promise<Participant[]> {
    return httpClient.get<Participant[]>("/profiles/showcase").then((res) => res.data);
  },
};
