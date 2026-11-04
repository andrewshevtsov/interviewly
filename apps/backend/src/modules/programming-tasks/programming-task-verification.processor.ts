import {
  InjectQueue,
  OnWorkerEvent,
  Processor,
  WorkerHost,
} from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import type { Job, Queue } from 'bullmq';
import { isDeepStrictEqual } from 'node:util';
import { ProgrammingTaskVariantStatus } from '../../prisma/generated/enums.ts';
import { CoderunnerClientService } from '../code-executions/coderunner-client.service.ts';
import { CODE_EXECUTIONS_QUEUE } from '../code-executions/code-executions.constants.ts';
import {
  PROGRAMMING_TASK_VERIFICATION_CONCURRENCY,
  PROGRAMMING_TASK_VERIFICATIONS_QUEUE,
  SESSION_QUEUE_IDLE_POLL_INTERVAL_MS,
  SESSION_QUEUE_WAIT_TIMEOUT_MS,
} from './programming-task-verification.constants.ts';
import type { ProgrammingTaskVerificationJob } from './programming-task-verification.types.ts';
import { ProgrammingTasksRepository } from './programming-tasks.repository.ts';

@Injectable()
@Processor(PROGRAMMING_TASK_VERIFICATIONS_QUEUE, {
  concurrency: PROGRAMMING_TASK_VERIFICATION_CONCURRENCY,
})
export class ProgrammingTaskVerificationProcessor extends WorkerHost {
  private readonly logger = new Logger(
    ProgrammingTaskVerificationProcessor.name,
  );

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

    const verificationError = await this.verify(variant, revision);
    await this.repository.completeVariantVerification(variant.id, revision, {
      status: verificationError
        ? ProgrammingTaskVariantStatus.FAILED
        : ProgrammingTaskVariantStatus.VERIFIED,
      verifiedAt: verificationError ? null : new Date(),
      lastVerificationError: verificationError,
    });
  }

  @OnWorkerEvent('failed')
  onFailed(
    job: Job<ProgrammingTaskVerificationJob> | undefined,
    error: Error,
  ): void {
    if (!job || job.attemptsMade < (job.opts.attempts ?? 1)) {
      return;
    }

    // Сюда попадают только исключения coderunner/инфраструктуры - настоящее
    // несовпадение теста обрабатывается синхронно внутри process() и не бросает.
    // Вариант остаётся VERIFYING: ProgrammingTaskVerificationRecoveryService
    // поставит его в очередь повторно, когда сервис снова станет доступен -
    // это не провал задачи, и помечать его FAILED здесь нельзя.
    this.logger.warn(
      `Verification for variant ${job.data.variantId} failed after ${String(job.attemptsMade)} attempts: ${error.message}`,
    );
  }

  private async verify(
    variant: NonNullable<
      Awaited<
        ReturnType<ProgrammingTasksRepository['findVariantForVerification']>
      >
    >,
    revision: Date,
  ): Promise<string | null> {
    const language = variant.language.toLowerCase() as
      'python' | 'javascript' | 'typescript';
    const code = `${variant.referenceSolution}\n${variant.harnessCode}`;

    for (const [index, testCase] of variant.testCases.entries()) {
      await this.waitForSessionQueue(variant.id, revision);
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

  /**
   * Не даёт фоновой admin-проверке конкурировать с ожидающим кодом сессий.
   * Ждёт не дольше SESSION_QUEUE_WAIT_TIMEOUT_MS: при истечении дедлайна
   * фиксирует причину в lastVerificationError (статус остаётся VERIFYING) и
   * бросает исключение, которое уводит job в обычный retry с backoff.
   */
  private async waitForSessionQueue(
    variantId: string,
    revision: Date,
  ): Promise<void> {
    const deadline = Date.now() + SESSION_QUEUE_WAIT_TIMEOUT_MS;

    while (true) {
      const counts = await this.sessionExecutionsQueue.getJobCounts(
        'waiting',
        'active',
      );
      if ((counts.waiting ?? 0) === 0 && (counts.active ?? 0) === 0) {
        return;
      }

      if (Date.now() >= deadline) {
        const message =
          'Session code execution queue is busy; verification will retry automatically.';
        try {
          await this.repository.recordVerificationNote(
            variantId,
            revision,
            message,
          );
        } catch (error) {
          this.logger.warn(
            `Could not record session-queue-busy note for variant ${variantId}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
        throw new Error(message);
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
