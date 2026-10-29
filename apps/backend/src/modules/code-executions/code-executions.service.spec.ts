import { ConflictException, ForbiddenException } from '@nestjs/common';
import { SessionStatus } from '../../prisma/generated/enums.ts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CodeExecutionsService } from './code-executions.service.ts';
import type { CodeExecutionJob } from './code-executions.types.ts';

describe('CodeExecutionsService', () => {
  const queue = {
    getJobCounts: vi.fn(),
    add: vi.fn(),
  };
  const sessions = {
    findById: vi.fn(),
    findParticipant: vi.fn(),
    findUserById: vi.fn(),
  };
  const collaboration = { updateExecution: vi.fn() };
  const locks = {
    acquire: vi.fn(),
    extend: vi.fn(),
    release: vi.fn(),
  };
  let service: CodeExecutionsService;

  beforeEach(() => {
    vi.clearAllMocks();
    queue.getJobCounts.mockResolvedValue({ waiting: 0, active: 0 });
    sessions.findById.mockResolvedValue({
      status: SessionStatus.ACTIVE,
      editorLanguage: 'TYPESCRIPT',
      programmingTaskSnapshot: null,
    });
    sessions.findParticipant.mockResolvedValue({ role: 'CANDIDATE' });
    sessions.findUserById.mockResolvedValue({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
    });
    collaboration.updateExecution.mockResolvedValue(undefined);
    locks.acquire.mockResolvedValue(true);
    locks.extend.mockResolvedValue(undefined);
    locks.release.mockResolvedValue(undefined);
    queue.add.mockImplementation((_name: string, data: CodeExecutionJob) =>
      Promise.resolve({ id: data.executionId }),
    );
    service = new CodeExecutionsService(
      queue as never,
      sessions as never,
      collaboration as never,
      locks as never,
    );
  });

  it('rejects another active execution of the same session', async () => {
    locks.acquire.mockResolvedValue(false);

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

  it('holds a session lock for the whole execution', async () => {
    await service.enqueue('session-id', 'user-id', {
      language: 'typescript',
      code: 'console.log(1)',
    });

    expect(queue.add).toHaveBeenCalledWith(
      'execute-code',
      expect.objectContaining({
        kind: 'custom',
        sessionId: 'session-id',
        requestedById: 'user-id',
      }),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      expect.objectContaining({ jobId: expect.any(String) }),
    );
    expect(locks.acquire).toHaveBeenCalledWith(
      'session-id',
      expect.any(String),
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

  it('prepares the selected task and queues only its first test case', async () => {
    sessions.findById.mockResolvedValue({
      status: SessionStatus.ACTIVE,
      editorLanguage: 'TYPESCRIPT',
      programmingTaskSnapshot: {
        language: 'TYPESCRIPT',
        harnessCode: '\nrunHarness();',
        testCases: [
          {
            position: 0,
            name: 'Первый кейс',
            input: { numbers: [1, 2] },
            expectedOutput: 3,
          },
          {
            position: 1,
            name: 'Второй кейс',
            input: { numbers: [] },
            expectedOutput: 0,
          },
        ],
      },
    });

    await service.enqueue('session-id', 'user-id', {
      language: 'typescript',
      code: 'function solve(params) { return 3; }',
      stdin: 'ignored for a bank task',
    });

    expect(queue.add).toHaveBeenCalledWith(
      'execute-test-case',
      expect.objectContaining({
        kind: 'task-case',
        caseIndex: 0,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        code: expect.stringContaining('runHarness();'),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        testCases: expect.arrayContaining([
          expect.objectContaining({ name: 'Первый кейс' }),
          expect.objectContaining({ name: 'Второй кейс' }),
        ]),
      }),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      expect.objectContaining({ jobId: expect.stringMatching(/-0$/) }),
    );
  });
});
