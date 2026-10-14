import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../prisma/generated/client.ts';
import type { ShowcaseResponse } from '../../prisma/generated/client.ts';
import { SessionParticipantRole, ShowcaseResponseStatus } from '../../prisma/generated/enums.ts';
import { NotificationsService } from '../notifications/notifications.service.ts';
import { REMINDER_LEAD_HOURS } from '../notifications/notifications.constants.ts';
import { SessionsService } from '../sessions/sessions.service.ts';
import type { CreateShowcaseResponseDto } from './dto/create-showcase-response.dto.ts';
import type { RejectShowcaseResponseDto } from './dto/reject-showcase-response.dto.ts';
import {
  ShowcaseIncomingResponse,
  ShowcaseOutgoingResponse,
  ShowcaseResponseResult,
} from './entities/showcase-response.entity.ts';
import {
  ShowcaseResponsesRepository,
  type IncomingRow,
  type OutgoingRow,
} from './showcase-responses.repository.ts';
import {
  MAX_LEAD_DAYS,
  MIN_LEAD_HOURS,
  SHOWCASE_RESPONSE_COOLDOWN_HOURS,
} from './showcase.constants.ts';

const HOUR_MS = 60 * 60 * 1000;

const fullName = (user: { firstName: string; lastName: string | null }) =>
  [user.firstName, user.lastName].filter(Boolean).join(' ');

const oppositeRole = (role: SessionParticipantRole) =>
  role === SessionParticipantRole.INTERVIEWER
    ? SessionParticipantRole.CANDIDATE
    : SessionParticipantRole.INTERVIEWER;

const retryAfterRejection = (response: { reviewedAt: Date | null; timeMismatch: boolean }) =>
  response.reviewedAt && !response.timeMismatch
    ? new Date(response.reviewedAt.getTime() + SHOWCASE_RESPONSE_COOLDOWN_HOURS * HOUR_MS)
    : null;

@Injectable()
export class ShowcaseResponsesService {
  constructor(
    private readonly repository: ShowcaseResponsesRepository,
    private readonly sessionsService: SessionsService,
    private readonly notifications: NotificationsService,
  ) {}

  async respond(
    responderId: string,
    cardId: string,
    dto: CreateShowcaseResponseDto,
  ): Promise<ShowcaseResponseResult> {
    const slot = this.parseSlot(dto.scheduledAt);

    const card = await this.repository.findCard(cardId);

    if (!card || !card.showcaseVisible || card.user.status !== 'ACTIVE') {
      throw new NotFoundException('Showcase card not found');
    }

    if (card.userId === responderId) {
      throw new ForbiddenException('You cannot respond to your own card');
    }

    if (!(await this.repository.hasProfile(responderId))) {
      throw new ConflictException('Fill in your profile before responding to a card');
    }

    try {
      const created = await this.repository.transaction(async (tx) => {
        await this.repository.lockUsers([responderId, card.userId], tx);
        await this.repository.expireOverdue({ cardId, responderId }, tx);
        await this.assertCanRespondAgain(cardId, responderId, tx);
        await this.assertSlotFree(responderId, card.userId, slot, tx);

        return this.repository.create({ cardId, responderId, role: dto.role, scheduledAt: slot }, tx);
      });
      await this.notifications.notifyResponseCreated(created.id);

      return this.toResult(created);
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('You already have a pending response to this card');
      }
      throw error;
    }
  }

  /**
   * Принять отклик: в одной транзакции проверяем, что оба свободны в это время, помечаем отклик
   * принятым и создаём сессию на предложенное время. Владелец сессии - интервьюер пары.
   */
  async accept(ownerId: string, responseId: string): Promise<ShowcaseResponseResult> {
    const response = await this.requireReviewable(ownerId, responseId);
    await this.assertNotOverdue(response);

    const interviewerId = response.role === SessionParticipantRole.INTERVIEWER ? response.responderId : ownerId;
    const candidateId = interviewerId === ownerId ? response.responderId : ownerId;

    const accepted = await this.repository.transaction(async (tx) => {
      await this.repository.lockUsers([ownerId, response.responderId], tx);

      const busy = await this.repository.findBusyUserIds([ownerId, response.responderId], response.scheduledAt, tx);

      if (busy.has(ownerId)) {
        throw new ConflictException(
          'You already have an interview around this time. Reject this response and mark it as a time mismatch',
        );
      }

      if (busy.has(response.responderId)) {
        throw new ConflictException(
          'The responder is no longer available at this time. Reject this response and mark it as a time mismatch',
        );
      }

      const decided = this.requireDecided(
        await this.repository.decide(responseId, { status: ShowcaseResponseStatus.ACCEPTED }, tx),
      );

      const session = await this.sessionsService.createMatchSession(
        { interviewerId, candidateId, scheduledAt: response.scheduledAt },
        tx,
      );

      return this.repository.attachSession(decided.id, session.id, tx);
    });

    await this.notifications.notifyResponseAccepted(accepted.id);

    if (accepted.sessionId) {
      await this.notifications.scheduleSessionReminder(accepted.sessionId, accepted.scheduledAt);
    }

    return this.toResult(accepted);
  }

  async reject(
    ownerId: string,
    responseId: string,
    dto: RejectShowcaseResponseDto,
  ): Promise<ShowcaseResponseResult> {
    await this.requireReviewable(ownerId, responseId);

    const decided = await this.repository.decide(responseId, {
      status: ShowcaseResponseStatus.REJECTED,
      rejectionReason: dto.reason,
      timeMismatch: dto.timeMismatch ?? false,
    });
    const rejected = this.requireDecided(decided);

    await this.notifications.notifyResponseRejected(rejected.id);
    return this.toResult(rejected);
  }

  async cancel(responderId: string, responseId: string): Promise<ShowcaseResponseResult> {
    const response = await this.repository.findForReview(responseId);
    if (!response) {
      throw new NotFoundException('Response not found');
    }
    if (response.responderId !== responderId) {
      throw new ForbiddenException('Only the author of a response can cancel it');
    }
    if (response.status !== ShowcaseResponseStatus.PENDING) {
      throw new ConflictException('Only a pending response can be cancelled');
    }

    const decided = await this.repository.decide(responseId, { status: ShowcaseResponseStatus.CANCELLED });
    return this.toResult(this.requireDecided(decided));
  }

  async findIncoming(
    ownerId: string,
    status?: ShowcaseResponseStatus,
  ): Promise<ShowcaseIncomingResponse[]> {
    await this.repository.expireOverdue({ card: { userId: ownerId } });
    const rows = await this.repository.findIncoming(ownerId, status);
    return rows.map((row) => this.toIncoming(row));
  }

  async findOutgoing(responderId: string): Promise<ShowcaseOutgoingResponse[]> {
    await this.repository.expireOverdue({ responderId });
    const rows = await this.repository.findOutgoing(responderId);
    return rows.map((row) => this.toOutgoing(row));
  }

  private parseSlot(value: string): Date {
    const slot = new Date(value);
    const now = Date.now();
    if (slot.getTime() < now + MIN_LEAD_HOURS * HOUR_MS) {
      throw new BadRequestException(`Meeting time must be at least ${MIN_LEAD_HOURS} hours from now`);
    }
    if (slot.getTime() > now + MAX_LEAD_DAYS * 24 * HOUR_MS) {
      throw new BadRequestException(`Meeting time must be within ${MAX_LEAD_DAYS} days from now`);
    }
    return slot;
  }

  private async assertCanRespondAgain(
    cardId: string,
    responderId: string,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const latest = await this.repository.findLatest(cardId, responderId, tx);
    if (!latest) {
      return;
    }
    if (latest.status === ShowcaseResponseStatus.PENDING) {
      throw new ConflictException('You already have a pending response to this card');
    }
    if (latest.status === ShowcaseResponseStatus.REJECTED) {
      const retryAt = retryAfterRejection(latest);
      if (retryAt && retryAt.getTime() > Date.now()) {
        throw new ConflictException(
          `Your previous response was rejected. You can respond to this card again after ${retryAt.toISOString()}`,
        );
      }
    }
  }

  /**
   * Слот не должен пересекаться с назначенными интервью откликающегося и владельца карточки и
   * с другими откликами откликающегося в ожидании.
   */
  private async assertSlotFree(
    responderId: string,
    ownerId: string,
    slot: Date,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const busy = await this.repository.findBusyUserIds([responderId, ownerId], slot, tx);

    if (busy.has(responderId) || (await this.repository.hasPendingResponseAround(responderId, slot, tx))) {
      throw new ConflictException(
        'You already have an interview or a pending response around this time. Propose another time',
      );
    }
    if (busy.has(ownerId)) {
      throw new ConflictException('The card owner is busy around this time. Propose another time');
    }
  }

  private async requireReviewable(ownerId: string, responseId: string) {
    const response = await this.repository.findForReview(responseId);
    if (!response) {
      throw new NotFoundException('Response not found');
    }
    if (response.card.userId !== ownerId) {
      throw new ForbiddenException('Only the card owner can review responses');
    }
    if (response.status !== ShowcaseResponseStatus.PENDING) {
      throw new ConflictException('This response has already been reviewed');
    }
    return response;
  }

  private async assertNotOverdue(response: ShowcaseResponse): Promise<void> {
    if (response.scheduledAt.getTime() <= Date.now()) {
      await this.repository.expireOverdue({ id: response.id });
      throw new ConflictException('The proposed time has already passed');
    }
  }

  private requireDecided(response: ShowcaseResponse | null): ShowcaseResponse {
    if (!response) {
      throw new ConflictException('This response has already been reviewed');
    }
    return response;
  }

  private toResult(response: ShowcaseResponse): ShowcaseResponseResult {
    return new ShowcaseResponseResult({
      id: response.id,
      status: response.status,
      role: response.role,
      scheduledAt: response.scheduledAt,
      reminderAt: new Date(response.scheduledAt.getTime() - REMINDER_LEAD_HOURS * HOUR_MS),
      sessionId: response.sessionId,
      createdAt: response.createdAt,
      reviewedAt: response.reviewedAt,
      rejectionReason: response.rejectionReason,
      timeMismatch: response.timeMismatch,
    });
  }

  private toIncoming(row: IncomingRow): ShowcaseIncomingResponse {
    const { responder } = row;
    return new ShowcaseIncomingResponse({
      id: row.id,
      status: row.status,
      role: row.role,
      ownerRole: oppositeRole(row.role),
      scheduledAt: row.scheduledAt,
      responder: {
        name: fullName(responder),
        title: responder.profile?.role ?? null,
        level: responder.profile?.level ?? null,
        stack: responder.profile?.stack ?? [],
        bio: responder.profile?.bio ?? null,
      },
      sessionId: row.sessionId,
      createdAt: row.createdAt,
      reviewedAt: row.reviewedAt,
      rejectionReason: row.rejectionReason,
      timeMismatch: row.timeMismatch,
    });
  }

  private toOutgoing(row: OutgoingRow): ShowcaseOutgoingResponse {
    return new ShowcaseOutgoingResponse({
      id: row.id,
      status: row.status,
      role: row.role,
      scheduledAt: row.scheduledAt,
      card: { id: row.card.id, name: fullName(row.card.user), title: row.card.role },
      sessionId: row.sessionId,
      createdAt: row.createdAt,
      reviewedAt: row.reviewedAt,
      rejectionReason: row.rejectionReason,
      timeMismatch: row.timeMismatch,
      canRetryAt: row.status === ShowcaseResponseStatus.REJECTED ? retryAfterRejection(row) : null,
    });
  }
}
