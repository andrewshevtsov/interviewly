import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  EditorLanguage,
  ProgrammingTaskVariantStatus,
} from '../../prisma/generated/enums.ts';
import type { PrismaService } from '../../prisma/prisma.service.ts';
import { ProgrammingTasksRepository } from './programming-tasks.repository.ts';

describe('ProgrammingTasksRepository visibility', () => {
  const findMany = vi.fn();
  const findFirst = vi.fn();
  let repository: ProgrammingTasksRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new ProgrammingTasksRepository({
      programmingTask: { findMany, findFirst },
    } as unknown as PrismaService);
  });

  it('показывает в банке только активные задачи с VERIFIED-вариантом языка', async () => {
    findMany.mockResolvedValue([]);

    await repository.findAvailable(EditorLanguage.JAVASCRIPT);

    expect(findMany).toHaveBeenCalledWith({
      where: {
        isActive: true,
        variants: {
          some: {
            language: EditorLanguage.JAVASCRIPT,
            status: ProgrammingTaskVariantStatus.VERIFIED,
          },
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
  });

  it('выдаёт в сессию только VERIFIED-вариант выбранного языка', async () => {
    findFirst.mockResolvedValue(null);

    await repository.findActiveForSession('task-id', EditorLanguage.TYPESCRIPT);

    expect(findFirst).toHaveBeenCalledWith({
      where: {
        id: 'task-id',
        isActive: true,
        variants: {
          some: {
            language: EditorLanguage.TYPESCRIPT,
            status: ProgrammingTaskVariantStatus.VERIFIED,
          },
        },
      },
      include: {
        variants: {
          where: {
            language: EditorLanguage.TYPESCRIPT,
            status: ProgrammingTaskVariantStatus.VERIFIED,
          },
          take: 1,
          include: { testCases: { orderBy: { position: 'asc' } } },
        },
      },
    });
  });
});

describe('ProgrammingTasksRepository writes', () => {
  it('обновляет детали только при совпадении expected updatedAt', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const repository = new ProgrammingTasksRepository({
      programmingTask: { updateMany },
    } as unknown as PrismaService);
    const expectedUpdatedAt = new Date('2026-10-28T12:00:00.000Z');
    const nextUpdatedAt = new Date('2026-10-28T12:00:00.001Z');

    await repository.updateDetails(
      'task-id',
      expectedUpdatedAt,
      nextUpdatedAt,
      {
        title: 'Updated',
        description: 'Updated description',
        difficulty: 'MEDIUM',
      },
    );

    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'task-id', updatedAt: expectedUpdatedAt },
      data: {
        title: 'Updated',
        description: 'Updated description',
        difficulty: 'MEDIUM',
        updatedAt: nextUpdatedAt,
      },
    });
  });

  it('при сохранении варианта не обновляет общие колонки задачи', async () => {
    const updateTask = vi.fn();
    const updateVariant = vi.fn().mockResolvedValue({
      id: 'variant-id',
      updatedAt: new Date(),
    });
    const repository = new ProgrammingTasksRepository({
      programmingTask: { update: updateTask },
      programmingTaskVariant: { update: updateVariant },
    } as unknown as PrismaService);

    await repository.updateForVerification('variant-id', {
      language: EditorLanguage.JAVASCRIPT,
      starterCode: 'function solve() {}',
      harnessCode: 'console.log(solve(input));',
      referenceSolution: 'function solve() { return 1; }',
      testCases: [
        { position: 0, name: 'Case 1', input: [], expectedOutput: 1 },
      ],
    });

    expect(updateVariant).toHaveBeenCalledOnce();
    expect(updateTask).not.toHaveBeenCalled();
  });
});
