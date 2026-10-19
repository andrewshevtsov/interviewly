import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { TelegramBotService, type TelegramUpdate } from './telegram-bot.service.ts';

@Controller('telegram')
@ApiExcludeController()
export class TelegramBotController {
  constructor(private readonly bot: TelegramBotService) {}

  /**
   * Webhook бота. Подлинность по секрету, который Telegram присылает в заголовке
   * (задаётся при `setWebhook`). Всегда 200, иначе Telegram будет слать апдейт повторно.
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleUpdate(
    @Headers('x-telegram-bot-api-secret-token') secret: string | undefined,
    @Body() update: TelegramUpdate,
  ): Promise<{ ok: true }> {
    if (!this.bot.isValidSecret(secret)) {
      throw new UnauthorizedException('Invalid Telegram webhook secret');
    }
    await this.bot.handleUpdate(update);
    return { ok: true };
  }
}
