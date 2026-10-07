import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import type { Job, Queue } from 'bullmq';
import type { NotificationDeliveryService } from './notification-delivery.service.ts';
import { NotificationsProcessor } from './notifications.processor.ts';
import type {
  NotificationsRepository,
  ResponseForNotice,
  SessionForNotice,
} from './notifications.repository.ts';

const AT = new Date('2026-10-12T11:00:00.000Z');

const person = (id: string, firstName: string, timeZone: string | null = null) => ({
  id,
  firstName,
  lastName: null,
  email: `${firstName.toLowerCase()}@test`,
  telegramId: null,
  timeZone,
});

const response = (overrides: Partial<ResponseForNotice> = {}): ResponseForNotice =>
  ({
    id: 'r1',
    responderId: 'me',
    role: 'CANDIDATE',
    status: 'ACCEPTED',
    scheduledAt: AT,
    rejectionReason: null,
    reviewedAt: AT,
    timeMismatch: false,
    responder: person('me', 'Clara', 'Asia/Dubai'),
    card: { user: person('owner', 'Ivan') },
    ...overrides,
  }) as ResponseForNotice;

const session = (overrides: Partial<SessionForNotice> = {}): SessionForNotice =>
  ({
    id: 's1',
    status: 'SCHEDULED',
    scheduledAt: AT,
    startedAt: null,
    cancelReason: null,
    participants: [
      { userId: 'owner', role: 'INTERVIEWER', user: person('owner', 'Ivan') },
      { userId: 'me', role: 'CANDIDATE', user: person('me', 'Clara', 'Asia/Dubai') },
    ],
    ...overrides,
  }) as SessionForNotice;

const job = (name: string, data: object) => ({ name, data }) as Job;

describe('NotificationsProcessor', () => {
  let queue: Mocked<Queue>;
  let repository: Mocked<NotificationsRepository>;
  let delivery: Mocked<NotificationDeliveryService>;
  let processor: NotificationsProcessor;

  const delivered = () => (queue.addBulk.mock.calls[0]?.[0] ?? []) as Array<{ name: string; data: { userId: string; subject: string; text: string }; opts: { jobId: string; attempts: number } }>;

  beforeEach(() => {
    queue = { addBulk: vi.fn().mockResolvedValue([]) } as unknown as Mocked<Queue>;
    repository = {
      findResponse: vi.fn(),
      findSession: vi.fn(),
      findRecipient: vi.fn(),
    } as unknown as Mocked<NotificationsRepository>;
    delivery = { deliver: vi.fn() } as unknown as Mocked<NotificationDeliveryService>;
    const config = { get: vi.fn().mockReturnValue('http://localhost:3000/') } as unknown as ConfigService;
    processor = new NotificationsProcessor(queue, repository, delivery, config);
  });

  it('новый отклик: сообщение уходит владельцу карточки в его часовом поясе', async () => {
    repository.findResponse.mockResolvedValue(
      response({ status: 'PENDING', card: { user: person('owner', 'Ivan', 'Asia/Dubai') } } as never),
    );

    await processor.process(job('response-created', { responseId: 'r1' }));

    const [message] = delivered();
    expect(message?.data.userId).toBe('owner');
    expect(message?.data.text).toContain('Clara');
    expect(message?.data.text).toContain('15:00');
    expect(message?.opts).toMatchObject({ jobId: 'deliver-created-r1', attempts: 5 });
  });

  it.each(['CANCELLED', 'ACCEPTED', 'REJECTED', 'EXPIRED'] as const)(
    'новый отклик: не уведомляет, если отклик уже в статусе %s',
    async (status) => {
      repository.findResponse.mockResolvedValue(response({ status }));

      await processor.process(job('response-created', { responseId: 'r1' }));

      expect(queue.addBulk).not.toHaveBeenCalled();
    },
  );

  it('принятие: сообщение уходит откликнувшемуся в его часовом поясе', async () => {
    repository.findResponse.mockResolvedValue(response());

    await processor.process(job('response-accepted', { responseId: 'r1' }));

    const [message] = delivered();
    expect(message?.name).toBe('deliver');
    expect(message?.data.userId).toBe('me');
    expect(message?.data.text).toContain('Ivan');
    expect(message?.data.text).toContain('15:00');
    expect(message?.opts).toMatchObject({ jobId: 'deliver-accepted-r1', attempts: 5 });
  });

  it('принятие: если отклик уже не принят, ничего не отправляет', async () => {
    repository.findResponse.mockResolvedValue(response({ status: 'CANCELLED' }));

    await processor.process(job('response-accepted', { responseId: 'r1' }));

    expect(queue.addBulk).not.toHaveBeenCalled();
  });

  it('отказ: причина и время повтора уходят откликнувшемуся', async () => {
    repository.findResponse.mockResolvedValue(
      response({ status: 'REJECTED', rejectionReason: 'Нет времени', reviewedAt: AT }),
    );

    await processor.process(job('response-rejected', { responseId: 'r1' }));

    const [message] = delivered();
    expect(message?.data.userId).toBe('me');
    expect(message?.data.text).toContain('Причина: Нет времени');
    expect(message?.data.text).toContain('снова можно после');
  });

  it('отмена: получает только откликнувшийся', async () => {
    repository.findSession.mockResolvedValue(session({ status: 'CANCELLED', cancelReason: 'Заболела' } as never));
    repository.findRecipient.mockResolvedValue(person('me', 'Clara'));

    await processor.process(job('session-cancelled', { sessionId: 's1', cancelledById: 'me' }));

    const messages = delivered();
    expect(messages.map((m) => m.data.userId)).toEqual(['owner']);
    expect(messages[0]?.data.text).toContain('Clara отменил(а)');
    expect(messages[0]?.data.text).toContain('Заболела');
  });

  it('отмена: сессия не в статусе CANCELLED - ничего не отправляет', async () => {
    repository.findSession.mockResolvedValue(session());

    await processor.process(job('session-cancelled', { sessionId: 's1', cancelledById: 'me' }));

    expect(queue.addBulk).not.toHaveBeenCalled();
  });

  it('напоминание: ссылка уходит обоим участникам, каждому со своим партнёром и ролью', async () => {
    repository.findSession.mockResolvedValue(session());

    await processor.process(job('session-reminder', { sessionId: 's1' }));

    const messages = delivered();
    expect(messages.map((m) => m.data.userId).sort()).toEqual(['me', 'owner']);
    const forClara = messages.find((m) => m.data.userId === 'me');
    expect(forClara?.data.text).toContain('http://localhost:3000/sessions/s1');
    expect(forClara?.data.text).toContain('Ivan');
    expect(forClara?.data.text).toContain('кандидат');
    expect(messages.map((m) => m.opts.jobId).sort()).toEqual(['deliver-reminder-s1-me', 'deliver-reminder-s1-owner']);
  });

  it.each(['CANCELLED', 'COMPLETED', 'ACTIVE'] as const)('напоминание: не отправляется, если сессия %s', async (status) => {
    repository.findSession.mockResolvedValue(session({ status }));

    await processor.process(job('session-reminder', { sessionId: 's1' }));

    expect(queue.addBulk).not.toHaveBeenCalled();
  });

  it('напоминание: не отправляется, если интервью уже началось', async () => {
    repository.findSession.mockResolvedValue(session({ startedAt: AT }));

    await processor.process(job('session-reminder', { sessionId: 's1' }));

    expect(queue.addBulk).not.toHaveBeenCalled();
  });

  it('deliver передаёт задание сервису доставки', async () => {
    const data = { userId: 'me', subject: 'Тема', text: 'Текст' };

    await processor.process(job('deliver', data));

    expect(delivery.deliver).toHaveBeenCalledWith(data);
  });

  it('неизвестное задание - ошибка', async () => {
    await expect(processor.process(job('unknown', {}))).rejects.toThrow('Unknown notification job');
  });
});
