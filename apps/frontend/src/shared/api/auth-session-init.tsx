"use client";

// Слой shared: на первом монтировании тихо пытается восстановить сессию из
// httpOnly-куки с refresh-токеном (например, после перезагрузки страницы),
// чтобы auth-store перешёл из `initializing` в итоговое состояние сессии.
import { useEffect } from "react";

import { useAuthStore } from "@/shared/model/auth-store";

import { refreshAccessToken } from "./http-client";

/**
 * Attempts a silent session restore once per app load. Renders nothing.
 * @returns {null} Always `null`.
 */
export function AuthSessionInit(): null {
  const setAnonymous = useAuthStore((state) => state.setAnonymous);

  useEffect(() => {
    refreshAccessToken().catch(() => {
      // Нет активной сессии (нет куки/просрочена) - ожидаемо для гостя.
      setAnonymous();
    });
  }, [setAnonymous]);

  return null;
}
