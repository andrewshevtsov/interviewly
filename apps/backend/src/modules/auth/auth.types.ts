/**
 * Полезная нагрузка access-токена. `sub` — идентификатор пользователя.
 */
export interface JwtPayload {
  sub: string;
  email: string;
  isAdmin: boolean;
}

/**
 * Полезная нагрузка refresh-токена
 */
export interface RefreshPayload {
  sub: string;
  rememberMe?: boolean;
}

/**
 * Пара токенов, возвращаемая на register/login/refresh. `refreshTokenExpiresAt`
 * и `rememberMe` нужны только контроллеру: по ним он решает, ставить ли
 * `Expires` у httpOnly-куки с refresh-токеном (постоянная или сессионная).
 * В клиентский JSON-ответ не попадают.
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
  rememberMe: boolean;
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
