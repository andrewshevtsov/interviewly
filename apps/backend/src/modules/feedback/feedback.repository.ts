import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.ts';
import type { UpdateFeedbackDto } from './dto/update-feedback.ts';

export interface CreateFeedbackData {
  sessionId: string;
  authorId: string;
  targetUserId: string;
  score: number;
  comment?: string;
}

@Injectable()
export class FeedbackRepository {
  constructor(private readonly prisma: PrismaService) { }

  async isSessionParticipant(sessionId: string, userId: string): Promise<boolean> {
    const participant = await this.prisma.sessionParticipant.findUnique({
      where: { userId_sessionId: { userId, sessionId } },
    });
    return participant !== null;
  }

  findUnique(sessionId: string, authorId: string, targetUserId: string) {
    return this.prisma.feedback.findUnique({
      where: { sessionId_authorId_targetUserId: { sessionId, authorId, targetUserId } },
    });
  }

  create(data: CreateFeedbackData) {
    return this.prisma.feedback.create({ data });
  }

  findById(id: string) {
    return this.prisma.feedback.findUnique({ where: { id } });
  }

  findManyByAuthor(authorId: string) {
    return this.prisma.feedback.findMany({
      where: { authorId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        sessionId: true,
        score: true,
        comment: true,
        createdAt: true,
        targetUser: { select: { id: true, firstName: true, lastName: true } },
        session: { select: { type: true, startedAt: true, endedAt: true, scheduledAt: true } },
      },
    });
  }

  findOtherParticipants(sessionId: string, excludeUserId: string) {
    return this.prisma.sessionParticipant.findMany({
      where: { sessionId, userId: { not: excludeUserId } },
      select: { user: { select: { id: true, firstName: true, lastName: true } } },
    });
  }

  update(id: string, data: UpdateFeedbackDto) {
    return this.prisma.feedback.update({ where: { id }, data });
  }
}
