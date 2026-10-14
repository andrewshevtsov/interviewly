import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const DEFAULT_API_URL = 'https://api.telegram.org';
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Ошибка доставки в Telegram. `permanent` - повтор бесполезен (бот заблокирован, чата нет, токен
 * неверный): вызывающий код может переключиться на другой канал. Остальное - временный сбой.
 */
export class TelegramDeliveryError extends Error {
  constructor(
    message: string,
    readonly permanent: boolean,
  ) {
    super(message);
    this.name = 'TelegramDeliveryError';
  }
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;
  private readonly apiUrl: string;

  constructor(configService: ConfigService) {
    this.botToken = configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
    this.apiUrl = configService.get<string>('TELEGRAM_API_URL') ?? DEFAULT_API_URL;
  }

  async sendMessage(chatId: string, text: string): Promise<void> {
    let response: Response;
    try {
      response = await fetch(`${this.apiUrl}/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.name : 'unknown error';
      throw new TelegramDeliveryError(`Telegram request failed: ${reason}`, false);
    }

    if (response.ok) {
      return;
    }

    const description = await this.readDescription(response);
    const permanent = response.status >= 400 && response.status < 500 && response.status !== 429;
    this.logger.warn(`Telegram sendMessage failed: ${response.status} ${description}`);
    throw new TelegramDeliveryError(`Telegram responded ${response.status}: ${description}`, permanent);
  }

  private async readDescription(response: Response): Promise<string> {
    try {
      const body = (await response.json()) as { description?: string };
      return body.description ?? 'no description';
    } catch {
      return 'no description';
    }
  }
}
