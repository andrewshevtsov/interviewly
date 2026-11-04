import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ExecutionResult } from './code-executions.types.ts';

interface CoderunnerExecutionInput {
  language: 'python' | 'javascript' | 'typescript';
  code: string;
  stdin?: string;
}

@Injectable()
export class CoderunnerClientService {
  private readonly url: string;
  private readonly token: string;

  constructor(config: ConfigService) {
    this.url = config
      .get<string>('CODERUNNER_INTERNAL_URL', 'http://localhost:3003')
      .replace(/\/+$/, '');
    this.token = config.getOrThrow<string>('INTERNAL_SERVICE_TOKEN');
  }

  async execute(job: CoderunnerExecutionInput): Promise<ExecutionResult> {
    let response: Response;
    try {
      response = await fetch(`${this.url}/execution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Service-Token': this.token,
        },
        body: JSON.stringify({
          language: job.language,
          code: job.code,
          stdin: job.stdin,
        }),
        signal: AbortSignal.timeout(5_000),
      });
    } catch (error) {
      if (
        error instanceof Error &&
        (error.name === 'TimeoutError' || error.name === 'AbortError')
      ) {
        throw new GatewayTimeoutException('Coderunner request timed out');
      }
      throw new ServiceUnavailableException('Coderunner is unavailable');
    }

    if (!response.ok) {
      throw new BadGatewayException(`Coderunner returned ${response.status}`);
    }
    return (await response.json()) as ExecutionResult;
  }
}
