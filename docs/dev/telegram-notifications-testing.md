# Проверка Telegram-уведомлений (dev, ngrok)

Единая инструкция: от нуля до проверки всех сценариев. Что именно отправляется - в
[docs/notifications.md](../notifications.md).

Схема: бот шлёт уведомления через очередь (Redis), привязка и вход идут через Telegram Login Widget
(нужен домен, поэтому ngrok), `/start` боту обрабатывает webhook (нужен публичный HTTPS на backend).

## 1. Разовая подготовка

1. **Dev-бот**: `@BotFather` → `/newbot`. Сохраните токен и username (заканчивается на `bot`).
2. **ngrok**: аккаунт с подтверждённой почтой, затем:
   ```bash
   ngrok config add-authtoken <authtoken>   # dashboard.ngrok.com/get-started/your-authtoken
   ngrok update
   ```
3. **Статический домен** для фронта: [dashboard.ngrok.com/domains](https://dashboard.ngrok.com/domains) → Create Domain.
4. **Привязать домен к боту**: `@BotFather` → `/setdomain` → dev-бот → домен без `https://`.
5. База и сид (если ещё не делали):
   ```bash
   cp .env.example .env && pnpm i
   pnpm db-dev            # postgres, livekit, redis, mailpit
   pnpm prisma-generate   # миграции + сид
   ```

## 2. Запуск (каждый раз)

Подставьте свои значения и держите каждую команду в отдельной вкладке терминала.

**Вкладка 1 - туннель фронта** (статический домен):
```bash
ngrok http 3000 --domain=<фронт-домен>
```

**Вкладка 2 - туннель backend** (домен случайный, берём из вывода ngrok, например `https://abc.ngrok-free.app`):
```bash
ngrok http 4000
```
Если порт инспектора 4040 занят, второй агент уйдёт на 4041 - это нормально.

**Вкладка 3 - backend**:
```bash
docker compose stop backend   # если backend поднят в Docker, иначе занят порт 4000
DATABASE_URL="postgresql://interviewly:interviewly@localhost:5432/interviewly?schema=public" \
BACKEND_PORT=4000 \
FRONTEND_URL=https://<фронт-домен> \
JWT_ACCESS_SECRET=dev-access-secret-change-me JWT_ACCESS_EXPIRES_IN=15m \
JWT_REFRESH_SECRET=dev-refresh-secret-change-me JWT_REFRESH_EXPIRES_IN=7d \
TELEGRAM_BOT_TOKEN=<токен-бота> \
TELEGRAM_WEBHOOK_SECRET=<любая-случайная-строка> \
TELEGRAM_WEBHOOK_URL=https://<домен-туннеля-backend>/telegram/webhook \
pnpm --filter @app/backend run start:dev
```
В логе должно быть `Telegram webhook set to ...`. Redis по умолчанию `localhost:6379`, SMTP - Mailpit.

**Вкладка 4 - frontend**:
```bash
cat > apps/frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=https://<домен-туннеля-backend>
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=<username-бота>
DEV_TUNNEL_ORIGIN=<фронт-домен>
EOF
pnpm --filter @app/frontend run dev
```
Формат значений: `NEXT_PUBLIC_API_URL` - `https://` + домен, **без** пути (`/telegram/webhook` нужен только
backend'у); username бота - **без** `@`; `DEV_TUNNEL_ORIGIN` - только хост, **без** `https://`.
`FRONTEND_URL` у backend, наоборот, с `https://` и без `/` в конце.
`.env.local` читается при старте: поменяли домен - перезапустите `next dev`.

> Backend-домен меняется при каждом запуске ngrok, поэтому `TELEGRAM_WEBHOOK_URL` и
> `NEXT_PUBLIC_API_URL` нужно обновлять каждый раз и перезапускать backend и frontend.

Открывайте **только** `https://<фронт-домен>/ru/...`, не `localhost:3000`: иначе виджет не увидит домен бота.

## 3. Проверка

Пароль всех сид-пользователей: `Password123!`. Нужны два аккаунта с включённой витриной:
**А** `interviewer@interviewly.test` (владелец карточки, привяжем Telegram) и
**Б** `candidate@interviewly.test` (откликается, Telegram не привязываем - получит письма).
Б открывайте в окне инкогнито, чтобы сессии не перемешались. Письма - в Mailpit: http://localhost:8025.

### 3.1 Webhook
Напишите боту `/start` из своего Telegram. Ответ - подсказка привязать Telegram на сайте.
Нет ответа - см. «Если не работает».

### 3.2 Привязка
1. Войдите как **А** → `https://<фронт-домен>/ru/profile`.
2. В блоке «Telegram-уведомления» нажмите кнопку Telegram-виджета, подтвердите в приложении.
3. Блок покажет «Telegram привязан @ник» и кнопку «отвязать».

Если у вас уже есть другой аккаунт с этим Telegram: привязка вернёт «уже привязан к другому аккаунту».

### 3.3 Новый отклик → Telegram владельцу
1. **Б** (инкогнито): `/ru/showcase` → карточка А → откликнуться: роль и время через 3+ часа.
2. **А** получает в Telegram сообщение: кто откликнулся, время, роли.

### 3.4 Принятие → письмо откликнувшемуся
1. **А**: `/ru/showcase/responses` → принять отклик.
2. **Б** получает письмо в Mailpit: время, роль, обещание ссылки за 2 часа.

Это же проверка запасного канала: у Б Telegram нет, поэтому письмо.

### 3.5 Напоминание за 2 часа
Время встречи не меньше 3 часов вперёд, ждать неудобно - запустите отложенное задание вручную.
`<sessionId>` - id сессии из ответа на принятие (вкладка Network → `.../accept`) или из `/ru/sessions`:
```bash
cd apps/backend
node --input-type=module -e "
import { Queue } from 'bullmq';
const q = new Queue('notifications', { connection: { host: 'localhost', port: 6379 } });
await (await q.getJob('session-reminder-<sessionId>')).promote();
await q.close();"
```
Ждите: **А** получает ссылку на комнату в Telegram, **Б** - письмо со ссылкой.

### 3.6 Отклонение и отмена
Повторите 3.3, затем:
- **А отклоняет** (причина 30-500 символов) → **Б** получает письмо с причиной.
- Отмена встречи: Б отменяет назначенную встречу (`POST /sessions/:id/cancel`, кнопка на странице
  сессии или Swagger `http://localhost:4000/api`) → **А** получает Telegram об отмене. Тому, кто отменил, ничего не приходит.

### 3.7 Запасной канал при блокировке бота
1. В Telegram заблокируйте бота (Block / Stop bot).
2. Повторите 3.3 для А.
3. Telegram вернёт 403, backend отправит то же сообщение письмом А (Mailpit).

### 3.8 Отвязка
В профиле А нажмите «отвязать» → блок снова показывает виджет; следующие уведомления идут на почту.
Для аккаунта, который вошёл через Telegram и не имеет настоящей почты, отвязка вернёт ошибку «сначала добавьте почту».

## 4. Если не работает

| Симптом | Причина и решение |
|---------|-------------------|
| `ERR_NGROK_123` | почта в ngrok не подтверждена, либо локальный authtoken от другого аккаунта |
| `ERR_NGROK_121` | устаревший агент: `ngrok update` |
| Через ~15 минут выкидывает из аккаунта, `POST /auth/refresh` даёт 401 `Missing refresh token` | известное ограничение схемы с двумя ngrok-доменами: фронт и backend на разных сайтах, кука `SameSite=Lax` не отправляется. Для проверки уведомлений хватает 15 минут; потом войдите заново |
| Виджета нет на странице | открыт `localhost`, а не домен туннеля; не задан `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`; не сделан `/setdomain` |
| «Не удалось войти/привязать», в консоли mixed content | `NEXT_PUBLIC_API_URL` указывает на `http://localhost:4000` вместо HTTPS-туннеля backend |
| CORS-ошибка | `FRONTEND_URL` у backend не равен `https://<фронт-домен>` (без `/` на конце) |
| `Blocked cross-origin request to Next.js dev resource` | не задан `DEV_TUNNEL_ORIGIN` или не перезапущен `next dev` |
| Бот не отвечает на `/start` | в логе backend нет `webhook set` (не заданы `TELEGRAM_WEBHOOK_URL`/`SECRET`); устарел домен туннеля. Проверка: `curl https://api.telegram.org/bot<токен>/getWebhookInfo` - смотрите `url` и `last_error_message` |
| `/start` даёт 401 в инспекторе ngrok (`http://127.0.0.1:4041`) | секрет в `getWebhookInfo` не совпадает с `TELEGRAM_WEBHOOK_SECRET`: перезапустите backend |
| Уведомления не приходят вообще | не поднят Redis (`pnpm db-dev`). Либо задание забрал другой запущенный backend на том же Redis: запускайте с `REDIS_URL=redis://localhost:6379/1` |
| Сообщений в Telegram нет, письмо пришло | бот заблокирован или чата нет (по плану, см. 3.7) |
| Вместо ответа 409 при привязке | этот Telegram уже у другого пользователя: сбросьте `update "User" set "telegramId" = null where "telegramId" = '<id>'` |

## 5. После проверки

```bash
pkill -f "ngrok http"
docker compose up -d backend   # вернуть backend в Docker
rm apps/frontend/.env.local    # домен backend-туннеля всё равно сменится
```
Webhook остаётся у бота на мёртвом домене - это безвредно, при следующем запуске backend заменит его.
