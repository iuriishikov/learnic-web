# syntax=docker/dockerfile:1.7

# Custom Caddy build. The stock image has no rate limiting, so we compile in the
# community rate-limit module via xcaddy — needed for the per-user throttle on
# the learnic.ru edge in a split deploy. Identical to learnic/deploy/caddy/Dockerfile.
# Pin caddy-ratelimit (append @vX.Y.Z) once you've confirmed a version for repro builds.
FROM caddy:2-builder AS builder
RUN xcaddy build --with github.com/mholt/caddy-ratelimit

FROM caddy:2-alpine
COPY --from=builder /usr/bin/caddy /usr/bin/caddy
# Fail the build loudly if the rate-limit module didn't actually get compiled in.
RUN caddy list-modules | grep -q rate_limit
