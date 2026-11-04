import { timingSafeEqual } from 'node:crypto';
import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from '../../infrastructure/telegram/telegram.service.ts';

export interface TelegramUpdate {
  message?: { text?: string; chat?: { id: number; type: string } };
}

const START_REPLY =
  `Привет! Это бот Interviewly. Сюда придут уведомления об откликах и встречах. Чтобы получать их, привяжите Telegram в личном кабинете на сайте.`;

const POLL_RETRY_DELAY_MS = 3_000;

@Injectable()
export class TelegramBotService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(TelegramBotService.name);
  private readonly secret: string | undefined;
  private readonly webhookUrl: string | undefined;
  private polling = false;
  private pollOffset: number | undefined;

  constructor(
    configService: ConfigService,
    private readonly telegram: TelegramService,
  ) {
    this.secret = configService.get<string>('TELEGRAM_WEBHOOK_SECRET');
    this.webhookUrl = configService.get<string>('TELEGRAM_WEBHOOK_URL');
  }

  async onApplicationBootstrap(): Promise<void> {
    try {
      const me = await this.telegram.getMe();
      const handle = me.username ? `@${me.username}` : '(без username)';
      const link = me.username ? `https://t.me/${me.username}` : 'n/a';
      this.logger.log(`Telegram bot: ${me.first_name} ${handle}`);
      this.logger.log(`Telegram bot link: ${link} (id=${me.id})`);
    } catch (error: unknown) {
      this.logger.warn(
        `Telegram getMe failed (token/proxy?): ${error instanceof Error ? error.message : 'unknown'}`,
      );
      return;
    }

    if (this.webhookUrl && this.secret) {
      try {
        await this.telegram.setWebhook(this.webhookUrl, this.secret);
        this.logger.log(`Telegram webhook set to ${this.webhookUrl}`);
      } catch (error: unknown) {
        this.logger.error(`Failed to set Telegram webhook: ${error instanceof Error ? error.message : 'unknown'}`);
      }
      return;
    }

    void this.startPolling();
  }

  onModuleDestroy(): void {
    this.polling = false;
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

  private async startPolling(): Promise<void> {
    try {
      await this.telegram.deleteWebhook();
    } catch (error: unknown) {
      this.logger.warn(
        `deleteWebhook before polling failed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }

    this.polling = true;
    this.logger.log('Telegram long polling started (ответы на /start без webhook)');

    while (this.polling) {
      try {
        const updates = await this.telegram.getUpdates(this.pollOffset);
        for (const update of updates) {
          this.pollOffset = update.update_id + 1;
          await this.handleUpdate(update);
        }
      } catch (error: unknown) {
        if (!this.polling) {
          return;
        }
        this.logger.warn(
          `Telegram getUpdates failed: ${error instanceof Error ? error.message : 'unknown'}`,
        );
        await new Promise((resolve) => {
          setTimeout(resolve, POLL_RETRY_DELAY_MS);
        });
      }
    }
  }
}
