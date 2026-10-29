import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { JwtPayload } from '../auth.types.ts';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: JwtPayload;
    }>();

    if (!request.user?.isAdmin) {
      throw new ForbiddenException('Administrator access required');
    }

    return true;
  }
}
