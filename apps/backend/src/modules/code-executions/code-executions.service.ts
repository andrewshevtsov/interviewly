import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';
import type { Prisma, Session } from '../../prisma/generated/client.ts';
import { EditorLanguage, SessionStatus } from '../../prisma/generated/enums.ts';
import { SessionsRepository } from '../sessions/sessions.repository.ts';
import {
  CODE_EXECUTIONS_QUEUE,
  EXECUTE_CODE_JOB,
  EXECUTE_TEST_CASE_JOB,
  MAX_EXECUTION_SLOT_MS,
  MAX_QUEUE_WAIT_MS,
  PROCESSOR_CONCURRENCY,
} from './code-executions.constants.ts';
import type { CreateCodeExecutionDto } from './dto/create-code-execution.dto.ts';
import type {
  CodeExecutionJob,
  TaskCodeExecutionJob,
  TestCaseDefinition,
} from './code-executions.types.ts';
import { CollaborationClientService } from './collaboration-client.service.ts';
import { CodeExecutionLockService } from './code-execution-lock.service.ts';

const FORBIDDEN_STATUSES = new Set<SessionStatus>([
  SessionStatus.COMPLETED,
  SessionStatus.CANCELLED,
  SessionStatus.EXPIRED,
]);
const QUEUED_PUBLICATION_ATTEMPTS = 3;
const QUEUED_PUBLICATION_TIMEOUT_MS = 300;
const QUEUED_PUBLICATION_RETRY_DELAY_MS = 100;
const LANGUAGE_BY_EDITOR_LANGUAGE = {
  [EditorLanguage.PYTHON]: 'python',
  [EditorLanguage.JAVASCRIPT]: 'javascript',
  [EditorLanguage.TYPESCRIPT]: 'typescript',
} as const;

interface ProgrammingTaskExecutionSnapshot {
  language: EditorLanguage;
  harnessCode: string;
  testCases: TestCaseDefinition[];
}

@Injectable()
export class CodeExecutionsService {
  private readonly logger = new Logger(CodeExecutionsService.name);

  constructor(
    @InjectQueue(CODE_EXECUTIONS_QUEUE)
    private readonly queue: Queue<CodeExecutionJob>,
    private readonly sessionsRepository: SessionsRepository,
    private readonly collaboration: CollaborationClientService,
    private readonly locks: CodeExecutionLockService,
  ) {}

  async enqueue(
    sessionId: string,
    userId: string,
    dto: CreateCodeExecutionDto,
  ) {
    const session = await this.assertAllowed(sessionId, userId);
    const expectedLanguage =
      LANGUAGE_BY_EDITOR_LANGUAGE[session.editorLanguage];
    if (dto.language !== expectedLanguage) {
      throw new BadRequestException(
        `Execution language must match session language ${expectedLanguage}`,
      );
    }
    const counts = await this.queue.getJobCounts('waiting', 'active');
    const jobsAhead = (counts.waiting ?? 0) + (counts.active ?? 0);
    if (
      Math.ceil(jobsAhead / PROCESSOR_CONCURRENCY) * MAX_EXECUTION_SLOT_MS >=
      MAX_QUEUE_WAIT_MS
    ) {
      throw new HttpException(
        'Code execution queue is overloaded',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const user = await this.sessionsRepository.findUserById(userId);
    if (!user) {
      throw new ForbiddenException('Session access denied');
    }
    const executionId = randomUUID();
    const queuedAt = Date.now();
    const baseJob = {
      executionId,
      sessionId,
      requestedById: userId,
      userName:
        [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
      language: dto.language,
      code: dto.code,
      executionStartedAt: queuedAt,
      queuedAt,
    };
    const taskSnapshot = this.parseTaskSnapshot(
      session.programmingTaskSnapshot,
    );
    if (taskSnapshot && taskSnapshot.language !== session.editorLanguage) {
      throw new ConflictException(
        'Programming task language does not match session language',
      );
    }
    const jobData: CodeExecutionJob = taskSnapshot
      ? {
          ...baseJob,
          kind: 'task-case',
          code: `${dto.code}\n${taskSnapshot.harnessCode}`,
          caseIndex: 0,
          testCases: taskSnapshot.testCases,
          caseResults: [],
        }
      : { ...baseJob, kind: 'custom', stdin: dto.stdin };

    let locked: boolean;
    try {
      locked = await this.locks.acquire(sessionId, executionId);
    } catch {
      throw new ServiceUnavailableException('Execution lock is unavailable');
    }
    if (!locked) {
      throw new ConflictException(
        'A code execution is already active for this session',
      );
    }

    try {
      await this.queue.add(
        taskSnapshot ? EXECUTE_TEST_CASE_JOB : EXECUTE_CODE_JOB,
        jobData,
        {
          jobId: this.jobId(jobData),
          attempts: 3,
          backoff: { type: 'fixed', delay: 500 },
          removeOnComplete: { age: 60 * 60 },
          removeOnFail: { age: 24 * 60 * 60 },
        },
      );
    } catch {
      await this.locks.release(sessionId, executionId).catch(() => undefined);
      throw new ServiceUnavailableException(
        'Code execution queue is unavailable',
      );
    }

    await this.publishQueuedState(jobData);

    return { executionId, status: 'QUEUED' as const, queuedAt };
  }

  async assertAllowed(sessionId: string, userId: string): Promise<Session> {
    const [session, participant] = await Promise.all([
      this.sessionsRepository.findById(sessionId),
      this.sessionsRepository.findParticipant(sessionId, userId),
    ]);
    if (!session || !participant || FORBIDDEN_STATUSES.has(session.status)) {
      throw new ForbiddenException('Session access denied');
    }
    return session;
  }

  async enqueueNextCase(data: TaskCodeExecutionJob): Promise<void> {
    const next: TaskCodeExecutionJob = {
      ...data,
      caseIndex: data.caseIndex + 1,
      caseResults: data.caseResult
        ? [...data.caseResults, data.caseResult]
        : data.caseResults,
      caseResult: undefined,
      queuedAt: Date.now(),
    };
    await this.locks.extend(data.sessionId, data.executionId);
    await this.queue.add(EXECUTE_TEST_CASE_JOB, next, {
      jobId: this.jobId(next),
      attempts: 3,
      backoff: { type: 'fixed', delay: 500 },
      removeOnComplete: { age: 60 * 60 },
      removeOnFail: { age: 24 * 60 * 60 },
    });
  }

  releaseLock(data: CodeExecutionJob): Promise<void> {
    return this.locks.release(data.sessionId, data.executionId);
  }

  private async publishQueuedState(data: CodeExecutionJob): Promise<void> {
    const patch = {
      id: data.executionId,
      userName: data.userName,
      startedAt: data.executionStartedAt,
      status: 'queued' as const,
    };

    for (let attempt = 1; attempt <= QUEUED_PUBLICATION_ATTEMPTS; attempt++) {
      try {
        await this.collaboration.updateExecution(
          data.sessionId,
          patch,
          QUEUED_PUBLICATION_TIMEOUT_MS,
        );
        return;
      } catch (error) {
        if (attempt === QUEUED_PUBLICATION_ATTEMPTS) {
          this.logger.warn(
            `Execution ${data.executionId} was queued but its queued state could not be published: ${String(error)}`,
          );
          return;
        }
        await new Promise((resolve) =>
          setTimeout(resolve, QUEUED_PUBLICATION_RETRY_DELAY_MS * attempt),
        );
      }
    }
  }

  private jobId(data: CodeExecutionJob): string {
    return data.kind === 'task-case'
      ? `${data.executionId}-${data.caseIndex}`
      : data.executionId;
  }

  private parseTaskSnapshot(
    value: Prisma.JsonValue,
  ): ProgrammingTaskExecutionSnapshot | null {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return null;
    }
    if (
      typeof value.harnessCode !== 'string' ||
      typeof value.language !== 'string' ||
      !Object.values(EditorLanguage).includes(
        value.language as EditorLanguage,
      ) ||
      !Array.isArray(value.testCases)
    ) {
      throw new ConflictException('Programming task snapshot is invalid');
    }

    const testCases = value.testCases.map((testCase) => {
      if (
        typeof testCase !== 'object' ||
        testCase === null ||
        Array.isArray(testCase) ||
        typeof testCase.position !== 'number' ||
        typeof testCase.name !== 'string' ||
        !('input' in testCase) ||
        !('expectedOutput' in testCase)
      ) {
        throw new ConflictException('Programming task test case is invalid');
      }
      return {
        position: testCase.position,
        name: testCase.name,
        input: testCase.input as Prisma.JsonValue,
        expectedOutput: testCase.expectedOutput as Prisma.JsonValue,
      } satisfies TestCaseDefinition;
    });
    if (testCases.length === 0) {
      throw new ConflictException('Programming task has no test cases');
    }

    return {
      language: value.language as EditorLanguage,
      harnessCode: value.harnessCode,
      testCases,
    };
  }
}
