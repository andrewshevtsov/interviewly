# @app/backend

Минимальный HTTP-бэкенд на встроенном `node:http` (пакет `apps/backend`, NestJS —
зафиксированный технологический выбор, см. [docs/architecture](../../docs/architecture/README.md)).

## Текущее состояние

- `src/main.ts` — HTTP-сервер, отвечает на `GET /health` → `{"status":"ok","service":"backend"}`,
  на остальные пути — текстовая заглушка.
- `src/placeholder.service.ts` — класс с декоратором `@Injectable()` (минимальная
  реализация, без зависимости от `@nestjs/common`), демонстрирует, что декораторы +
  `emitDecoratorMetadata` работают под ESM.

## Запуск

```bash
pnpm --filter @app/backend run dev
# http://localhost:4000/health
```

## Модульная система: ESM + NodeNext

Этот пакет — чистый ESM (`"type": "module"`, `module`/`moduleResolution`: `NodeNext`).
Из этого следует важное практическое правило: **относительные импорты должны указывать
`.js`, даже если реальный файл — `.ts`**:

```ts
// src/main.ts
import { PlaceholderService } from "./placeholder.service.js"; // .js, не .ts!
```

Это не опечатка — так требует спецификация ESM (Node резолвит уже скомпилированный `.js`,
TypeScript только проверяет типы у исходного `.ts`).

## Переменные окружения

- `PORT` — порт HTTP-сервера (по умолчанию `4000`), читается в `src/main.ts`.

## Типы

```bash
pnpm --filter @app/backend run typecheck
```
