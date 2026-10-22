import { describe, expect, it } from 'vitest';
import { parseRedisUrl } from './redis-connection.ts';

describe('parseRedisUrl', () => {
  it('разбирает хост и порт, база по умолчанию 0', () => {
    expect(parseRedisUrl('redis://localhost:6380')).toMatchObject({ host: 'localhost', port: 6380, db: 0 });
  });

  it('порт по умолчанию 6379', () => {
    expect(parseRedisUrl('redis://redis')).toMatchObject({ host: 'redis', port: 6379 });
  });

  it('читает пароль, пользователя и номер базы, в том числе с экранированием', () => {
    expect(parseRedisUrl('redis://app:p%40ss@host:6379/2')).toMatchObject({
      username: 'app',
      password: 'p@ss',
      db: 2,
    });
  });

  it('rediss:// включает TLS', () => {
    expect(parseRedisUrl('rediss://host').tls).toEqual({});
    expect(parseRedisUrl('redis://host').tls).toBeUndefined();
  });

  it('отклоняет чужую схему понятной ошибкой', () => {
    expect(() => parseRedisUrl('http://host')).toThrow('REDIS_URL must start with redis://');
  });
});
