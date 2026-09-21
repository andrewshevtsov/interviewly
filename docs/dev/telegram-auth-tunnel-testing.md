# E2E-тестирование Telegram-авторизации через туннель (dev)

Как проверить **настоящий** клик по кнопке «Войти через Telegram» в браузере — с реальным
Telegram-виджетом, реальным ботом и реальным подтверждением в приложении Telegram. Не путать с
[docs/dev/telegram-auth-manual-testing.md](telegram-auth-manual-testing.md) — там про backend-логику
через curl без браузера и без бота вообще; сюда идти, только когда нужно увидеть саму кнопку/попап
или прогнать логин целиком глазами.

Смысл: Telegram Login Widget сверяет домен, на котором его открыли, с доменом, привязанным к боту
через `/setdomain` в BotFather. `localhost` для этого не годится — нужен настоящий домен, отсюда
туннель (ngrok).

## Разовая подготовка

### 1. Dev-бот в Telegram

Не переиспользуйте прод-бота — у него уже привязан прод-домен, а `/setdomain` держит только один
домен одновременно. В чате с `@BotFather`:

```
/newbot
```

- имя — любое, например `Interviewly Dev`;
- username — обязательно заканчивается на `bot`, например `interviewly_dev_bot`.

Сохраните токен, который пришлёт BotFather, и username бота — понадобятся ниже.

### 2. Аккаунт ngrok + статический домен

1. Зарегистрируйтесь на [ngrok.com](https://ngrok.com) и **подтвердите email** — без этого агент
   вообще не стартует (`ERR_NGROK_123: ... email address is verified`).
2. Скопируйте authtoken с [dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken)
   и сохраните его локально:
   ```bash
   ngrok config add-authtoken <ваш-authtoken>
   ```
3. Убедитесь, что версия агента актуальна — free-план требует свежий агент:
   ```bash
   ngrok update
   ```
4. Claim'ните статический домен на [dashboard.ngrok.com/domains](https://dashboard.ngrok.com/domains)
   → «Create Domain» (free-план включает один). Он нужен только для **фронтенда** — домен должен
   быть стабильным, чтобы не переделывать `/setdomain` при каждом перезапуске.
5. В чате с `@BotFather`:
   ```
   /setdomain
   ```
   выбрать dev-бота → вставить домен **без протокола**, например `your-name.ngrok-free.dev`.

## Каждый раз, когда тестируете

Нужны **два** туннеля — не только фронтенд. Бэкенду достаточно случайного домена, он не участвует
в проверке Telegram, но должен быть HTTPS (см. «Mixed content» в troubleshooting ниже). Всего у вас
будет: postgres (Docker), backend (локальный процесс), frontend (dev-сервер), туннель на фронтенд,
туннель на бэкенд.

```bash
# 1. Postgres в Docker, backend вне Docker (проще управлять переменными окружения на лету)
docker compose up -d postgres
docker compose stop backend   # если уже поднят в Docker - иначе конфликт по порту 4000

# 2. Туннель на фронтенд - статический домен из разовой подготовки
ngrok http 3000 --domain=<ваш-статический-домен> &

# 3. Туннель на бэкенд - случайный домен, каждый раз новый, это нормально
ngrok http 4000 &
# посмотреть выданный URL:
curl -s http://127.0.0.1:4041/api/tunnels | grep -o 'https://[a-z0-9.-]*ngrok-free\.app'
```

> Если у вас уже занят порт `4040` (веб-интерфейс инспектора первого агента ngrok), второй агент
> сам переключится на `4041` — оба тоннеля при этом работают, это не ошибка.

```bash
# 4. apps/frontend/.env.local (не коммитится)
cat > apps/frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=https://<домен-бэкенд-туннеля-из-шага-3>
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=<username-dev-бота>
DEV_TUNNEL_ORIGIN=<ваш-статический-домен-из-шага-2>
EOF

# 5. Backend локально, с CORS на домен фронтенд-туннеля и реальным токеном dev-бота
DATABASE_URL="postgresql://interviewly:interviewly@localhost:5432/interviewly?schema=public" \
BACKEND_PORT=4000 \
FRONTEND_URL=https://<ваш-статический-домен-из-шага-2> \
JWT_ACCESS_SECRET=dev-access-secret-change-me JWT_ACCESS_EXPIRES_IN=15m \
JWT_REFRESH_SECRET=dev-refresh-secret-change-me JWT_REFRESH_EXPIRES_IN=7d \
TELEGRAM_BOT_TOKEN=<токен-dev-бота-из-BotFather> \
pnpm --filter backend run start:dev

# 6. Frontend
pnpm --filter frontend run dev
```

Откройте **`https://<ваш-статический-домен>/ru/auth`** — именно через туннель, не `localhost:3000`,
иначе виджет не увидит нужный домен. Кнопка «Войти через Telegram» должна отрисоваться настоящим
виджетом (не заглушкой); клик открывает попап Telegram, после подтверждения — редирект на `/profile`.

## Troubleshooting

Симптомы ниже — реальные грабли, на которые мы наступили по порядку, настраивая это в первый раз.

### `ERR_NGROK_123`: email не подтверждён
Подтвердите почту на [dashboard.ngrok.com/user/settings](https://dashboard.ngrok.com/user/settings).
Если уверены, что подтвердили, но ошибка не уходит — вероятно, локальный authtoken от другого
аккаунта; скопируйте актуальный с `dashboard.ngrok.com/get-started/your-authtoken` и `ngrok config
add-authtoken <token>` заново.

### `ERR_NGROK_121`: версия агента слишком старая
```bash
ngrok update
```
Free-план не обслуживает старые агенты (актуально было для `3.2.2` → `3.39.11`).

### В логе фронтенда: `Blocked cross-origin request to Next.js dev resource`
Next.js dev-сервер по умолчанию блокирует HMR-запросы с чужого origin. Из-за постоянно рвущегося
HMR-соединения виджет ведёт себя нестабильно (может не появиться совсем, хотя код отработал без
ошибок). Нужен `DEV_TUNNEL_ORIGIN` в `.env.local` — уже учтён в [next.config.ts](../../apps/frontend/next.config.ts)
(`allowedDevOrigins`). Если меняли домен туннеля — обновите переменную и **перезапустите** `next dev`
(конфиг читается только при старте).

### Кнопка виджета не появляется, хотя ошибок нет
1. Проверьте, что открыли именно `https://<домен-туннеля>/...`, а не `localhost:3000`.
2. Виджет грузится асинхронно с `telegram.org` — подождите 1-2 секунды после загрузки страницы.
3. Проверьте DOM: `document.querySelector('[data-telegram-login]')` — если скрипта нет вообще,
   значит `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` не задан (виджет-блок в `AuthCard.tsx` тогда вообще не
   рендерится, включая разделитель «или»).

### После клика: «Не удалось войти через Telegram» (mixed content)
Самая частая причина. Frontend открыт по HTTPS (туннель), а `NEXT_PUBLIC_API_URL` указывает на
`http://localhost:4000` — браузер молча блокирует такой запрос как mixed content
(`net::ERR_BLOCKED_BY_CLIENT` в консоли, `Failed to fetch` в JS). Сам факт входа в Telegram при этом
пройдёт успешно (бот пришлёт сообщение) — это часть OAuth-ритуала Telegram, отдельная от того, дошёл
ли запрос до вашего backend. **Решение**: пробросить туннелем и backend тоже (шаг 3 выше) и указать
его HTTPS-адрес в `NEXT_PUBLIC_API_URL`, не `http://localhost:4000`.

### CORS-ошибка `Access-Control-Allow-Origin ... is not equal to the supplied origin`
`FRONTEND_URL`, который видит backend, не совпадает с реальным origin страницы. Проверьте, что
`FRONTEND_URL` при запуске backend — это ровно `https://<домен-фронтенд-туннеля>` (без `/` на конце,
с `https://`), и что вы открываете страницу через тот же домен, а не через `localhost`.

## После тестов

```bash
pkill -f "ngrok http"
docker compose up -d backend   # вернуть обычный docker-режим
rm apps/frontend/.env.local    # если не нужен для следующей сессии
```

`.env.local` в `.gitignore` — можно и оставить между сессиями, домен туннеля бэкенда всё равно
каждый раз новый, а `NEXT_PUBLIC_API_URL` придётся обновлять в любом случае.
