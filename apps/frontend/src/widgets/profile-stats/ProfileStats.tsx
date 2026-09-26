"use client";

// Слой widgets: карточка статистики профиля.
import { useQuery } from "@tanstack/react-query";

import { Card } from "@/shared/ui/card";
import { useTranslations } from "@/shared/i18n-context";
import { profileApi } from "@/entities/profile";

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
 * Sidebar card with the user's aggregate stats: interviews conducted, average rating and
 * leaderboard rank.
 * @returns {import('react').ReactNode} The stats card.
 */
export function ProfileStats() {
  const t = useTranslations("profile");
  const common = useTranslations("common");

  const statsQuery = useQuery({
    queryKey: ["profile", "me", "stats"],
    queryFn: profileApi.getMyStats,
  });

  if (statsQuery.isPending) {
    return <p className="text-muted-foreground">{common("loading")}</p>;
  }

  const stats = statsQuery.data;
  const rows: StatRow[] = [
    { label: t("interviews"), value: stats?.interviews ?? "0" },
    { label: t("averageRating"), value: stats?.avgRating ?? "0.0" },
    { label: t("leaderboardPlace"), value: stats?.topRank ?? "—" },
  ];

  return (
    <Card className="p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t("statistics")}
      </p>

      <div className="mt-4 divide-y divide-border">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
          >
            <span className="text-muted-foreground">{row.label}</span>
            <span className="font-mono font-semibold">{row.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
