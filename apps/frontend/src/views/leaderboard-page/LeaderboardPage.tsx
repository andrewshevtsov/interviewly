// Слой views: страница "Лидерборд" - полный рейтинг участников.
// Разрешено импортировать widgets, features, entities, shared.
import { Footer } from "@/widgets/footer";
import { LeaderboardTable } from "@/widgets/leaderboard-table";
import { Navbar } from "@/widgets/navbar";
import { getServerTranslations } from "@/shared/i18n-server";

/**
 * Renders the "Лидерборд" screen: navbar, the full ranking table and the footer.
 * @returns {import('react').ReactNode} The leaderboard page.
 */
export async function LeaderboardPage() {
  const t = await getServerTranslations("leaderboard");

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("description")}</p>

        <div className="mt-10">
          <LeaderboardTable />
        </div>
      </main>

      <Footer />
    </div>
  );
}
