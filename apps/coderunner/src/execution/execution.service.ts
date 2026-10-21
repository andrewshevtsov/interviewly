import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
  UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExecuteCodeDto } from './dto/execute-code.dto';

/** Минимальная часть результата процесса, возвращаемая Piston. */
interface PistonRunResult {
  stdout: string;
  stderr: string;
  code: number | null;
  signal: string | null;
  status?: string | null;
  message?: string | null;
  memory?: number;
  cpu_time?: number;
  wall_time?: number;
}

/** Успешный ответ endpoint-а выполнения Piston. */
interface PistonExecuteResponse {
  run: PistonRunResult;
}

/** Стабильный внешний контракт coderunner, не зависящий от имён полей Piston. */
export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  signal: string | null;
  status: string | null;
  message: string | null;
  memory: number | null;
  cpuTime: number | null;
  wallTime: number | null;
}

/** Проверяет доступ к сессии, запускает код в Piston и нормализует его ответ. */
@Injectable()
export class ExecutionService {
  private readonly pistonUrl: string;
  private readonly internalServiceToken: string;

  constructor(configService: ConfigService) {
    // Удаляем завершающий слеш, чтобы дальнейшая склейка URL не создавала `//`.
    this.pistonUrl = configService
      .getOrThrow<string>('PISTON_URL')
      .replace(/\/+$/, '');
    this.internalServiceToken = configService.getOrThrow<string>(
      'INTERNAL_SERVICE_TOKEN',
    );
  }

  async execute(
    input: ExecuteCodeDto,
    serviceToken?: string,
  ): Promise<ExecutionResult> {
    if (serviceToken !== this.internalServiceToken) {
      throw new UnauthorizedException('Invalid internal service token');
    }

    let response: Response;

    try {
      response = await fetch(`${this.pistonUrl}/api/v2/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: input.language,
          version: '*',
          files: [{ content: input.code }],
          stdin: input.stdin ?? '',
        }),
        // Piston ограничивает сам запуск тремя секундами; секунда оставлена на HTTP-обвязку.
        signal: AbortSignal.timeout(4_000),
      });
    } catch (error) {
      if (
        error instanceof Error &&
        (error.name === 'TimeoutError' || error.name === 'AbortError')
      ) {
        throw new GatewayTimeoutException('Code execution timed out');
      }

      throw new ServiceUnavailableException(
        'Code execution service is unavailable',
      );
    }

    if (!response.ok) {
      throw new BadGatewayException({
        message: 'Code execution service returned an error',
        upstreamStatus: response.status,
      });
    }

    let payload: unknown;

    try {
      payload = await response.json();
    } catch {
      throw new BadGatewayException(
        'Code execution service returned an invalid response',
      );
    }

    if (!this.isPistonExecuteResponse(payload)) {
      throw new BadGatewayException(
        'Code execution service returned an invalid response',
      );
    }

    return {
      stdout: payload.run.stdout,
      stderr: payload.run.stderr,
      exitCode: payload.run.code,
      signal: payload.run.signal,
      status: payload.run.status ?? null,
      message: payload.run.message ?? null,
      memory: payload.run.memory ?? null,
      cpuTime: payload.run.cpu_time ?? null,
      wallTime: payload.run.wall_time ?? null,
    };
  }

  /**
   * Защищает внешний контракт от неожиданного или повреждённого ответа Piston.
   * @param payload Десериализованный JSON Piston.
   * @returns Признак наличия обязательных полей результата.
   */
  private isPistonExecuteResponse(
    payload: unknown,
  ): payload is PistonExecuteResponse {
    if (
      typeof payload !== 'object' ||
      payload === null ||
      !('run' in payload)
    ) {
      return false;
    }

    const run = payload.run;

    return (
      typeof run === 'object' &&
      run !== null &&
      'stdout' in run &&
      typeof run.stdout === 'string' &&
      'stderr' in run &&
      typeof run.stderr === 'string' &&
      'code' in run &&
      (typeof run.code === 'number' || run.code === null) &&
      'signal' in run &&
      (typeof run.signal === 'string' || run.signal === null)
    );
  }
}
