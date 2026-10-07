import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import {
  ENQUEUE_TIMEOUT_MS,
  EVENT_JOB,
  NOTIFICATIONS_QUEUE,
  REMINDER_LEAD_HOURS,
} from './notifications.constants.ts';

const HOUR_MS = 60 * 60 * 1000;

const reminderJobId = (sessionId: string) => `session-reminder-${sessionId}`;

/**
 * Ставит уведомления в очередь; сбой очереди только логируется и не ломает основную операцию.
 */
@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(@InjectQueue(NOTIFICATIONS_QUEUE) private readonly queue: Queue) {}

  onModuleInit(): void {
    this.queue.on('error', (error) => this.logger.error(`Notifications queue error: ${error.message}`));
  }

  notifyResponseCreated(responseId: string): Promise<void> {
    return this.enqueue('response created', () =>
      this.queue.add(EVENT_JOB.responseCreated, { responseId }, { jobId: `response-created-${responseId}` }),
    );
  }

  notifyResponseAccepted(responseId: string): Promise<void> {
    return this.enqueue('response accepted', () =>
      this.queue.add(EVENT_JOB.responseAccepted, { responseId }, { jobId: `response-accepted-${responseId}` }),
    );
  }

  notifyResponseRejected(responseId: string): Promise<void> {
    return this.enqueue('response rejected', () =>
      this.queue.add(EVENT_JOB.responseRejected, { responseId }, { jobId: `response-rejected-${responseId}` }),
    );
  }

  notifySessionCancelled(sessionId: string, cancelledById: string): Promise<void> {
    return this.enqueue('session cancelled', () =>
      this.queue.add(
        EVENT_JOB.sessionCancelled,
        { sessionId, cancelledById },
        { jobId: `session-cancelled-${sessionId}` },
      ),
    );
  }

  /** 2 часа до встречи; если времени осталось меньше, ссылка уходит сразу */
  scheduleSessionReminder(sessionId: string, scheduledAt: Date): Promise<void> {
    const delay = Math.max(0, scheduledAt.getTime() - REMINDER_LEAD_HOURS * HOUR_MS - Date.now());

    return this.enqueue('session reminder', () =>
      this.queue.add(EVENT_JOB.sessionReminder, { sessionId }, { jobId: reminderJobId(sessionId), delay }),
    );
  }

  /**
   * Снимает напоминание отменённой встречи.
   */
  cancelSessionReminder(sessionId: string): Promise<void> {
    return this.enqueue('reminder removal', async () => {
      await this.queue.remove(reminderJobId(sessionId));
    });
  }

  private async enqueue(what: string, run: () => Promise<unknown>): Promise<void> {
    try {
      await Promise.race([
        run(),
        new Promise((_resolve, reject) =>
          setTimeout(() => reject(new Error('queue is not responding')), ENQUEUE_TIMEOUT_MS).unref(),
        ),
      ]);
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error(`Could not enqueue notification (${what}): ${reason}`);
    }
  }
}
