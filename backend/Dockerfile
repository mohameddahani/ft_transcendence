# ────── This Dockerfile builded using multi-stage approach ──────


# deps: install All dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# build: compile source files to dist
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps ./app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# prod-deps: install ONLY production dependencies
FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm ci --omit=dev
RUN npx prisma generate

# runner: the final minimized image
FROM node:20-alpine
WORKDIR /app

COPY --from=build ./app/dist ./dist
COPY --from=build ./app/prisma ./prisma
COPY --from=prod-deps ./app/node_modules ./node_modules
COPY prisma.config.ts ./
COPY package*.json ./
COPY scripts/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["node", "dist/src/main"]