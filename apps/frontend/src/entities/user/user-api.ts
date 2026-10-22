// Слой entities: запрос текущего пользователя. Импортирует только entities (свой слайс) и shared
import { httpClient } from "@/shared/api/http-client";

import type {
  ConfirmedEmail,
  CurrentUser,
  PendingEmailChange,
  PendingEmailChangeResponse,
  RequestEmailChangeInput,
  UpdateMeInput,
} from "./index";

/**
 * Ключ кеша ожидающей подтверждения смены email.
 */
export const EMAIL_CHANGE_QUERY_KEY = ["users", "me", "email-change"] as const;

export const userApi = {
  /**
   * Загружает данные текущего пользователя (`GET /users/me`).
   * @returns {Promise<CurrentUser>} Пользователь.
   */
  getMe(): Promise<CurrentUser> {
    return httpClient.get<CurrentUser>("/users/me").then((res) => res.data);
  },

  /**
   * Сохраняет имя, фамилию и Telegram-ник (`PATCH /users/me`).
   * @param {UpdateMeInput} input - Новые значения полей.
   * @returns {Promise<CurrentUser>} Пользователь после сохранения.
   */
  updateMe(input: UpdateMeInput): Promise<CurrentUser> {
    return httpClient.patch<CurrentUser>("/users/me", input).then((res) => res.data);
  },

  /**
   * Сохраняет часовой пояс пользователя (`PATCH /users/me`).
   * @param {string} timeZone - Название пояса IANA, например `Asia/Dubai`.
   * @returns {Promise<CurrentUser>} Пользователь после сохранения.
   */
  setTimeZone(timeZone: string): Promise<CurrentUser> {
    return httpClient.patch<CurrentUser>("/users/me", { timeZone }).then((res) => res.data);
  },

  /**
   * Отвязывает Telegram от аккаунта (`DELETE /users/me/telegram`).
   * @returns {Promise<CurrentUser>} Пользователь после отвязки.
   */
  unlinkTelegram(): Promise<CurrentUser> {
    return httpClient.delete<CurrentUser>("/users/me/telegram").then((res) => res.data);
  },

  /**
   * Отправляет письмо со ссылкой подтверждения на новый адрес (`POST /users/me/email-change`).
   * @param {RequestEmailChangeInput} input - Новый адрес и если есть - текущий пароль.
   * @returns {Promise<PendingEmailChange>} Запрос, который теперь ждёт подтверждения.
   */
  requestEmailChange(input: RequestEmailChangeInput): Promise<PendingEmailChange> {
    return httpClient.post<PendingEmailChange>("/users/me/email-change", input).then((res) => res.data);
  },

  /**
   * Загружает смену email, ожидающую подтверждения (`GET /users/me/email-change`).
   * @returns {Promise<PendingEmailChange | null>} Ожидание или `null`.
   */
  async getPendingEmailChange(): Promise<PendingEmailChange | null> {
    const res = await httpClient.get<PendingEmailChangeResponse>("/users/me/email-change");

    return res.data.pending;
  },

  /**
   * Отменяет ожидание смены email (`DELETE /users/me/email-change`).
   * @returns {Promise<void>} Завершается после отмены.
   */
  async cancelEmailChange(): Promise<void> {
    await httpClient.delete("/users/me/email-change");
  },

  /**
   * Подтверждает смену email по токену из письма (`POST /users/email-change/confirm`).
   * @param {string} token - Токен из ссылки в письме.
   * @returns {Promise<ConfirmedEmail>} Новый адрес аккаунта.
   */
  async confirmEmailChange(token: string): Promise<ConfirmedEmail> {
    const res = await httpClient.post<ConfirmedEmail>("/users/email-change/confirm", { token });

    return res.data;
  },
};
