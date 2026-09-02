// Слой widgets: секция "Лидерборд" - топ участников по числу проведённых интервью.
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Card } from "@/shared/ui/card";

/**
 * A single leaderboard row.
 */
interface LeaderboardEntry {
  /**
   * Rank, formatted for display (e.g. "01").
   */
  rank: string;

  /**
   * Display name.
   */
  name: string;

  /**
   * Role/title shown under the name.
   */
  role: string;

  /**
   * Number of interview sessions conducted, formatted for display (e.g. "142").
   */
  sessions: string;

  /**
   * Average rating, formatted for display (e.g. "9.9/10").
   */
  rating: string;
}

const ENTRIES: LeaderboardEntry[] = [
  { rank: "01", name: "Марк Ченов", role: "Senior Architect", sessions: "142", rating: "9.9/10" },
  { rank: "02", name: "София Родригес", role: "Fullstack Dev", sessions: "128", rating: "9.7/10" },
  { rank: "03", name: "Мария Лебедева", role: "Systems Engineer", sessions: "95", rating: "9.5/10" },
];

/**
 * "Лидерборд" section: top participants ranked by sessions conducted.
 * @returns {import('react').ReactNode} The leaderboard section.
 */
export function Leaderboard() {
  return (
    <section id="leaderboard" className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h2 className="text-3xl font-bold tracking-tight">Лидерборд</h2>
      <p className="mt-2 text-muted-foreground">Топ участников по количеству проведённых интервью.</p>

      <Card className="mt-10 divide-y divide-border text-left">
        {ENTRIES.map((entry) => (
          <div key={entry.rank} className="flex items-center gap-4 p-5">
            <span className="w-8 font-mono text-2xl font-bold italic text-primary">{entry.rank}</span>

            <Avatar className="h-10 w-10 bg-muted">
              <AvatarFallback>{entry.name[0]}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <p className="font-semibold">{entry.name}</p>
              <p className="text-sm text-muted-foreground">{entry.role}</p>
            </div>

            <div className="text-right">
              <p>
                <span className="font-bold">{entry.sessions}</span>{" "}
                <span className="text-muted-foreground">сессий</span>
              </p>
              <p className="text-sm text-success">РЕЙТИНГ: {entry.rating}</p>
            </div>
          </div>
        ))}
      </Card>
    </section>
  );
}
