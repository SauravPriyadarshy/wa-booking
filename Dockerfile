# Universal Dockerfile — selects service via SERVICE env var
# SERVICE=wa-worker  → WhatsApp worker (default)
# SERVICE=bullmq     → BullMQ reminder processor

# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: Install ALL workspace deps (root + per-workspace)
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/wa-worker/package.json apps/wa-worker/package.json
COPY apps/api/package.json        apps/api/package.json

# npm workspaces places shared packages at /app/node_modules and
# workspace-specific packages (e.g. devDeps) at apps/*/node_modules.
RUN npm ci --ignore-scripts

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: Build wa-worker
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-slim AS build-wa
WORKDIR /app

COPY --from=deps /app/node_modules              ./node_modules
# tsc lives in apps/wa-worker/node_modules/.bin/tsc (devDep, not hoisted)
COPY --from=deps /app/apps/wa-worker/node_modules ./apps/wa-worker/node_modules

COPY apps/wa-worker ./apps/wa-worker
COPY package.json ./

WORKDIR /app/apps/wa-worker
RUN node_modules/.bin/tsc -p tsconfig.json

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3: Build BullMQ worker
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-slim AS build-bullmq
WORKDIR /app

COPY --from=deps /app/node_modules          ./node_modules
# prisma CLI + @nestjs/cli live in apps/api/node_modules/.bin/ (devDeps, not hoisted)
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

COPY apps/api ./apps/api
COPY package.json ./

WORKDIR /app/apps/api
# Dummy URL so prisma generate never fails on missing env var during image build.
ENV DATABASE_URL="postgresql://x:x@localhost:5432/x?schema=public"
RUN node_modules/.bin/prisma generate
# Use tsc (not nest build/webpack) so both main.ts AND worker.ts are compiled.
# nest build/webpack only follows the main.ts entry point and would miss worker.ts.
RUN node_modules/.bin/tsc -p tsconfig.build.json

# ─────────────────────────────────────────────────────────────────────────────
# Stage 4: Final runtime image
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-slim AS runner

# Chromium is required by whatsapp-web.js
RUN apt-get update && apt-get install -y \
  chromium \
  fonts-noto-color-emoji \
  fonts-freefont-ttf \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

ENV CHROME_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV NODE_ENV=production

WORKDIR /app

# Shared runtime node_modules
COPY --from=deps /app/node_modules ./node_modules

# wa-worker: built JS + runtime node_modules
COPY --from=build-wa /app/apps/wa-worker/dist          ./apps/wa-worker/dist
COPY --from=deps     /app/apps/wa-worker/node_modules  ./apps/wa-worker/node_modules
COPY apps/wa-worker/package.json                        ./apps/wa-worker/package.json

# BullMQ worker: built JS + generated prisma client + runtime node_modules
COPY --from=build-bullmq /app/apps/api/dist            ./apps/api/dist
COPY --from=build-bullmq /app/apps/api/node_modules    ./apps/api/node_modules
COPY apps/api/package.json                              ./apps/api/package.json
COPY apps/api/prisma                                    ./apps/api/prisma

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3100 3200

ENTRYPOINT ["/docker-entrypoint.sh"]
