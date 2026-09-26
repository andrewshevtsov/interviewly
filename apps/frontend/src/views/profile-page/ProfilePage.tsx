// Слой views: страница личного кабинета - профиль и статистика пользователя.
// Разрешено импортировать widgets, features, entities, shared.
import { Footer } from "@/widgets/footer";
import { Navbar } from "@/widgets/navbar";
import { ProfileStats } from "@/widgets/profile-stats";
import { TelegramNotice } from "@/widgets/telegram-notice";
import { getServerTranslations } from "@/shared/i18n-server";
import { ProfileFormSection } from "./ProfileFormSection";

/**
 * Renders the "Личный кабинет" screen: navbar, an editable profile form (fetched
 * client-side for the signed-in user, redirecting to "/auth" if the session can't be
 * resolved) and a sidebar with stats and the Telegram notification notice.
 * @returns {import('react').ReactNode} The profile page.
 */
export async function ProfilePage() {
  const t = await getServerTranslations("profile");

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("description")}</p>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">
          <ProfileFormSection />

          <div className="space-y-6">
            <ProfileStats />
            <TelegramNotice />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
