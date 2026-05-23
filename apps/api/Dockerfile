FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
RUN npm ci --ignore-scripts

FROM node:22-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY apps/api ./apps/api
COPY package.json ./
WORKDIR /app/apps/api
RUN npm run build

FROM node:22-slim AS runner
WORKDIR /app/apps/api
ENV NODE_ENV=production
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/package.json ./package.json
COPY --from=build /app/node_modules /app/node_modules
COPY apps/api/prisma ./prisma
EXPOSE 3000
CMD ["node", "dist/main.js"]

