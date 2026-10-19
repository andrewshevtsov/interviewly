import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Job, Queue } from 'bullmq';
import { randomUUID } from 'node:crypto';
import { SessionStatus } from '../../prisma/generated/enums.ts';
import { SessionsRepository } from '../sessions/sessions.repository.ts';
import {
  CODE_EXECUTIONS_QUEUE,
  EXECUTE_CODE_JOB,
  MAX_EXECUTION_SLOT_MS,
  MAX_QUEUE_WAIT_MS,
  PROCESSOR_CONCURRENCY,
} from './code-executions.constants.ts';
import type { CreateCodeExecutionDto } from './dto/create-code-execution.dto.ts';
import type { CodeExecutionJob } from './code-executions.types.ts';
import { CollaborationClientService } from './collaboration-client.service.ts';

const FORBIDDEN_STATUSES = new Set<SessionStatus>([
  SessionStatus.COMPLETED,
  SessionStatus.CANCELLED,
  SessionStatus.EXPIRED,
]);
const QUEUED_PUBLICATION_ATTEMPTS = 3;
const QUEUED_PUBLICATION_TIMEOUT_MS = 300;
const QUEUED_PUBLICATION_RETRY_DELAY_MS = 100;

@Injectable()
export class CodeExecutionsService {
  private readonly logger = new Logger(CodeExecutionsService.name);

  constructor(
    @InjectQueue(CODE_EXECUTIONS_QUEUE)
    private readonly queue: Queue<CodeExecutionJob>,
    private readonly sessionsRepository: SessionsRepository,
    private readonly collaboration: CollaborationClientService,
  ) {}

  async enqueue(
    sessionId: string,
    userId: string,
    dto: CreateCodeExecutionDto,
  ) {
    const existingJobId = await this.queue.getDeduplicationJobId(sessionId);
    if (existingJobId) {
      throw new ConflictException(
        'A code execution is already active for this session',
      );
    }

    await this.assertAllowed(sessionId, userId);
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
    const jobData: CodeExecutionJob = {
      executionId,
      sessionId,
      requestedById: userId,
      userName:
        [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
      language: dto.language,
      code: dto.code,
      stdin: dto.stdin,
      queuedAt,
    };

    let job: Job<CodeExecutionJob>;
    try {
      job = await this.queue.add(EXECUTE_CODE_JOB, jobData, {
        jobId: executionId,
        deduplication: { id: sessionId },
        attempts: 3,
        backoff: { type: 'fixed', delay: 500 },
        removeOnComplete: { age: 60 * 60 },
        removeOnFail: { age: 24 * 60 * 60 },
      });
    } catch {
      throw new ServiceUnavailableException(
        'Code execution queue is unavailable',
      );
    }

    if (job.id !== executionId) {
      throw new ConflictException(
        'A code execution is already active for this session',
      );
    }

    await this.publishQueuedState(jobData);

    return { executionId, status: 'QUEUED' as const, queuedAt };
  }

  async assertAllowed(sessionId: string, userId: string): Promise<void> {
    const [session, participant] = await Promise.all([
      this.sessionsRepository.findById(sessionId),
      this.sessionsRepository.findParticipant(sessionId, userId),
    ]);
    if (!session || !participant || FORBIDDEN_STATUSES.has(session.status)) {
      throw new ForbiddenException('Session access denied');
    }
  }

  private async publishQueuedState(data: CodeExecutionJob): Promise<void> {
    const patch = {
      id: data.executionId,
      userName: data.userName,
      startedAt: data.queuedAt,
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
          setTimeout(
            resolve,
            QUEUED_PUBLICATION_RETRY_DELAY_MS * attempt,
          ),
        );
      }
    }
  }
}
