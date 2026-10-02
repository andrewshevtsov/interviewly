# Деплой и инфраструктура

## Docker (локальная разработка)

`docker-compose.yml` в корне репозитория поднимает `apps/frontend`, `apps/backend` и
`postgres`:

```bash
cp .env.example .env
docker compose up --build
# frontend: http://localhost:3000
# backend:  http://localhost:4000
```

Исходники пробрасываются в контейнеры bind-mount'ом (`.:/app`) для hot-reload; `node_modules`
защищены от перезаписи именованными volume'ами (`frontend_node_modules`,
`backend_node_modules`).

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

Сервис `backend` при каждом старте контейнера выполняет
`prisma generate && prisma migrate deploy && prisma db seed`, затем запускает
`nest start --watch`. Ручные шаги (`prisma migrate dev`/`generate`/`db seed`) нужны только
при запуске backend локально вне Docker — см. [docs/onboarding.md](onboarding.md).

### Prisma migrations

В локальной разработке используйте `prisma migrate dev`: команда создаёт и применяет
миграции. В production применяются только уже закоммиченные миграции командой
`prisma migrate deploy`; она не изменяет Prisma-схему и не создаёт новую миграцию.

Применённые `migration.sql` не редактируются. Дополнительные изменения базы, включая
PostgreSQL `CHECK`, индексы и триггеры, оформляются следующей миграцией.

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

Затем по SSH скрипт [`infra/deploy/server.sh`](../infra/deploy/server.sh) готовит сервер и
поднимает образ. Пустой сервер он приводит в рабочее состояние сам:

- ставит `git`, `curl` и `ca-certificates`, если их нет (`apt`, `dnf` или `yum`);
- ставит Docker Engine и плагин Compose скриптом `get.docker.com`, если `docker compose` ещё не отвечает;
- клонирует репозиторий в `DEPLOY_PATH` (по умолчанию `/home/<SSH_USER>/interviewly`) или обновляет уже существующий клон;
- если `.env` нет, копирует `.env.example` и подставляет публичный хост вместо `localhost` в URL фронтенда, API и LiveKit;
- в `infra/livekit/livekit.yaml` на сервере заменяет `node_ip: 127.0.0.1` на этот хост, чтобы WebRTC был доступен снаружи;
- поднимает `postgres` и `livekit`;
- для собранного приложения делает `docker login` в GHCR, `docker compose pull` и `up -d --no-build`.

Пользователь SSH должен иметь passwordless sudo: установка пакетов идёт через `sudo -n`.
Имя образа задаётся переменными `FRONTEND_IMAGE` и `BACKEND_IMAGE` в `docker-compose.yml`.
Локально они не заданы, и compose по-прежнему собирает `interviewly-frontend` / `interviewly-backend`.

В GitHub Actions secrets репозитория:

- `SSH_HOST` — хост сервера
- `SSH_USER` — пользователь SSH
- `SSH_KEY` — приватный RSA-ключ, публичная пара которого уже лежит в `authorized_keys` на сервере
- `DEPLOY_PATH` — необязательно, абсолютный путь к клону; иначе `/home/<SSH_USER>/interviewly`

Пакеты GHCR приватные. Токен для `git clone` и `docker login` на сервере — `GITHUB_TOKEN` того же
job. Отдельный PAT не нужен, пока выкладка идёт из этого workflow.
