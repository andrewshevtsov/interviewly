import { CanActivate, Injectable, NotFoundException } from '@nestjs/common';

/**
 * Закрывает маршрут в production, отдаёт 404, как будто роута не существует.
 * `NODE_ENV` в этом репозитории нигде не выставляется явно для dev/docker-compose
 * (см. `refreshTokenCookieOptions` в `auth.constants.ts`, тот же паттерн), поэтому по умолчанию — открыт.
 */
@Injectable()
export class DevOnlyGuard implements CanActivate {
  canActivate(): boolean {
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundException();
    }
    return true;
  }
}
