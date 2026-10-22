import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type ChatCompletionOptions = {
  maxTokens: number;
  temperature: number;
};

type ChatCompletionResponse = {
  choices?: { message?: { content?: string | null }; finish_reason?: string }[];
};

const DEFAULT_BASE_URL = 'https://api.deepseek.com';
const DEFAULT_MODEL = 'deepseek-flash';
const REQUEST_TIMEOUT_MS = 20_000;

// Коды из документации DeepSeek, после которых повтор не поможет: проблема в
// ключе, балансе или самом запросе - ошибка конфигурации, а не сбой сети
const CONFIG_ERROR_STATUSES: ReadonlySet<number> = new Set([400, 401, 402, 422]);

/**
 * Клиент DeepSeek Chat Completions API (OpenAI-совместимый) на нативном fetch.
 * Ключ необязателен для старта приложения: без него бэкенд поднимается, а
 * запросы к модели отвечают 503
 */
@Injectable()
export class DeepseekService {
  private readonly logger = new Logger(DeepseekService.name);
  private readonly apiKey: string | undefined;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(configService: ConfigService) {
    this.apiKey = configService.get<string>('DEEPSEEK_API_KEY') || undefined;
    this.baseUrl = configService.get<string>('DEEPSEEK_BASE_URL', DEFAULT_BASE_URL);
    this.model = configService.get<string>('DEEPSEEK_MODEL', DEFAULT_MODEL);

    if (!this.apiKey) {
      this.logger.warn('DEEPSEEK_API_KEY is not set: AI features will respond with 503');
    }
  }

  /**
   * Отправляет диалог модели и возвращает текст ответа.
   * @throws ServiceUnavailableException - ключ не задан, неверен, кончился баланс или DeepSeek перегружен
   * @throws GatewayTimeoutException - DeepSeek не ответил за REQUEST_TIMEOUT_MS
   * @throws BadGatewayException - ответ пустой или обрезан фильтром
   */
  async complete(
    messages: ChatMessage[],
    options: ChatCompletionOptions,
  ): Promise<string> {
    if (!this.apiKey) {
      throw new ServiceUnavailableException('AI service is not configured');
    }

    const response = await this.post(messages, options);

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      this.logger.error(`DeepSeek responded ${response.status}: ${body.slice(0, 500)}`);

      if (CONFIG_ERROR_STATUSES.has(response.status)) {
        throw new ServiceUnavailableException('AI service is misconfigured');
      }
      throw new ServiceUnavailableException('AI service is temporarily unavailable, try again');
    }

    const data = (await response.json()) as ChatCompletionResponse;
    const choice = data.choices?.[0];
    const content = choice?.message?.content?.trim();

    if (!content || choice?.finish_reason === 'content_filter') {
      this.logger.warn(`DeepSeek returned no usable content (finish_reason=${choice?.finish_reason})`);
      throw new BadGatewayException('AI service returned an empty answer, try again');
    }

    return content;
  }

  private async post(
    messages: ChatMessage[],
    options: ChatCompletionOptions,
  ): Promise<Response> {
    try {
      return await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          max_tokens: options.maxTokens,
          temperature: options.temperature,
          // Режим рассуждений у flash-модели включён по умолчанию и замедляет ответ
          thinking: { type: 'disabled' },
          stream: false,
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw new GatewayTimeoutException('AI service did not respond in time, try again');
      }
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`DeepSeek request failed: ${message}`);
      throw new ServiceUnavailableException('AI service is temporarily unavailable, try again');
    }
  }
}
