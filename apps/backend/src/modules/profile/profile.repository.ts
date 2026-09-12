import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.ts';
import { UpdateProfileDto } from './dto/update-profile.dto.ts';
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
}
