FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@11.22.0 --activate

WORKDIR /app
ENV CI=true

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/frontend/package.json ./apps/frontend/package.json
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/collaboration/package.json ./apps/collaboration/package.json
COPY patches ./patches

RUN pnpm config set fetch-timeout 500000 && \
    pnpm config set fetch-retry-mintimeout 100000 && \
    pnpm config set fetch-retry-maxtimeout 500000
RUN pnpm install --frozen-lockfile

COPY . .

# NEXT_PUBLIC_* вшивается в клиентский бандл на этапе build.
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN pnpm --filter @app/frontend run build

EXPOSE 3000

CMD ["pnpm", "--filter", "@app/frontend", "run", "start"]
