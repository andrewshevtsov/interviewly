import type { CookieOptions } from 'express';

/**
 * Имя httpOnly-куки, в которой хранится refresh-токен. Путь ограничен `/auth`,
 * поэтому браузер отправляет её только на login/register/refresh/logout.
 */
export const REFRESH_TOKEN_COOKIE = 'refreshToken';

/**
 * Прежний path куки. После смены на `/` у уже залогиненных могла остаться
 * старая кука с Path=/auth — её нужно чистить явно (clearCookie матчит path).
 */
export const LEGACY_REFRESH_TOKEN_COOKIE_PATH = '/auth';

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
    path: '/',
  };
}

/** Опции для удаления legacy-куки Path=/auth (миграция path → `/`). */
export function legacyRefreshTokenCookieOptions(): CookieOptions {
  return {
    ...refreshTokenCookieOptions(),
    path: LEGACY_REFRESH_TOKEN_COOKIE_PATH,
  };
}
