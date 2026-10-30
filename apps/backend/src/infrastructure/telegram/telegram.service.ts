import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { fetchViaHttpProxy, normalizeTelegramProxyUrl } from './telegram-proxy.ts';

const DEFAULT_API_URL = 'https://api.telegram.org';
const REQUEST_TIMEOUT_MS = 10_000;
const LONG_POLL_TIMEOUT_SEC = 25;

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

export interface TelegramBotInfo {
  id: number;
  username?: string;
  first_name: string;
}

export interface TelegramUpdateResult {
  update_id: number;
  message?: { text?: string; chat?: { id: number; type: string } };
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;
  private readonly apiUrl: string;
  private readonly proxyUrl: string | undefined;

  constructor(configService: ConfigService) {
    this.botToken = configService.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
    this.apiUrl = configService.get<string>('TELEGRAM_API_URL') ?? DEFAULT_API_URL;
    const rawProxy = configService.get<string>('TG_PROXY')?.trim();
    this.proxyUrl = rawProxy ? normalizeTelegramProxyUrl(rawProxy) : undefined;
    if (this.proxyUrl) {
      const host = new URL(this.proxyUrl).host;
      this.logger.log(`Telegram API proxy enabled (${host})`);
    }
  }

  async getMe(): Promise<TelegramBotInfo> {
    return this.call<TelegramBotInfo>('getMe', {});
  }

  async sendMessage(chatId: string, text: string): Promise<void> {
    await this.call('sendMessage', { chat_id: chatId, text, disable_web_page_preview: true });
  }

  /** Подписывает бота на webhook. */
  async setWebhook(url: string, secret: string): Promise<void> {
    await this.call('setWebhook', { url, secret_token: secret, allowed_updates: ['message'] });
  }

  /** Снимает webhook, чтобы работал long polling (`getUpdates`). */
  async deleteWebhook(): Promise<void> {
    await this.call('deleteWebhook', {});
  }

  async getUpdates(offset?: number): Promise<TelegramUpdateResult[]> {
    return this.call<TelegramUpdateResult[]>('getUpdates', {
      offset,
      timeout: LONG_POLL_TIMEOUT_SEC,
      allowed_updates: ['message'],
    });
  }

  private async call<T>(method: string, payload: object): Promise<T> {
    const url = `${this.apiUrl}/bot${this.botToken}/${method}`;
    const body = JSON.stringify(payload);
    const headers = { 'Content-Type': 'application/json' };
    const signal = AbortSignal.timeout(
      method === 'getUpdates' ? (LONG_POLL_TIMEOUT_SEC + 5) * 1000 : REQUEST_TIMEOUT_MS,
    );

    let response: Response;
    try {
      response = this.proxyUrl
        ? await fetchViaHttpProxy(url, this.proxyUrl, { method: 'POST', headers, body, signal })
        : await fetch(url, { method: 'POST', headers, body, signal });
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : 'unknown error';
      throw new TelegramDeliveryError(`Telegram request failed: ${reason}`, false);
    }

    const rawBody = await response.text();
    let parsed: { ok?: boolean; result?: T; description?: string };
    try {
      parsed = JSON.parse(rawBody) as { ok?: boolean; result?: T; description?: string };
    } catch {
      const snippet = rawBody.replace(/\s+/g, ' ').slice(0, 120);
      throw new TelegramDeliveryError(
        `Telegram responded ${response.status}: invalid JSON (${snippet || 'empty body'})`,
        false,
      );
    }

    if (response.ok && parsed.ok) {
      return parsed.result as T;
    }

    const description = parsed.description ?? 'no description';
    const permanent = response.status >= 400 && response.status < 500 && response.status !== 429;
    this.logger.warn(`Telegram ${method} failed: ${response.status} ${description}`);
    throw new TelegramDeliveryError(`Telegram responded ${response.status}: ${description}`, permanent);
  }
}
