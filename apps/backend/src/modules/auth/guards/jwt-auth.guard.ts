import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthenticatedRequest, JwtPayload } from '../auth.types.ts';

/**
 * Проверяет access-токен из заголовка `Authorization: Bearer <token>`.
 * При успехе кладёт расшифрованную нагрузку в `request.user`, иначе — 401.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const token = this.extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      request.user = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>
          ('JWT_ACCESS_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    return true;
  }

  private extractBearerToken(
    request: AuthenticatedRequest,
  ): string | undefined {
    const header = request.headers.authorization;
    const value = Array.isArray(header) ? header[0] : header;
    const [scheme, token] = value?.split(' ') ?? [];
    return scheme === 'Bearer' && token ? token : undefined;
  }
}
