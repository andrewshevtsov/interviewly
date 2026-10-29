import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.ts';
import {
  ProgrammingTaskVariantStatus,
  type EditorLanguage,
} from '../../prisma/generated/enums.ts';
import type { Prisma } from '../../prisma/generated/client.ts';
import { VERIFICATION_RECOVERY_BATCH_SIZE } from './programming-task-verification.constants.ts';

@Injectable()
export class ProgrammingTasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.programmingTask.findUnique({
      where: { id },
      select: { id: true, slug: true },
    });
  }

  findVariantByLanguage(taskId: string, language: EditorLanguage) {
    return this.prisma.programmingTaskVariant.findUnique({
      where: { taskId_language: { taskId, language } },
      select: { id: true },
    });
  }

  // Soft-delete: задача и её варианты/тесты остаются в базе, просто пропадают
  // из findAvailable/findActiveForSession - можно восстановить, в отличие от
  // настоящего DELETE.
  delete(id: string) {
    return this.prisma.programmingTask.update({
      where: { id },
      data: { isActive: false },
    });
  }

  deleteVariant(id: string) {
    return this.prisma.programmingTaskVariant.delete({ where: { id } });
  }

  createWithVariant(data: Prisma.ProgrammingTaskCreateInput) {
    return this.prisma.programmingTask.create({
      data,
      include: {
        variants: { select: { id: true, status: true, updatedAt: true } },
      },
    });
  }

  createVariantForTask(variantData: Prisma.ProgrammingTaskVariantCreateInput) {
    return this.prisma.programmingTaskVariant.create({
      data: variantData,
      select: { id: true, status: true, updatedAt: true },
    });
  }

  updateVariantVerification(
    id: string,
    data: {
      status: ProgrammingTaskVariantStatus;
      verifiedAt: Date | null;
      lastVerificationError: string | null;
    },
  ) {
    return this.prisma.programmingTaskVariant.update({
      where: { id },
      data,
      select: {
        id: true,
        status: true,
        verifiedAt: true,
        lastVerificationError: true,
      },
    });
  }

  findVariantForVerification(id: string) {
    return this.prisma.programmingTaskVariant.findUnique({
      where: { id },
      select: {
        id: true,
        language: true,
        referenceSolution: true,
        harnessCode: true,
        status: true,
        updatedAt: true,
        testCases: {
          orderBy: { position: 'asc' },
          select: { input: true, expectedOutput: true },
        },
      },
    });
  }

  findStaleVerifyingVariants(cutoff: Date) {
    return this.prisma.programmingTaskVariant.findMany({
      where: {
        status: ProgrammingTaskVariantStatus.VERIFYING,
        updatedAt: { lte: cutoff },
      },
      orderBy: { updatedAt: 'asc' },
      take: VERIFICATION_RECOVERY_BATCH_SIZE,
      select: { id: true, updatedAt: true },
    });
  }

  completeVariantVerification(
    id: string,
    revision: Date,
    data: {
      status: ProgrammingTaskVariantStatus;
      verifiedAt: Date | null;
      lastVerificationError: string | null;
    },
  ) {
    return this.prisma.programmingTaskVariant.updateMany({
      where: {
        id,
        status: ProgrammingTaskVariantStatus.VERIFYING,
        updatedAt: revision,
      },
      data,
    });
  }

  // Фиксирует причину временной задержки без смены статуса: вариант остаётся
  // VERIFYING, чтобы его подхватили собственный retry job или recovery-сервис.
  recordVerificationNote(id: string, revision: Date, note: string) {
    return this.prisma.programmingTaskVariant.updateMany({
      where: {
        id,
        status: ProgrammingTaskVariantStatus.VERIFYING,
        updatedAt: revision,
      },
      data: { lastVerificationError: note },
    });
  }

  findVariantForTask(taskId: string, variantId: string) {
    return this.prisma.programmingTaskVariant.findFirst({
      where: { id: variantId, taskId },
      select: { id: true, task: { select: { id: true, slug: true } } },
    });
  }

  findForEditing(id: string) {
    return this.prisma.programmingTask.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        difficulty: true,
        version: true,
        variants: {
          orderBy: { language: 'asc' },
          select: {
            id: true,
            language: true,
            starterCode: true,
            harnessCode: true,
            referenceSolution: true,
            status: true,
            verifiedAt: true,
            lastVerificationError: true,
            testCases: {
              orderBy: { position: 'asc' },
              select: {
                id: true,
                name: true,
                input: true,
                expectedOutput: true,
              },
            },
          },
        },
      },
    });
  }

  updateDetails(
    id: string,
    expectedVersion: number,
    data: Pick<
      Prisma.ProgrammingTaskUpdateInput,
      'title' | 'description' | 'difficulty'
    >,
  ) {
    return this.prisma.programmingTask.updateMany({
      where: { id, version: expectedVersion },
      data: {
        ...data,
        version: { increment: 1 },
      },
    });
  }

  updateForVerification(
    variantId: string,
    data: {
      starterCode: string;
      harnessCode: string;
      referenceSolution: string;
      testCases: Array<{
        position: number;
        name: string;
        input: Prisma.InputJsonValue | Prisma.JsonNullValueInput;
        expectedOutput: Prisma.InputJsonValue | Prisma.JsonNullValueInput;
      }>;
    },
  ) {
    return this.prisma.programmingTaskVariant.update({
      where: { id: variantId },
      data: {
        starterCode: data.starterCode,
        harnessCode: data.harnessCode,
        referenceSolution: data.referenceSolution,
        status: ProgrammingTaskVariantStatus.VERIFYING,
        verifiedAt: null,
        lastVerificationError: null,
        testCases: {
          deleteMany: {},
          create: data.testCases,
        },
      },
      select: { id: true, updatedAt: true },
    });
  }

  findActiveHarnessTemplate(language: EditorLanguage) {
    return this.prisma.programmingTaskHarnessTemplate.findFirst({
      where: { language, isActive: true },
      select: { code: true },
    });
  }

  findAvailable(language: EditorLanguage) {
    return this.prisma.programmingTask.findMany({
      where: {
        isActive: true,
        variants: {
          some: { language, status: ProgrammingTaskVariantStatus.VERIFIED },
        },
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
      where: {
        id,
        isActive: true,
        variants: {
          some: { language, status: ProgrammingTaskVariantStatus.VERIFIED },
        },
      },
      include: {
        variants: {
          where: {
            language,
            status: ProgrammingTaskVariantStatus.VERIFIED,
          },
          take: 1,
          include: { testCases: { orderBy: { position: 'asc' } } },
        },
      },
    });
  }
}
