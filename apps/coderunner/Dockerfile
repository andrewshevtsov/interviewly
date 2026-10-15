FROM node:22-alpine

# Версия pnpm совпадает с packageManager корневого package.json.
RUN corepack enable && corepack prepare pnpm@11.22.0 --activate

WORKDIR /app
ENV CI=true

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
# Для frozen-lockfile pnpm должен видеть manifest каждого workspace-пакета.
COPY apps/frontend/package.json ./apps/frontend/package.json
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/collaboration/package.json ./apps/collaboration/package.json
COPY apps/coderunner/package.json ./apps/coderunner/package.json
COPY patches ./patches

RUN pnpm config set fetch-timeout 500000 && \
    pnpm config set fetch-retry-mintimeout 100000 && \
    pnpm config set fetch-retry-maxtimeout 500000
RUN pnpm install --frozen-lockfile

# Исходники монтируются поверх этого слоя в dev Compose, а слой оставляет образ автономным.
COPY . .

EXPOSE 3003

CMD ["pnpm", "--filter", "@app/coderunner", "run", "start:dev"]
