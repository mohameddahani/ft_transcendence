# ==============================================================================
#                        SuperAdmin's Frontend Dockerfile (Next.js)
# ==============================================================================


# ==============================================================================
# Stage 1: Install dependencies
# ==============================================================================
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN npm ci

# ==============================================================================
# Stage 2: Build Next.js application
# ==============================================================================
FROM node:20-alpine AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

ARG NEXT_PUBLIC_GYMTOKEN_ADDRESS
ARG NEXT_PUBLIC_FORWARDER_ADDRESS
ARG NEXT_PUBLIC_API_URL_RELAYER
ARG NEXT_PUBLIC_FETCH_PLANS_URL
ARG NEXT_PUBLIC_UPDATE_WALLET_ADDRESS_MEMBER
ARG NEXT_PUBLIC_UPDATE_WALLET_ADDRESS_ADMIN

RUN npm run build

# ==============================================================================
# Stage 3: Production image
# ==============================================================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# Run container as non-root user for security reasons
RUN addgroup --system --gid 1001 nodejs && \
	adduser  --system --uid 1001 nextjs

# Copy only what Next.js needs to run the app
COPY --from=build --chown=nextjs:nodejs /app/public           ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static     ./.next/static

USER nextjs

EXPOSE 3000

ENTRYPOINT ["node", "server.js"]