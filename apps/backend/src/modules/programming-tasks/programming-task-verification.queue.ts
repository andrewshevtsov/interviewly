import type { Queue } from 'bullmq';
import {
  VERIFICATION_RETRY_ATTEMPTS,
  VERIFICATION_RETRY_BASE_DELAY_MS,
  VERIFY_PROGRAMMING_TASK_VARIANT_JOB,
} from './programming-task-verification.constants.ts';
import type { ProgrammingTaskVerificationJob } from './programming-task-verification.types.ts';

export function enqueueProgrammingTaskVerification(
  queue: Queue<ProgrammingTaskVerificationJob>,
  variantId: string,
  updatedAt: Date,
) {
  return queue.add(
    VERIFY_PROGRAMMING_TASK_VARIANT_JOB,
    { variantId, revision: updatedAt.toISOString() },
    {
      jobId: `${variantId}-${updatedAt.getTime()}`,
      attempts: VERIFICATION_RETRY_ATTEMPTS,
      backoff: {
        type: 'exponential',
        delay: VERIFICATION_RETRY_BASE_DELAY_MS,
      },
      removeOnComplete: { age: 60 * 60 },
      removeOnFail: { age: 24 * 60 * 60 },
    },
  );
}
