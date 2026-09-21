import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import { DevOnlyGuard } from './guards/dev-only.guard.ts';
import { TelegramSampleQueryDto } from './dto/telegram-sample-query.dto.ts';
import { computeTelegramAuthHash } from './utils/telegram-auth.util.ts';

const DEFAULT_SAMPLE_ID = 555666777;

/**
 * Dev-only помощник для ручного тестирования Telegram-логина без реального
 * бота/виджета: сам считает валидный `hash` тем же `TELEGRAM_BOT_TOKEN`,
 * которым бэкенд проверяет запросы к `/auth/telegram`. Токен никогда не
 * покидает бэкенд, наружу отдаётся только готовый подписанный payload.
 * Закрыт `DevOnlyGuard` (404 при `NODE_ENV=production`) и исключён из
 * Swagger. См. docs/dev/telegram-auth-manual-testing.md.
 */
@Controller('auth/dev')
@ApiExcludeController()
@UseGuards(DevOnlyGuard)
export class AuthDevController {
  private readonly telegramBotToken: string;

  constructor(configService: ConfigService) {
    this.telegramBotToken = configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
  }

  @Get('telegram-sample')
  telegramSample(@Query() query: TelegramSampleQueryDto) {
    const id = query.id ?? DEFAULT_SAMPLE_ID;
    const firstName = query.firstName ?? 'Dev';
    const authDate = Math.floor(Date.now() / 1000) + (query.authDateOffsetSeconds ?? 0);

    const fields = { id, first_name: firstName, auth_date: authDate };
    const hash = computeTelegramAuthHash(fields, this.telegramBotToken);

    return { ...fields, hash };
  }
}
