import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.ts';
import type { Prisma } from '../../prisma/generated/client.ts';
import type { SessionHintWithRequester } from './entities/session-hint.entity.ts';

const REQUESTER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const satisfies Prisma.UserSelect;

@Injectable()
export class SessionHintsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listBySession(sessionId: string): Promise<SessionHintWithRequester[]> {
    return this.prisma.sessionHint.findMany({
      where: { sessionId },
      include: { requestedBy: { select: REQUESTER_SELECT } },
      orderBy: { order: 'asc' },
    });
  }

  setDemoTaskIndex(sessionId: string, demoTaskIndex: number): Promise<unknown> {
    return this.prisma.session.update({ where: { id: sessionId }, data: { demoTaskIndex } });
  }

  /** Падает с P2002, если подсказка с таким номером уже есть, гонка за лимит */
  create(data: {
    sessionId: string;
    requestedById: string;
    order: number;
    text: string;
  }): Promise<SessionHintWithRequester> {
    return this.prisma.sessionHint.create({
      data,
      include: { requestedBy: { select: REQUESTER_SELECT } },
    });
  }
}
