import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../../infrastructure/email/email.service.ts';
import {
  TelegramDeliveryError,
  TelegramService,
} from '../../infrastructure/telegram/telegram.service.ts';
import { TELEGRAM_PLACEHOLDER_EMAIL_DOMAIN } from '../users/users.constants.ts';
import { NotificationsRepository } from './notifications.repository.ts';

export interface DeliverJobData {
  userId: string;
  subject: string;
  text: string;
}

export type DeliveryChannel = 'telegram' | 'email' | 'none';

const hasRealEmail = (email: string) => !email.endsWith(`@${TELEGRAM_PLACEHOLDER_EMAIL_DOMAIN}`);

@Injectable()
export class NotificationDeliveryService {
  private readonly logger = new Logger(NotificationDeliveryService.name);

  constructor(
    private readonly repository: NotificationsRepository,
    private readonly telegram: TelegramService,
    private readonly email: EmailService,
  ) {}

  /**
   * Telegram, если он привязан, иначе почта. Если Telegram недоступен (бот
   * заблокирован, чата нет), пробуем почту. Временные сбои пробрасываются, очередь повторяет.
   */
  async deliver(data: DeliverJobData): Promise<DeliveryChannel> {
    const user = await this.repository.findRecipient(data.userId);
    if (!user) {
      this.logger.warn(`Recipient ${data.userId} no longer exists, notification skipped`);
      return 'none';
    }

    if (user.telegramId) {
      try {
        await this.telegram.sendMessage(user.telegramId, `${data.subject}\n\n${data.text}`);
        return 'telegram';
      } catch (error: unknown) {
        if (!(error instanceof TelegramDeliveryError && error.permanent)) {
          throw error;
        }
        this.logger.warn(`Telegram delivery to user ${user.id} failed permanently, trying email`);
      }
    }

    if (!hasRealEmail(user.email)) {
      this.logger.warn(`User ${user.id} has no reachable channel (no Telegram, no real email)`);
      return 'none';
    }

    await this.email.send({ to: user.email, subject: data.subject, text: data.text });
    return 'email';
  }
}
