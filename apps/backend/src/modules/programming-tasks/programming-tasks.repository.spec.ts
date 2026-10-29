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
  it('удаляет задачу мягко - isActive: false, а не настоящий DELETE', async () => {
    const update = vi.fn().mockResolvedValue({ id: 'task-id', isActive: false });
    const deleteMock = vi.fn();
    const repository = new ProgrammingTasksRepository({
      programmingTask: { update, delete: deleteMock },
    } as unknown as PrismaService);

    await repository.delete('task-id');

    expect(update).toHaveBeenCalledWith({
      where: { id: 'task-id' },
      data: { isActive: false },
    });
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it('фиксирует причину задержки, не трогая статус варианта', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const repository = new ProgrammingTasksRepository({
      programmingTaskVariant: { updateMany },
    } as unknown as PrismaService);
    const revision = new Date('2026-10-28T12:00:00.000Z');

    await repository.recordVerificationNote(
      'variant-id',
      revision,
      'Session code execution queue is busy; verification will retry automatically.',
    );

    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: 'variant-id',
        status: ProgrammingTaskVariantStatus.VERIFYING,
        updatedAt: revision,
      },
      data: {
        lastVerificationError:
          'Session code execution queue is busy; verification will retry automatically.',
      },
    });
  });

  it('обновляет детали только при совпадении expected version и атомарно увеличивает её', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const repository = new ProgrammingTasksRepository({
      programmingTask: { updateMany },
    } as unknown as PrismaService);

    await repository.updateDetails('task-id', 3, {
      title: 'Updated',
      description: 'Updated description',
      difficulty: 'MEDIUM',
    });

    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'task-id', version: 3 },
      data: {
        title: 'Updated',
        description: 'Updated description',
        difficulty: 'MEDIUM',
        version: { increment: 1 },
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

  it('при сохранении варианта не меняет его язык', async () => {
    const updateVariant = vi.fn().mockResolvedValue({
      id: 'variant-id',
      updatedAt: new Date(),
    });
    const repository = new ProgrammingTasksRepository({
      programmingTaskVariant: { update: updateVariant },
    } as unknown as PrismaService);

    await repository.updateForVerification('variant-id', {
      starterCode: 'function solve() {}',
      harnessCode: 'console.log(solve(input));',
      referenceSolution: 'function solve() { return 1; }',
      testCases: [
        { position: 0, name: 'Case 1', input: [], expectedOutput: 1 },
      ],
    });

    const call = updateVariant.mock.calls[0]?.[0] as
      | { data: Record<string, unknown> }
      | undefined;
    expect(call?.data).not.toHaveProperty('language');
  });
});
