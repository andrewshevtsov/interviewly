import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import type { TelegramService } from '../../infrastructure/telegram/telegram.service.ts';
import { TelegramBotService } from './telegram-bot.service.ts';

const makeConfig = (values: Record<string, string>) =>
  ({ get: (key: string) => values[key] }) as unknown as ConfigService;

describe('TelegramBotService', () => {
  let telegram: Mocked<TelegramService>;

  beforeEach(() => {
    telegram = {
      sendMessage: vi.fn(),
      setWebhook: vi.fn(),
      getMe: vi.fn().mockResolvedValue({ id: 1, username: 'interviewly_bot', first_name: 'Interviewly' }),
      deleteWebhook: vi.fn(),
      getUpdates: vi.fn().mockResolvedValue([]),
    } as unknown as Mocked<TelegramService>;
  });

  describe('isValidSecret', () => {
    const service = () => new TelegramBotService(makeConfig({ TELEGRAM_WEBHOOK_SECRET: 's3cret' }), telegram);

    it('принимает верный секрет', () => {
      expect(service().isValidSecret('s3cret')).toBe(true);
    });

    it.each([undefined, '', 'wrong!', 's3cret-longer'])('отклоняет %j', (value) => {
      expect(service().isValidSecret(value)).toBe(false);
    });

    it('отклоняет всё, если секрет не настроен', () => {
      const unconfigured = new TelegramBotService(makeConfig({}), telegram);
      expect(unconfigured.isValidSecret('anything')).toBe(false);
    });
  });

  describe('handleUpdate', () => {
    const service = () => new TelegramBotService(makeConfig({ TELEGRAM_WEBHOOK_SECRET: 's' }), telegram);

    it('отвечает на /start в личном чате', async () => {
      await service().handleUpdate({ message: { text: '/start', chat: { id: 42, type: 'private' } } });
      expect(telegram.sendMessage).toHaveBeenCalledWith('42', expect.any(String));
    });

    it('игнорирует прочие сообщения и групповые чаты', async () => {
      const bot = service();
      await bot.handleUpdate({ message: { text: 'hi', chat: { id: 1, type: 'private' } } });
      await bot.handleUpdate({ message: { text: '/start', chat: { id: 2, type: 'group' } } });
      await bot.handleUpdate({});
      expect(telegram.sendMessage).not.toHaveBeenCalled();
    });

    it('не падает, если ответить не удалось', async () => {
      telegram.sendMessage.mockRejectedValue(new Error('blocked'));
      await expect(
        service().handleUpdate({ message: { text: '/start', chat: { id: 1, type: 'private' } } }),
      ).resolves.toBeUndefined();
    });
  });

  describe('onApplicationBootstrap', () => {
    it('логирует бота и регистрирует webhook, если заданы URL и секрет', async () => {
      const bot = new TelegramBotService(
        makeConfig({ TELEGRAM_WEBHOOK_SECRET: 's', TELEGRAM_WEBHOOK_URL: 'https://x.ngrok/telegram/webhook' }),
        telegram,
      );
      await bot.onApplicationBootstrap();
      expect(telegram.getMe).toHaveBeenCalled();
      expect(telegram.setWebhook).toHaveBeenCalledWith('https://x.ngrok/telegram/webhook', 's');
      expect(telegram.deleteWebhook).not.toHaveBeenCalled();
    });

    it('без webhook URL снимает webhook и не падает при ошибке getMe', async () => {
      telegram.getMe.mockRejectedValue(new Error('bad token'));
      await new TelegramBotService(makeConfig({ TELEGRAM_WEBHOOK_SECRET: 's' }), telegram).onApplicationBootstrap();
      expect(telegram.setWebhook).not.toHaveBeenCalled();
      expect(telegram.deleteWebhook).not.toHaveBeenCalled();

      telegram.getMe.mockResolvedValue({ id: 1, first_name: 'Bot' });
      telegram.setWebhook.mockRejectedValue(new Error('boom'));
      const bot = new TelegramBotService(
        makeConfig({ TELEGRAM_WEBHOOK_SECRET: 's', TELEGRAM_WEBHOOK_URL: 'https://x' }),
        telegram,
      );
      await expect(bot.onApplicationBootstrap()).resolves.toBeUndefined();
    });
  });
});
