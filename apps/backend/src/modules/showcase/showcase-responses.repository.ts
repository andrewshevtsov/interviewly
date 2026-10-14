import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.ts';
import type { Prisma, ShowcaseResponse } from '../../prisma/generated/client.ts';
import type {
  SessionParticipantRole,
  ShowcaseResponseStatus,
} from '../../prisma/generated/enums.ts';
import {
  INTERVIEW_DURATION_MINUTES,
  SHOWCASE_RESPONSES_LIST_LIMIT,
} from './showcase.constants.ts';

type Db = Prisma.TransactionClient;

const responderSelect = {
  firstName: true,
  lastName: true,
  profile: { select: { role: true, level: true, stack: true, bio: true } },
} satisfies Prisma.UserSelect;

const cardOwnerSelect = {
  id: true,
  role: true,
  user: { select: { firstName: true, lastName: true } },
} satisfies Prisma.ProfileSelect;

export type IncomingRow = Prisma.ShowcaseResponseGetPayload<{
  include: { responder: { select: typeof responderSelect } };
}>;

export type OutgoingRow = Prisma.ShowcaseResponseGetPayload<{
  include: { card: { select: typeof cardOwnerSelect } };
}>;

export interface CardForResponse {
  id: string;
  userId: string;
  showcaseVisible: boolean;
  user: { status: string };
}

export interface ReviewTarget extends ShowcaseResponse {
  card: { userId: string };
}

// Интервью, которые занимают время участника
const CONFIRMED_SESSION_STATUSES = ['SCHEDULED', 'READY', 'ACTIVE'] as const;

function overlapWindow(slot: Date) {
  const span = INTERVIEW_DURATION_MINUTES * 60 * 1000;
  return { gt: new Date(slot.getTime() - span), lt: new Date(slot.getTime() + span) };
}

/**
 * Методы с параметром `db` работают внутри транзакции, когда он передан: проверка занятости,
 * запись отклика и создание сессии должны выполняться под одной блокировкой участников.
 */
@Injectable()
export class ShowcaseResponsesRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(run: (tx: Db) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(run);
  }

  /**
   * Блокирует участников до конца транзакции: две параллельные проверки занятости одного человека
   * идут по очереди и не пропускают пересекающиеся слоты. Порядок фиксирован, чтобы транзакции не
   * ждали друг друга по кругу.
   */
  async lockUsers(userIds: string[], db: Db): Promise<void> {
    for (const userId of [...new Set(userIds)].sort()) {
      await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${userId}))`;
    }
  }

  findCard(cardId: string): Promise<CardForResponse | null> {
    return this.prisma.profile.findUnique({
      where: { id: cardId },
      select: { id: true, userId: true, showcaseVisible: true, user: { select: { status: true } } },
    });
  }

  async hasProfile(userId: string): Promise<boolean> {
    const profile = await this.prisma.profile.findUnique({ where: { userId }, select: { id: true } });
    return profile !== null;
  }

  /** Помечает просроченные отклики в ожидании: у них прошло время встречи, а решения не было */
  async expireOverdue(scope: Prisma.ShowcaseResponseWhereInput, db: Db = this.prisma): Promise<void> {
    await db.showcaseResponse.updateMany({
      where: { ...scope, status: 'PENDING', scheduledAt: { lte: new Date() } },
      data: { status: 'EXPIRED' },
    });
  }

  /** Последний отклик этого человека на эту карточку: по нему считаем ожидание и паузу после отказа */
  findLatest(cardId: string, responderId: string, db: Db = this.prisma): Promise<ShowcaseResponse | null> {
    return db.showcaseResponse.findFirst({
      where: { cardId, responderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Пользователи из списка, у которых в окне слота уже есть назначенное интервью */
  async findBusyUserIds(userIds: string[], slot: Date, db: Db = this.prisma): Promise<Set<string>> {
    const rows = await db.sessionParticipant.findMany({
      where: {
        userId: { in: userIds },
        session: { status: { in: [...CONFIRMED_SESSION_STATUSES] }, scheduledAt: overlapWindow(slot) },
      },
      select: { userId: true },
    });
    return new Set(rows.map((row) => row.userId));
  }

  /** Есть ли у человека свой отклик в ожидании на пересекающееся время */
  async hasPendingResponseAround(responderId: string, slot: Date, db: Db = this.prisma): Promise<boolean> {
    const count = await db.showcaseResponse.count({
      where: { responderId, status: 'PENDING', scheduledAt: overlapWindow(slot) },
    });
    return count > 0;
  }

  /** Падает с P2002, если у пары уже есть отклик в ожидании */
  create(
    data: {
      cardId: string;
      responderId: string;
      role: SessionParticipantRole;
      scheduledAt: Date;
    },
    db: Db = this.prisma,
  ): Promise<ShowcaseResponse> {
    return db.showcaseResponse.create({ data });
  }

  findForReview(id: string): Promise<ReviewTarget | null> {
    return this.prisma.showcaseResponse.findUnique({
      where: { id },
      include: { card: { select: { userId: true } } },
    });
  }

  /**
   * Меняет статус, только пока отклик в ожидании: условие в самом UPDATE не даёт двум
   * одновременным решениям (принять и отклонить, принять и отозвать) оба применить.
   * `null`, если отклик уже не PENDING.
   */
  async decide(
    id: string,
    data: { status: ShowcaseResponseStatus; rejectionReason?: string; timeMismatch?: boolean },
    db: Db = this.prisma,
  ): Promise<ShowcaseResponse | null> {
    const { count } = await db.showcaseResponse.updateMany({
      where: { id, status: 'PENDING' },
      data: { ...data, reviewedAt: new Date() },
    });
    return count === 0 ? null : db.showcaseResponse.findUnique({ where: { id } });
  }

  attachSession(id: string, sessionId: string, db: Db = this.prisma): Promise<ShowcaseResponse> {
    return db.showcaseResponse.update({ where: { id }, data: { sessionId } });
  }

  findIncoming(ownerId: string, status?: ShowcaseResponseStatus): Promise<IncomingRow[]> {
    return this.prisma.showcaseResponse.findMany({
      where: { card: { userId: ownerId }, status },
      include: { responder: { select: responderSelect } },
      orderBy: { createdAt: 'desc' },
      take: SHOWCASE_RESPONSES_LIST_LIMIT,
    });
  }

  findOutgoing(responderId: string): Promise<OutgoingRow[]> {
    return this.prisma.showcaseResponse.findMany({
      where: { responderId },
      include: { card: { select: cardOwnerSelect } },
      orderBy: { createdAt: 'desc' },
      take: SHOWCASE_RESPONSES_LIST_LIMIT,
    });
  }
}
