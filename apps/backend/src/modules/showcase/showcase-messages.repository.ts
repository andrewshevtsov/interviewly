import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.ts';
import type { ShowcaseMessage } from '../../prisma/generated/client.ts';
import type { ShowcaseResponseStatus } from '../../prisma/generated/enums.ts';
import { MESSAGES_LIST_LIMIT } from './showcase.constants.ts';

export interface ChatResponse {
  id: string;
  status: ShowcaseResponseStatus;
  responderId: string;
  card: { userId: string };
}

export interface UnreadRow {
  responseId: string;
  count: number;
  owner: boolean;
}

@Injectable()
export class ShowcaseMessagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findResponse(id: string): Promise<ChatResponse | null> {
    return this.prisma.showcaseResponse.findUnique({
      where: { id },
      select: { id: true, status: true, responderId: true, card: { select: { userId: true } } },
    });
  }

  /** Последние сообщения в порядке отправки */
  async findRecent(responseId: string): Promise<ShowcaseMessage[]> {
    const rows = await this.prisma.showcaseMessage.findMany({
      where: { responseId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: MESSAGES_LIST_LIMIT,
    });
    return rows.reverse();
  }

  /**
   * Непрочитанные сообщения собеседника по каждому из моих откликов.
   */
  async countUnread(userId: string): Promise<UnreadRow[]> {
    return this.prisma.$queryRaw<UnreadRow[]>`
      SELECT m."responseId" AS "responseId",
             count(*)::int AS count,
             (p."userId" = ${userId}::uuid) AS owner
      FROM "ShowcaseMessage" m
      JOIN "ShowcaseResponse" r ON r.id = m."responseId"
      JOIN "Profile" p ON p.id = r."cardId"
      LEFT JOIN "ShowcaseChatRead" cr ON cr."responseId" = m."responseId" AND cr."userId" = ${userId}::uuid
      WHERE (r."responderId" = ${userId}::uuid OR p."userId" = ${userId}::uuid)
        AND m."senderId" <> ${userId}::uuid
        AND (cr."lastReadAt" IS NULL OR m."createdAt" > cr."lastReadAt")
      GROUP BY m."responseId", p."userId"
    `;
  }

  async markRead(responseId: string, userId: string): Promise<void> {
    const lastReadAt = new Date();
    await this.prisma.showcaseChatRead.upsert({
      where: { responseId_userId: { responseId, userId } },
      create: { responseId, userId, lastReadAt },
      update: { lastReadAt },
    });
  }

  create(data: { responseId: string; senderId: string; text: string }): Promise<ShowcaseMessage> {
    return this.prisma.showcaseMessage.create({ data });
  }
}
