// Слой shared: запросы к /auth. Refresh-токен сервер кладёт в httpOnly-куку -
// в JSON-ответах он не встречается, поэтому здесь везде только accessToken.
import type { AxiosResponse } from "axios";

import { httpClient } from "./http-client";

/**
 * Payload for authentication via email and password.
 */
export interface LoginPayload {
  /**
   * User email address.
   */
  email: string;

  /**
   * User password.
   */
  password: string;

  /**
   * Запомнить вход: `false` - сессия заканчивается при закрытии браузера.
   */
  rememberMe: boolean;
}

/**
 * Payload for creating a new user account.
 */
export interface RegisterPayload {
  /**
   * User email address.
   */
  email: string;

  /**
   * User password.
   */
  password: string;

  /**
   * User first name.
   */
  firstName: string;

  /**
   * User last name.
   */
  lastName?: string;
}

/**
 * Response returned after a successful authentication request.
 */
interface AccessTokenResponse {
  /**
   * JWT access token issued for the authenticated user.
   */
  accessToken: string;
}

/**
 * Ответ `POST /auth/telegram/link/start`.
 */
interface TelegramLinkStartResponse {
  /**
   * Адрес авторизации в Telegram.
   */
  url: string;
}

/**
 * Достаёт адрес Telegram из ответа начала привязки.
 * @param {AxiosResponse<TelegramLinkStartResponse>} response - Ответ axios.
 * @returns {string} Адрес авторизации.
 */
function extractUrl(response: AxiosResponse<TelegramLinkStartResponse>): string {
  return response.data.url;
}

/**
 * API methods for authentication-related endpoints.
 */
export const authApi = {
  login(payload: LoginPayload): Promise<AccessTokenResponse> {
    return httpClient.post<AccessTokenResponse>("/auth/login", payload).then((res) => res.data);
  },

  register(payload: RegisterPayload): Promise<AccessTokenResponse> {
    return httpClient.post<AccessTokenResponse>("/auth/register", payload).then((res) => res.data);
  },

  /**
   * Начинает привязку Telegram к текущему аккаунту (`POST /auth/telegram/link/start`).
   * Ответ содержит адрес Telegram, на который нужно перейти всей страницей.
   * @param {string} returnPath - Внутренний путь, куда вернуть пользователя после привязки.
   * @returns {Promise<string>} Адрес авторизации в Telegram.
   */
  startTelegramLink(returnPath: string): Promise<string> {
    return httpClient.post<TelegramLinkStartResponse>("/auth/telegram/link/start", { returnPath }).then(extractUrl);
  },

  logout(): Promise<void> {
    return httpClient.post("/auth/logout").then(() => undefined);
  },
};
