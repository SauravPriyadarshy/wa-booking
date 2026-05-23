# WhatsApp Worker — needs Chromium for whatsapp-web.js
FROM node:22-slim

# Install Chromium and its dependencies
RUN apt-get update && apt-get install -y \
  chromium \
  fonts-noto-color-emoji \
  fonts-freefont-ttf \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

ENV CHROME_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

WORKDIR /app

# Copy workspace root manifests for npm install
COPY package.json package-lock.json ./
COPY apps/wa-worker/package.json apps/wa-worker/package.json

# Install only wa-worker deps
RUN npm ci --workspace=apps/wa-worker --ignore-scripts

# Copy source
COPY apps/wa-worker ./apps/wa-worker

WORKDIR /app/apps/wa-worker

# Build TypeScript
RUN npm run build

EXPOSE 3100

CMD ["node", "dist/index.js"]
