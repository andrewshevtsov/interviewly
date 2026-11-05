import { generateKeyPairSync, createHash } from 'node:crypto';
import { JwtService } from '@nestjs/jwt';
import type { ConfigService } from '@nestjs/config';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from 'vitest';
import {
  safeReturnPath,
  TelegramOidcService,
} from './telegram-oidc.service.ts';

const CLIENT_ID = '8930536412';
const ISSUER = 'https://oauth.telegram.org';
const KID = 'test-key';

/** Адрес запроса из любого вида первого аргумента `fetch` */
const urlOf = (input: Parameters<typeof fetch>[0]): string => {
  if (typeof input === 'string') return input;
  return input instanceof URL ? input.href : input.url;
};

const config = (values: Record<string, string>) =>
  ({
    get: (key: string) => values[key],
    getOrThrow: (key: string) => {
      if (!values[key]) throw new Error(`${key} missing`);
      return values[key];
    },
  }) as unknown as ConfigService;

const FULL_CONFIG = {
  TELEGRAM_CLIENT_ID: CLIENT_ID,
  TELEGRAM_CLIENT_SECRET: 'secret',
  TELEGRAM_OAUTH_REDIRECT_URI:
    'https://interviewly.top/api/auth/telegram/callback',
  JWT_REFRESH_SECRET: 'refresh-secret',
};

describe('safeReturnPath', () => {
  it.each(['/profile', '/ru/showcase?x=1'])(
    'пропускает относительный путь %s',
    (path) => {
      expect(safeReturnPath(path)).toBe(path);
    },
  );

  it.each([
    'https://evil.com',
    '//evil.com',
    '/\\evil.com',
    'profile',
    '',
    undefined,
    42,
  ])('заменяет %j на корень', (path) => {
    expect(safeReturnPath(path)).toBe('/');
  });
});

describe('TelegramOidcService', () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });
  const jwk = { ...publicKey.export({ format: 'jwk' }), kid: KID };
  const signer = new JwtService();
  let service: TelegramOidcService;
  let fetchMock: Mock<typeof fetch>;

  const idToken = (
    claims: Record<string, unknown> = {},
    options: { audience?: string; issuer?: string } = {},
  ) =>
    signer.sign(
      {
        id: 123456,
        name: 'Ivan Petrov',
        given_name: 'Ivan',
        family_name: 'Petrov',
        preferred_username: 'ivan_p',
        ...claims,
      },
      {
        privateKey: privateKey
          .export({ type: 'pkcs8', format: 'pem' })
          .toString(),
        algorithm: 'RS256',
        keyid: KID,
        issuer: options.issuer ?? ISSUER,
        audience: options.audience ?? CLIENT_ID,
        expiresIn: '5m',
      },
    );

  /** Проходит `start`, подставляет в токен тот же nonce и вызывает `finish` */
  const complete = (
    claims: Record<string, unknown> = {},
    tokenOptions: { audience?: string; issuer?: string } = {},
    flow: Parameters<TelegramOidcService['start']>[0] = { intent: 'login' },
  ) => {
    const { authorizationUrl, cookieValue } = service.start(flow);
    const query = new URL(authorizationUrl).searchParams;
    const token = idToken(
      { nonce: query.get('nonce'), ...claims },
      tokenOptions,
    );

    fetchMock.mockImplementation((url) =>
      Promise.resolve(
        urlOf(url).endsWith('/token')
          ? new Response(JSON.stringify({ id_token: token }))
          : new Response(JSON.stringify({ keys: [jwk] })),
      ),
    );

    return {
      query,
      run: (state = query.get('state') ?? '') =>
        service.finish({ code: 'code', state, cookieValue }),
    };
  };

  beforeEach(() => {
    fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal('fetch', fetchMock);
    service = new TelegramOidcService(config(FULL_CONFIG), signer);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('start', () => {
    it('строит адрес авторизации с PKCE', () => {
      const { authorizationUrl } = service.start({ intent: 'login' });
      const url = new URL(authorizationUrl);

      expect(`${url.origin}${url.pathname}`).toBe(
        'https://oauth.telegram.org/auth',
      );
      expect(Object.fromEntries(url.searchParams)).toMatchObject({
        client_id: CLIENT_ID,
        redirect_uri: FULL_CONFIG.TELEGRAM_OAUTH_REDIRECT_URI,
        response_type: 'code',
        scope: 'openid profile telegram:bot_access',
        code_challenge_method: 'S256',
      });
      expect(url.searchParams.get('state')).toBeTruthy();
      expect(url.searchParams.get('nonce')).toBeTruthy();
    });

    it('code_challenge - это SHA-256 от verifier из куки', () => {
      const { authorizationUrl, cookieValue } = service.start({
        intent: 'login',
      });
      const session = JSON.parse(
        Buffer.from(cookieValue.split('.')[0] ?? '', 'base64url').toString(),
      ) as {
        verifier: string;
      };

      expect(new URL(authorizationUrl).searchParams.get('code_challenge')).toBe(
        createHash('sha256').update(session.verifier).digest('base64url'),
      );
    });

    it('каждый запуск получает свои state и nonce', () => {
      const first = new URL(service.start({ intent: 'login' }).authorizationUrl)
        .searchParams;
      const second = new URL(
        service.start({ intent: 'login' }).authorizationUrl,
      ).searchParams;

      expect(first.get('state')).not.toBe(second.get('state'));
      expect(first.get('nonce')).not.toBe(second.get('nonce'));
    });

    it('отвечает 503, если вход через Telegram не настроен', () => {
      const unconfigured = new TelegramOidcService(
        config({ JWT_REFRESH_SECRET: 's' }),
        signer,
      );

      expect(() => unconfigured.start({ intent: 'login' })).toThrow(
        'not configured',
      );
    });
  });

  describe('finish', () => {
    it('возвращает профиль, намерение и безопасный путь', async () => {
      const { run } = complete(
        {},
        {},
        { intent: 'link', userId: 'u1', returnPath: '/profile' },
      );

      await expect(run()).resolves.toEqual({
        intent: 'link',
        userId: 'u1',
        returnPath: '/profile',
        profile: {
          telegramId: '123456',
          username: 'ivan_p',
          firstName: 'Ivan',
          lastName: 'Petrov',
        },
      });
    });

    it('открытый redirect в returnPath заменяется корнем', async () => {
      const { run } = complete(
        {},
        {},
        { intent: 'login', returnPath: 'https://evil.com' },
      );

      expect((await run()).returnPath).toBe('/');
    });

    it('обменивает код с PKCE и Basic-авторизацией', async () => {
      const { run } = complete();
      await run();

      const [url, init] = fetchMock.mock.calls.find(([target]) =>
        urlOf(target).endsWith('/token'),
      ) as [string, RequestInit];
      expect(url).toBe('https://oauth.telegram.org/token');
      expect((init.headers as Record<string, string>).Authorization).toBe(
        `Basic ${Buffer.from(`${CLIENT_ID}:secret`).toString('base64')}`,
      );
      expect(Object.fromEntries(init.body as URLSearchParams)).toMatchObject({
        grant_type: 'authorization_code',
        code: 'code',
        client_id: CLIENT_ID,
      });
      expect((init.body as URLSearchParams).get('code_verifier')).toBeTruthy();
    });

    it('отклоняет чужой state', async () => {
      const { run } = complete();

      await expect(run('another-state')).rejects.toThrow(
        'Invalid Telegram login state',
      );
    });

    it.each([undefined, '', 'garbage', 'a.b'])(
      'отклоняет куку %j',
      async (cookieValue) => {
        await expect(
          service.finish({ code: 'c', state: 's', cookieValue }),
        ).rejects.toThrow(/session/);
      },
    );

    it('отклоняет куку, подписанную другим ключом', async () => {
      const { cookieValue } = service.start({ intent: 'login' });
      const other = new TelegramOidcService(
        config({ ...FULL_CONFIG, JWT_REFRESH_SECRET: 'other' }),
        signer,
      );

      await expect(
        other.finish({ code: 'c', state: 's', cookieValue }),
      ).rejects.toThrow(/session/);
    });

    it('отклоняет просроченную сессию', async () => {
      const { run } = complete();
      vi.useFakeTimers({ now: Date.now() + 11 * 60 * 1000, toFake: ['Date'] });
      try {
        await expect(run()).rejects.toThrow(/expired/);
      } finally {
        vi.useRealTimers();
      }
    });

    it('отклоняет токен с чужим nonce', async () => {
      const { run } = complete({ nonce: 'replayed' });

      await expect(run()).rejects.toThrow('Invalid Telegram login nonce');
    });

    it('отклоняет токен для другого бота (aud)', async () => {
      const { run } = complete({}, { audience: '111' });

      await expect(run()).rejects.toThrow('Invalid Telegram identity token');
    });

    it('отклоняет токен другого издателя (iss)', async () => {
      const { run } = complete({}, { issuer: 'https://evil.example' });

      await expect(run()).rejects.toThrow('Invalid Telegram identity token');
    });

    it('отклоняет токен, подписанный не тем ключом', async () => {
      const { run } = complete();
      const stranger = generateKeyPairSync('rsa', {
        modulusLength: 2048,
      }).publicKey;
      fetchMock.mockImplementation((url) =>
        Promise.resolve(
          urlOf(url).endsWith('/token')
            ? new Response(
                JSON.stringify({ id_token: idToken({ nonce: 'x' }) }),
              )
            : new Response(
                JSON.stringify({
                  keys: [{ ...stranger.export({ format: 'jwk' }), kid: KID }],
                }),
              ),
        ),
      );

      await expect(run()).rejects.toThrow('Invalid Telegram identity token');
    });

    it('отклоняет токен без числового id', async () => {
      const { run } = complete({ id: undefined, sub: '42' });

      await expect(run()).rejects.toThrow('no user id');
    });

    it('падает с понятной ошибкой, если Telegram отклонил обмен кода', async () => {
      const { run } = complete();
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ error: 'invalid_grant' }), {
          status: 400,
        }),
      );

      await expect(run()).rejects.toThrow('Telegram login failed');
    });

    it('кеширует JWKS между входами', async () => {
      const first = complete();
      await first.run();
      const second = complete();
      await second.run();

      const jwksCalls = fetchMock.mock.calls.filter(([target]) =>
        urlOf(target).includes('jwks'),
      );
      expect(jwksCalls).toHaveLength(1);
    });
  });
});
