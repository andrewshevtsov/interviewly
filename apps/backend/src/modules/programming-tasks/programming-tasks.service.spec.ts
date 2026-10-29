import {
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Queue } from 'bullmq';
import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import {
  EditorLanguage,
  ProgrammingTaskDifficulty,
  ProgrammingTaskVariantStatus,
} from '../../prisma/generated/enums.ts';
import { Prisma } from '../../prisma/generated/client.ts';
import type { ProgrammingTaskVerificationJob } from './programming-task-verification.types.ts';
import type { ProgrammingTasksRepository } from './programming-tasks.repository.ts';
import { ProgrammingTasksService } from './programming-tasks.service.ts';

const revision = new Date('2026-10-28T12:00:00.000Z');
const input = {
  title: 'Sum',
  description: 'Return sum.',
  difficulty: ProgrammingTaskDifficulty.EASY,
  language: EditorLanguage.JAVASCRIPT,
  starterCode: 'function solve(numbers) {}',
  harnessCode: 'console.log(JSON.stringify(solve(input)));',
  referenceSolution: 'function solve(numbers) { return 6; }',
  testCases: [{ name: 'Case 1', input: [1, 2, 3], expectedOutput: 6 }],
};

describe('ProgrammingTasksService', () => {
  let repository: Mocked<ProgrammingTasksRepository>;
  let queue: Mocked<Queue<ProgrammingTaskVerificationJob>>;
  let service: ProgrammingTasksService;

  beforeEach(() => {
    repository = {
      findActiveHarnessTemplate: vi.fn(),
    } as unknown as Mocked<ProgrammingTasksRepository>;
    queue = { add: vi.fn().mockResolvedValue({}) } as unknown as Mocked<
      Queue<ProgrammingTaskVerificationJob>
    >;
    service = new ProgrammingTasksService(repository, queue);
  });

  it('возвращает активный Harness выбранного языка из базы', async () => {
    repository.findActiveHarnessTemplate.mockResolvedValue({
      code: 'solve(input);',
    });

    await expect(
      service.getHarnessTemplate(EditorLanguage.JAVASCRIPT),
    ).resolves.toEqual({ harnessCode: 'solve(input);' });
  });

  it('возвращает 404, если у языка нет активного шаблона', async () => {
    repository.findActiveHarnessTemplate.mockResolvedValue(null);

    await expect(
      service.getHarnessTemplate(EditorLanguage.PYTHON),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('сохраняет основные данные задачи отдельно от верификации', async () => {
    repository.findForEditing = vi.fn().mockResolvedValue({
      id: 'task-id',
      slug: 'sum',
      title: 'Sum',
      description: 'Return sum.',
      difficulty: ProgrammingTaskDifficulty.EASY,
      updatedAt: revision,
      variants: [],
    });
    repository.updateDetails = vi.fn().mockResolvedValue({ count: 1 });

    const result = await service.updateDetails('task-id', {
      expectedUpdatedAt: revision.toISOString(),
      title: '  Updated sum  ',
      description: '  Return all numbers.  ',
      difficulty: ProgrammingTaskDifficulty.MEDIUM,
    });

    expect(queue.add).not.toHaveBeenCalled();
    expect(repository.updateDetails).toHaveBeenCalledOnce();
    const updateCall = repository.updateDetails.mock.calls[0];
    expect(updateCall?.[0]).toBe('task-id');
    expect(updateCall?.[1]).toEqual(revision);
    expect(updateCall?.[2]).toBeInstanceOf(Date);
    expect(updateCall?.[3]).toEqual({
      title: 'Updated sum',
      description: 'Return all numbers.',
      difficulty: ProgrammingTaskDifficulty.MEDIUM,
    });
    expect(result).toMatchObject({
      id: 'task-id',
      title: 'Updated sum',
    });
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('возвращает конфликт при сохранении устаревшей версии деталей', async () => {
    repository.findForEditing = vi.fn().mockResolvedValue({
      id: 'task-id',
      slug: 'sum',
      title: 'Changed by another admin',
      description: 'Changed description',
      difficulty: ProgrammingTaskDifficulty.MEDIUM,
      updatedAt: new Date(revision.getTime() + 1_000),
      variants: [],
    });
    repository.updateDetails = vi.fn().mockResolvedValue({ count: 0 });

    await expect(
      service.updateDetails('task-id', {
        expectedUpdatedAt: revision.toISOString(),
        title: 'My edit',
        description: 'My description',
        difficulty: ProgrammingTaskDifficulty.EASY,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('создаёт задачу и сразу возвращает VERIFYING после постановки job', async () => {
    repository.findBySlug = vi.fn().mockResolvedValue(null);
    repository.createWithVariant = vi.fn().mockResolvedValue({
      id: 'task-id',
      slug: 'sum',
      variants: [
        {
          id: 'variant-id',
          status: ProgrammingTaskVariantStatus.VERIFYING,
          updatedAt: revision,
        },
      ],
    });

    await expect(service.createAndVerify('author-id', input)).resolves.toEqual({
      id: 'task-id',
      slug: 'sum',
      variantId: 'variant-id',
      status: ProgrammingTaskVariantStatus.VERIFYING,
      verificationError: null,
    });
    expect(queue.add).toHaveBeenCalledWith(
      'verify-programming-task-variant',
      { variantId: 'variant-id', revision: revision.toISOString() },
      expect.objectContaining({
        jobId: `variant-id-${revision.getTime()}`,
        attempts: 3,
      }),
    );
  });

  it('повторяет создание со следующим slug при конкурентном P2002', async () => {
    repository.findBySlug = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'concurrent-task-id' })
      .mockResolvedValueOnce(null);
    repository.createWithVariant = vi
      .fn()
      .mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
          meta: { target: ['slug'] },
        }),
      )
      .mockResolvedValueOnce({
        id: 'task-id',
        slug: 'sum-2',
        variants: [
          {
            id: 'variant-id',
            status: ProgrammingTaskVariantStatus.VERIFYING,
            updatedAt: revision,
          },
        ],
      });

    await expect(
      service.createAndVerify('author-id', input),
    ).resolves.toMatchObject({
      id: 'task-id',
      slug: 'sum-2',
    });
    expect(repository.createWithVariant).toHaveBeenCalledTimes(2);
    expect(repository.createWithVariant.mock.calls[1]?.[0]).toMatchObject({
      slug: 'sum-2',
    });
  });

  it('помечает вариант FAILED, если очередь недоступна', async () => {
    repository.findBySlug = vi.fn().mockResolvedValue(null);
    repository.createWithVariant = vi.fn().mockResolvedValue({
      id: 'task-id',
      slug: 'sum',
      variants: [
        {
          id: 'variant-id',
          status: ProgrammingTaskVariantStatus.VERIFYING,
          updatedAt: revision,
        },
      ],
    });
    repository.completeVariantVerification = vi
      .fn()
      .mockResolvedValue({ count: 1 });
    queue.add.mockRejectedValue(new Error('Redis unavailable'));

    await expect(
      service.createAndVerify('author-id', input),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(repository.completeVariantVerification).toHaveBeenCalledWith(
      'variant-id',
      revision,
      expect.objectContaining({ status: ProgrammingTaskVariantStatus.FAILED }),
    );
  });

  it('добавляет новый язык в отдельную job', async () => {
    repository.findById = vi
      .fn()
      .mockResolvedValue({ id: 'task-id', slug: 'sum' });
    repository.findVariantByLanguage = vi.fn().mockResolvedValue(null);
    repository.createVariantForTask = vi.fn().mockResolvedValue({
      id: 'python-variant-id',
      status: ProgrammingTaskVariantStatus.VERIFYING,
      updatedAt: revision,
    });

    const result = await service.addVariantAndVerify('task-id', 'author-id', {
      ...input,
      language: EditorLanguage.PYTHON,
    });

    expect(result.status).toBe(ProgrammingTaskVariantStatus.VERIFYING);
    expect(queue.add).toHaveBeenCalledWith(
      'verify-programming-task-variant',
      expect.objectContaining({ variantId: 'python-variant-id' }),
      expect.any(Object),
    );
  });

  it('не создаёт второй вариант того же языка', async () => {
    repository.findById = vi
      .fn()
      .mockResolvedValue({ id: 'task-id', slug: 'sum' });
    repository.findVariantByLanguage = vi
      .fn()
      .mockResolvedValue({ id: 'existing-variant-id' });
    repository.createVariantForTask = vi.fn();

    await expect(
      service.addVariantAndVerify('task-id', 'author-id', input),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('обновляет тот же вариант и ставит новую редакцию в очередь', async () => {
    repository.findVariantForTask = vi.fn().mockResolvedValue({
      id: 'variant-id',
      task: { id: 'task-id', slug: 'sum' },
    });
    repository.updateForVerification = vi.fn().mockResolvedValue({
      id: 'variant-id',
      updatedAt: revision,
    });

    const result = await service.updateAndVerify(
      'task-id',
      'variant-id',
      input,
    );

    expect(result.status).toBe(ProgrammingTaskVariantStatus.VERIFYING);
    expect(repository.updateForVerification).toHaveBeenCalledWith(
      'variant-id',
      expect.objectContaining({
        testCases: [expect.objectContaining({ position: 0, name: 'Case 1' })],
      }),
    );
    expect(queue.add).toHaveBeenCalledOnce();
  });

  it('не изменяет данные, если вариант не принадлежит задаче', async () => {
    repository.findVariantForTask = vi.fn().mockResolvedValue(null);

    await expect(
      service.updateAndVerify('task-id', 'foreign-variant-id', input),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(queue.add).not.toHaveBeenCalled();
  });
});
