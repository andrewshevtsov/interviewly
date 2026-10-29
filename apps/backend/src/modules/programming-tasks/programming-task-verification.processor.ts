import {
  InjectQueue,
  OnWorkerEvent,
  Processor,
  WorkerHost,
} from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Job, Queue } from 'bullmq';
import { isDeepStrictEqual } from 'node:util';
import { ProgrammingTaskVariantStatus } from '../../prisma/generated/enums.ts';
import { CoderunnerClientService } from '../code-executions/coderunner-client.service.ts';
import { CODE_EXECUTIONS_QUEUE } from '../code-executions/code-executions.constants.ts';
import {
  PROGRAMMING_TASK_VERIFICATION_CONCURRENCY,
  PROGRAMMING_TASK_VERIFICATIONS_QUEUE,
  SESSION_QUEUE_IDLE_POLL_INTERVAL_MS,
} from './programming-task-verification.constants.ts';
import type { ProgrammingTaskVerificationJob } from './programming-task-verification.types.ts';
import { ProgrammingTasksRepository } from './programming-tasks.repository.ts';

@Injectable()
@Processor(PROGRAMMING_TASK_VERIFICATIONS_QUEUE, {
  concurrency: PROGRAMMING_TASK_VERIFICATION_CONCURRENCY,
})
export class ProgrammingTaskVerificationProcessor extends WorkerHost {
  constructor(
    private readonly repository: ProgrammingTasksRepository,
    private readonly coderunner: CoderunnerClientService,
    @InjectQueue(CODE_EXECUTIONS_QUEUE)
    private readonly sessionExecutionsQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<ProgrammingTaskVerificationJob>): Promise<void> {
    const revision = new Date(job.data.revision);
    const variant = await this.repository.findVariantForVerification(
      job.data.variantId,
    );

    // Вариант мог быть удалён или повторно отредактирован, пока job ожидала.
    if (
      !variant ||
      variant.status !== ProgrammingTaskVariantStatus.VERIFYING ||
      variant.updatedAt.getTime() !== revision.getTime()
    ) {
      return;
    }

    const verificationError = await this.verify(variant);
    await this.repository.completeVariantVerification(variant.id, revision, {
      status: verificationError
        ? ProgrammingTaskVariantStatus.FAILED
        : ProgrammingTaskVariantStatus.VERIFIED,
      verifiedAt: verificationError ? null : new Date(),
      lastVerificationError: verificationError,
    });
  }

  @OnWorkerEvent('failed')
  async onFailed(
    job: Job<ProgrammingTaskVerificationJob> | undefined,
    error: Error,
  ): Promise<void> {
    if (!job || job.attemptsMade < (job.opts.attempts ?? 1)) {
      return;
    }

    await this.repository.completeVariantVerification(
      job.data.variantId,
      new Date(job.data.revision),
      {
        status: ProgrammingTaskVariantStatus.FAILED,
        verifiedAt: null,
        lastVerificationError: `Verification could not be completed: ${error.message}`,
      },
    );
  }

  private async verify(
    variant: NonNullable<
      Awaited<
        ReturnType<ProgrammingTasksRepository['findVariantForVerification']>
      >
    >,
  ): Promise<string | null> {
    const language = variant.language.toLowerCase() as
      'python' | 'javascript' | 'typescript';
    const code = `${variant.referenceSolution}\n${variant.harnessCode}`;

    for (const [index, testCase] of variant.testCases.entries()) {
      await this.waitForSessionQueue();
      const execution = await this.coderunner.execute({
        language,
        code,
        stdin: JSON.stringify(testCase.input),
      });
      if (execution.exitCode !== 0) {
        const details =
          execution.stderr.trim() || execution.message || execution.status;
        return `Test case ${index + 1} exited with code ${String(execution.exitCode)}${details ? `: ${details}` : ''}`;
      }

      const actualOutput = this.parseOutput(execution.stdout);
      if (!isDeepStrictEqual(actualOutput, testCase.expectedOutput)) {
        return `Test case ${index + 1} failed: expected ${JSON.stringify(testCase.expectedOutput)}, received ${JSON.stringify(actualOutput)}`;
      }
    }

    return null;
  }

  /** Не даёт фоновой admin-проверке конкурировать с ожидающим кодом сессий. */
  private async waitForSessionQueue(): Promise<void> {
    while (true) {
      const counts = await this.sessionExecutionsQueue.getJobCounts(
        'waiting',
        'active',
      );
      if ((counts.waiting ?? 0) === 0 && (counts.active ?? 0) === 0) {
        return;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, SESSION_QUEUE_IDLE_POLL_INTERVAL_MS),
      );
    }
  }

  private parseOutput(stdout: string): unknown {
    try {
      return JSON.parse(stdout) as unknown;
    } catch {
      return stdout;
    }
  }
}
