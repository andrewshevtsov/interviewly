import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import type { EmailService } from '../../infrastructure/email/email.service.ts';
import {
  TelegramDeliveryError,
  type TelegramService,
} from '../../infrastructure/telegram/telegram.service.ts';
import { NotificationDeliveryService } from './notification-delivery.service.ts';
import type { NotificationsRepository, Recipient } from './notifications.repository.ts';

const user = (overrides: Partial<Recipient> = {}): Recipient => ({
  id: 'u',
  firstName: 'Clara',
  lastName: null,
  email: 'clara@interviewly.test',
  telegramId: null,
  timeZone: null,
  ...overrides,
});

const data = { userId: 'u', subject: 'Тема', text: 'Текст' };

describe('NotificationDeliveryService', () => {
  let repository: Mocked<NotificationsRepository>;
  let telegram: Mocked<TelegramService>;
  let email: Mocked<EmailService>;
  let service: NotificationDeliveryService;

  beforeEach(() => {
    repository = { findRecipient: vi.fn() } as unknown as Mocked<NotificationsRepository>;
    telegram = { sendMessage: vi.fn() } as unknown as Mocked<TelegramService>;
    email = { send: vi.fn() } as unknown as Mocked<EmailService>;
    service = new NotificationDeliveryService(repository, telegram, email);
  });

  it('отправляет в Telegram, если он привязан, и не пишет на почту', async () => {
    repository.findRecipient.mockResolvedValue(user({ telegramId: '777' }));

    await expect(service.deliver(data)).resolves.toBe('telegram');

    expect(telegram.sendMessage).toHaveBeenCalledWith('777', 'Тема\n\nТекст');
    expect(email.send).not.toHaveBeenCalled();
  });

  it('без Telegram отправляет письмо', async () => {
    repository.findRecipient.mockResolvedValue(user());

    await expect(service.deliver(data)).resolves.toBe('email');

    expect(email.send).toHaveBeenCalledWith({ to: 'clara@interviewly.test', subject: 'Тема', text: 'Текст' });
    expect(telegram.sendMessage).not.toHaveBeenCalled();
  });

  it('если Telegram недоступен (бот заблокирован), пишет на почту', async () => {
    repository.findRecipient.mockResolvedValue(user({ telegramId: '777' }));
    telegram.sendMessage.mockRejectedValue(new TelegramDeliveryError('blocked', true));

    await expect(service.deliver(data)).resolves.toBe('email');

    expect(email.send).toHaveBeenCalled();
  });

  it('временный сбой Telegram пробрасывает: очередь повторит, письмо не дублируется', async () => {
    repository.findRecipient.mockResolvedValue(user({ telegramId: '777' }));
    telegram.sendMessage.mockRejectedValue(new TelegramDeliveryError('timeout', false));

    await expect(service.deliver(data)).rejects.toThrow('timeout');

    expect(email.send).not.toHaveBeenCalled();
  });

  it('плейсхолдер-адрес Telegram-пользователя не считается почтой', async () => {
    repository.findRecipient.mockResolvedValue(user({ email: 'tg-777@telegram.interviewly.local' }));

    await expect(service.deliver(data)).resolves.toBe('none');

    expect(email.send).not.toHaveBeenCalled();
  });

  it('Telegram-пользователю, у которого бот заблочен, на плейсхолдер не пишет', async () => {
    repository.findRecipient.mockResolvedValue(
      user({ telegramId: '777', email: 'tg-777@telegram.interviewly.local' }),
    );
    telegram.sendMessage.mockRejectedValue(new TelegramDeliveryError('blocked', true));

    await expect(service.deliver(data)).resolves.toBe('none');

    expect(email.send).not.toHaveBeenCalled();
  });

  it('удалённый пользователь пропускается без ошибки', async () => {
    repository.findRecipient.mockResolvedValue(null);

    await expect(service.deliver(data)).resolves.toBe('none');
  });

  it('сбой SMTP пробрасывается для повтора', async () => {
    repository.findRecipient.mockResolvedValue(user());
    email.send.mockRejectedValue(new Error('smtp down'));

    await expect(service.deliver(data)).rejects.toThrow('smtp down');
  });
});
