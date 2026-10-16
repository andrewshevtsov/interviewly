// Слой features: решает, нужно ли отправлять часовой пояс браузера в профиль.

/**
 * Пояс отправляем только тому, у кого он ещё не сохранён.
 * @param {string | null} savedTimeZone - Пояс пользователя из `GET /users/me`.
 * @param {string | undefined} browserTimeZone - Пояс браузера (IANA, например `Asia/Dubai`).
 * @returns {boolean} `true`, если пояс нужно сохранить.
 */
export function needsTimeZoneSync(savedTimeZone: string | null, browserTimeZone: string | undefined): boolean {
  return savedTimeZone === null && Boolean(browserTimeZone);
}
