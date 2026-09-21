"use client";

// Слой views: клиентская граница для личного кабинета. Вынесена из ProfilePage
// (серверный компонент, использует getServerTranslations/next-headers через
// Footer/ProfileStats/TelegramNotice), чтобы клиентский fetch профиля и
// react-query не утягивали эти серверные виджеты в клиентский бандл.
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ProfileForm } from "@/features/edit-profile";
import { EMPTY_PROFILE, profileApi } from "@/entities/profile";
import { getLocalizedHref } from "@/shared/i18n";
import { useLocale, useTranslations } from "@/shared/i18n-context";

/**
 * Fetches the signed-in user's profile client-side and renders the editable form,
 * redirecting to "/auth" if the session can't be resolved.
 * @returns {import('react').ReactNode} The profile form, or a loading placeholder.
 */
export function ProfileFormSection() {
  const router = useRouter();
  const locale = useLocale();
  const common = useTranslations("common");

  const profileQuery = useQuery({
    queryKey: ["profile", "me"],
    queryFn: profileApi.getMine,
    retry: false,
  });

  useEffect(() => {
    if (profileQuery.isError) {
      router.replace(getLocalizedHref("/auth", locale));
    }
  }, [profileQuery.isError, router, locale]);

  if (profileQuery.isPending) {
    return <p className="text-muted-foreground">{common("loading")}</p>;
  }

  return <ProfileForm profile={profileQuery.data ?? EMPTY_PROFILE} />;
}
