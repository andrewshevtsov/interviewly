import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.ts';
import { UpdateProfileDto } from './dto/update-profile.dto.ts';
import { SessionParticipantRole } from '../../prisma/generated/enums.ts';
import type { Prisma } from '../../prisma/generated/client.ts';
@Injectable()
export class ProfileRepository {
  constructor(private readonly prisma: PrismaService) { }

  create(data: Prisma.ProfileCreateInput) {
    return this.prisma.profile.create({ data });
  }

  findAll() {
    return this.prisma.profile.findMany({ orderBy: { createdAt: 'desc' } });
  }

  findOne(id: string) {
    return this.prisma.profile.findUnique({ where: { id } });
  }

  findByEmail(email: string) {
    return this.prisma.profile.findUnique({ where: { email } });
  }

  findByUserId(userId: string) {
    return this.prisma.profile.findFirst({ where: { userId } });
  }

  update(id: string, data: UpdateProfileDto) {
    return this.prisma.profile.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.profile.delete({ where: { id } });
  }

  // Витрина участников: агрегаты по User (не по Profile), поэтому считаем
  // отдельными запросами с group-by и подмешиваем к профилям в сервисе.

  // Считаем только сессии в роли CANDIDATE: интервьюер отзывов не получает
  // (см. FeedbackService.create), поэтому его сессии не дают avgRating и
  // не должны попадать в "число интервью".
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

  async findActiveSessionUserIds(userIds: string[]): Promise<Set<string>> {
    if (userIds.length === 0) return new Set();
    const active = await this.prisma.sessionParticipant.findMany({
      where: { userId: { in: userIds }, leftAt: null, session: { status: 'ACTIVE' } },
      select: { userId: true },
      distinct: ['userId'],
    });
    return new Set(active.map((row) => row.userId));
  }
}
