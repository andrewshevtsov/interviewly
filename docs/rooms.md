# Комнаты (Sessions + LiveKit)

Документ фиксирует текущую логику комнат интервью: роли, права, заявки, LiveKit и проверка через Postman / Meet.

Исходники прав: [`apps/backend/src/modules/sessions/sessions.permissions.ts`](../apps/backend/src/modules/sessions/sessions.permissions.ts).  
Runtime-матрица: `GET /sessions/permissions`.

---

## Модель

| Сущность | Назначение |
|----------|------------|
| `Session` | Комната в БД: owner, `access`, `status`, `livekitRoomName` |
| `SessionParticipant` | Принятый участник (`HOST` / `INTERVIEWER` / `CANDIDATE`) |
| `SessionAccessRequest` | Заявка на вход (`PENDING` → approve/reject) |

- При `POST /sessions` создатель становится **HOST**.
- `livekitRoomName` по умолчанию = `session.id` (отдельное поле на будущее).
- Видео идёт через **LiveKit SFU**; backend только выдаёт participant JWT.

### Типы доступа (`SessionAccess`)

| access | Как попасть |
|--------|-------------|
| `OPEN` | Заявка → approve хостом |
| `PASSWORD` | Заявка с паролем → approve |
| `INVITE` | Заявку подать нельзя; нужно уже быть в participants |

### Статусы сессии

`DRAFT` → `SCHEDULED` → `READY` → `ACTIVE` → `COMPLETED` / `CANCELLED` / `EXPIRED`

Закрытые (`COMPLETED` / `CANCELLED` / `EXPIRED`) — join и заявки запрещены.  
LiveKit-token — только для `SCHEDULED` / `READY` / `ACTIVE`.

---

## Роли

| Роль | Кто обычно | Сколько активных комнат |
|------|------------|-------------------------|
| **HOST** | Создатель / владелец | Несколько (не выкидывается при входе в другую) |
| **INTERVIEWER** | Проводящий интервью | Одна: вход в новую → выход из старой |
| **CANDIDATE** | Кандидат | Одна: вход в новую → выход из старой |
| **admin** (`isAdmin` в JWT) | Глобальный админ | Видит все сессии; может смотреть заявки/участников |

При смене комнаты у INTERVIEWER/CANDIDATE: `leftAt` в БД + `removeParticipant` в LiveKit. HOST-участия в других комнатах не трогаются.

---

## Кто что может

| Действие | HOST | INTERVIEWER | CANDIDATE | Автор pending-заявки | Admin |
|----------|:----:|:-----------:|:---------:|:--------------------:|:-----:|
| `GET /sessions` (свои) | ✅ | ✅ | ✅ | ✅ | все |
| `GET /sessions/:id` (карточка без участников) | ✅ | ✅ | ✅ | ✅ | ✅ |
| `GET /sessions/:id/participants` (список + count) | ✅ | ✅ | ✅ | ❌ | ✅ |
| Подать `access-request` (OPEN/PASSWORD) | — | если ещё не участник | если ещё не участник | — | — |
| Смотреть / approve / reject заявки | ✅ | ❌ | ❌ | ❌ | ✅ |
| `join` / `livekit-token` | ✅ | ✅ | ✅ | ❌ пока не approved | ❌* |

\* Admin **не** получает LiveKit-token только из-за isAdmin — нужен статус участника.

Карточка сессии **никогда** не отдаёт `participants` и `passwordHash`. Состав комнаты — только отдельный endpoint.

---

## Флоу входа

```text
POST /auth/login → Bearer
        │
        ▼
не участник + OPEN/PASSWORD
        │
        ▼
POST /sessions/:id/access-requests
        │
        ▼
HOST: GET …/access-requests
      POST …/access-requests/:requestId/approve | reject
        │ (approve → запись в SessionParticipant)
        ▼
POST /sessions/:id/join          (опционально, «вошёл»)
POST /sessions/:id/livekit-token → { serverUrl, roomName, token }
        │
        ▼
клиент LiveKit (Meet / frontend SDK)
```

INVITE: шаг с заявкой пропускается, если пользователь уже в participants (сид или `participants` при create).

---

## API (кратко)

| Метод | Путь | Заметка |
|-------|------|---------|
| GET | `/sessions/permissions` | Матрица прав |
| POST | `/sessions` | Создать; ты = HOST |
| GET | `/sessions` | Фильтр по пользователю |
| GET | `/sessions/:id` | Без участников |
| GET | `/sessions/:id/participants` | count + список |
| POST | `/sessions/:id/access-requests` | Заявка |
| GET | `/sessions/:id/access-requests` | Только HOST/admin |
| POST | `/sessions/:id/access-requests/:requestId/approve` | HOST |
| POST | `/sessions/:id/access-requests/:requestId/reject` | HOST |
| POST | `/sessions/:id/join` | Уже участник |
| POST | `/sessions/:id/livekit-token` | JWT для SFU |

Все маршруты (кроме будущих публичных) — `Authorization: Bearer <accessToken>`.

---

## Безопасность

1. **JWT** на всех session-эндпоинтах.
2. **Список сессий** не глобальный (кроме admin).
3. **Участники и count** скрыты от посторонних.
4. **Вход в медиа** только после accept (или pre-invite).
5. **Заявки** принимает только HOST (или admin).
6. **PASSWORD**: проверка при создании заявки (и при join).
7. **INVITE**: чужой не может сам себя добавить через заявку.
8. **Одна активная комната** для INTERVIEWER/CANDIDATE.
9. **API key/secret LiveKit** только на backend; в браузер уходит лишь participant token.
10. Права централизованы в `sessions.permissions.ts` (`satisfies` + `roleAllowed`, без `as`-кастов).

Не реализовано (осознанно пока): WS/push «пришла заявка», Nest-уведомления хосту, mute UI, HTTPS для удалённых устройств.

---

## Запуск LiveKit

```bash
cp .env.example .env   # если ещё нет
pnpm db-dev            # postgres + livekit
# в .env для локального backend: DATABASE_URL с localhost (не postgres)
cd apps/backend && pnpm exec prisma migrate deploy && pnpm exec prisma db seed
pnpm back-dev
```

- Signaling: `ws://localhost:7880` (порты RTC: 7881 TCP, 7882 UDP)
- Конфиг SFU: [`infra/livekit/livekit.yaml`](../infra/livekit/livekit.yaml)
- Ключи в `.env` (`LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET`) **должны совпадать** с `keys` в yaml (секрет ≥ 32 символов)

Сид-пользователи: `owner@` / `interviewer@` / `candidate@` / `admin@interviewly.test`, пароль `Password123!`.  
Активная OPEN-сессия для тестов: `00000000-0000-4000-8000-000000000102`.

После `POST /sessions/:id/livekit-token` открой Meet с query-параметрами (голый `/custom` без них покажет «Missing LiveKit URL»):

```text
https://meet.livekit.io/custom?liveKitUrl=ws%3A%2F%2Flocalhost%3A7880&token=<JWT_ИЗ_ОТВЕТА>
```

`<JWT_ИЗ_ОТВЕТА>` — поле `token` из JSON. Два участника = два окна / инкогнито с разными token на ту же комнату.

HTTPS Meet → `ws://localhost` иногда режется mixed content; тогда [example.livekit.io](https://example.livekit.io) или локальная страница по `http://localhost`.

---

## Тест: Postman

1. Import OpenAPI: http://localhost:4000/api-json (Swagger UI: `/api`).
2. `POST /auth/login` → сохранить `accessToken` в Bearer.
3. `GET /sessions/permissions`, `GET /sessions`.
4. Кандидатом: `POST /sessions/…102/access-requests` body `{}`.
5. Хостом сессии (interviewer на `…102`): `GET …/access-requests` → `…/approve`.
6. Кандидатом: `POST …/join` → `POST …/livekit-token`.
7. Проверить JWT: `video.room` == `livekitRoomName`, `iss` == `devkey`.
8. `GET …/participants` — видят host и участники; посторонний — 403.

Postman **не** поднимает WebRTC — только HTTP и JWT.

---

## Тест: LiveKit Meet (видео)

1. `POST …/livekit-token` → `{ serverUrl, roomName, token }`.
2. Ссылка из раздела [Запуск LiveKit](#запуск-livekit) (подставь свой `token`).
3. Либо [meet.livekit.io](https://meet.livekit.io) → Custom → URL `ws://localhost:7880` + token.
4. Второй пользователь — отдельное окно с своим token, та же `roomName`.

---

## Карта файлов

| Путь | Роль |
|------|------|
| `modules/sessions/*` | HTTP, бизнес-логика, права |
| `infrastructure/livekit/*` | AccessToken + RoomServiceClient |
| `prisma/models/session.prisma` | Session / Participant / AccessRequest |
| `infra/livekit/livekit.yaml` | Self-hosted SFU |
| `docker-compose.yml` | сервис `livekit` |
| `.env.example` | `LIVEKIT_*` + подсказки Postman |
