# Почему эта папка пустая

Next.js резолвит директорию Pages Router независимо от App Router: он ищет
`pages/`, и только если её нет — `src/pages/`. У нас уже есть `src/pages` —
это слой FSD (см. [../README.md](../README.md)), а не Next.js Pages Router,
и файлы там не являются React-компонентами с default export.

Эта пустая папка "занимает" `pages/` в корне, поэтому Next.js останавливается
на ней и никогда не заглядывает в `src/pages`. Роутинг полностью на App
Router, см. [`../app`](../app).

Не удаляйте эту папку (и не добавляйте в неё файлы) — иначе `next build`
начнёт падать с ошибкой "pages without a React Component as default export"
на файлах слоя FSD `src/pages/**`.
