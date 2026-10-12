# Аккаунт: имя, Telegram-ник, email

Блоки «Аккаунт» и «Email» в личном кабинете (`/profile`).

## Имя, фамилия, Telegram-ник

`PATCH /users/me` принимает `firstName`, `lastName`, `telegramUsername`, `timeZone`. Пустая строка в `lastName` и `telegramUsername` очищает поле (в базе `null`). Ник вводится вручную, `@` срезается, формат 5-32 символа `[A-Za-z0-9_]`.

Ник только отображается. Уведомления в Telegram идут по `telegramId`, который задаётся входом через Telegram (`POST /auth/telegram/link`); ручной ввод ника его не меняет.

## Смена email с подтверждением

| Эндпоинт | Доступ | Что делает |
| --- | --- | --- |
| `POST /users/me/email-change` `{ email, password? }` | JWT | Создаёт запрос и шлёт письмо со ссылкой на новый адрес |
| `GET /users/me/email-change` | JWT | `{ pending: { newEmail, expiresAt } \| null }` |
| `DELETE /users/me/email-change` | JWT | Отменяет ожидающую смену |
| `POST /users/email-change/confirm` `{ token }` | без авторизации | Меняет email и ставит `emailVerifiedAt` |

- Пароль обязателен, если он есть у аккаунта (`hasPassword` в `GET /users/me`); неверный пароль - 403. Вошедшие через Telegram пароля не имеют и подтверждают адрес одним письмом.
- Один активный запрос на пользователя: новый заменяет прежний, токен старого письма перестаёт работать. Ссылка живёт 24 часа.
- В базе лежит только sha256 токена (`EmailChangeRequest.tokenHash`).
- Адрес сравнивается без учёта регистра и хранится в нижнем регистре; занятый адрес - 409 (и при запросе, и при подтверждении, если его успели занять). Домен `telegram.interviewly.local` зарезервирован.
- Если письмо не ушло, запрос удаляется и возвращается 503.
- Подтверждение не требует входа: по ссылке можно перейти из другого браузера. Ссылка ведёт на `FRONTEND_URL/confirm-email?token=...`.

В dev письма видны в Mailpit: http://localhost:8025.

## Frontend

`features/edit-account` (имя, фамилия, ник), `features/change-email` (адрес, ожидающая смена, форма), `features/confirm-email` + `views/confirm-email-page` (страница `/confirm-email`). Классификация ошибок и `isPlaceholderEmail` - в `entities/user`.

## Не сделано

- Повторная отправка письма отдельной кнопкой: сейчас нужно заново заполнить форму.
- Лимит частоты запросов письма и попыток пароля.
- Уведомление на старый адрес о смене email.
