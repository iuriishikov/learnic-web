# syntax=docker/dockerfile:1.7

# ---------- base: Node + pnpm ----------
# Debian (glibc) base on purpose: sharp / @swc/core / unrs-resolver resolve to
# prebuilt glibc binaries from the lockfile, so no native build step is needed
# (Alpine/musl would force recompilation). pnpm is pinned to v9 to match the
# lockfileVersion 9.0 in pnpm-lock.yaml.
FROM node:20-bookworm-slim AS base
ENV PNPM_HOME="/pnpm" \
    PATH="/pnpm:$PATH" \
    NEXT_TELEMETRY_DISABLED=1
RUN npm install --global pnpm@9
WORKDIR /app

# ---------- deps: install the full dependency set from the lockfile ----------
# devDependencies are required to build (TypeScript, Tailwind, the next-intl
# plugin); the standalone tracer drops everything not needed at runtime later.
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---------- builder: compile the standalone production bundle ----------
FROM base AS builder

# NEXT_PUBLIC_* are inlined into the browser bundle at BUILD time, so their
# production values must be present now — they cannot be injected at runtime.
# API_URL is read both by next.config.ts `rewrites()` (baked into the routes
# manifest at build, i.e. the WS-proxy destinations) AND by apiFetch on the
# server at runtime, so it is supplied as a build arg here too. The compose
# stack overrides these with prod values (API_URL=http://app:8000, etc.).
ARG API_URL=http://127.0.0.1:8000
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_DEFAULT_THEME=system
ENV API_URL=$API_URL \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_DEFAULT_THEME=$NEXT_PUBLIC_DEFAULT_THEME

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ---------- runner: minimal image that runs the standalone server ----------
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Unprivileged runtime user, mirroring the backend image's `app` user.
RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid 1001 \
        --home-dir /app --shell /usr/sbin/nologin nextjs

# `output: 'standalone'` emits a self-contained server (server.js + a minimal
# node_modules) under .next/standalone. Static assets and public/ are NOT
# traced into it, so they are copied in alongside.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

# Hits the /healthz route handler (plain "ok", outside [locale]).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
