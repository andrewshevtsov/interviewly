import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
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

/** Часть ответа backend, достаточная для допуска пользователя к запуску. */
interface SessionState {
  role: unknown;
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
  private readonly backendUrl: string;

  constructor(configService: ConfigService) {
    // Удаляем завершающий слеш, чтобы дальнейшая склейка URL не создавала `//`.
    this.pistonUrl = configService
      .getOrThrow<string>('PISTON_URL')
      .replace(/\/+$/, '');
    this.backendUrl = configService
      .getOrThrow<string>('BACKEND_INTERNAL_URL')
      .replace(/\/+$/, '');
  }

  async execute(
    input: ExecuteCodeDto,
    authorization?: string,
  ): Promise<ExecutionResult> {
    // Чужой код не попадёт в Piston, пока backend не подтвердит участие в сессии.
    await this.assertSessionAccess(input.sessionId, authorization);

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
        // Piston ограничивает сам запуск тремя секундами; две секунды оставлены на HTTP-обвязку.
        signal: AbortSignal.timeout(5_000),
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
   * Передаёт JWT основному backend и допускает только участника указанной сессии.
   * @param sessionId UUID сессии из тела запроса.
   * @param authorization Bearer-заголовок браузера.
   */
  private async assertSessionAccess(
    sessionId: string,
    authorization?: string,
  ): Promise<void> {
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    let response: Response;

    try {
      response = await fetch(
        `${this.backendUrl}/sessions/${encodeURIComponent(sessionId)}/me`,
        {
          headers: { Authorization: authorization },
          signal: AbortSignal.timeout(3_000),
        },
      );
    } catch {
      throw new ServiceUnavailableException(
        'Session authorization service is unavailable',
      );
    }

    if (response.status === 401) {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    if (!response.ok) {
      throw new ForbiddenException('Session access denied');
    }

    let state: SessionState;

    try {
      state = (await response.json()) as SessionState;
    } catch {
      throw new ServiceUnavailableException(
        'Session authorization service returned an invalid response',
      );
    }

    if (state.role !== 'INTERVIEWER' && state.role !== 'CANDIDATE') {
      throw new ForbiddenException('Session access denied');
    }
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
