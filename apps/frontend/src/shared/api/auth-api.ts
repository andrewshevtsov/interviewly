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

  logout(): Promise<void> {
    return httpClient.post("/auth/logout").then(() => undefined);
  },
};
