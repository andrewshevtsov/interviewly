import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { isDeepStrictEqual } from 'node:util';
import {
  CODE_EXECUTIONS_QUEUE,
  MAX_QUEUE_WAIT_MS,
  PROCESSOR_CONCURRENCY,
} from './code-executions.constants.ts';
import type {
  CodeExecutionJob,
  CodeExecutionOutcome,
  ExecutionResult,
  TaskCodeExecutionJob,
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

    if (Date.now() - data.queuedAt > MAX_QUEUE_WAIT_MS) {
      await this.collaboration.updateExecution(data.sessionId, {
        id: data.executionId,
        status: 'queue_timeout',
      });
      await this.executions.releaseLock(data);
      return;
    }

    try {
      await this.executions.assertAllowed(data.sessionId, data.requestedById);
    } catch {
      await this.collaboration.updateExecution(data.sessionId, {
        id: data.executionId,
        status: 'rejected',
      });
      await this.executions.releaseLock(data);
      return;
    }

    if (data.kind === 'task-case') {
      await this.processTestCase(job as Job<TaskCodeExecutionJob>);
      return;
    }

    // A previous attempt may have executed the code successfully but failed
    // to publish its result. In that case, only retry the publication.
    if (data.outcome) {
      await this.publishOutcome(data, data.outcome);
      await this.executions.releaseLock(data);
      return;
    }

    try {
      await this.collaboration.updateExecution(data.sessionId, {
        id: data.executionId,
        userName: data.userName,
        startedAt: data.executionStartedAt,
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
    await this.executions.releaseLock(data);
  }

  private async processTestCase(job: Job<TaskCodeExecutionJob>): Promise<void> {
    const data = job.data;
    const testCase = data.testCases[data.caseIndex];
    if (!testCase) {
      await this.executions.releaseLock(data);
      throw new Error(`Test case ${data.caseIndex} is missing`);
    }

    let caseResult = data.caseResult;
    if (!caseResult) {
      let execution: ExecutionResult | null = null;
      try {
        execution = await this.coderunner.execute({
          language: data.language,
          code: data.code,
          stdin: JSON.stringify(testCase.input),
        });
      } catch {
        // Ошибка инфраструктуры публикуется как результат конкретного кейса;
        // остальные кейсы всё равно получают шанс выполниться.
      }

      const actualOutput = execution
        ? this.parseActualOutput(execution.stdout)
        : null;
      const passed =
        execution?.exitCode === 0 &&
        isDeepStrictEqual(actualOutput, testCase.expectedOutput);
      caseResult = {
        ...testCase,
        status: execution ? (passed ? 'passed' : 'failed') : 'error',
        actualOutput,
        execution,
      };
      await job.updateData({ ...data, caseResult });
    }

    const cases = [...data.caseResults, caseResult];
    const isLast = data.caseIndex === data.testCases.length - 1;
    await this.collaboration.updateExecution(data.sessionId, {
      id: data.executionId,
      userName: data.userName,
      startedAt: data.executionStartedAt,
      status: isLast ? 'completed' : 'running',
      result: {
        completedCases: cases.length,
        totalCases: data.testCases.length,
        cases,
      },
    });

    if (isLast) {
      await this.executions.releaseLock(data);
    } else {
      await this.executions.enqueueNextCase({ ...data, caseResult });
    }
  }

  private parseActualOutput(stdout: string): unknown {
    try {
      return JSON.parse(stdout) as unknown;
    } catch {
      return stdout;
    }
  }

  private async publishOutcome(
    data: CodeExecutionJob,
    outcome: CodeExecutionOutcome,
  ): Promise<void> {
    await this.collaboration.updateExecution(data.sessionId, {
      id: data.executionId,
      userName: data.userName,
      startedAt: data.executionStartedAt,
      ...outcome,
    });
  }
}
