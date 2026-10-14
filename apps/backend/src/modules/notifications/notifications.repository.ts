import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.ts';
import type { Prisma } from '../../prisma/generated/client.ts';

const recipientSelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  telegramId: true,
  timeZone: true,
} satisfies Prisma.UserSelect;

export type Recipient = Prisma.UserGetPayload<{ select: typeof recipientSelect }>;

export type ResponseForNotice = Prisma.ShowcaseResponseGetPayload<{
  include: {
    responder: { select: typeof recipientSelect };
    card: { select: { user: { select: typeof recipientSelect } } };
  };
}>;

export type SessionForNotice = Prisma.SessionGetPayload<{
  include: { participants: { include: { user: { select: typeof recipientSelect } } } };
}>;

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findRecipient(userId: string): Promise<Recipient | null> {
    return this.prisma.user.findUnique({ where: { id: userId }, select: recipientSelect });
  }

  findResponse(id: string): Promise<ResponseForNotice | null> {
    return this.prisma.showcaseResponse.findUnique({
      where: { id },
      include: {
        responder: { select: recipientSelect },
        card: { select: { user: { select: recipientSelect } } },
      },
    });
  }

  findSession(id: string): Promise<SessionForNotice | null> {
    return this.prisma.session.findUnique({
      where: { id },
      include: { participants: { include: { user: { select: recipientSelect } } } },
    });
  }
}
