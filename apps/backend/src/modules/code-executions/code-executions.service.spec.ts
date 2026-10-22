import { ConflictException, ForbiddenException } from '@nestjs/common';
import { SessionStatus } from '../../prisma/generated/enums.ts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CodeExecutionsService } from './code-executions.service.ts';
import type { CodeExecutionJob } from './code-executions.types.ts';

describe('CodeExecutionsService', () => {
  const queue = {
    getDeduplicationJobId: vi.fn(),
    getJobCounts: vi.fn(),
    add: vi.fn(),
  };
  const sessions = {
    findById: vi.fn(),
    findParticipant: vi.fn(),
    findUserById: vi.fn(),
  };
  const collaboration = { updateExecution: vi.fn() };
  let service: CodeExecutionsService;

  beforeEach(() => {
    vi.clearAllMocks();
    queue.getDeduplicationJobId.mockResolvedValue(null);
    queue.getJobCounts.mockResolvedValue({ waiting: 0, active: 0 });
    sessions.findById.mockResolvedValue({ status: SessionStatus.ACTIVE });
    sessions.findParticipant.mockResolvedValue({ role: 'CANDIDATE' });
    sessions.findUserById.mockResolvedValue({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
    });
    collaboration.updateExecution.mockResolvedValue(undefined);
    queue.add.mockImplementation((_name: string, data: CodeExecutionJob) =>
      Promise.resolve({ id: data.executionId }),
    );
    service = new CodeExecutionsService(
      queue as never,
      sessions as never,
      collaboration as never,
    );
  });

  it('rejects another active execution of the same session', async () => {
    queue.getDeduplicationJobId.mockResolvedValue('existing-job');

    await expect(
      service.enqueue('session-id', 'user-id', {
        language: 'typescript',
        code: 'console.log(1)',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(queue.add).not.toHaveBeenCalled();
  });

  it.each([
    SessionStatus.COMPLETED,
    SessionStatus.CANCELLED,
    SessionStatus.EXPIRED,
  ])('rejects execution for a closed session in status %s', async (status) => {
    sessions.findById.mockResolvedValue({ status });

    await expect(
      service.enqueue('session-id', 'user-id', {
        language: 'typescript',
        code: 'console.log(1)',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(queue.add).not.toHaveBeenCalled();
  });

  it('uses the session id for BullMQ deduplication', async () => {
    await service.enqueue('session-id', 'user-id', {
      language: 'typescript',
      code: 'console.log(1)',
    });

    expect(queue.add).toHaveBeenCalledWith(
      'execute-code',
      expect.objectContaining({
        sessionId: 'session-id',
        requestedById: 'user-id',
      }),
      expect.objectContaining({ deduplication: { id: 'session-id' } }),
    );
    expect(collaboration.updateExecution).toHaveBeenCalledWith(
      'session-id',
      expect.objectContaining({ status: 'queued', userName: 'Ada Lovelace' }),
      300,
    );
  });

  it('retries publishing the queued state without removing the job', async () => {
    collaboration.updateExecution
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce(undefined);

    await service.enqueue('session-id', 'user-id', {
      language: 'typescript',
      code: 'console.log(1)',
    });

    expect(queue.add).toHaveBeenCalledTimes(1);
    expect(collaboration.updateExecution).toHaveBeenCalledTimes(3);
  });
});
