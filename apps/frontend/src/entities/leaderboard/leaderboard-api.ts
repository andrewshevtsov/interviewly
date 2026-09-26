// Слой entities: запросы к /leaderboard.
// Импортирует только entities (свой слайс) и shared.
import { httpClient } from "@/shared/api/http-client";
import type { LeaderboardEntry } from "./index";

export const leaderboardApi = {
  /**
   * Загружает рейтинг участников, отсортированный по среднему баллу отзывов.
   * @returns {Promise<LeaderboardEntry[]>} Строки лидерборда, лучшие сначала.
   */
  getRanked(): Promise<LeaderboardEntry[]> {
    return httpClient.get<LeaderboardEntry[]>("/leaderboard").then((res) => res.data);
  },
};
