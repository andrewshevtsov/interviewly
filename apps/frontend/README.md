# @app/frontend

Минимальный HTTP-фронтенд на встроенном `node:http` (пакет `apps/frontend`, Next.js —
зафиксированный технологический выбор, см. [docs/architecture](../../docs/architecture/README.md)).
`src/*` организован по слоям Feature-Sliced Design.

## Текущее состояние

- `dev-server.ts` — HTTP-сервер в корне пакета (не часть FSD-структуры `src/*`), отвечает на
  `GET /health` → `{"status":"ok","service":"frontend"}`, на остальные пути — HTML-заглушку.

## Запуск

```bash
pnpm --filter @app/frontend run dev
# http://localhost:3000
```

## Запуск через Docker

```bash
cp ../../.env.example ../../.env   # из корня репозитория: cp .env.example .env
docker compose up --build          # из корня репозитория
# http://localhost:3000/health
```

Детали устройства compose-файла — в [docs/deployment.md](../../docs/deployment.md).

## Структура: Feature-Sliced Design

```
src/
├── app/       # инициализация приложения, композиция pages
├── pages/     # конкретные страницы (собирают widgets/features/entities)
├── widgets/   # крупные блоки UI из нескольких features/entities
├── features/  # пользовательские сценарии
├── entities/  # бизнес-сущности (session, user)
└── shared/    # переиспользуемый код без бизнес-логики (lib/, config/)
```

Правило: слой не может импортировать из того, что лежит **выше** него в этом списке
(например, `entities` не может импортировать из `features`). Валидная цепочка импортов —
`app → pages → widgets → features → entities → shared`, через алиас `@/*`.

## Переменные окружения

- `PORT` — порт dev-сервера (по умолчанию `3000`), читается в `dev-server.ts`.

## Типы

```bash
pnpm --filter @app/frontend run typecheck
```
