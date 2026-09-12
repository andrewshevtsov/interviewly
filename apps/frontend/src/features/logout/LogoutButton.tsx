"use client";

// Слой features: кнопка выхода - чистит сессию на backend и локально.
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { clearAccessToken } from "@/shared/api/access-token";
import { authApi } from "@/shared/api/auth-api";
import { Button } from "@/shared/ui/button";

/**
 * Signs the user out: asks the backend to clear the refresh-token cookie, then clears
 * the in-memory access token, drops any cached profile data and returns to the homepage.
 * @returns {import('react').ReactNode} The logout button.
 */
export function LogoutButton() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    /**
     * Clears local session state regardless of whether the server call succeeded -
     * an expired/invalid access token already means the user is effectively signed out.
     * @returns {void}
     */
    onSettled: () => {
      clearAccessToken();
      queryClient.removeQueries({ queryKey: ["profile"] });
      router.push("/");
    },
  });

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Выйти"
      onClick={() => logoutMutation.mutate()}
      disabled={logoutMutation.isPending}
    >
      <LogOut className="h-5 w-5" />
    </Button>
  );
}
