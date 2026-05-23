# WhatsApp Worker — root Dockerfile (used by Render wa-worker service)
# Needs Chromium for whatsapp-web.js
FROM node:22-slim

RUN apt-get update && apt-get install -y \
  chromium \
  fonts-noto-color-emoji \
  fonts-freefont-ttf \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

ENV CHROME_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/wa-worker/package.json apps/wa-worker/package.json

RUN npm ci --workspace=apps/wa-worker --ignore-scripts

COPY apps/wa-worker ./apps/wa-worker

WORKDIR /app/apps/wa-worker

RUN npm run build

EXPOSE 3100

CMD ["node", "dist/index.js"]
