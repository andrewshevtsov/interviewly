"use client";

// Слой shared: страницы только для авторизованных. Отправляет гостей на "/auth"
// и возвращает на ту же страницу после входа
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useLocale } from "@/shared/i18n-context";
import { getAuthHref } from "@/shared/lib/return-path";
import { useAuthStore } from "@/shared/model/auth-store";

/**
 * Отправляет гостя на "/auth", а после входа - обратно на текущую страницу
 * Пока сессия восстанавливается, ничего не делает
 * @returns {void}
 */
export function useGuestRedirect(): void {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const isGuest = useAuthStore((state) => state.status === "anonymous");

  useEffect(() => {
    if (isGuest) {
      router.replace(getAuthHref(pathname, locale));
    }
  }, [isGuest, router, pathname, locale]);
}
