# ────── This Dockerfile builded using multi-stage approach ──────


# deps: install All dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY backend/package*.json ./
COPY backend/prisma ./prisma
COPY backend/prisma.config.ts ./
RUN npm ci
RUN npx prisma generate

# build: compile source files to dist
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps ./app/node_modules ./node_modules
COPY backend/ .
RUN npm run build

# prod-deps: install ONLY production dependencies
FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY backend/package*.json ./
COPY backend/prisma ./prisma
COPY backend/prisma.config.ts ./
RUN npm ci --omit=dev
RUN npx prisma generate

# runner: the final minimized image
FROM node:20-alpine
WORKDIR /app

COPY --from=build ./app/dist ./dist
COPY --from=build ./app/prisma ./prisma
COPY --from=prod-deps ./app/node_modules ./node_modules
COPY backend/prisma.config.ts ./
COPY backend/package*.json ./
COPY devops/scripts/backend-entrypoint.sh /usr/local/bin/backend-entrypoint.sh

RUN chmod +x /usr/local/bin/backend-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/backend-entrypoint.sh"]
CMD ["node", "dist/src/main"]