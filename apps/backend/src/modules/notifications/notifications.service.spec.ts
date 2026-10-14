import { afterEach, beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import type { Queue } from 'bullmq';
import { NotificationsService } from './notifications.service.ts';

const NOW = new Date('2026-10-10T12:00:00.000Z');
const hoursFromNow = (hours: number) => new Date(NOW.getTime() + hours * 60 * 60 * 1000);

describe('NotificationsService', () => {
  let queue: Mocked<Queue>;
  let service: NotificationsService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    queue = { add: vi.fn().mockResolvedValue({}), remove: vi.fn().mockResolvedValue(1), on: vi.fn() } as unknown as Mocked<Queue>;
    service = new NotificationsService(queue);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('напоминание за 2 часа до встречи с отложенным запуском', async () => {
    await service.scheduleSessionReminder('s1', hoursFromNow(5));

    expect(queue.add).toHaveBeenCalledWith(
      'session-reminder',
      { sessionId: 's1' },
      { jobId: 'session-reminder-s1', delay: 3 * 60 * 60 * 1000 },
    );
  });

  it('если до встречи меньше 2 часов, ссылка уходит сразу', async () => {
    await service.scheduleSessionReminder('s1', hoursFromNow(1));

    expect(queue.add).toHaveBeenCalledWith('session-reminder', { sessionId: 's1' }, expect.objectContaining({ delay: 0 }));
  });

  it('снимает напоминание по детерминированному jobId', async () => {
    await service.cancelSessionReminder('s1');

    expect(queue.remove).toHaveBeenCalledWith('session-reminder-s1');
  });

  it('события получают детерминированный jobId: повтор не создаст дубль', async () => {
    await service.notifyResponseCreated('r1');
    await service.notifyResponseAccepted('r1');
    await service.notifyResponseRejected('r1');
    await service.notifySessionCancelled('s1', 'u1');

    expect(queue.add).toHaveBeenNthCalledWith(1, 'response-created', { responseId: 'r1' }, { jobId: 'response-created-r1' });
    expect(queue.add).toHaveBeenNthCalledWith(2, 'response-accepted', { responseId: 'r1' }, { jobId: 'response-accepted-r1' });
    expect(queue.add).toHaveBeenNthCalledWith(3, 'response-rejected', { responseId: 'r1' }, { jobId: 'response-rejected-r1' });
    expect(queue.add).toHaveBeenNthCalledWith(
      4,
      'session-cancelled',
      { sessionId: 's1', cancelledById: 'u1' },
      { jobId: 'session-cancelled-s1' },
    );
  });

  it('сбой очереди не ломает основную операцию', async () => {
    queue.add.mockRejectedValue(new Error('redis down'));

    await expect(service.notifyResponseAccepted('r1')).resolves.toBeUndefined();
    await expect(service.scheduleSessionReminder('s1', hoursFromNow(5))).resolves.toBeUndefined();
  });

  it('если Redis не отвечает, не зависает дольше таймаута', async () => {
    queue.add.mockReturnValue(new Promise(() => undefined));

    const pending = service.notifyResponseAccepted('r1');
    await vi.advanceTimersByTimeAsync(3_000);

    await expect(pending).resolves.toBeUndefined();
  });
});
