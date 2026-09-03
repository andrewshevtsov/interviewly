# Dev-образ frontend. apps/backend/package.json копируется ниже,
# несмотря на то что у backend сейчас нет своего Dockerfile (докер для
# backend сюда пока не входит) — pnpm workspace должен видеть
# package.json ВСЕХ пакетов, чтобы `pnpm install` разрешил зависимости
# корректно, иначе он упадёт с ошибкой "workspace package not found".
# Когда появится Next.js app, этот файл, скорее всего, придётся
# дополнить шагом сборки (`next build`) для продакшен-варианта — для чистого
# dev-режима (`next dev`) структура ниже останется актуальной.

FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@11.21.0 --activate


WORKDIR /app
ENV CI=true

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/frontend/package.json ./apps/frontend/package.json

RUN pnpm config set fetch-timeout 500000 && \
    pnpm config set fetch-retry-mintimeout 100000 && \
    pnpm config set fetch-retry-maxtimeout 500000
RUN pnpm install --frozen-lockfile


COPY . .

EXPOSE 3000

CMD [ "pnpm", "run", "front-dev"]
