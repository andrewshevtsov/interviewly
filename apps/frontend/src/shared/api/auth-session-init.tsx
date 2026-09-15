"use client";

// Слой shared: на первом монтировании тихо пытается восстановить сессию из
// httpOnly-куки с refresh-токеном (например, после перезагрузки страницы),
// чтобы `useIsAuthenticated` сразу отражал уже вошедшего пользователя.
import { useEffect } from "react";

import { refreshAccessToken } from "./http-client";

/**
 * Attempts a silent session restore once per app load. Renders nothing.
 * @returns {null} Always `null`.
 */
export function AuthSessionInit(): null {
  useEffect(() => {
    refreshAccessToken().catch(() => {
      // Нет активной сессии (нет куки/просрочена) - ожидаемо для гостя.
    });
  }, []);

  return null;
}
