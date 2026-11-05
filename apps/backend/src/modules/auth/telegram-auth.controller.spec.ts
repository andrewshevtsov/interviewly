import { ConflictException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import type { AuthService } from './auth.service.ts';
import { TELEGRAM_OIDC_COOKIE } from './auth.constants.ts';
import { TelegramAuthController } from './telegram-auth.controller.ts';
import type { TelegramOidcService } from './telegram-oidc.service.ts';

const FRONTEND = 'https://interviewly.top';
const PROFILE = { telegramId: '123', username: 'ivan_p', firstName: 'Ivan' };
const TOKENS = {
  accessToken: 'a',
  refreshToken: 'r',
  refreshTokenExpiresAt: new Date(),
  rememberMe: true,
};

describe('TelegramAuthController', () => {
  let oidc: Mocked<TelegramOidcService>;
  let authService: Mocked<AuthService>;
  let controller: TelegramAuthController;
  let res: Mocked<Response>;
  const req = (cookie?: string) => ({ cookies: cookie ? { [TELEGRAM_OIDC_COOKIE]: cookie } : {} }) as unknown as Request;
  const redirected = () => new URL(String(res.redirect.mock.calls[0]?.[0]));

  beforeEach(() => {
    oidc = {
      start: vi.fn(),
      finish: vi.fn(),
      peekSession: vi.fn(),
      sessionTtlMs: 600_000,
    } as unknown as Mocked<TelegramOidcService>;
    authService = {
      loginWithTelegramProfile: vi.fn().mockResolvedValue(TOKENS),
      linkTelegramProfile: vi.fn().mockResolvedValue(undefined),
    } as unknown as Mocked<AuthService>;
    res = { redirect: vi.fn(), cookie: vi.fn(), clearCookie: vi.fn() } as unknown as Mocked<Response>;
    controller = new TelegramAuthController(oidc, authService, { get: () => FRONTEND } as unknown as ConfigService);
  });

  describe('login', () => {
    it('ставит куку состояния и уводит на Telegram', () => {
      oidc.start.mockReturnValue({ authorizationUrl: 'https://oauth.telegram.org/auth?x=1', cookieValue: 'c' });

      controller.login('/ru/showcase', res);

      expect(oidc.start).toHaveBeenCalledWith({ intent: 'login', returnPath: '/ru/showcase' });
      expect(res.cookie).toHaveBeenCalledWith(TELEGRAM_OIDC_COOKIE, 'c', expect.objectContaining({ httpOnly: true, sameSite: 'lax' }));
      expect(res.redirect).toHaveBeenCalledWith('https://oauth.telegram.org/auth?x=1');
    });

    it('без настройки возвращает на страницу входа с кодом unavailable', () => {
      oidc.start.mockImplementation(() => {
        throw new ServiceUnavailableException();
      });

      controller.login('/ru/showcase', res);

      expect(redirected().pathname).toBe('/auth');
      expect(redirected().searchParams.get('telegramError')).toBe('unavailable');
      expect(redirected().searchParams.get('next')).toBe('/ru/showcase');
    });
  });

  describe('linkStart', () => {
    it('возвращает адрес и ставит куку с id пользователя', () => {
      oidc.start.mockReturnValue({ authorizationUrl: 'https://oauth.telegram.org/auth?x=1', cookieValue: 'c' });

      const result = controller.linkStart('u1', { returnPath: '/ru/profile' }, res);

      expect(oidc.start).toHaveBeenCalledWith({ intent: 'link', userId: 'u1', returnPath: '/ru/profile' });
      expect(result).toEqual({ url: 'https://oauth.telegram.org/auth?x=1' });
      expect(res.cookie).toHaveBeenCalled();
    });
  });

  describe('callback', () => {
    it('вход: ставит refresh-куку и ведёт на сохранённый путь', async () => {
      oidc.peekSession.mockReturnValue({ intent: 'login', returnPath: '/ru/showcase' });
      oidc.finish.mockResolvedValue({ intent: 'login', returnPath: '/ru/showcase', profile: PROFILE });

      await controller.callback('code', 'state', undefined, req('cookie'), res);

      expect(authService.loginWithTelegramProfile).toHaveBeenCalledWith(PROFILE);
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'r', expect.any(Object));
      expect(redirected().toString()).toBe(`${FRONTEND}/ru/showcase`);
    });

    it('привязка: привязывает к пользователю из состояния и ведёт обратно с telegram=linked', async () => {
      oidc.peekSession.mockReturnValue({ intent: 'link', returnPath: '/ru/profile' });
      oidc.finish.mockResolvedValue({ intent: 'link', userId: 'u1', returnPath: '/ru/profile', profile: PROFILE });

      await controller.callback('code', 'state', undefined, req('cookie'), res);

      expect(authService.linkTelegramProfile).toHaveBeenCalledWith('u1', PROFILE);
      expect(authService.loginWithTelegramProfile).not.toHaveBeenCalled();
      expect(redirected().pathname).toBe('/ru/profile');
      expect(redirected().searchParams.get('telegram')).toBe('linked');
    });

    it('привязка занятого Telegram возвращает в профиль с telegramError=taken', async () => {
      oidc.peekSession.mockReturnValue({ intent: 'link', returnPath: '/ru/profile' });
      oidc.finish.mockResolvedValue({ intent: 'link', userId: 'u1', returnPath: '/ru/profile', profile: PROFILE });
      authService.linkTelegramProfile.mockRejectedValue(new ConflictException());

      await controller.callback('code', 'state', undefined, req('cookie'), res);

      expect(redirected().pathname).toBe('/ru/profile');
      expect(redirected().searchParams.get('telegramError')).toBe('taken');
    });

    it('отказ пользователя у Telegram: telegramError=denied, обмен кода не выполняется', async () => {
      oidc.peekSession.mockReturnValue({ intent: 'login', returnPath: '/ru/showcase' });

      await controller.callback(undefined, undefined, 'access_denied', req('cookie'), res);

      expect(oidc.finish).not.toHaveBeenCalled();
      expect(redirected().pathname).toBe('/auth');
      expect(redirected().searchParams.get('telegramError')).toBe('denied');
    });

    it('неверное состояние или токен: telegramError=failed и вход не выполняется', async () => {
      oidc.peekSession.mockReturnValue(null);
      oidc.finish.mockRejectedValue(new UnauthorizedException());

      await controller.callback('code', 'state', undefined, req(), res);

      expect(authService.loginWithTelegramProfile).not.toHaveBeenCalled();
      expect(redirected().searchParams.get('telegramError')).toBe('failed');
      expect(redirected().searchParams.has('next')).toBe(false);
    });

    it('кука состояния сбрасывается при любом исходе', async () => {
      oidc.peekSession.mockReturnValue(null);
      oidc.finish.mockRejectedValue(new UnauthorizedException());

      await controller.callback('code', 'state', undefined, req(), res);

      expect(res.clearCookie).toHaveBeenCalledWith(TELEGRAM_OIDC_COOKIE, expect.any(Object));
    });
  });
});
