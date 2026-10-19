import { describe, expect, it, vi } from 'vitest';
import type { Job } from 'bullmq';
import { CodeExecutionsProcessor } from './code-executions.processor.ts';
import type { CodeExecutionJob } from './code-executions.types.ts';

const DATA: CodeExecutionJob = {
  executionId: 'execution-id',
  sessionId: 'session-id',
  requestedById: 'user-id',
  userName: 'User',
  language: 'typescript',
  code: 'console.log(1)',
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
  const executions = { assertAllowed: vi.fn().mockResolvedValue(undefined) };
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
        startedAt: DATA.queuedAt,
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
        startedAt: DATA.queuedAt,
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
        startedAt: DATA.queuedAt,
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
});
