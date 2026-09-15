import type { CookieOptions } from 'express';

/**
 * Имя httpOnly-куки, в которой хранится refresh-токен. Путь ограничен `/auth`,
 * поэтому браузер отправляет её только на login/register/refresh/logout.
 */
export const REFRESH_TOKEN_COOKIE = 'refreshToken';

export function refreshTokenCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/auth',
  };
}
