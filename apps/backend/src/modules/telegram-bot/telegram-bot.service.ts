import { timingSafeEqual } from 'node:crypto';
import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from '../../infrastructure/telegram/telegram.service.ts';

export interface TelegramUpdate {
  message?: { text?: string; chat?: { id: number; type: string } };
}

const START_REPLY =
  `Привет! Это бот Interviewly. Сюда придут уведомления об откликах и встречах. Чтобы получать их, привяжите Telegram в личном кабинете на сайте.`;

@Injectable()
export class TelegramBotService implements OnApplicationBootstrap {
  private readonly logger = new Logger(TelegramBotService.name);
  private readonly secret: string | undefined;
  private readonly webhookUrl: string | undefined;

  constructor(
    configService: ConfigService,
    private readonly telegram: TelegramService,
  ) {
    this.secret = configService.get<string>('TELEGRAM_WEBHOOK_SECRET');
    this.webhookUrl = configService.get<string>('TELEGRAM_WEBHOOK_URL');
  }

  /** Регистрирует webhook при старте, если задан публичный URL (ngrok в разработке). */
  async onApplicationBootstrap(): Promise<void> {
    if (!this.webhookUrl || !this.secret) {
      return;
    }
    try {
      await this.telegram.setWebhook(this.webhookUrl, this.secret);
      this.logger.log(`Telegram webhook set to ${this.webhookUrl}`);
    } catch (error: unknown) {
      this.logger.error(`Failed to set Telegram webhook: ${error instanceof Error ? error.message : 'unknown'}`);
    }
  }

  isValidSecret(received: string | undefined): boolean {
    if (!received || !this.secret) {
      return false;
    }
    const expected = Buffer.from(this.secret);
    const actual = Buffer.from(received);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }

  /** Реагирует только на `/start` в личном чате; ошибки ответа не должны ломать webhook. */
  async handleUpdate(update: TelegramUpdate): Promise<void> {
    const { message } = update;
    if (message?.chat?.type !== 'private' || !message.text?.startsWith('/start')) {
      return;
    }

    try {
      await this.telegram.sendMessage(String(message.chat.id), START_REPLY);
    } catch (error: unknown) {
      this.logger.warn(`Failed to answer /start: ${error instanceof Error ? error.message : 'unknown'}`);
    }
  }
}
