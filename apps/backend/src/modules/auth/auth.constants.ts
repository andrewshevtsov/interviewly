import type { CookieOptions } from 'express';

/**
 * Имя httpOnly-куки, в которой хранится refresh-токен. Путь ограничен `/auth`,
 * поэтому браузер отправляет её только на login/register/refresh/logout.
 */
export const REFRESH_TOKEN_COOKIE = 'refreshToken';

/**
 * Максимальный возраст `auth_date` из данных Telegram Login Widget, после
 * которого запрос отклоняется как просроченный (защита от replay готового
 * набора полей). Значение - рекомендация из документации виджета.
 */
export const TELEGRAM_AUTH_MAX_AGE_SECONDS = 24 * 60 * 60;

export function refreshTokenCookieOptions(): CookieOptions {
  const frontendUrl = process.env.FRONTEND_URL ?? '';
  const secure =
    process.env.NODE_ENV === 'production' || frontendUrl.startsWith('https://');

  return {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    // `/` — кука уходит и на `/auth/*`, и на `/api/auth/*` (same-origin прокси).
    path: '/',
  };
}
