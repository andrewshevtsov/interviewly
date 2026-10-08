const DEFAULT_REDIS_PORT = 6379;

/** BullMQ принимает параметры подключения: разбираем `redis://[:пароль@]хост[:порт][/база]` */
export function parseRedisUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== 'redis:' && url.protocol !== 'rediss:') {
    throw new Error(`REDIS_URL must start with redis:// or rediss://, got "${url.protocol}//"`);
  }

  const database = Number(url.pathname.slice(1));
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : DEFAULT_REDIS_PORT,
    username: url.username ? decodeURIComponent(url.username) : undefined,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    db: Number.isInteger(database) ? database : 0,
    tls: url.protocol === 'rediss:' ? {} : undefined,
  };
}
