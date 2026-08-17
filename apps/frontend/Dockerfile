# Dev-образ frontend. apps/backend/package.json копируется ниже,
# несмотря на то что у backend сейчас нет своего Dockerfile (докер для
# backend сюда пока не входит) — pnpm workspace должен видеть
# package.json ВСЕХ пакетов, чтобы `pnpm install` разрешил зависимости
# корректно, иначе он упадёт с ошибкой "workspace package not found".
# Когда появится Next.js app, этот файл, скорее всего, придётся
# дополнить шагом сборки (`next build`) для продакшен-варианта — для чистого
# dev-режима (`next dev`) структура ниже останется актуальной.

FROM node:22-alpine

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json

RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["pnpm", "--filter", "@app/frontend", "run", "dev"]
