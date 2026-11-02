# ==============================================================================
#                         Block-Chain's Dockerfile (Nest.js)
# ==============================================================================

# ==============================================================================
# Stage 1: Install all dependencies
# ==============================================================================
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci

# ==============================================================================
# Stage 2: Compile source files
# ==============================================================================
FROM node:20-alpine AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ==============================================================================
# Stage 3: Install production-only dependencies
# ==============================================================================
FROM node:20-alpine AS prod-deps

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

# ==============================================================================
# Stage 4: Final production image
# ==============================================================================
FROM node:20-alpine

WORKDIR /app

# Non-root user for security purposes
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nestjs

COPY --from=build     --chown=nestjs:nodejs  /app/dist            ./dist
COPY --from=prod-deps --chown=nestjs:nodejs  /app/node_modules    ./node_modules

USER nestjs

EXPOSE 3000

CMD ["node", "dist/main"]