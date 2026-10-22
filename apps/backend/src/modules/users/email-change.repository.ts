import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.ts';
import type { EmailChangeRequest, User } from '../../prisma/generated/client.ts';

@Injectable()
export class EmailChangeRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Новый запрос заменяет прежний: токен прошлого письма перестаёт работать */
  upsert(userId: string, data: { newEmail: string; tokenHash: string; expiresAt: Date }): Promise<EmailChangeRequest> {
    return this.prisma.emailChangeRequest.upsert({
      where: { userId },
      create: { userId, ...data },
      update: { ...data, createdAt: new Date() },
    });
  }

  findByUserId(userId: string): Promise<EmailChangeRequest | null> {
    return this.prisma.emailChangeRequest.findUnique({ where: { userId } });
  }

  findByTokenHash(tokenHash: string): Promise<EmailChangeRequest | null> {
    return this.prisma.emailChangeRequest.findUnique({ where: { tokenHash } });
  }

  deleteByUserId(userId: string): Promise<{ count: number }> {
    return this.prisma.emailChangeRequest.deleteMany({ where: { userId } });
  }

  /** В базе email могут лежать в разном регистре, поэтому сравниваем без учёта регистра */
  findUserByEmailInsensitive(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
  }

  /** Падает с P2002, если адрес успели занять между проверкой и записью */
  applyChange(request: EmailChangeRequest): Promise<User> {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: request.userId },
        data: { email: request.newEmail, emailVerifiedAt: new Date() },
      });
      await tx.emailChangeRequest.delete({ where: { id: request.id } });
      return user;
    });
  }
}
