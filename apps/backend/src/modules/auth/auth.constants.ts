import type { CookieOptions, Response } from 'express';
import type { AuthTokens } from './auth.types.ts';

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

/**
 * Кладёт refresh-токен в httpOnly-куку. Без «запомнить меня» кука сессионная (без `expires`).
 * Заодно сносит legacy Path=/auth, чтобы cookie-parser не читал старую куку первой.
 */
export function setRefreshTokenCookie(res: Response, tokens: AuthTokens): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE, legacyRefreshTokenCookieOptions());
  res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    ...refreshTokenCookieOptions(),
    ...(tokens.rememberMe && { expires: tokens.refreshTokenExpiresAt }),
  });
}

/** Кука состояния входа через Telegram (OIDC): живёт, пока пользователь подтверждает вход у Telegram */
export const TELEGRAM_OIDC_COOKIE = 'telegramOidc';

export function telegramOidcCookieOptions(): CookieOptions {
  return { ...refreshTokenCookieOptions(), sameSite: 'lax' };
}
