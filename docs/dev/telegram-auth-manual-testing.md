# Ручное тестирование Telegram-авторизации (dev)

Как локально прогнать сценарии `/auth/telegram` и `/auth/telegram/link` без реального
Telegram-бота — просто копируя готовые команды, без ручного пересчёта HMAC-подписи.

Инструкция для локальной разработки. В production все команды ниже вернут `404` — см.
[«Почему это безопасно в проде»](#почему-это-безопасно-в-проде).

Нужно увидеть саму кнопку/попап в браузере или прогнать логин целиком глазами (не только backend) —
см. [docs/dev/telegram-auth-tunnel-testing.md](telegram-auth-tunnel-testing.md), там про
E2E-тестирование через ngrok-туннель с настоящим ботом.

## Как работает

Telegram Login Widget подписывает данные (`id`, `first_name`, `auth_date`, ...) через
HMAC-SHA256 с ключом, производным от токена бота (`TELEGRAM_BOT_TOKEN`). Чтобы не поднимать
настоящего бота и не считать эту подпись руками, в backend есть dev-only эндпоинт
`GET /auth/dev/telegram-sample` — он сам берёт `TELEGRAM_BOT_TOKEN` из конфига (тот же,
которым backend потом проверяет запрос) и отдаёт готовый подписанный JSON, который можно
сразу подставить в `/auth/telegram`.

Реализация: [`AuthDevController`](../../apps/backend/src/modules/auth/auth-dev.controller.ts),
подпись считает [`computeTelegramAuthHash`](../../apps/backend/src/modules/auth/utils/telegram-auth.util.ts).

## Подготовка

```bash
cp .env.example .env   # если .env ещё нет - дефолтный TELEGRAM_BOT_TOKEN подходит
docker compose up -d postgres backend
```

Сервис `backend` сам применяет миграции и сиды при старте контейнера (см.
[docs/onboarding.md](../onboarding.md#запуск-через-docker)) и слушает `http://localhost:4000`.
Дальше все команды копируются как есть.

> Если вместо этого хотите запускать backend локально (`pnpm --filter backend run start:dev`,
> вне Docker) — учтите, что `DATABASE_URL` в `.env` по умолчанию указывает на хост `postgres`
> (имя сервиса в docker-сети), который резолвится только из контейнеров. Для локального запуска
> вне Docker его нужно переопределить на `localhost`, например: `DATABASE_URL=postgresql://interviewly:interviewly@localhost:5432/interviewly?schema=public`.

## Сценарии

### 1. Логин через Telegram создаёт нового пользователя

```bash
curl -i -X POST http://localhost:4000/auth/telegram \
  -H "Content-Type: application/json" \
  -d "$(curl -s http://localhost:4000/auth/dev/telegram-sample)"
```

Ожидается `200`, в теле `{"accessToken": "..."}`, в заголовках `Set-Cookie: refreshToken=...; HttpOnly`.

### 2. Повторный логин с тем же Telegram-аккаунтом не плодит дубликат

Выполните команду из шага 1 ещё раз (у `/auth/dev/telegram-sample` без параметров всегда один
и тот же `id`) — `sub` внутри `accessToken` должен совпасть с предыдущим разом. Проверить в БД:

```bash
docker compose exec -T postgres psql -U interviewly -d interviewly -c \
  'select id, email, "telegramId", "registrationCompleted" from "User" where "telegramId" is not null;'
```

Должна быть ровно одна строка, `email` вида `tg-555666777@telegram.interviewly.local`,
`registrationCompleted = f` (у Telegram-логина нет email/пароля, профиль нужно дозаполнить).

### 3. Невалидная подпись отклоняется

```bash
curl -i -X POST http://localhost:4000/auth/telegram \
  -H "Content-Type: application/json" \
  -d '{"id":1,"first_name":"X","auth_date":9999999999,"hash":"deadbeef"}'
```

Ожидается `401 {"message":"Invalid Telegram authentication data"}`.

### 4. Просроченные данные виджета отклоняются

`?authDateOffsetSeconds=-172800` сдвигает `auth_date` на 2 дня назад (лимит свежести —
`TELEGRAM_AUTH_MAX_AGE_SECONDS` = 24 часа, см. `auth.constants.ts`):

```bash
curl -i -X POST http://localhost:4000/auth/telegram \
  -H "Content-Type: application/json" \
  -d "$(curl -s "http://localhost:4000/auth/dev/telegram-sample?authDateOffsetSeconds=-172800")"
```

Ожидается `401 {"message":"Telegram authentication data has expired"}`.

### 5. Привязка Telegram к уже существующему аккаунту (email/пароль)

```bash
# 1. Обычная регистрация, сохраняем accessToken в переменную
ACCESS=$(curl -s -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"manual-test@example.com","password":"P@ssw0rd123","firstName":"Manual"}' \
  | node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>console.log(JSON.parse(d).accessToken))')

# 2. Привязка нового Telegram-id (другого, чем в шаге 1) -> 200
curl -i -X POST http://localhost:4000/auth/telegram/link \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ACCESS" \
  -d "$(curl -s "http://localhost:4000/auth/dev/telegram-sample?id=111222333")"

# 3. Привязка Telegram-id из шага 1 (уже занят другим пользователем) -> 409
curl -i -X POST http://localhost:4000/auth/telegram/link \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ACCESS" \
  -d "$(curl -s http://localhost:4000/auth/dev/telegram-sample)"

# 4. Без токена -> 401
curl -i -X POST http://localhost:4000/auth/telegram/link \
  -H "Content-Type: application/json" \
  -d "$(curl -s http://localhost:4000/auth/dev/telegram-sample)"
```

## После тестов

```bash
docker compose exec -T postgres psql -U interviewly -d interviewly -c \
  "delete from \"User\" where email like 'tg-%@telegram.interviewly.local' or email = 'manual-test@example.com';"
```

## Почему это безопасно в проде

- `GET /auth/dev/telegram-sample` закрыт [`DevOnlyGuard`](../../apps/backend/src/modules/auth/guards/dev-only.guard.ts):
  при `NODE_ENV=production` отдаёт `404` (не `403` — чтобы не подтверждать сам факт
  существования роута), при любом другом (включая пустой, как в текущем dev-compose,
  где `NODE_ENV` нигде явно не выставлен) — работает.
- Контроллер помечен `@ApiExcludeController()` — не попадает в Swagger (`/api`) ни в каком
  окружении, это просто внутренний dev-инструмент, а не часть публичного API.
- `TELEGRAM_BOT_TOKEN` никогда не покидает backend: наружу через этот эндпоинт уходит только
  готовый подписанный payload, а не сам токен.
