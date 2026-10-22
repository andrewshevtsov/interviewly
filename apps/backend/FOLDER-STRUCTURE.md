## Структура проекта

Ниже представлена рекомендуемая структура backend-приложения на NestJS для крупного проекта. Она помогает разделить ответственность между модулями, общими компонентами и инфраструктурой.

```text
apps/
  backend/
    src/
      app.module.ts
      main.ts

      core/
        config/
          app.config.ts
          database.config.ts
          jwt.config.ts
        database/
          database.module.ts
          database.service.ts
        logger/
          logger.module.ts
          logger.service.ts
        health/
          health.controller.ts
          health.module.ts

      common/
        constants/
        decorators/
        filters/
        guards/
        interceptors/
        pipes/
        utils/
        interfaces/

      shared/
        dto/
        enums/
        types/
        validators/
        base/

      modules/
        auth/
          auth.module.ts
          auth.controller.ts
          auth.service.ts
          dto/
          guards/
          strategies/

        users/
          users.module.ts
          users.controller.ts
          users.service.ts
          users.repository.ts
          dto/
          entities/

        interviews/
          interviews.module.ts
          interviews.controller.ts
          interviews.service.ts
          interviews.repository.ts
          dto/
          entities/

        sessions/
          sessions.module.ts
          sessions.controller.ts
          sessions.service.ts
          sessions.repository.ts
          dto/
          entities/

        feedback/
          feedback.module.ts
          feedback.controller.ts
          feedback.service.ts
          feedback.repository.ts
          dto/
          entities/

        companies/
          companies.module.ts
          companies.controller.ts
          companies.service.ts

        notifications/
          notifications.module.ts
          notifications.service.ts

      infrastructure/
        cache/
        email/
        storage/
        queue/
        integrations/

      prisma/
        prisma-client-adapter.ts # общая настройка PostgreSQL-адаптера Prisma
        prisma.module.ts
        prisma.service.ts
        generated/          # Prisma Client; генерируется и не коммитится

      tests/
        e2e/

    prisma/
      schema.prisma         # datasource и generator
      models/               # доменные модели и enum
      migrations/           # история SQL-миграций
      seed.ts               # идемпотентное заполнение локальной БД
      seed-data/            # тестовые пользователи, сессии и участия
    prisma.config.ts        # пути схемы/миграций и DATABASE_URL для Prisma CLI
```

## Описание ключевых директорий

### `core/`

Содержит фундаментальные компоненты приложения: конфигурацию, подключение к БД, логирование, health check и базовые сервисы.

### `common/`

Общие утилиты и инфраструктурные элементы NestJS: guards, interceptors, filters, decorators, pipes, helpers и interfaces. Эти компоненты могут использоваться несколькими модулями.

### `shared/`

Общие типы, enum, DTO, валидаторы и базовые классы, которые используются в разных частях системы.

### `modules/`

Основная бизнес-логика приложения. Каждый модуль отвечает за отдельную предметную область:

- `auth` — авторизация и аутентификация
- `users` — пользователи и профили
- `interviews` — интервью и сценарии
- `sessions` — сессии и комнаты
- `feedback` — отзывы и обратная связь
- `companies` — компании и организации
- `notifications` — уведомления

### `infrastructure/`

Внешние сервисы и интеграции: Redis, почта, хранение файлов, очереди задач, внешние API.

### `prisma/`

Корневая `apps/backend/prisma/` хранит схему и историю миграций PostgreSQL.
`src/prisma/` содержит интеграцию Prisma Client с NestJS; generated-код создаётся командой
`prisma generate` и не хранится в git.

`prisma/seed.ts` заполняет локальную базу тестовыми данными из `prisma/seed-data/`.
Seed использует `upsert`, поэтому повторный запуск не создаёт дубликаты.

### `tests/`

E2E и интеграционные тесты, проверяющие взаимодействие модулей и сервисов.

## Принципы архитектуры

- Каждый модуль отвечает за одну предметную область.
- Контроллер обрабатывает HTTP-запросы.
- Сервисы содержат бизнес-логику.
- Репозитории или PrismaService отвечают за доступ к данным.
- Внешние интеграции выносятся в `infrastructure`.
- Общие компоненты находятся в `common` и `shared`.

## Почему так лучше

Такая структура делает проект:

- масштабируемым;
- проще поддерживаемым;
- удобным для командной разработки;
- понятным для новых разработчиков;
- безопасным с точки зрения разделения ответственности.

## Рекомендация

Для этого проекта рекомендуется придерживаться такой структуры и постепенно добавлять новые модули по доменной модели, а не класть всё в один файл или один модуль.

---

Если хотите, я могу также добавить в README:

- пример `docker-compose.yml` для PostgreSQL;
- описание `Prisma`-схемы;
- таблицу с назначением каждой папки;
- краткую схему архитектуры проекта в формате Mermaid.
