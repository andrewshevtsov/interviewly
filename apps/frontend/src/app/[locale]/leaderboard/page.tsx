import { LeaderboardPage } from "@/views/leaderboard-page";
import { getLeaderboard, type LeaderboardEntry } from "@/entities/leaderboard";

const LEADERBOARD_LIMIT = 20;

/**
 * Загружает лидерборд; при ошибке backend страница покажет сообщение, а не упадёт целиком
 * @returns {Promise<LeaderboardEntry[] | null>} Строки лидерборда
 */
async function loadLeaderboard(): Promise<LeaderboardEntry[] | null> {
  try {
    return await getLeaderboard(LEADERBOARD_LIMIT);
  } catch (error) {
    // Временный серверный лог Next.js, в браузер не попадает
    // eslint-disable-next-line no-console
    console.error("Failed to load the leaderboard", error);

    return null;
  }
}

/**
 * Route "/leaderboard" - the full participant ranking screen.
 * @returns {Promise<import('react').ReactNode>} The leaderboard page.
 */
export default async function Page() {
  return <LeaderboardPage entries={await loadLeaderboard()} />;
}
