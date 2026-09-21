// Слой shared: запросы к /auth. Refresh-токен сервер кладёт в httpOnly-куку -
// в JSON-ответах он не встречается, поэтому здесь везде только accessToken.
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
 * Data the Telegram Login Widget hands to its `data-onauth` callback - see
 * https://core.telegram.org/widgets/login#receiving-authorization-data. Field names match
 * Telegram's own naming (snake_case) and the backend's `TelegramAuthDto`, so the widget's
 * callback payload can be posted to `/auth/telegram` as-is.
 */
export interface TelegramAuthPayload {
  /**
   * Numeric Telegram account id.
   */
  id: number;

  /**
   * Telegram first name.
   */
  first_name: string;

  /**
   * Telegram last name, if set.
   */
  last_name?: string;

  /**
   * Telegram username, if set.
   */
  username?: string;

  /**
   * URL of the Telegram avatar, if set.
   */
  photo_url?: string;

  /**
   * Unix timestamp (seconds) of when the widget issued this data.
   */
  auth_date: number;

  /**
   * HMAC-SHA256 signature Telegram computed over the other fields.
   */
  hash: string;
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
 * API methods for authentication-related endpoints.
 */
export const authApi = {
  login(payload: LoginPayload): Promise<AccessTokenResponse> {
    return httpClient.post<AccessTokenResponse>("/auth/login", payload).then((res) => res.data);
  },

  register(payload: RegisterPayload): Promise<AccessTokenResponse> {
    return httpClient.post<AccessTokenResponse>("/auth/register", payload).then((res) => res.data);
  },

  telegramLogin(payload: TelegramAuthPayload): Promise<AccessTokenResponse> {
    return httpClient.post<AccessTokenResponse>("/auth/telegram", payload).then((res) => res.data);
  },

  logout(): Promise<void> {
    return httpClient.post("/auth/logout").then(() => undefined);
  },
};
