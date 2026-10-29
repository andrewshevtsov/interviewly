import type { Queue } from 'bullmq';
import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import { VERIFICATION_STALE_AFTER_MS } from './programming-task-verification.constants.ts';
import { ProgrammingTaskVerificationRecoveryService } from './programming-task-verification-recovery.service.ts';
import type { ProgrammingTaskVerificationJob } from './programming-task-verification.types.ts';
import type { ProgrammingTasksRepository } from './programming-tasks.repository.ts';

describe('ProgrammingTaskVerificationRecoveryService', () => {
  let repository: Mocked<ProgrammingTasksRepository>;
  let queue: Mocked<Queue<ProgrammingTaskVerificationJob>>;
  let service: ProgrammingTaskVerificationRecoveryService;

  beforeEach(() => {
    repository = {
      findStaleVerifyingVariants: vi.fn().mockResolvedValue([]),
    } as unknown as Mocked<ProgrammingTasksRepository>;
    queue = { add: vi.fn().mockResolvedValue({}) } as unknown as Mocked<
      Queue<ProgrammingTaskVerificationJob>
    >;
    service = new ProgrammingTaskVerificationRecoveryService(repository, queue);
  });

  it('возвращает старый VERIFYING-вариант в очередь с тем же revision job id', async () => {
    const now = new Date('2026-10-28T12:10:00.000Z');
    const updatedAt = new Date('2026-10-28T12:00:00.000Z');
    repository.findStaleVerifyingVariants.mockResolvedValue([
      { id: 'variant-id', updatedAt },
    ]);

    await service.recoverStaleVariants(now);

    expect(repository.findStaleVerifyingVariants).toHaveBeenCalledWith(
      new Date(now.getTime() - VERIFICATION_STALE_AFTER_MS),
    );
    expect(queue.add).toHaveBeenCalledWith(
      'verify-programming-task-variant',
      { variantId: 'variant-id', revision: updatedAt.toISOString() },
      expect.objectContaining({ jobId: `variant-id-${updatedAt.getTime()}` }),
    );
  });

  it('не прерывает восстановление остальных вариантов при ошибке одной job', async () => {
    repository.findStaleVerifyingVariants.mockResolvedValue([
      { id: 'first-id', updatedAt: new Date('2026-10-28T12:00:00.000Z') },
      { id: 'second-id', updatedAt: new Date('2026-10-28T12:01:00.000Z') },
    ]);
    queue.add
      .mockRejectedValueOnce(new Error('Redis unavailable'))
      .mockResolvedValueOnce({} as never);

    await expect(service.recoverStaleVariants()).resolves.toBeUndefined();
    expect(queue.add).toHaveBeenCalledTimes(2);
  });
});
