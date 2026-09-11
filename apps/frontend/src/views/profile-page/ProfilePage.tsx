"use client";

// Слой views: страница личного кабинета - профиль и статистика пользователя.
// Разрешено импортировать widgets, features, entities, shared.
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Footer } from "@/widgets/footer";
import { Navbar } from "@/widgets/navbar";
import { ProfileStats } from "@/widgets/profile-stats";
import { TelegramNotice } from "@/widgets/telegram-notice";
import { ProfileForm } from "@/features/edit-profile";
import { EMPTY_PROFILE, profileApi, type ProfileStatsData } from "@/entities/profile";

/**
 * Props for {@link ProfilePage}.
 */
export interface ProfilePageProps {
  /**
   * The signed-in user's aggregate stats.
   */
  stats: ProfileStatsData;
}

/**
 * Renders the "Личный кабинет" screen: navbar, an editable profile form (fetched for the
 * signed-in user) and a sidebar with stats and the Telegram notification notice. Redirects to
 * "/auth" if the user isn't signed in (or their session can't be refreshed).
 * @param {ProfilePageProps} props - Props for the page.
 * @returns {import('react').ReactNode} The profile page.
 */
export function ProfilePage(props: ProfilePageProps) {
  const { stats } = props;
  const router = useRouter();

  const profileQuery = useQuery({
    queryKey: ["profile", "me"],
    queryFn: profileApi.getMine,
    retry: false,
  });

  useEffect(() => {
    if (profileQuery.isError) {
      router.replace("/auth");
    }
  }, [profileQuery.isError, router]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight">Личный кабинет</h1>
        <p className="mt-2 text-muted-foreground">Профиль и карточка, которую видят другие участники.</p>

        {profileQuery.isPending
          ? (
            <p className="mt-10 text-muted-foreground">Загружаем профиль…</p>
          )
          : (
            <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">
              <ProfileForm profile={profileQuery.data ?? EMPTY_PROFILE} />

              <div className="space-y-6">
                <ProfileStats stats={stats} />
                <TelegramNotice />
              </div>
            </div>
          )}
      </main>

      <Footer />
    </div>
  );
}
