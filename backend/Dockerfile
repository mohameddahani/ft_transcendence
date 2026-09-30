# ==============================================================================
#                         Backend Dockerfile (Nest.js)
# ==============================================================================

# ==============================================================================
# Stage 1: Install all dependencies
# ==============================================================================
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci

# ==============================================================================
# Stage 2: Generate Prisma client + compile source
# ==============================================================================
FROM node:20-alpine AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

# ==============================================================================
# Stage 3: Install production-only dependencies + generate Prisma client
# ==============================================================================
FROM node:20-alpine AS prod-deps

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

# ==============================================================================
# Stage 4: Final production image
# ==============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

# Non-root user for security purposes
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nestjs

COPY --from=build     --chown=nestjs:nodejs /app/dist         ./dist
COPY --from=build     --chown=nestjs:nodejs /app/prisma       ./prisma
COPY --from=build     --chown=nestjs:nodejs /app/prisma.config.ts       ./
COPY --from=prod-deps --chown=nestjs:nodejs /app/node_modules ./node_modules

COPY --chown=nestjs:nodejs scripts/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

USER nestjs

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["node", "dist/src/main"]