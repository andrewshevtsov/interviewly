// Слой widgets: полная таблица "Лидерборд" - все участники, отсортированные по рейтингу.
import { cn } from "@/shared/lib/cn";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Card } from "@/shared/ui/card";
import type { LeaderboardEntry } from "@/entities/leaderboard";

const TOP_RANKS_COUNT = 3;

/**
 * Props for {@link LeaderboardTable}.
 */
export interface LeaderboardTableProps {
  /**
   * Leaderboard rows, ranked best first.
   */
  entries: LeaderboardEntry[];
}

/**
 * Full "Лидерборд" table: rank, participant, sessions conducted and average rating.
 * @param {LeaderboardTableProps} props - Props for the table.
 * @returns {import('react').ReactNode} The leaderboard table.
 */
export function LeaderboardTable(props: LeaderboardTableProps) {
  const { entries } = props;

  return (
    <Card className="divide-y divide-border">
      <div className="flex items-center gap-4 px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <span className="w-8">#</span>
        <span className="flex-1">Участник</span>
        <span className="w-20 text-right">Интервью</span>
        <span className="w-16 text-right">Рейтинг</span>
      </div>

      {entries.map((entry, index) => (
        <div key={entry.id} className="flex items-center gap-4 p-5">
          <span
            className={cn(
              "w-8 font-mono text-xl font-bold italic",
              index < TOP_RANKS_COUNT ? "text-primary" : "text-muted-foreground",
            )}
          >
            {entry.rank}
          </span>

          <Avatar className="h-10 w-10 bg-muted">
            <AvatarFallback>{entry.name[0]}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <p className="font-semibold">{entry.name}</p>
            <p className="text-sm text-muted-foreground">{entry.role}</p>
          </div>

          <span className="w-20 text-right">{entry.sessionsCount}</span>
          <span className="w-16 text-right font-mono text-success">{entry.rating}</span>
        </div>
      ))}
    </Card>
  );
}
