# LiveKit + CodeMirror + Yjs experiment

Изолированный proof of concept интервью-сессии в одном браузерном окне:

- LiveKit передаёт аудио и видео
- CodeMirror 6 предоставляет редактор JavaScript
- Yjs объединяет одновременные изменения документа
- `y-websocket` передаёт Yjs updates и положение курсоров между браузерами

Эксперимент не подключён к основному frontend-приложению и имеет собственные `package.json`,
`pnpm-lock.yaml` и `node_modules`.

## Важные ограничения

Yjs использует публичный демонстрационный сервер `wss://demos.yjs.dev/ws`. Не вводите в редактор рабочий, приватный или чувствительный код. Имя Yjs-документа сейчас зафиксировано в `editor.js` как `interviewly-yjs-experiment`: все открывшие эксперимент с этим именем попадут
в один общий документ.

Development token server LiveKit также предназначен только для разработки. Пока он включён, клиент может запросить токен с тестовыми разрешениями без backend-аутентификации. После эксперимента его следует отключить.

## Требования

- Node.js 22 или новее
- pnpm 11
- аккаунт и тестовый проект в LiveKit Cloud
- два браузера, например Chrome и Safari или режим инкогнито

## 1. Установка зависимостей

Из корня репозитория:

```bash
cd experiments/livekit-codemirror
pnpm --ignore-workspace install
```

Флаг `--ignore-workspace` оставляет эксперимент независимым от корневого workspace.

## 2. Сборка редактора

```bash
pnpm run build
```

Команда собирает CodeMirror, Yjs, `y-codemirror.next` и `y-websocket` из `editor.js` в один браузерный файл `editor.bundle.js`. После каждого изменения `editor.js` сборку нужно повторить.

## 3. Запуск локальной страницы

```bash
pnpm run dev
```

Ожидаемый вывод:

```text
LiveKit + CodeMirror experiment: http://localhost:4173
```

Откройте [http://localhost:4173](http://localhost:4173). Терминал с сервером нужно оставить работающим. Для остановки нажмите `Control + C`.

В DevTools Console должны появиться сообщения:

```text
Yjs WebSocket: connected
Yjs synchronized: true
```

Если браузер показывает старую версию страницы, выполните полное обновление через
`Command + Shift + R`.

## 4. Создание проекта LiveKit Cloud

1. Войдите в [LiveKit Cloud](https://cloud.livekit.io/) и создайте тестовый проект.
2. Откройте `Settings → Project → General → Раздел Options`.
3. Найдите `Development token server` и включите переключатель.
4. Скопируйте появившийся `Token server ID`.

`Token server ID` — не Project URL. Нельзя составлять адрес вида
`wss://<token-server-id>.livekit.cloud`: LiveKit вернёт ошибку `invalid API key for domain`. Ни API Secret, ни API Key для этого эксперимента в браузер вводить не нужно.

## 5. Получение URL и participant token

Откройте DevTools на странице эксперимента:

Выполните сниппет в консоли, заменив `<TOKEN_SERVER_ID>` на Token server ID из LiveKit Cloud.

```js
(async () => {
  const tokenSource = LivekitClient.TokenSource.developmentTokenServer("<TOKEN_SERVER_ID>");
  const credentials = await tokenSource.fetch({
    roomName: "interview-test",
  });

  document.querySelector("#url").value = credentials.serverUrl;
  document.querySelector("#token").value = credentials.participantToken;

  console.log("LiveKit credentials inserted");
})();
```

Сниппет запрашивает временные credentials и автоматически заполняет правильные поля:

- `LiveKit URL` получает настоящий `credentials.serverUrl`
- `Participant token` получает новый `credentials.participantToken`

После обновления страницы credentials исчезнут, и сниппет нужно будет выполнить заново. Если токен истёк, также получите новый запуском сниппета.

## 6. Подключение первого участника

1. Нажмите `Connect`
2. Разрешите браузеру использовать камеру и микрофон
3. Дождитесь статуса `connected · interview-test`
4. Слева должно появиться локальное видео, справа — совместный редактор

## 7. Подключение второго участника

1. Откройте [http://localhost:4173](http://localhost:4173) во втором браузере или в режиме инкогнито.
2. Выполните в его Console тот же сниппет с тем же `Token server ID` и `roomName`.
3. Нажмите `Connect` и разрешите камеру и микрофон.

Каждый запуск `fetch` создаёт отдельные временные credentials. Не используйте один participant token одновременно в двух браузерах: одинаковая identity может вытеснить первое подключение.

После подключения проверьте:

- оба браузера показывают аудио- и видеопотоки
- изменения кода появляются во втором редакторе в обе стороны
- отображается цветной курсор другого участника
- одновременный ввод не приводит к потере символов

Чтобы избежать акустического эха, используйте наушники или отключите воспроизведение медиа в одном из браузеров. 

## Проверка только Yjs

LiveKit подключать необязательно, если нужно проверить только совместное редактирование.
Откройте страницу в двух браузерах и начните печатать. Оба экземпляра используют одинаковый `documentId`, поэтому текст и курсоры должны синхронизироваться через публичный WebSocket.

## Что здесь является временным

- публичный Yjs WebSocket нужно заменить собственным авторизованным provider
- `documentId` нужно формировать из ID интервью, а не хранить константой
- состояние Y.Doc пока не сохраняется в базе данных
- LiveKit development token server нужно заменить backend token endpoint
- в интерфейсе пока нет кнопок mute/unmute для камеры и микрофона
- для открытия именно этой страницы с другого компьютера потребуется HTTPS, поскольку браузеры блокируют камеру и микрофон на обычном LAN HTTP-адресе.

## Завершение эксперимента

1. Остановите локальный сервер через `Control + C`.
2. В LiveKit Cloud откройте `Settings → Project`.
3. Отключите `Development token server`, если он больше не используется.
