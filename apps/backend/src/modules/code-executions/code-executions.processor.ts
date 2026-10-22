import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import {
  CODE_EXECUTIONS_QUEUE,
  MAX_QUEUE_WAIT_MS,
  PROCESSOR_CONCURRENCY,
} from './code-executions.constants.ts';
import type {
  CodeExecutionJob,
  CodeExecutionOutcome,
} from './code-executions.types.ts';
import { CodeExecutionsService } from './code-executions.service.ts';
import { CoderunnerClientService } from './coderunner-client.service.ts';
import { CollaborationClientService } from './collaboration-client.service.ts';

@Injectable()
@Processor(CODE_EXECUTIONS_QUEUE, { concurrency: PROCESSOR_CONCURRENCY })
export class CodeExecutionsProcessor extends WorkerHost {
  private readonly logger = new Logger(CodeExecutionsProcessor.name);

  constructor(
    private readonly executions: CodeExecutionsService,
    private readonly coderunner: CoderunnerClientService,
    private readonly collaboration: CollaborationClientService,
  ) {
    super();
  }

  async process(job: Job<CodeExecutionJob>): Promise<void> {
    const data = job.data;

    // A previous attempt may have executed the code successfully but failed
    // to publish its result. In that case, only retry the publication.
    if (data.outcome) {
      await this.publishOutcome(data, data.outcome);
      return;
    }

    if (Date.now() - data.queuedAt > MAX_QUEUE_WAIT_MS) {
      await this.collaboration.updateExecution(data.sessionId, {
        id: data.executionId,
        status: 'queue_timeout',
      });
      return;
    }

    try {
      await this.executions.assertAllowed(data.sessionId, data.requestedById);
    } catch {
      await this.collaboration.updateExecution(data.sessionId, {
        id: data.executionId,
        status: 'rejected',
      });
      return;
    }

    try {
      await this.collaboration.updateExecution(data.sessionId, {
        id: data.executionId,
        userName: data.userName,
        startedAt: data.queuedAt,
        status: 'running',
      });
    } catch (error) {
      this.logger.warn(
        `Execution ${data.executionId} started but its running state could not be published: ${String(error)}`,
      );
    }

    let outcome: CodeExecutionOutcome;
    try {
      const result = await this.coderunner.execute(data);
      outcome = { status: 'success', result };
    } catch {
      outcome = { status: 'error' };
    }

    await job.updateData({ ...data, outcome });
    await this.publishOutcome(data, outcome);
  }

  private async publishOutcome(
    data: CodeExecutionJob,
    outcome: CodeExecutionOutcome,
  ): Promise<void> {
    await this.collaboration.updateExecution(data.sessionId, {
      id: data.executionId,
      userName: data.userName,
      startedAt: data.queuedAt,
      ...outcome,
    });
  }
}
