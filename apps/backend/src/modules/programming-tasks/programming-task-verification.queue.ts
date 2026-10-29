import type { Queue } from 'bullmq';
import { VERIFY_PROGRAMMING_TASK_VARIANT_JOB } from './programming-task-verification.constants.ts';
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
      attempts: 3,
      backoff: { type: 'fixed', delay: 500 },
      removeOnComplete: { age: 60 * 60 },
      removeOnFail: { age: 24 * 60 * 60 },
    },
  );
}
