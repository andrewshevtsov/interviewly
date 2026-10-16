// Слой entities: правила email пользователя. Импортирует только shared.

/**
 * Домен служебных адресов пользователей, вошедших через Telegram.
 */
const TELEGRAM_PLACEHOLDER_EMAIL_DOMAIN = "@telegram.interviewly.local";

/**
 * Проверяет, что адрес служебный (на служебный написать нельзя).
 * @param {string} email - Email из `GET /users/me`.
 * @returns {boolean} `true` для служебного адреса вошедшего через Telegram.
 */
export function isPlaceholderEmail(email: string): boolean {
  return email.toLowerCase().endsWith(TELEGRAM_PLACEHOLDER_EMAIL_DOMAIN);
}
