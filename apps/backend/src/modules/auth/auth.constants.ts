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
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/auth',
  };
}
