# Interviewly

Сервис технических и мок-интервью: расписание сессий, роли (host / interviewer / candidate), LiveKit-видео, заявки на вход в комнату.

## Стек

- **Monorepo** (pnpm): `apps/backend` (NestJS + Prisma + PostgreSQL), `apps/frontend` (Next.js, FSD: app → views → widgets → features → entities → shared)
- **ESM** везде (`"type": "module"`)
- **Docker Compose**: postgres, livekit, опционально frontend/backend
- **Auth**: JWT (access + refresh)

## Быстрый старт

```bash
cp .env.example .env
pnpm i
pnpm db-dev          # postgres + livekit
pnpm prisma-generate # migrate + seed (из apps/backend)
pnpm back-dev
pnpm front-dev
```

- Backend: http://localhost:4000 (Swagger: `/api`, OpenAPI: `/api-json`)
- Frontend: http://localhost:3000
- LiveKit: `ws://localhost:7880`

Сид-логины: `*@interviewly.test` / `Password123!`

## Backend-конвенции

- Слои: `controller → service → repository → Prisma`
- Внешние SDK: `src/infrastructure/` (например LiveKit)
- Права сессий: `modules/sessions/sessions.permissions.ts`
- Схема Prisma: `prisma/models/*.prisma` + миграции

## Сессии (кратко)

Подробно: [docs/rooms.md](docs/rooms.md).

- `GET /sessions` — только свои (admin — все), без участников
- Участники: `GET /sessions/:id/participants` (host / участники комнаты)
- Вход: заявка → approve хостом → `join` / `livekit-token`
- HOST может быть в нескольких комнатах; INTERVIEWER/CANDIDATE при входе в новую выходят из старой

## Skills

- TypeScript (Claude): `.claude/skills/mastering-typescript/`
- Frontend agent notes: `apps/frontend/CLAUDE.md` / `AGENTS.md`
