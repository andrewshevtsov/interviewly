import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.ts';
import type { EditorLanguage } from '../../prisma/generated/enums.ts';

@Injectable()
export class ProgrammingTasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAvailable(language: EditorLanguage) {
    return this.prisma.programmingTask.findMany({
      where: {
        isActive: true,
        variants: { some: { language } },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        difficulty: true,
      },
      orderBy: [{ difficulty: 'asc' }, { title: 'asc' }],
    });
  }

  findActiveForSession(id: string, language: EditorLanguage) {
    return this.prisma.programmingTask.findFirst({
      where: { id, isActive: true, variants: { some: { language } } },
      include: {
        variants: { where: { language }, take: 1 },
        testCases: { orderBy: { position: 'asc' } },
      },
    });
  }
}
