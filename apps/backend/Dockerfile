FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@11.21.0 --activate

WORKDIR /app
ENV CI=true

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/package.json

RUN pnpm config set fetch-timeout 500000 && \
    pnpm config set fetch-retry-mintimeout 100000 && \
    pnpm config set fetch-retry-maxtimeout 500000
RUN pnpm install --frozen-lockfile 

COPY . .

EXPOSE 4001

CMD ["pnpm", "run", "back-dev"]