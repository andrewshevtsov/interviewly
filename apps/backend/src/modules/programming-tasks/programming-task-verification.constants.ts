export const PROGRAMMING_TASK_VERIFICATIONS_QUEUE =
  'programming-task-verifications';
export const VERIFY_PROGRAMMING_TASK_VARIANT_JOB =
  'verify-programming-task-variant';
export const PROGRAMMING_TASK_VERIFICATION_CONCURRENCY = 1;
export const SESSION_QUEUE_IDLE_POLL_INTERVAL_MS = 250;
// Общий дедлайн на ожидание очереди кода сессий во время одной проверки
// варианта - не даёт admin-проверке зависнуть навечно, если сессии постоянно активны.
export const SESSION_QUEUE_WAIT_TIMEOUT_MS = 30_000;
// Экспоненциальный backoff: 30с и 60с между тремя попытками - достаточно,
// чтобы переждать короткий рестарт coderunner, не растягивая задержку надолго.
export const VERIFICATION_RETRY_BASE_DELAY_MS = 30_000;
export const VERIFICATION_RETRY_ATTEMPTS = 3;
export const VERIFICATION_RECOVERY_INTERVAL_MS = 60_000;
export const VERIFICATION_STALE_AFTER_MS = 5 * 60_000;
export const VERIFICATION_RECOVERY_BATCH_SIZE = 100;
