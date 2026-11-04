import { InjectQueue } from '@nestjs/bullmq';
import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import type { Queue } from 'bullmq';
import {
  PROGRAMMING_TASK_VERIFICATIONS_QUEUE,
  VERIFICATION_RECOVERY_INTERVAL_MS,
  VERIFICATION_STALE_AFTER_MS,
} from './programming-task-verification.constants.ts';
import { enqueueProgrammingTaskVerification } from './programming-task-verification.queue.ts';
import type { ProgrammingTaskVerificationJob } from './programming-task-verification.types.ts';
import { ProgrammingTasksRepository } from './programming-tasks.repository.ts';

@Injectable()
export class ProgrammingTaskVerificationRecoveryService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(
    ProgrammingTaskVerificationRecoveryService.name,
  );
  private timer?: NodeJS.Timeout;
  private recoveryInProgress = false;

  constructor(
    private readonly repository: ProgrammingTasksRepository,
    @InjectQueue(PROGRAMMING_TASK_VERIFICATIONS_QUEUE)
    private readonly queue: Queue<ProgrammingTaskVerificationJob>,
  ) {}

  onModuleInit(): void {
    void this.runRecovery();
    this.timer = setInterval(
      () => void this.runRecovery(),
      VERIFICATION_RECOVERY_INTERVAL_MS,
    );
    this.timer.unref();
  }

  private async runRecovery(): Promise<void> {
    if (this.recoveryInProgress) {
      return;
    }

    this.recoveryInProgress = true;
    try {
      await this.recoverStaleVariants();
    } catch (error) {
      this.logger.warn(
        `Programming task verification recovery failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      this.recoveryInProgress = false;
    }
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async recoverStaleVariants(now = new Date()): Promise<void> {
    const cutoff = new Date(now.getTime() - VERIFICATION_STALE_AFTER_MS);
    const variants = await this.repository.findStaleVerifyingVariants(cutoff);

    const results = await Promise.allSettled(
      variants.map((variant) =>
        enqueueProgrammingTaskVerification(
          this.queue,
          variant.id,
          variant.updatedAt,
        ),
      ),
    );
    const failed = results.filter((result) => result.status === 'rejected');
    if (failed.length > 0) {
      this.logger.warn(
        `Could not recover ${failed.length} stale programming task verification job(s)`,
      );
    }
  }
}
