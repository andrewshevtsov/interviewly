import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ExecutionLogPatch } from './code-executions.types.ts';

@Injectable()
export class CollaborationClientService {
  private readonly url: string;
  private readonly token: string;

  constructor(config: ConfigService) {
    this.url = config
      .get<string>('COLLABORATION_INTERNAL_URL', 'http://localhost:1234')
      .replace(/\/+$/, '');
    this.token = config.getOrThrow<string>('INTERNAL_SERVICE_TOKEN');
  }

  async updateExecution(
    sessionId: string,
    patch: ExecutionLogPatch,
    timeoutMs = 3_000,
  ): Promise<void> {
    try {
      const response = await fetch(
        `${this.url}/internal/sessions/${encodeURIComponent(sessionId)}/executions/${encodeURIComponent(patch.id)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Service-Token': this.token,
          },
          body: JSON.stringify(patch),
          signal: AbortSignal.timeout(timeoutMs),
        },
      );
      if (!response.ok) {
        throw new Error(`Collaboration returned ${response.status}`);
      }
    } catch {
      throw new ServiceUnavailableException(
        'Collaboration service is unavailable',
      );
    }
  }
}
