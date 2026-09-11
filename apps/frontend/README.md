# @app/frontend

Next.js (App Router) фронтенд (пакет `apps/frontend`, см.
[docs/architecture](../../docs/architecture/README.md)). `src/*` организован по слоям
Feature-Sliced Design.

## Текущее состояние

- `src/app/` — Next.js App Router (роутинг, `layout.tsx`/`page.tsx`) и точка композиции
  приложения. Пользовательские страницы находятся под динамическим сегментом `[locale]`.
- Слой FSD `pages` называется **`views`** (`src/views/*`), а не `pages` — специально, чтобы не
  совпадать с зарезервированным именем каталога Next.js (`pages/`/`src/pages` = Pages Router).
  Из-за этого не нужно ни выносить `app/` из `src/`, ни заводить пустую папку-заглушку — конфликта
  просто не возникает, потому что каталога `pages` в проекте нет вообще. Подробности и рассмотренные
  альтернативы — в [docs/architecture/adr-fsd-views-vs-pages.md](../../docs/architecture/adr-fsd-views-vs-pages.md).

## Пример роутинга

Демонстрационные роуты (для тех, кто впервые видит связку Next.js App Router + FSD):

```
src/app/
├── layout.tsx                # корневой HTML-layout и I18nProvider
├── page.tsx                  # перенаправление "/" на локализованный URL
├── demo-data.ts              # демонстрационные данные, не часть FSD
└── [locale]/
    ├── layout.tsx            # проверка поддерживаемой locale
    ├── page.tsx              → @/views/home-page             ("/:locale")
    ├── auth/page.tsx         → @/views/auth-page             ("/:locale/auth")
    ├── profile/page.tsx      → @/views/profile-page          ("/:locale/profile")
    └── sessions/
        ├── layout.tsx        # layout секции сессий
        ├── page.tsx          → @/views/sessions-list-page    ("/:locale/sessions")
        └── [sessionId]/
            └── page.tsx      → @/views/interview-session-page
```

Идея: файлы в `app/**` — тонкие "роуты", которые только читают URL/параметры и рендерят
компонент из `src/views/*` (слой FSD). Бизнес-логика и разметка живут в `src/views`, а не в
route-файлах. Внутренние переходы используют `LocalizedLink`, который добавляет текущую locale к
адресу. Устройство интернационализации зафиксировано в
[ADR](../../docs/architecture/adr-frontend-internationalization.md).

## Запуск

```bash
pnpm --filter @app/frontend run dev
# http://localhost:3000/ru
# http://localhost:3000/en
```

## Запуск через Docker

```bash
cp ../../.env.example ../../.env   # из корня репозитория: cp .env.example .env
docker compose up --build          # из корня репозитория
# http://localhost:3000
```

Детали устройства compose-файла — в [docs/deployment.md](../../docs/deployment.md).

## Структура: Feature-Sliced Design

```
src/
├── app/       # инициализация приложения, композиция views (см. также app/ в корне пакета)
├── views/     # конкретные страницы (собирают widgets/features/entities)
├── widgets/   # крупные блоки UI из нескольких features/entities
├── features/  # пользовательские сценарии
├── entities/  # бизнес-сущности (session, user)
└── shared/    # переиспользуемый код без бизнес-логики (lib/, config/)
```

Правило: слой не может импортировать из того, что лежит **выше** него в этом списке
(например, `entities` не может импортировать из `features`). Валидная цепочка импортов —
`app → views → widgets → features → entities → shared`, через алиас `@/*`. Это правило
проверяется линтером (`eslint-plugin-boundaries`, правило `boundaries/dependencies`).

## Переменные окружения

- `PORT` — порт Next.js dev/prod-сервера (по умолчанию `3000`).

## Типы и линт

```bash
pnpm --filter @app/frontend run typecheck
pnpm --filter @app/frontend run lint
```
