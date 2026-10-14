import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.ts';
import type { CreateProfileDto } from './dto/create-profile.dto.ts';

@Injectable()
export class ProfileRepository {
  constructor(private readonly prisma: PrismaService) { }

  findByUserId(userId: string) {
    return this.prisma.profile.findUnique({ where: { userId } });
  }

  // userId уникален, поэтому upsert атомарен: два параллельных PUT не создают дубль.
  upsertByUserId(userId: string, data: CreateProfileDto) {
    return this.prisma.profile.upsert({
      where: { userId },
      create: { ...data, userId },
      update: data,
    });
  }
}
