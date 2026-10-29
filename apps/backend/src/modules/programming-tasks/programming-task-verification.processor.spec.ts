import type { Job, Queue } from 'bullmq';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mocked,
} from 'vitest';
import {
  EditorLanguage,
  ProgrammingTaskVariantStatus,
} from '../../prisma/generated/enums.ts';
import type { CoderunnerClientService } from '../code-executions/coderunner-client.service.ts';
import { ProgrammingTaskVerificationProcessor } from './programming-task-verification.processor.ts';
import type { ProgrammingTaskVerificationJob } from './programming-task-verification.types.ts';
import type { ProgrammingTasksRepository } from './programming-tasks.repository.ts';

const revision = new Date('2026-10-28T12:00:00.000Z');
const job = {
  data: { variantId: 'variant-id', revision: revision.toISOString() },
  attemptsMade: 3,
  opts: { attempts: 3 },
} as Job<ProgrammingTaskVerificationJob>;

describe('ProgrammingTaskVerificationProcessor', () => {
  let repository: Mocked<ProgrammingTasksRepository>;
  let coderunner: Mocked<CoderunnerClientService>;
  let sessionExecutionsQueue: Mocked<Queue>;
  let processor: ProgrammingTaskVerificationProcessor;

  beforeEach(() => {
    repository = {
      findVariantForVerification: vi.fn().mockResolvedValue({
        id: 'variant-id',
        language: EditorLanguage.JAVASCRIPT,
        referenceSolution: 'function solve() { return 6; }',
        harnessCode: 'console.log(JSON.stringify(solve(input)));',
        status: ProgrammingTaskVariantStatus.VERIFYING,
        updatedAt: revision,
        testCases: [
          { input: [1, 2, 3], expectedOutput: 6 },
          { input: [2, 2, 2], expectedOutput: 6 },
        ],
      }),
      completeVariantVerification: vi.fn().mockResolvedValue({ count: 1 }),
      recordVerificationNote: vi.fn().mockResolvedValue({ count: 1 }),
    } as unknown as Mocked<ProgrammingTasksRepository>;
    coderunner = {
      execute: vi.fn().mockResolvedValue({
        stdout: '6',
        stderr: '',
        exitCode: 0,
        signal: null,
        status: null,
        message: null,
        memory: null,
        cpuTime: null,
        wallTime: null,
      }),
    } as unknown as Mocked<CoderunnerClientService>;
    sessionExecutionsQueue = {
      getJobCounts: vi.fn().mockResolvedValue({ waiting: 0, active: 0 }),
    } as unknown as Mocked<Queue>;
    processor = new ProgrammingTaskVerificationProcessor(
      repository,
      coderunner,
      sessionExecutionsQueue,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('последовательно проверяет тест-кейсы одного варианта и публикует VERIFIED', async () => {
    await processor.process(job);

    expect(coderunner.execute).toHaveBeenCalledTimes(2);
    expect(sessionExecutionsQueue.getJobCounts).toHaveBeenCalledTimes(2);
    expect(repository.completeVariantVerification).toHaveBeenCalledWith(
      'variant-id',
      revision,
      expect.objectContaining({
        status: ProgrammingTaskVariantStatus.VERIFIED,
        lastVerificationError: null,
      }),
    );
  });

  it('ждёт освобождения очереди сессий перед административным тестом', async () => {
    vi.useFakeTimers();
    sessionExecutionsQueue.getJobCounts
      .mockResolvedValueOnce({ waiting: 1, active: 1 })
      .mockResolvedValue({ waiting: 0, active: 0 });

    const processing = processor.process(job);
    await vi.advanceTimersByTimeAsync(250);
    await processing;

    expect(sessionExecutionsQueue.getJobCounts).toHaveBeenCalledTimes(3);
    expect(coderunner.execute).toHaveBeenCalledTimes(2);
  });

  it('прерывает попытку и фиксирует причину, если сессии заняты дольше 30с', async () => {
    vi.useFakeTimers();
    sessionExecutionsQueue.getJobCounts.mockResolvedValue({ waiting: 1, active: 1 });

    const processing = processor.process(job);
    const rejection = expect(processing).rejects.toThrow(
      'Session code execution queue is busy',
    );
    await vi.advanceTimersByTimeAsync(30_000);
    await rejection;

    expect(repository.recordVerificationNote).toHaveBeenCalledWith(
      'variant-id',
      revision,
      expect.stringContaining('Session code execution queue is busy'),
    );
    expect(coderunner.execute).not.toHaveBeenCalled();
    expect(repository.completeVariantVerification).not.toHaveBeenCalled();
  });

  it('останавливается на несовпадении и публикует FAILED', async () => {
    coderunner.execute.mockResolvedValueOnce({
      stdout: '5',
      stderr: '',
      exitCode: 0,
      signal: null,
      status: null,
      message: null,
      memory: null,
      cpuTime: null,
      wallTime: null,
    });

    await processor.process(job);

    expect(coderunner.execute).toHaveBeenCalledOnce();
    expect(repository.completeVariantVerification).toHaveBeenCalledOnce();
    const verification =
      repository.completeVariantVerification.mock.calls[0]?.[2];
    expect(verification?.status).toBe(ProgrammingTaskVariantStatus.FAILED);
    expect(verification?.lastVerificationError).toContain(
      'expected 6, received 5',
    );
  });

  it('не запускает устаревшую job после повторного редактирования', async () => {
    repository.findVariantForVerification.mockResolvedValue({
      ...(await repository.findVariantForVerification('variant-id'))!,
      updatedAt: new Date('2026-10-28T12:01:00.000Z'),
    });

    await processor.process(job);

    expect(coderunner.execute).not.toHaveBeenCalled();
    expect(repository.completeVariantVerification).not.toHaveBeenCalled();
  });

  it('после последнего инфраструктурного retry не трогает статус варианта', () => {
    processor.onFailed(job, new Error('Coderunner is unavailable'));

    expect(repository.completeVariantVerification).not.toHaveBeenCalled();
  });

  it('не трогает статус, если job упала раньше последней попытки', () => {
    processor.onFailed(
      { ...job, attemptsMade: 1 } as Job<ProgrammingTaskVerificationJob>,
      new Error('Coderunner is unavailable'),
    );

    expect(repository.completeVariantVerification).not.toHaveBeenCalled();
  });
});
