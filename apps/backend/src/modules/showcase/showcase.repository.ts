import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.ts';
import type { Prisma } from '../../prisma/generated/client.ts';
import type { ProfessionLevel, SessionStatus, ShowcaseResponseStatus } from '../../prisma/generated/enums.ts';

export interface ShowcaseFilters {
  viewerId: string;
  levels?: ProfessionLevel[];
  stack?: string[];
  query?: string;
  limit: number;
  cursor?: string;
}

const COUNTED_INTERVIEW: Prisma.SessionParticipantWhereInput = {
  joinedAt: { not: null },
  session: { status: 'COMPLETED', startedAt: { not: null } },
};

const ACTIVE_ROOM: Prisma.SessionParticipantWhereInput = {
  leftAt: null,
  session: { status: 'ACTIVE' },
};

const cardSelect = {
  id: true,
  role: true,
  level: true,
  stack: true,
  bio: true,
  user: {
    select: {
      firstName: true,
      lastName: true,
      _count: {
        select: {
          sessionParticipations: { where: COUNTED_INTERVIEW },
        },
      },
    },
  },
} satisfies Prisma.ProfileSelect;

export interface LatestResponse {
  status: ShowcaseResponseStatus;
  scheduledAt: Date;
  reviewedAt: Date | null;
  timeMismatch: boolean;
  sessionStatus: SessionStatus | null;
}

export type ShowcaseRow = Prisma.ProfileGetPayload<{ select: typeof cardSelect }> & {
  inSession: boolean;
  latestResponse: LatestResponse | null;
};

@Injectable()
export class ShowcaseRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Страница карточек: только включённые на витрине профили активных пользователей.
   * Берёт `limit + 1` строку, чтобы сервис понял, есть ли следующая страница.
   * Порядок стабилен для курсора: новые карточки выше, id разводит одинаковое время.
   */
  async findPage(filters: ShowcaseFilters): Promise<ShowcaseRow[]> {
    const { viewerId, levels, stack, query, limit, cursor } = filters;

    const rows = await this.prisma.profile.findMany({
      where: {
        showcaseVisible: true,
        userId: { not: viewerId },
        user: { status: 'ACTIVE' },
        level: levels?.length ? { in: levels } : undefined,
        stackSearch: stack?.length ? { hasSome: stack } : undefined,
        OR: query
          ? [
              { role: { contains: query, mode: 'insensitive' } },
              { user: { firstName: { contains: query, mode: 'insensitive' } } },
              { user: { lastName: { contains: query, mode: 'insensitive' } } },
              { stackSearch: { has: query.toLowerCase() } },
            ]
          : undefined,
      },
      select: cardSelect,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
    });

    const cardIds = rows.map((row) => row.id);
    const [busyProfileIds, latestResponses] = await Promise.all([
      this.findBusyProfileIds(cardIds),
      this.findLatestResponses(viewerId, cardIds),
    ]);

    return rows.map((row) => ({
      ...row,
      inSession: busyProfileIds.has(row.id),
      latestResponse: latestResponses.get(row.id) ?? null,
    }));
  }

  private async findLatestResponses(viewerId: string, cardIds: string[]): Promise<Map<string, LatestResponse>> {
    if (cardIds.length === 0) {
      return new Map();
    }

    const responses = await this.prisma.showcaseResponse.findMany({
      where: { responderId: viewerId, cardId: { in: cardIds } },
      orderBy: { createdAt: 'desc' },
      select: {
        cardId: true,
        status: true,
        scheduledAt: true,
        reviewedAt: true,
        timeMismatch: true,
        session: { select: { status: true } },
      },
    });

    const latest = new Map<string, LatestResponse>();
    for (const { cardId, session, ...response } of responses) {
      if (!latest.has(cardId)) {
        latest.set(cardId, { ...response, sessionStatus: session?.status ?? null });
      }
    }
    return latest;
  }

  private async findBusyProfileIds(profileIds: string[]): Promise<Set<string>> {
    if (profileIds.length === 0) {
      return new Set();
    }

    const busy = await this.prisma.profile.findMany({
      where: { id: { in: profileIds }, user: { sessionParticipations: { some: ACTIVE_ROOM } } },
      select: { id: true },
    });
    return new Set(busy.map((profile) => profile.id));
  }
}
