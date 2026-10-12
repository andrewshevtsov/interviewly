// Слой entities: сущность "пользователь". Импортирует только shared.
import { formatLevel } from "@/shared/lib/format-level";

/**
 * A platform user (candidate or interviewer).
 */
export interface User {
  /**
   * Unique user identifier.
   */
  id: string;

  /**
   * Name shown in the UI.
   */
  displayName: string;

  /**
   * Technologies the user works with.
   */
  stack: string[];

  /**
   * Experience level, e.g. "junior", "middle", "senior".
   */
  level: string;
}

/**
 * Formats a user's experience level for display.
 * @param {User} user - User whose level should be formatted.
 * @returns {string} Human-readable representation of the user's level.
 */
export function formatUserLevel(user: User): string {
  return formatLevel(user.level);
}

export { UserBadge } from "./UserBadge";
export type { UserBadgeProps } from "./UserBadge";

/**
 * Текущий пользователь, как его отдаёт `GET /users/me`.
 */
export interface CurrentUser {
  /**
   * Идентификатор пользователя.
   */
  id: string;

  /**
   * Email; у вошедших через Telegram служебный адрес без почтового ящика.
   */
  email: string;

  /**
   * Имя.
   */
  firstName: string;

  /**
   * Фамилия.
   */
  lastName: string | null;

  /**
   * Id Tg.
   */
  telegramId: string | null;

  /**
   * Есть ли у аккаунта пароль: без него (вход через Tg) пароль при смене email не спрашиваем.
   */
  hasPassword: boolean;

  /**
   * Ник в Telegram без `@`, введённый вручную.
   */
  telegramUsername: string | null;

  /**
   * Часовой пояс пользователя.
   */
  timeZone: string | null;
}

/**
 * Поля, которые пользователь меняет в кабинете.
 */
export interface UpdateMeInput {
  /**
   * Имя.
   */
  firstName: string;

  /**
   * Фамилия.
   */
  lastName: string;

  /**
   * Ник в Telegram, с `@` или без.
   */
  telegramUsername: string;
}

export { EMAIL_CHANGE_QUERY_KEY, userApi } from "./user-api";
export { CURRENT_USER_QUERY_KEY, useCurrentUser } from "./use-current-user";
export { isPlaceholderEmail } from "./email";

/**
 * Смена email.
 */
export interface PendingEmailChange {
  /**
   * Новый адрес, на который ушло письмо.
   */
  newEmail: string;

  /**
   * Когда ссылка из письма перестанет работать (ISO).
   */
  expiresAt: string;
}

/**
 * Ответ `GET /users/me/email-change`.
 */
export interface PendingEmailChangeResponse {
  /**
   * Ожидающая подтверждения смена.
   */
  pending: PendingEmailChange | null;
}

/**
 * Ответ на подтверждение смены email.
 */
export interface ConfirmedEmail {
  /**
   * Новый адрес аккаунта.
   */
  email: string;
}

/**
 * Данные запроса на смену email.
 */
export interface RequestEmailChangeInput {
  /**
   * Новый адрес.
   */
  email: string;

  /**
   * Текущий пароль (если есть).
   */
  password?: string;
}

export { classifyEmailChangeError } from "./email-change-errors";
export type { EmailChangeErrorKey } from "./email-change-errors";
