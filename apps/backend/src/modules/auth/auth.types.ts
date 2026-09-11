/**
 * Полезная нагрузка access-токена. `sub` — идентификатор пользователя.
 */
export interface JwtPayload {
  sub: string;
  email: string;
  isAdmin: boolean;
}

/**
 * Полезная нагрузка refresh-токена — минимальная, только субъект.
 */
export interface RefreshPayload {
  sub: string;
}

/**
 * Пара токенов, возвращаемая на register/login/refresh.
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Минимальная форма HTTP-запроса, которая нужна гварду и декоратору:
 * заголовки для чтения `Authorization` и поле `user`, которое гвард
 * заполняет после проверки токена.
 */
export interface AuthenticatedRequest {
  headers: Record<string, string | string[] | undefined>;
  user?: JwtPayload;
}
