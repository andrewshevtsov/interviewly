"use client";

// Слой features: кнопка выхода - чистит сессию на backend и локально.
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { authApi } from "@/shared/api/auth-api";
import { useTranslations } from "@/shared/i18n-context";
import { useAuthStore } from "@/shared/model/auth-store";
import { Button } from "@/shared/ui/button";

/**
 * Разлогинивает пользователя: просит бэкенд очистить куку с refresh-токеном, затем чистит
 * access-токен в памяти, сбрасывает закэшированные данные профиля и отзывов и возвращает на главную.
 * @returns {import('react').ReactNode} Кнопка выхода.
 */
export function LogoutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setAnonymous = useAuthStore((state) => state.setAnonymous);
  const t = useTranslations("navigation");

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    /**
     * Clears local session state regardless of whether the server call succeeded -
     * an expired/invalid access token already means the user is effectively signed out.
     * @returns {void}
     */
    onSettled: () => {
      setAnonymous();
      queryClient.removeQueries({ queryKey: ["profile"] });
      queryClient.removeQueries({ queryKey: ["feedback"] });
      router.push("/");
    },
  });

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={t("logout")}
      onClick={() => logoutMutation.mutate()}
      disabled={logoutMutation.isPending}
    >
      <LogOut className="h-5 w-5" />
    </Button>
  );
}
