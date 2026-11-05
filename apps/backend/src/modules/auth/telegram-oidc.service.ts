import {
  createHash,
  createHmac,
  createPublicKey,
  randomBytes,
  timingSafeEqual,
  type JsonWebKey,
} from 'node:crypto';
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

const AUTHORIZATION_URL = 'https://oauth.telegram.org/auth';
const TOKEN_URL = 'https://oauth.telegram.org/token';
const JWKS_URL = 'https://oauth.telegram.org/.well-known/jwks.json';
const ISSUER = 'https://oauth.telegram.org';
const SCOPE = 'openid profile telegram:bot_access';
// Telegram по умолчанию подписывает RS256; ES256 включается в BotFather
const ID_TOKEN_ALGORITHMS = ['RS256', 'ES256'] as const;

const SESSION_TTL_MS = 10 * 60 * 1000;
const JWKS_TTL_MS = 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 10_000;
const DEFAULT_RETURN_PATH = '/';

export type TelegramOidcIntent = 'login' | 'link';

/** То, что нужно помнить между уходом на Telegram и возвратом на callback */
interface OidcSession {
  state: string;
  nonce: string;
  verifier: string;
  intent: TelegramOidcIntent;
  userId?: string;
  returnPath: string;
  expiresAt: number;
}

export interface TelegramProfile {
  telegramId: string;
  username?: string;
  firstName: string;
  lastName?: string;
}

export interface TelegramOidcResult {
  intent: TelegramOidcIntent;
  userId?: string;
  returnPath: string;
  profile: TelegramProfile;
}

interface Jwk extends JsonWebKey {
  kid?: string;
}

interface IdTokenClaims {
  nonce?: string;
  id?: number | string;
  name?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
}

const toBase64Url = (value: Buffer | string) => Buffer.from(value).toString('base64url');

/**
 * Возвращает только относительный путь внутри сайта: иначе callback стал бы open redirect.
 * `//host` и `/\host` браузер считает адресом другого сайта.
 */
export function safeReturnPath(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return DEFAULT_RETURN_PATH;
  }
  return value;
}

/**
 * Вход через Telegram по OIDC (Authorization Code + PKCE).
 * Состояние потока хранится в подписанной куке, а не на сервере: `start` отдаёт её значение,
 * `finish` принимает его обратно вместе с `code` и `state` из адреса возврата.
 */
@Injectable()
export class TelegramOidcService {
  private readonly logger = new Logger(TelegramOidcService.name);
  private readonly clientId?: string;
  private readonly clientSecret?: string;
  private readonly redirectUri?: string;
  private readonly signingKey: string;
  private jwks?: { keys: Jwk[]; fetchedAt: number };

  constructor(
    configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.clientId = configService.get<string>('TELEGRAM_CLIENT_ID');
    this.clientSecret = configService.get<string>('TELEGRAM_CLIENT_SECRET');
    this.redirectUri = configService.get<string>('TELEGRAM_OAUTH_REDIRECT_URI');
    // Отдельный ключ под эту куку: подпись не должна подходить ни к каким другим токенам
    this.signingKey = `telegram-oidc:${configService.getOrThrow<string>('JWT_REFRESH_SECRET')}`;
  }

  /** Время жизни куки состояния, мс */
  get sessionTtlMs(): number {
    return SESSION_TTL_MS;
  }

  /** Адрес для редиректа на Telegram и значение куки состояния */
  start(params: { intent: TelegramOidcIntent; userId?: string; returnPath?: string }) {
    const { clientId, redirectUri } = this.requireConfig();
    const session: OidcSession = {
      state: toBase64Url(randomBytes(16)),
      nonce: toBase64Url(randomBytes(16)),
      verifier: toBase64Url(randomBytes(32)),
      intent: params.intent,
      userId: params.userId,
      returnPath: safeReturnPath(params.returnPath),
      expiresAt: Date.now() + SESSION_TTL_MS,
    };

    const query = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPE,
      state: session.state,
      nonce: session.nonce,
      code_challenge: toBase64Url(createHash('sha256').update(session.verifier).digest()),
      code_challenge_method: 'S256',
    });

    return {
      authorizationUrl: `${AUTHORIZATION_URL}?${query.toString()}`,
      cookieValue: this.sign(session),
    };
  }

  /** Проверяет возврат с Telegram и достаёт профиль из `id_token` */
  async finish(params: { code: string; state: string; cookieValue: string | undefined }): Promise<TelegramOidcResult> {
    const session = this.readSession(params.cookieValue);
    if (!this.equals(session.state, params.state)) {
      throw new UnauthorizedException('Invalid Telegram login state');
    }

    const idToken = await this.exchangeCode(params.code, session.verifier);
    const claims = await this.verifyIdToken(idToken);
    if (!claims.nonce || !this.equals(claims.nonce, session.nonce)) {
      throw new UnauthorizedException('Invalid Telegram login nonce');
    }

    return {
      intent: session.intent,
      userId: session.userId,
      returnPath: session.returnPath,
      profile: this.toProfile(claims),
    };
  }

  /** Намерение и путь из куки без проверки `state`: чтобы вернуть пользователя туда, откуда он начал, даже при ошибке */
  peekSession(cookieValue: string | undefined): Pick<OidcSession, 'intent' | 'returnPath'> | null {
    try {
      const { intent, returnPath } = this.readSession(cookieValue);
      return { intent, returnPath };
    } catch {
      return null;
    }
  }

  private requireConfig() {
    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      throw new ServiceUnavailableException('Telegram login is not configured');
    }
    return { clientId: this.clientId, clientSecret: this.clientSecret, redirectUri: this.redirectUri };
  }

  private sign(session: OidcSession): string {
    const payload = toBase64Url(JSON.stringify(session));
    return `${payload}.${this.hmac(payload)}`;
  }

  private readSession(cookieValue: string | undefined): OidcSession {
    const [payload, signature] = (cookieValue ?? '').split('.');
    if (!payload || !signature || !this.equals(signature, this.hmac(payload))) {
      throw new UnauthorizedException('Telegram login session is missing or invalid');
    }

    try {
      const session = JSON.parse(Buffer.from(payload, 'base64url').toString()) as OidcSession;
      if (session.expiresAt < Date.now()) {
        throw new Error('expired');
      }
      return session;
    } catch {
      throw new UnauthorizedException('Telegram login session expired');
    }
  }

  private hmac(payload: string): string {
    return createHmac('sha256', this.signingKey).update(payload).digest('base64url');
  }

  private equals(a: string, b: string): boolean {
    const left = Buffer.from(a);
    const right = Buffer.from(b);
    return left.length === right.length && timingSafeEqual(left, right);
  }

  private async exchangeCode(code: string, verifier: string): Promise<string> {
    const { clientId, clientSecret, redirectUri } = this.requireConfig();

    let response: Response;
    try {
      response = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          client_id: clientId,
          code_verifier: verifier,
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error: unknown) {
      this.logger.warn(`Telegram token request failed: ${error instanceof Error ? error.name : 'unknown'}`);
      throw new UnauthorizedException('Telegram login failed');
    }

    const body = (await response.json().catch(() => null)) as { id_token?: string; error?: string } | null;
    if (!response.ok || !body?.id_token) {
      this.logger.warn(`Telegram token exchange rejected: ${response.status} ${body?.error ?? 'no error'}`);
      throw new UnauthorizedException('Telegram login failed');
    }
    return body.id_token;
  }

  private async verifyIdToken(idToken: string): Promise<IdTokenClaims> {
    const { clientId } = this.requireConfig();

    try {
      const header = JSON.parse(Buffer.from(idToken.split('.')[0] ?? '', 'base64url').toString()) as { kid?: string };
      const jwk = await this.findKey(header.kid);
      const publicKey = createPublicKey({ key: jwk, format: 'jwk' }).export({ type: 'spki', format: 'pem' }).toString();

      return await this.jwtService.verifyAsync<IdTokenClaims>(idToken, {
        publicKey,
        algorithms: [...ID_TOKEN_ALGORITHMS],
        issuer: ISSUER,
        audience: clientId,
      });
    } catch (error: unknown) {
      this.logger.warn(`Telegram id_token rejected: ${error instanceof Error ? error.message : 'unknown'}`);
      throw new UnauthorizedException('Invalid Telegram identity token');
    }
  }

  /** Ключи кешируются; неизвестный `kid` - повод один раз перечитать (ротация ключей) */
  private async findKey(kid: string | undefined): Promise<Jwk> {
    const fresh = this.jwks && Date.now() - this.jwks.fetchedAt < JWKS_TTL_MS;
    const cached = fresh ? this.jwks?.keys.find((key) => key.kid === kid) : undefined;
    if (cached) {
      return cached;
    }

    const response = await fetch(JWKS_URL, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!response.ok) {
      throw new Error(`JWKS request failed: ${response.status}`);
    }
    const { keys } = (await response.json()) as { keys: Jwk[] };
    this.jwks = { keys, fetchedAt: Date.now() };

    const key = keys.find((candidate) => candidate.kid === kid);
    if (!key) {
      throw new Error('Signing key not found in JWKS');
    }
    return key;
  }

  private toProfile(claims: IdTokenClaims): TelegramProfile {
    // `sub` у Telegram не обязан совпадать с числовым id, а уведомления идут по числовому id
    const telegramId = claims.id === undefined ? '' : String(claims.id);
    if (!/^\d+$/.test(telegramId)) {
      throw new UnauthorizedException('Telegram identity token has no user id');
    }

    return {
      telegramId,
      username: claims.preferred_username,
      firstName: claims.given_name ?? claims.name ?? claims.preferred_username ?? 'Telegram',
      lastName: claims.family_name,
    };
  }
}
