import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import type { JwtPayload } from '../auth.types.ts';
import { AdminGuard } from './admin.guard.ts';

function contextFor(user?: JwtPayload): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('AdminGuard', () => {
  const guard = new AdminGuard();

  it('разрешает доступ администратору', () => {
    expect(
      guard.canActivate(
        contextFor({ sub: 'admin-id', email: 'admin@test.dev', isAdmin: true }),
      ),
    ).toBe(true);
  });

  it.each([
    [
      'обычному пользователю',
      { sub: 'user-id', email: 'user@test.dev', isAdmin: false },
    ],
    ['запросу без пользователя', undefined],
  ])('запрещает доступ %s', (_label, user) => {
    expect(() => guard.canActivate(contextFor(user))).toThrow(
      ForbiddenException,
    );
  });
});
