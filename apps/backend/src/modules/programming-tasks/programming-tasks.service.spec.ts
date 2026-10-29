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
      delete: vi.fn(),
      deleteVariant: vi.fn(),
      completeVariantVerification: vi.fn(),
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
    repository.findById = vi.fn().mockResolvedValue({ id: 'task-id', slug: 'sum' });
    repository.updateDetails = vi.fn().mockResolvedValue({ count: 1 });

    // Обрезка пробелов теперь делает DTO (@Transform) до вызова сервиса -
    // сюда приходят уже готовые значения, сервис их не трогает.
    const result = await service.updateDetails('task-id', {
      expectedVersion: 3,
      title: 'Updated sum',
      description: 'Return all numbers.',
      difficulty: ProgrammingTaskDifficulty.MEDIUM,
    });

    expect(queue.add).not.toHaveBeenCalled();
    expect(repository.updateDetails).toHaveBeenCalledWith('task-id', 3, {
      title: 'Updated sum',
      description: 'Return all numbers.',
      difficulty: ProgrammingTaskDifficulty.MEDIUM,
    });
    expect(result).toMatchObject({
      id: 'task-id',
      title: 'Updated sum',
      version: 4,
    });
  });

  it('возвращает конфликт при сохранении устаревшей версии деталей', async () => {
    repository.findById = vi.fn().mockResolvedValue({ id: 'task-id', slug: 'sum' });
    repository.updateDetails = vi.fn().mockResolvedValue({ count: 0 });

    await expect(
      service.updateDetails('task-id', {
        expectedVersion: 3,
        title: 'My edit',
        description: 'My description',
        difficulty: ProgrammingTaskDifficulty.EASY,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('создаёт задачу со случайным slug и сразу возвращает VERIFYING после постановки job', async () => {
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
    // slug выводится из title и короткого случайного hex-суффикса - без
    // похода в базу (не сохраняет "-2", "-3" последовательным перебором).
    const createCall = repository.createWithVariant.mock.calls[0]?.[0] as { slug: string };
    expect(createCall.slug).toMatch(/^sum-[0-9a-f]{6}$/);
    expect(queue.add).toHaveBeenCalledWith(
      'verify-programming-task-variant',
      { variantId: 'variant-id', revision: revision.toISOString() },
      expect.objectContaining({
        jobId: `variant-id-${revision.getTime()}`,
        attempts: 3,
      }),
    );
  });

  it('сохраняет null во входных и ожидаемых данных как Prisma.JsonNull', async () => {
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

    await service.createAndVerify('author-id', {
      ...input,
      testCases: [{ name: 'Case 1', input: null, expectedOutput: null }],
    });

    const createCall = repository.createWithVariant.mock.calls[0]?.[0];
    const testCases = (
      createCall?.variants as {
        create: { testCases: { create: Array<{ input: unknown; expectedOutput: unknown }> } };
      }
    ).create.testCases.create;
    expect(testCases[0]?.input).toBe(Prisma.JsonNull);
    expect(testCases[0]?.expectedOutput).toBe(Prisma.JsonNull);
  });

  it('повторяет создание с новым случайным slug при конкурентном P2002', async () => {
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
        slug: 'sum-deadbeef',
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
      slug: 'sum-deadbeef',
    });
    expect(repository.createWithVariant).toHaveBeenCalledTimes(2);
    const firstAttempt = repository.createWithVariant.mock.calls[0]?.[0] as { slug: string };
    const secondAttempt = repository.createWithVariant.mock.calls[1]?.[0] as { slug: string };
    expect(firstAttempt.slug).not.toBe(secondAttempt.slug);
  });

  it('откатывает только что созданную задачу, если очередь недоступна', async () => {
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
    repository.delete = vi.fn().mockResolvedValue({ id: 'task-id' });
    queue.add.mockRejectedValue(new Error('Redis unavailable'));

    await expect(
      service.createAndVerify('author-id', input),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(repository.delete).toHaveBeenCalledWith('task-id');
    expect(repository.completeVariantVerification).not.toHaveBeenCalled();
  });

  it('откатывает только что созданный вариант, если очередь недоступна при добавлении языка', async () => {
    repository.findById = vi
      .fn()
      .mockResolvedValue({ id: 'task-id', slug: 'sum' });
    repository.findVariantByLanguage = vi.fn().mockResolvedValue(null);
    repository.createVariantForTask = vi.fn().mockResolvedValue({
      id: 'python-variant-id',
      status: ProgrammingTaskVariantStatus.VERIFYING,
      updatedAt: revision,
    });
    repository.deleteVariant = vi
      .fn()
      .mockResolvedValue({ id: 'python-variant-id' });
    queue.add.mockRejectedValue(new Error('Redis unavailable'));

    await expect(
      service.addVariantAndVerify('task-id', 'author-id', {
        ...input,
        language: EditorLanguage.PYTHON,
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(repository.deleteVariant).toHaveBeenCalledWith('python-variant-id');
  });

  it('не удаляет и не переводит в FAILED существующий вариант, если очередь недоступна при повторной проверке', async () => {
    repository.findVariantForTask = vi.fn().mockResolvedValue({
      id: 'variant-id',
      task: { id: 'task-id', slug: 'sum' },
    });
    repository.updateForVerification = vi.fn().mockResolvedValue({
      id: 'variant-id',
      updatedAt: revision,
    });
    queue.add.mockRejectedValue(new Error('Redis unavailable'));

    await expect(
      service.updateAndVerify('task-id', 'variant-id', input),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(repository.delete).not.toHaveBeenCalled();
    expect(repository.deleteVariant).not.toHaveBeenCalled();
    expect(repository.completeVariantVerification).not.toHaveBeenCalled();
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

  it('превращает гонку двух параллельных добавлений одного языка в 409', async () => {
    repository.findById = vi
      .fn()
      .mockResolvedValue({ id: 'task-id', slug: 'sum' });
    // Предварительная проверка прошла (языка ещё нет), но параллельный запрос
    // успел создать вариант первым - реальное ограничение БД срабатывает позже.
    repository.findVariantByLanguage = vi.fn().mockResolvedValue(null);
    repository.createVariantForTask = vi
      .fn()
      .mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
          meta: { target: ['taskId', 'language'] },
        }),
      );

    await expect(
      service.addVariantAndVerify('task-id', 'author-id', input),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(queue.add).not.toHaveBeenCalled();
    expect(repository.deleteVariant).not.toHaveBeenCalled();
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

  it('не передаёт язык при повторной проверке - он неизменяем', async () => {
    repository.findVariantForTask = vi.fn().mockResolvedValue({
      id: 'variant-id',
      task: { id: 'task-id', slug: 'sum' },
    });
    repository.updateForVerification = vi.fn().mockResolvedValue({
      id: 'variant-id',
      updatedAt: revision,
    });

    // dto содержит language (как и реальное тело PUT-запроса до валидации),
    // но сервис не должен передавать его дальше в repository.
    await service.updateAndVerify('task-id', 'variant-id', input);

    const data = repository.updateForVerification.mock.calls[0]?.[1];
    expect(data).not.toHaveProperty('language');
  });
});
