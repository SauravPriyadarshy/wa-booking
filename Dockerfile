# Universal Dockerfile — selects which service to run via SERVICE env var
# SERVICE=wa-worker  → WhatsApp worker (default)
# SERVICE=bullmq     → BullMQ reminder processor

# ──────────────────────────────────────────────────────────────────────────────
# Stage 1: Install all workspace deps
# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/wa-worker/package.json apps/wa-worker/package.json
COPY apps/api/package.json apps/api/package.json

# Install deps for both workspaces
RUN npm ci --ignore-scripts

# ──────────────────────────────────────────────────────────────────────────────
# Stage 2: Build wa-worker
# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-slim AS build-wa
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY apps/wa-worker ./apps/wa-worker
COPY package.json ./
WORKDIR /app/apps/wa-worker
RUN npm run build

# ──────────────────────────────────────────────────────────────────────────────
# Stage 3: Build BullMQ worker (NestJS API worker.ts)
# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-slim AS build-bullmq
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY apps/api ./apps/api
COPY package.json ./
WORKDIR /app/apps/api
# Dummy DATABASE_URL so prisma generate doesn't fail when no .env is present.
# The real URL is injected by Render/Vercel at runtime.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN /app/node_modules/.bin/prisma generate
RUN /app/node_modules/.bin/nest build

# ──────────────────────────────────────────────────────────────────────────────
# Stage 4: Final runtime image — includes Chromium + both built outputs
# ──────────────────────────────────────────────────────────────────────────────
FROM node:22-slim AS runner

# Install Chromium for whatsapp-web.js
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

# Copy node_modules (shared)
COPY --from=deps /app/node_modules ./node_modules

# Copy wa-worker build
COPY --from=build-wa /app/apps/wa-worker/dist ./apps/wa-worker/dist
COPY apps/wa-worker/package.json ./apps/wa-worker/package.json

# Copy BullMQ worker build
COPY --from=build-bullmq /app/apps/api/dist ./apps/api/dist
COPY apps/api/package.json ./apps/api/package.json
COPY apps/api/prisma ./apps/api/prisma

# Entrypoint script selects service based on SERVICE env var
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3100 3200

ENTRYPOINT ["/docker-entrypoint.sh"]
