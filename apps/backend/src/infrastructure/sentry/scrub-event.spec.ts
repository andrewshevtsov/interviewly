import type { ErrorEvent } from '@sentry/nestjs';
import { describe, expect, it } from 'vitest';
import { scrubEvent } from './scrub-event.ts';

describe('scrubEvent', () => {
  it('убирает тело запроса, cookie, query string и заголовки авторизации', () => {
    const event = {
      type: undefined,
      request: {
        url: 'https://interviewly.top/api/auth/login',
        method: 'POST',
        data: { email: 'a@b.c', password: 'secret' },
        cookies: { refreshToken: 'token' },
        query_string: 'token=abc',
        headers: { Authorization: 'Bearer x', Cookie: 'a=b', 'User-Agent': 'curl' },
      },
      user: { id: '1', email: 'a@b.c', ip_address: '1.2.3.4' },
    } as ErrorEvent;

    const result = scrubEvent(event);

    expect(result.request).toEqual({
      url: 'https://interviewly.top/api/auth/login',
      method: 'POST',
      headers: { 'User-Agent': 'curl' },
    });
    expect(result.user).toBeUndefined();
  });

  it('не падает на событии без запроса', () => {
    const event = { type: undefined, message: 'boom' } as ErrorEvent;

    expect(scrubEvent(event)).toEqual({ type: undefined, message: 'boom' });
  });
});
