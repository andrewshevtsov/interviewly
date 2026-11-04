import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { EXECUTION_LOCK_TTL_MS } from './code-executions.constants.ts';

const RELEASE_LOCK_SCRIPT = `
if redis.call('get', KEYS[1]) == ARGV[1] then
  return redis.call('del', KEYS[1])
end
return 0
`;

@Injectable()
export class CodeExecutionLockService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor(config: ConfigService) {
    this.redis = new Redis(
      config.get<string>('REDIS_URL') ?? 'redis://localhost:6379',
      { maxRetriesPerRequest: 1 },
    );
  }

  async acquire(sessionId: string, executionId: string): Promise<boolean> {
    const result = await this.redis.set(
      this.key(sessionId),
      executionId,
      'PX',
      EXECUTION_LOCK_TTL_MS,
      'NX',
    );
    return result === 'OK';
  }

  async extend(sessionId: string, executionId: string): Promise<void> {
    const current = await this.redis.get(this.key(sessionId));
    if (current === executionId) {
      await this.redis.pexpire(this.key(sessionId), EXECUTION_LOCK_TTL_MS);
    }
  }

  async release(sessionId: string, executionId: string): Promise<void> {
    await this.redis.eval(
      RELEASE_LOCK_SCRIPT,
      1,
      this.key(sessionId),
      executionId,
    );
  }

  onModuleDestroy(): Promise<'OK'> {
    return this.redis.quit();
  }

  private key(sessionId: string): string {
    return `code-execution:session:${sessionId}`;
  }
}
