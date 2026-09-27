"use client";

// Слой shared: страницы только для авторизованных. Отправляет гостей на "/auth"
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { getLocalizedHref } from "@/shared/i18n";
import { useLocale } from "@/shared/i18n-context";
import { useAuthStore } from "@/shared/model/auth-store";

/**
 * Отправляет гостя на "/auth". Пока сессия восстанавливается, ничего не делает.
 * @returns {void}
 */
export function useGuestRedirect(): void {
  const router = useRouter();
  const locale = useLocale();
  const isGuest = useAuthStore((state) => state.status === "anonymous");

  useEffect(() => {
    if (isGuest) {
      router.replace(getLocalizedHref("/auth", locale));
    }
  }, [isGuest, router, locale]);
}
