// Слой widgets: карточка статистики профиля.
import { Card } from "@/shared/ui/card";
import type { ProfileStatsData } from "@/entities/profile";

/**
 * A single labeled stat row.
 */
interface StatRow {
  /**
   * Stat label.
   */
  label: string;

  /**
   * Formatted stat value.
   */
  value: string;
}

/**
 * Props for {@link ProfileStats}.
 */
export interface ProfileStatsProps {
  /**
   * Stats to display.
   */
  stats: ProfileStatsData;
}

/**
 * Sidebar card with the user's aggregate stats: interviews conducted, average rating and
 * leaderboard rank.
 * @param {ProfileStatsProps} props - Props for the card.
 * @returns {import('react').ReactNode} The stats card.
 */
export function ProfileStats(props: ProfileStatsProps) {
  const { stats } = props;

  const rows: StatRow[] = [
    { label: "Интервью", value: stats.interviews },
    { label: "Средняя оценка", value: stats.avgRating },
    { label: "Место в топе", value: stats.topRank },
  ];

  return (
    <Card className="p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Статистика</p>

      <div className="mt-4 divide-y divide-border">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
            <span className="text-muted-foreground">{row.label}</span>
            <span className="font-mono font-semibold">{row.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
