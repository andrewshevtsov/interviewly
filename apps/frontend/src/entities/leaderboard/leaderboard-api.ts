// Слой entities: загрузка лидерборда на сервере Next.js
import { fetchFromServer } from "@/shared/api/server-api";

import { toLeaderboardEntry, type ApiLeaderboardEntry, type LeaderboardEntry } from "./index";

// Рейтинг меняется только после завершения интервью - минутный кеш снимает нагрузку с backend
const LEADERBOARD_REVALIDATE_SECONDS = 60;

/**
 * Загружает топ участников и готовит строки к отображению
 * @param {number} limit - Сколько участников показать
 * @returns {Promise<LeaderboardEntry[]>} Строки лидерборда
 */
export async function getLeaderboard(limit: number): Promise<LeaderboardEntry[]> {
  const entries = await fetchFromServer<ApiLeaderboardEntry[]>(
    `/leaderboard?limit=${limit}`,
    LEADERBOARD_REVALIDATE_SECONDS,
  );

  return entries.map(toLeaderboardEntry);
}
