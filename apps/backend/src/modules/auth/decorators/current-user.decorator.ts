import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest, JwtPayload } from '../auth.types.ts';

/**
 * Достаёт пользователя (или одно его поле), положенного в запрос `JwtAuthGuard`.
 * Использовать только на маршрутах под `@UseGuards(JwtAuthGuard)`.
 */
export const CurrentUser = createParamDecorator(
  (
    data: keyof JwtPayload | undefined,
    context: ExecutionContext,
  ): JwtPayload | JwtPayload[keyof JwtPayload] | undefined => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      return undefined;
    }

    return data ? user[data] : user;
  },
);
