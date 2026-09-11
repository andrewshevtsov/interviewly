import { LeaderboardPage } from "@/views/leaderboard-page";
import { DEMO_LEADERBOARD } from "../demo-data";

/**
 * Route "/leaderboard" - the full participant ranking screen.
 * @returns {import('react').ReactNode} The leaderboard page.
 */
export default function Page() {
  return <LeaderboardPage entries={DEMO_LEADERBOARD} />;
}
