import { Processor, WorkerHost, InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import type { Job, Queue } from 'bullmq';
import { ShowcaseResponseStatus, SessionStatus } from '../../prisma/generated/enums.ts';
import {
  COMPLETED_JOBS_TTL_SECONDS,
  DELIVER_ATTEMPTS,
  DELIVER_BACKOFF_MS,
  DELIVER_JOB,
  EVENT_JOB,
  FAILED_JOBS_TTL_SECONDS,
  NOTIFICATIONS_QUEUE,
  PROCESSOR_CONCURRENCY,
} from './notifications.constants.ts';
import { NotificationDeliveryService, type DeliverJobData } from './notification-delivery.service.ts';
import {
  NotificationsRepository,
  type Recipient,
  type SessionForNotice,
} from './notifications.repository.ts';
import {
  responseAcceptedMessage,
  responseCreatedMessage,
  responseRejectedMessage,
  sessionCancelledMessage,
  sessionReminderMessage,
  type NotificationMessage,
} from './notifications.templates.ts';
import { ConfigService } from '@nestjs/config';
import { SHOWCASE_RESPONSE_COOLDOWN_HOURS } from '../showcase/showcase.constants.ts';

/** Сообщение одному получателю; `key` не создает дубль при повторе */
interface Outgoing {
  key: string;
  userId: string;
  message: NotificationMessage;
}

const HOUR_MS = 60 * 60 * 1000;

const fullName = (user: Pick<Recipient, 'firstName' | 'lastName'>) =>
  [user.firstName, user.lastName].filter(Boolean).join(' ');

const UPCOMING_STATUSES: ReadonlySet<SessionStatus> = new Set([SessionStatus.SCHEDULED, SessionStatus.READY]);

/**
 * Первый этап: событие (принят отклик, отмена, время напоминания) превращается в сообщения для
 * конкретных людей. Второй этап - `deliver`: отправка одному человеку со своими повторами,
 * чтобы сбой доставки одному не приводил к повтору сообщения другому.
 */
@Injectable()
@Processor(NOTIFICATIONS_QUEUE, { concurrency: PROCESSOR_CONCURRENCY })
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);
  private readonly frontendUrl: string;

  constructor(
    @InjectQueue(NOTIFICATIONS_QUEUE) private readonly queue: Queue,
    private readonly repository: NotificationsRepository,
    private readonly delivery: NotificationDeliveryService,
    configService: ConfigService,
  ) {
    super();
    this.frontendUrl = (configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000').replace(/\/$/, '');
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case DELIVER_JOB:
        await this.delivery.deliver(job.data as DeliverJobData);
        return;
      case EVENT_JOB.responseCreated:
        return this.fanOut(await this.buildResponseCreated((job.data as { responseId: string }).responseId));
      case EVENT_JOB.responseAccepted:
        return this.fanOut(await this.buildResponseAccepted((job.data as { responseId: string }).responseId));
      case EVENT_JOB.responseRejected:
        return this.fanOut(await this.buildResponseRejected((job.data as { responseId: string }).responseId));
      case EVENT_JOB.sessionCancelled: {
        const data = job.data as { sessionId: string; cancelledById: string };
        return this.fanOut(await this.buildSessionCancelled(data.sessionId, data.cancelledById));
      }
      case EVENT_JOB.sessionReminder:
        return this.fanOut(await this.buildSessionReminder((job.data as { sessionId: string }).sessionId));
      default:
        throw new Error(`Unknown notification job "${job.name}"`);
    }
  }

  private async fanOut(messages: Outgoing[]): Promise<void> {
    if (messages.length === 0) {
      return;
    }

    await this.queue.addBulk(
      messages.map(({ key, userId, message }) => ({
        name: DELIVER_JOB,
        data: { userId, ...message } satisfies DeliverJobData,
        opts: {
          jobId: key,
          attempts: DELIVER_ATTEMPTS,
          backoff: { type: 'exponential', delay: DELIVER_BACKOFF_MS },
          removeOnComplete: { age: COMPLETED_JOBS_TTL_SECONDS },
          removeOnFail: { age: FAILED_JOBS_TTL_SECONDS },
        },
      })),
    );
  }

  private async buildResponseCreated(responseId: string): Promise<Outgoing[]> {
    const response = await this.repository.findResponse(responseId);

    if (!response || response.status !== ShowcaseResponseStatus.PENDING) {
      return [];
    }

    const owner = response.card.user;
    return [
      {
        key: `deliver-created-${responseId}`,
        userId: owner.id,
        message: responseCreatedMessage({
          responderName: fullName(response.responder),
          responderRole: response.role,
          scheduledAt: response.scheduledAt,
          timeZone: owner.timeZone,
        }),
      },
    ];
  }

  private async buildResponseAccepted(responseId: string): Promise<Outgoing[]> {
    const response = await this.repository.findResponse(responseId);
    if (!response || response.status !== ShowcaseResponseStatus.ACCEPTED) {
      return [];
    }

    return [
      {
        key: `deliver-accepted-${responseId}`,
        userId: response.responderId,
        message: responseAcceptedMessage({
          ownerName: fullName(response.card.user),
          responderRole: response.role,
          scheduledAt: response.scheduledAt,
          timeZone: response.responder.timeZone,
        }),
      },
    ];
  }

  private async buildResponseRejected(responseId: string): Promise<Outgoing[]> {
    const response = await this.repository.findResponse(responseId);
    if (!response || response.status !== ShowcaseResponseStatus.REJECTED || !response.rejectionReason) {
      return [];
    }

    const retryAt =
      response.reviewedAt && !response.timeMismatch
        ? new Date(response.reviewedAt.getTime() + SHOWCASE_RESPONSE_COOLDOWN_HOURS * HOUR_MS)
        : null;

    return [
      {
        key: `deliver-rejected-${responseId}`,
        userId: response.responderId,
        message: responseRejectedMessage({
          ownerName: fullName(response.card.user),
          scheduledAt: response.scheduledAt,
          timeZone: response.responder.timeZone,
          reason: response.rejectionReason,
          timeMismatch: response.timeMismatch,
          retryAt,
        }),
      },
    ];
  }

  private async buildSessionCancelled(sessionId: string, cancelledById: string): Promise<Outgoing[]> {
    const session = await this.repository.findSession(sessionId);
    if (!session || session.status !== SessionStatus.CANCELLED) {
      return [];
    }

    const canceller = await this.repository.findRecipient(cancelledById);
    const cancellerName = canceller ? fullName(canceller) : 'Участник';

    return session.participants
      .filter((participant) => participant.userId !== cancelledById)
      .map((participant) => ({
        key: `deliver-cancelled-${sessionId}-${participant.userId}`,
        userId: participant.userId,
        message: sessionCancelledMessage({
          cancellerName,
          scheduledAt: session.scheduledAt,
          timeZone: participant.user.timeZone,
          reason: session.cancelReason,
        }),
      }));
  }

  private async buildSessionReminder(sessionId: string): Promise<Outgoing[]> {
    const session = await this.repository.findSession(sessionId);
    if (!session || !session.scheduledAt || !this.isUpcoming(session)) {
      this.logger.log(`Reminder for session ${sessionId} skipped: it is cancelled, started or gone`);
      return [];
    }

    const { scheduledAt } = session;
    const roomUrl = `${this.frontendUrl}/sessions/${session.id}`;

    return session.participants.map((participant) => {
      const partner = session.participants.find((other) => other.userId !== participant.userId);

      return {
        key: `deliver-reminder-${sessionId}-${participant.userId}`,
        userId: participant.userId,
        message: sessionReminderMessage({
          partnerName: partner ? fullName(partner.user) : '',
          role: participant.role,
          scheduledAt,
          timeZone: participant.user.timeZone,
          roomUrl,
        }),
      };
    });
  }

  private isUpcoming(session: SessionForNotice): boolean {
    return UPCOMING_STATUSES.has(session.status) && session.startedAt === null;
  }
}
