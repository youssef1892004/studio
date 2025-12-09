# ==========================================
# Stage 1: Rust Builder (WASM Compilation)
# ==========================================
FROM rust:slim-bullseye AS rust-builder
WORKDIR /app

# Install curl to download wasm-pack
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Install wasm-pack
RUN curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# Copy Rust Source
COPY media-engine ./media-engine

# Build WASM
WORKDIR /app/media-engine
RUN wasm-pack build --target web --out-dir ../public/wasm --release

# ==========================================
# Stage 2: Node.js Builder (Next.js Build)
# ==========================================
FROM node:18-alpine AS builder
WORKDIR /app

# Install compatibility libraries
RUN apk add --no-cache libc6-compat

# Install Dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy Source Code
COPY . .

# Copy Built WASM from Rust Stage
COPY --from=rust-builder /app/public/wasm ./public/wasm

# Build Environment Variables
ARG NEXT_PUBLIC_HASURA_GRAPHQL_URL
ARG NEXT_PUBLIC_HASURA_ADMIN_SECRET
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_POSTHOG_KEY
ARG NEXT_PUBLIC_POSTHOG_HOST
ARG NEXT_PUBLIC_WEBSITE_IS_FREE

ENV NEXT_PUBLIC_HASURA_GRAPHQL_URL=$NEXT_PUBLIC_HASURA_GRAPHQL_URL
ENV NEXT_PUBLIC_HASURA_ADMIN_SECRET=$NEXT_PUBLIC_HASURA_ADMIN_SECRET
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY
ENV NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST
ENV NEXT_PUBLIC_WEBSITE_IS_FREE=$NEXT_PUBLIC_WEBSITE_IS_FREE

ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js app
RUN npm run build

# ==========================================
# Stage 3: Production Runner
# ==========================================
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install FFmpeg (Required for audio processing)
RUN apk add --no-cache ffmpeg

# Setup User
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy Public Assets
COPY --from=builder /app/public ./public

# Copy Standalone Build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Set Permissions
USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]