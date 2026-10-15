# Деплой и инфраструктура

## Docker (локальная разработка)

`docker-compose.yml` в корне репозитория поднимает frontend, backend, collaboration,
coderunner, Piston, PostgreSQL и LiveKit:

```bash
cp .env.example .env
docker compose up -d --build
# frontend: http://localhost:3000
# backend:  http://localhost:4000
# coderunner: http://localhost:3003
```

Исходники пробрасываются в контейнеры bind-mount'ом (`.:/app`) для hot-reload; `node_modules`
защищены от перезаписи именованными volume'ами (`frontend_node_modules`,
`backend_node_modules`, `collaboration_node_modules`, `coderunner_node_modules`).

### Coderunner и Piston

`coderunner` принимает код напрямую от frontend, передаёт JWT основному backend для
проверки участия пользователя в сессии и только после успешной проверки вызывает Piston
по внутреннему адресу `http://piston:2000`.

При первом старте одноразовый `piston-init` устанавливает зафиксированные runtime Python,
JavaScript и TypeScript. Они сохраняются в `piston_data`, поэтому повторно не скачиваются.
Статус `Exited (0)` у `piston-init` после запуска — ожидаемое успешное состояние.

### Production override

На сервере скрипт деплоя поднимает стек так:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

`docker-compose.prod.yml` снимает bind-mount и именованные `node_modules`, запускает
`next start` / `nest start:prod` / collaboration `start`. Код и зависимости — из образа
(GHCR), а не с диска хоста.

### Postgres

Сервис `postgres` (`postgres:17-alpine`) поднимается вместе с остальными:

- Порт проброшен на хост как `${POSTGRES_PORT:-5432}`, но `backend`, запущенный в Docker,
  подключается к `postgres` по имени сервиса внутри сети `interviewly-network` (`DATABASE_URL`
  в `.env` указывает на хост `postgres`, а не `localhost`). Все три сервиса (`postgres`,
  `backend`, `frontend`) должны быть в одной сети `interviewly-network` — иначе backend не
  сможет разрезолвить хост `postgres` (ошибка Prisma `P1001: Can't reach database server`).
- Данные сохраняются в именованном volume `postgres_data` — переживают `docker compose down`
  (но не `docker compose down -v`).
- Есть healthcheck (`pg_isready`); `backend` стартует только после того, как `postgres`
  становится healthy (`depends_on: { condition: service_healthy }`).

### Backend

Локально (этот compose): `prisma generate && migrate deploy && db seed`, затем
`nest start --watch`. В production-образе и prod-override: `migrate deploy && db seed &&
start:prod` (собранный `dist/`). Ручные шаги (`prisma migrate dev`/`generate`/`db seed`)
нужны только при запуске backend локально вне Docker — см. [docs/onboarding.md](onboarding.md).

### Prisma migrations

В локальной разработке используйте `prisma migrate dev`: команда создаёт и применяет
миграции. В production применяются только уже закоммиченные миграции командой
`prisma migrate deploy`; она не изменяет Prisma-схему и не создаёт новую миграцию.

Применённые `migration.sql` не редактируются. Дополнительные изменения базы, включая
PostgreSQL `CHECK`, индексы и триггеры, оформляются следующей миграцией.

### HTTPS / WSS (Caddy)

Шаблон: [`infra/caddy/Caddyfile`](../infra/caddy/Caddyfile). На https-сайте браузер
блокирует `ws://` (mixed content), поэтому в проде:

| Назначение | URL |
| --- | --- |
| API | `https://<домен>/api` |
| LiveKit signaling | `wss://livekit.<домен>` → `:7880` |
| Collaboration | `wss://collaboration.<домен>` → `:1234` |

RTC (UDP/TCP 7881/7882) идёт на публичный IP хоста (`node_ip` в livekit.yaml), не через
прокси. DNS для `livekit` обычно **DNS only**; `collaboration` может быть proxied.

`server.sh` копирует Caddyfile в `~/interviewly-caddy` (рядом с клоном) и делает reload
контейнера `caddy`, если он есть. Нужны Origin CA (или LE) и A-записи для поддоменов.

## CI/CD

Пайплайн: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml). Он запускается на pull request
в `dev` и на push в `dev` (в том числе merge). Отдельные долгоживущие ветки `frontend` и `backend`
не нужны.

На каждом запуске считается diff от базы pull request или от предыдущего коммита `dev` до `HEAD`.
По изменённым путям выбирается приложение:

| Пути | Что запускается |
| --- | --- |
| `apps/frontend/**` | typecheck и eslint frontend, на push в `dev` — образ frontend |
| `apps/backend/**` | typecheck и eslint backend, на push в `dev` — образ backend |
| `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.npmrc`, `patches/**` | оба приложения |

Проверки в CI: `pnpm --filter @app/frontend run typecheck`, eslint frontend без `--fix`,
`pnpm --filter @app/backend run typecheck`, eslint backend без `--fix`.

CD после успешных проверок собирает только затронутый Dockerfile и пушит образ в GHCR:

- `ghcr.io/<owner>/interviewly-frontend:<sha>` и тег `dev`
- `ghcr.io/<owner>/interviewly-backend:<sha>` и тег `dev`

Frontend build-args: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_COLLABORATION_URL`
(переменные репозитория `vars.*` или дефолты для `interviewly.top`).

Затем по SSH скрипт [`infra/deploy/server.sh`](../infra/deploy/server.sh) готовит сервер и
поднимает образ. Пустой сервер он приводит в рабочее состояние сам:

- ставит `git`, `curl` и `ca-certificates`, если их нет (`apt`, `dnf` или `yum`);
- ставит Docker Engine и плагин Compose скриптом `get.docker.com`, если `docker compose` ещё не отвечает;
- клонирует репозиторий в `DEPLOY_PATH` (по умолчанию `/home/<SSH_USER>/interviewly`) или обновляет уже существующий клон;
- пишет/обновляет публичные URL в `.env` (`https` / `wss://livekit.` / `wss://collaboration.`);
- синхронизирует Caddyfile;
- в `infra/livekit/livekit.yaml` на сервере заменяет `node_ip: 127.0.0.1` на публичный IP origin;
- поднимает `postgres`, `livekit`, `collaboration` (prod-compose, без bind-mount);
- для frontend/backend: `docker login` в GHCR, `pull` и `up -d --no-build --force-recreate`.

Если Docker, git и curl уже есть и пользователь входит в группу `docker`, sudo не нужен.
Passwordless sudo требуется только когда этих пакетов нет и их надо доустановить.
Имя образа задаётся переменными `FRONTEND_IMAGE` и `BACKEND_IMAGE` в `docker-compose.yml`.
Локально они не заданы, и compose по-прежнему собирает `interviewly-frontend` / `interviewly-backend`.

В GitHub Actions secrets репозитория:

- `SSH_HOST` — хост сервера
- `SSH_USER` — пользователь SSH
- `SSH_KEY` — приватный RSA-ключ, публичная пара которого уже лежит в `authorized_keys` на сервере
- `DEPLOY_PATH` — необязательно, абсолютный путь к клону; иначе `/home/<SSH_USER>/interviewly`

Пакеты GHCR приватные. Токен для `git clone` и `docker login` на сервере — `GITHUB_TOKEN` того же
job. Отдельный PAT не нужен, пока выкладка идёт из этого workflow.
