import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { isUUID } from 'class-validator';
import type { Server, Socket } from 'socket.io';
import type { JwtPayload } from '../auth/auth.types.ts';
import { SessionsService } from './sessions.service.ts';

/** Сообщения клиента для подписки на события комнаты. */
export const SESSION_SOCKET_MESSAGES = {
  join: 'session:join',
  leave: 'session:leave',
} as const;

type SocketData = { user?: JwtPayload };

type JoinResult = { ok: true } | { ok: false; error: string };

function roomOf(sessionId: string): string {
  return `session:${sessionId}`;
}

/**
 * Realtime-канал комнат (socket.io на том же порту, что и HTTP). Клиент
 * подключается с access-токеном в `auth.token`, затем подписывается на комнату
 * сообщением `session:join`; сервер рассылает события через {@link emitToSession}.
 *
 * Без Redis-адаптера события доходят только до клиентов этого же инстанса -
 * для нескольких инстансов бэкенда понадобится `@socket.io/redis-adapter`
 */
@WebSocketGateway({
  cors: {
    // Функция, а не строка: декоратор вычисляется при импорте, до загрузки .env
    origin: (
      _origin: string | undefined,
      callback: (error: Error | null, origin: string) => void,
    ) => callback(null, process.env.FRONTEND_URL ?? 'http://localhost:3000'),
    credentials: true,
  },
})
export class SessionsGateway implements OnGatewayInit {
  private readonly logger = new Logger(SessionsGateway.name);

  @WebSocketServer()
  private readonly server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly sessionsService: SessionsService,
  ) {}

  afterInit(server: Server): void {
    // Проверяем токен до установки соединения: клиент без него получит
    // connect_error и не сможет отправить ни одного сообщения
    server.use((socket, next) => {
      this.authenticate(socket)
        .then(() => next())
        .catch(() => next(new Error('Unauthorized')));
    });
  }

  @SubscribeMessage(SESSION_SOCKET_MESSAGES.join)
  async join(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ): Promise<JoinResult> {
    const sessionId = this.parseSessionId(body);
    const user = (client.data as SocketData).user;
    if (!sessionId || !user) {
      return { ok: false, error: 'Invalid session id' };
    }

    try {
      await this.sessionsService.requireRoomViewer(sessionId, user);
    } catch {
      return { ok: false, error: 'No access to this session' };
    }

    await client.join(roomOf(sessionId));
    return { ok: true };
  }

  @SubscribeMessage(SESSION_SOCKET_MESSAGES.leave)
  async leave(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: unknown,
  ): Promise<void> {
    const sessionId = this.parseSessionId(body);
    if (sessionId) {
      await client.leave(roomOf(sessionId));
    }
  }

  /** Отправляет событие всем, кто подписан на комнату сессии. */
  emitToSession(sessionId: string, event: string, payload: unknown): void {
    this.server.to(roomOf(sessionId)).emit(event, payload);
  }

  private async authenticate(socket: Socket): Promise<void> {
    const token: unknown = socket.handshake.auth?.token;
    if (typeof token !== 'string' || !token) {
      throw new Error('Missing token');
    }

    try {
      (socket.data as SocketData).user = await this.jwtService.verifyAsync<JwtPayload>(
        token,
        { secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET') },
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.debug(`Socket ${socket.id} rejected: ${message}`);
      throw error;
    }
  }

  private parseSessionId(body: unknown): string | null {
    const sessionId = (body as { sessionId?: unknown } | null)?.sessionId;
    return typeof sessionId === 'string' && isUUID(sessionId) ? sessionId : null;
  }
}
