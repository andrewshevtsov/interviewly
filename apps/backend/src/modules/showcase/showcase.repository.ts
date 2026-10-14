import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.ts';
import type { Prisma } from '../../prisma/generated/client.ts';
import type { ProfessionLevel } from '../../prisma/generated/enums.ts';

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

export type ShowcaseRow = Prisma.ProfileGetPayload<{ select: typeof cardSelect }> & {
  inSession: boolean;
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

    const busyProfileIds = await this.findBusyProfileIds(rows.map((row) => row.id));

    return rows.map((row) => ({ ...row, inSession: busyProfileIds.has(row.id) }));
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
