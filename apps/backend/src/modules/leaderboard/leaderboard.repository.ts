import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.ts';

export interface LeaderboardRow {
  userId: string;
  firstName: string;
  lastName: string | null;
  role: string | null;
  interviewsCount: number;
}

@Injectable()
export class LeaderboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Топ участников по числу интервью в любой роли. Интервью засчитывается, если сессия завершена,
   * если начиналась и участник в неё заходил - приглашённые, но не пришедшие, не учитываются.
   * Оценки из отзывов не участвуют: они приватны.
   */
  findTop(limit: number): Promise<LeaderboardRow[]> {
    return this.prisma.$queryRaw<LeaderboardRow[]>`
      WITH interviews AS (
        SELECT sp."userId", COUNT(*)::int AS "interviewsCount"
        FROM "SessionParticipant" sp
        JOIN "Session" s ON s.id = sp."sessionId"
        WHERE s.status = 'COMPLETED'
          AND s."startedAt" IS NOT NULL
          AND sp."joinedAt" IS NOT NULL
        GROUP BY sp."userId"
      )
      SELECT
        u.id AS "userId",
        u."firstName",
        u."lastName",
        (
          SELECT p.role FROM "Profile" p
          WHERE p."userId" = u.id
          ORDER BY p."updatedAt" DESC
          LIMIT 1
        ) AS role,
        i."interviewsCount"
      FROM interviews i
      JOIN "User" u ON u.id = i."userId"
      WHERE u.status = 'ACTIVE'
      ORDER BY i."interviewsCount" DESC, u."firstName" ASC, u.id ASC
      LIMIT ${limit}
    `;
  }
}
