import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  Req,
  Res,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.ts';
import {
  TELEGRAM_OIDC_COOKIE,
  setRefreshTokenCookie,
  telegramOidcCookieOptions,
} from './auth.constants.ts';
import { CurrentUser } from './decorators/current-user.decorator.ts';
import { TelegramLinkStartDto } from './dto/telegram-link-start.dto.ts';
import { JwtAuthGuard } from './guards/jwt-auth.guard.ts';
import {
  safeReturnPath,
  TelegramOidcService,
} from './telegram-oidc.service.ts';

type TelegramLoginError = 'denied' | 'taken' | 'failed' | 'unavailable';

const DEFAULT_FRONTEND_URL = 'http://localhost:3000';

/**
 * Вход и привязка Telegram по OIDC. Браузер уходит на Telegram и возвращается на `callback`,
 * поэтому результат (в том числе ошибки) сообщается редиректом на фронтенд: `?telegramError=<код>`
 * либо `?telegram=linked`.
 */
@Controller('auth/telegram')
export class TelegramAuthController {
  private readonly logger = new Logger(TelegramAuthController.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly oidc: TelegramOidcService,
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    this.frontendUrl =
      configService.get<string>('FRONTEND_URL') ?? DEFAULT_FRONTEND_URL;
  }

  @Get('login')
  login(
    @Query('returnPath') returnPath: string | undefined,
    @Res() res: Response,
  ): void {
    try {
      const { authorizationUrl, cookieValue } = this.oidc.start({
        intent: 'login',
        returnPath,
      });
      this.setStateCookie(res, cookieValue);
      res.redirect(authorizationUrl);
    } catch (error: unknown) {
      this.redirectWithError(
        res,
        { intent: 'login', returnPath: safeReturnPath(returnPath) },
        this.toErrorCode(error),
      );
    }
  }

  /** Привязка требует JWT, а у редиректа заголовка нет, поэтому старт - обычный запрос, отдающий адрес */
  @Post('link/start')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  linkStart(
    @CurrentUser('sub') userId: string,
    @Body() dto: TelegramLinkStartDto,
    @Res({ passthrough: true }) res: Response,
  ): { url: string } {
    const { authorizationUrl, cookieValue } = this.oidc.start({
      intent: 'link',
      userId,
      returnPath: dto.returnPath,
    });
    this.setStateCookie(res, cookieValue);
    return { url: authorizationUrl };
  }

  @Get('callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const cookieValue = (req.cookies as Record<string, string> | undefined)?.[
      TELEGRAM_OIDC_COOKIE
    ];
    // Состояние одноразовое: кука больше не нужна при любом исходе
    res.clearCookie(TELEGRAM_OIDC_COOKIE, telegramOidcCookieOptions());
    const origin = this.oidc.peekSession(cookieValue);

    if (error || !code || !state) {
      this.redirectWithError(res, origin, 'denied');
      return;
    }

    try {
      const result = await this.oidc.finish({ code, state, cookieValue });

      if (result.intent === 'link') {
        if (!result.userId) {
          throw new Error('Link session without user');
        }
        await this.authService.linkTelegramProfile(
          result.userId,
          result.profile,
        );
        res.redirect(
          this.frontendUrlFor(result.returnPath, { telegram: 'linked' }),
        );
        return;
      }

      setRefreshTokenCookie(
        res,
        await this.authService.loginWithTelegramProfile(result.profile),
      );
      res.redirect(this.frontendUrlFor(result.returnPath));
    } catch (failure: unknown) {
      this.logger.warn(
        `Telegram callback failed: ${failure instanceof Error ? failure.message : 'unknown'}`,
      );
      this.redirectWithError(res, origin, this.toErrorCode(failure));
    }
  }

  private setStateCookie(res: Response, cookieValue: string): void {
    res.cookie(TELEGRAM_OIDC_COOKIE, cookieValue, {
      ...telegramOidcCookieOptions(),
      maxAge: this.oidc.sessionTtlMs,
    });
  }

  private toErrorCode(error: unknown): TelegramLoginError {
    if (error instanceof ConflictException) return 'taken';
    if (error instanceof ServiceUnavailableException) return 'unavailable';
    return 'failed';
  }

  /** Вход, начатый с гостевой страницы, возвращаем на неё же; привязку - в то место, откуда её начали */
  private redirectWithError(
    res: Response,
    origin: { intent: 'login' | 'link'; returnPath: string } | null,
    code: TelegramLoginError,
  ): void {
    if (origin?.intent === 'link') {
      res.redirect(
        this.frontendUrlFor(origin.returnPath, { telegramError: code }),
      );
      return;
    }
    const params: Record<string, string> = { telegramError: code };
    if (origin && origin.returnPath !== '/') {
      params.next = origin.returnPath;
    }
    res.redirect(this.frontendUrlFor('/auth', params));
  }

  private frontendUrlFor(
    path: string,
    params: Record<string, string> = {},
  ): string {
    const url = new URL(path, this.frontendUrl);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return url.toString();
  }
}
