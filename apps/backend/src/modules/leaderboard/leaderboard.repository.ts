import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.ts';
import { SessionParticipantRole } from '../../prisma/generated/enums.ts';

@Injectable()
export class LeaderboardRepository {
  constructor(private readonly prisma: PrismaService) { }

  findProfilesWithUser() {
    return this.prisma.profile.findMany({ where: { userId: { not: null } } });
  }

  // Считаем только сессии в роли CANDIDATE: интервьюер отзывов не получает
  // (см. FeedbackService.create), поэтому его сессии не дают avgRating и
  // не должны попадать в "число интервью" на лидерборде.
  async countCompletedSessionsByUserIds(userIds: string[]): Promise<Map<string, number>> {
    if (userIds.length === 0) return new Map();
    const grouped = await this.prisma.sessionParticipant.groupBy({
      by: ['userId'],
      where: {
        userId: { in: userIds },
        role: SessionParticipantRole.CANDIDATE,
        session: { status: 'COMPLETED' },
      },
      _count: { _all: true },
    });
    return new Map(grouped.map((row) => [row.userId, row._count._all]));
  }

  async avgRatingByUserIds(userIds: string[]): Promise<Map<string, number>> {
    if (userIds.length === 0) return new Map();
    const grouped = await this.prisma.feedback.groupBy({
      by: ['targetUserId'],
      where: { targetUserId: { in: userIds } },
      _avg: { score: true },
    });
    return new Map(grouped.map((row) => [row.targetUserId, row._avg.score ?? 0]));
  }
}
