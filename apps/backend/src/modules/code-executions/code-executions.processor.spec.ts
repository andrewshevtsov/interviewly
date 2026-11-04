import { describe, expect, it, vi } from 'vitest';
import type { Job } from 'bullmq';
import { CodeExecutionsProcessor } from './code-executions.processor.ts';
import type { CodeExecutionJob } from './code-executions.types.ts';

const DATA: CodeExecutionJob = {
  kind: 'custom',
  executionId: 'execution-id',
  sessionId: 'session-id',
  requestedById: 'user-id',
  userName: 'User',
  language: 'typescript',
  code: 'console.log(1)',
  executionStartedAt: Date.now(),
  queuedAt: Date.now(),
};

const RESULT = {
  stdout: '1\n',
  stderr: '',
  exitCode: 0,
  signal: null,
  status: null,
  message: null,
  memory: null,
  cpuTime: null,
  wallTime: null,
};

function setup() {
  const executions = {
    assertAllowed: vi.fn().mockResolvedValue(undefined),
    enqueueNextCase: vi.fn().mockResolvedValue(undefined),
    releaseLock: vi.fn().mockResolvedValue(undefined),
  };
  const coderunner = {
    execute: vi.fn().mockResolvedValue(RESULT),
  };
  const collaboration = {
    updateExecution: vi.fn().mockResolvedValue(undefined),
  };
  const processor = new CodeExecutionsProcessor(
    executions as never,
    coderunner as never,
    collaboration as never,
  );
  return { processor, executions, coderunner, collaboration };
}

function createJob(data: CodeExecutionJob = DATA): Job<CodeExecutionJob> {
  return {
    data,
    updateData: vi.fn().mockImplementation((updated: CodeExecutionJob) => {
      Object.assign(data, updated);
      return Promise.resolve();
    }),
  } as unknown as Job<CodeExecutionJob>;
}

describe('CodeExecutionsProcessor', () => {
  it('rechecks access immediately before calling coderunner', async () => {
    const { processor, executions, coderunner, collaboration } = setup();

    const job = createJob({ ...DATA });
    await processor.process(job);

    expect(executions.assertAllowed).toHaveBeenCalledWith(
      'session-id',
      'user-id',
    );
    expect(coderunner.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        executionId: 'execution-id',
        sessionId: 'session-id',
        code: 'console.log(1)',
      }),
    );
    expect(job.updateData).toHaveBeenCalledWith({
      ...DATA,
      outcome: { status: 'success', result: RESULT },
    });
    expect(collaboration.updateExecution).toHaveBeenNthCalledWith(
      1,
      'session-id',
      {
        id: 'execution-id',
        userName: 'User',
        startedAt: DATA.executionStartedAt,
        status: 'running',
      },
    );
    expect(collaboration.updateExecution).toHaveBeenNthCalledWith(
      2,
      'session-id',
      expect.objectContaining({ id: 'execution-id', status: 'success' }),
    );
  });

  it('does not call coderunner after the queue deadline', async () => {
    const { processor, coderunner, collaboration } = setup();
    const expired = { ...DATA, queuedAt: Date.now() - 15_001 };

    await processor.process(createJob(expired));

    expect(coderunner.execute).not.toHaveBeenCalled();
    expect(collaboration.updateExecution).toHaveBeenCalledWith('session-id', {
      id: 'execution-id',
      status: 'queue_timeout',
    });
  });

  it('does not call coderunner when the repeated access check fails', async () => {
    const { processor, executions, coderunner, collaboration } = setup();
    executions.assertAllowed.mockRejectedValue(new Error('cancelled'));

    await processor.process(createJob({ ...DATA }));

    expect(coderunner.execute).not.toHaveBeenCalled();
    expect(collaboration.updateExecution).toHaveBeenCalledWith('session-id', {
      id: 'execution-id',
      status: 'rejected',
    });
  });

  it('retries publishing a saved result without executing code again', async () => {
    const { processor, coderunner, collaboration } = setup();
    const job = createJob({ ...DATA });
    collaboration.updateExecution
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('collaboration unavailable'))
      .mockResolvedValueOnce(undefined);

    await expect(processor.process(job)).rejects.toThrow(
      'collaboration unavailable',
    );
    await processor.process(job);

    expect(coderunner.execute).toHaveBeenCalledTimes(1);
    expect(collaboration.updateExecution).toHaveBeenLastCalledWith(
      'session-id',
      {
        id: 'execution-id',
        userName: 'User',
        startedAt: DATA.executionStartedAt,
        status: 'success',
        result: RESULT,
      },
    );
  });

  it('executes code when publishing the running state fails', async () => {
    const { processor, coderunner, collaboration } = setup();
    const job = createJob({ ...DATA });
    collaboration.updateExecution
      .mockRejectedValueOnce(new Error('collaboration unavailable'))
      .mockResolvedValueOnce(undefined);

    await processor.process(job);

    expect(coderunner.execute).toHaveBeenCalledTimes(1);
    expect(job.updateData).toHaveBeenCalledWith({
      ...DATA,
      outcome: { status: 'success', result: RESULT },
    });
    expect(collaboration.updateExecution).toHaveBeenLastCalledWith(
      'session-id',
      expect.objectContaining({
        id: 'execution-id',
        userName: 'User',
        startedAt: DATA.executionStartedAt,
        status: 'success',
      }),
    );
  });

  it('saves a coderunner error before publishing it', async () => {
    const { processor, coderunner, collaboration } = setup();
    const job = createJob({ ...DATA });
    coderunner.execute.mockRejectedValue(new Error('execution failed'));

    await processor.process(job);

    expect(job.updateData).toHaveBeenCalledWith({
      ...DATA,
      outcome: { status: 'error' },
    });
    expect(collaboration.updateExecution).toHaveBeenLastCalledWith(
      'session-id',
      {
        id: 'execution-id',
        userName: 'User',
        startedAt: DATA.queuedAt,
        status: 'error',
      },
    );
  });

  it('publishes a completed test case and queues the next one', async () => {
    const { processor, coderunner, collaboration, executions } = setup();
    coderunner.execute.mockResolvedValue({ ...RESULT, stdout: '3' });
    const job = createJob({
      ...DATA,
      kind: 'task-case',
      caseIndex: 0,
      testCases: [
        {
          position: 0,
          name: 'Сумма',
          input: { numbers: [1, 2] },
          expectedOutput: 3,
        },
        {
          position: 1,
          name: 'Пустой массив',
          input: { numbers: [] },
          expectedOutput: 0,
        },
      ],
      caseResults: [],
    });

    await processor.process(job);

    expect(coderunner.execute).toHaveBeenCalledWith(
      expect.objectContaining({ stdin: '{"numbers":[1,2]}' }),
    );
    expect(collaboration.updateExecution).toHaveBeenCalledWith(
      'session-id',
      expect.objectContaining({
        status: 'running',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        result: expect.objectContaining({ completedCases: 1, totalCases: 2 }),
      }),
    );
    expect(executions.enqueueNextCase).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        caseResult: expect.objectContaining({
          status: 'passed',
          actualOutput: 3,
        }),
      }),
    );
    expect(executions.releaseLock).not.toHaveBeenCalled();
  });

  it('publishes the final chunk and releases the session lock', async () => {
    const { processor, coderunner, collaboration, executions } = setup();
    coderunner.execute.mockResolvedValue({ ...RESULT, stdout: '4' });
    const previousResult = {
      position: 0,
      name: 'Первый',
      input: { numbers: [1, 2] },
      expectedOutput: 3,
      actualOutput: 3,
      status: 'passed' as const,
      execution: RESULT,
    };
    const job = createJob({
      ...DATA,
      kind: 'task-case',
      caseIndex: 1,
      testCases: [
        previousResult,
        {
          position: 1,
          name: 'Второй',
          input: { numbers: [2, 2] },
          expectedOutput: 5,
        },
      ],
      caseResults: [previousResult],
    });

    await processor.process(job);

    expect(collaboration.updateExecution).toHaveBeenCalledWith(
      'session-id',
      expect.objectContaining({
        status: 'completed',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        result: expect.objectContaining({ completedCases: 2, totalCases: 2 }),
      }),
    );
    expect(executions.enqueueNextCase).not.toHaveBeenCalled();
    expect(executions.releaseLock).toHaveBeenCalled();
  });
});
