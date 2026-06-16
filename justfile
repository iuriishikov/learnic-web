set dotenv-load := true

_default:
    @just --list --unsorted

[doc("Create .env from the template (edit it before deploying)")]
bootstrap:
    cp -n .env.dist .env && echo "Created .env from .env.dist — edit it before deploying" || echo ".env already exists"

[private]
[doc("Create the shared external edge network if it doesn't exist yet")]
_net:
    docker network inspect learnic-edge >/dev/null 2>&1 || docker network create learnic-edge

[doc("Split deploy: frontend WITH its own HTTPS edge (Caddy on :443). Set API_URL in .env to the backend's address (e.g. https://api.learnic.ru).")]
prod-up:
    #!/usr/bin/env bash
    set -euo pipefail
    if [ -z "${API_URL:-}" ] || [ "${API_URL:-}" = "http://127.0.0.1:8000" ]; then
        echo "ERROR: set API_URL in .env to the backend URL reachable from this host." >&2
        echo "       split deploy example: API_URL=https://${API_DOMAIN:-api.example.com}" >&2
        exit 1
    fi
    just _net
    NEXT_PUBLIC_SITE_URL="https://${SITE_DOMAIN}" docker compose --profile edge up -d --build --wait

[doc("Co-located deploy: web runs edge-less (the backend's Caddy fronts both domains). Pairs with backend `just prod-up-colocated`.")]
prod-up-colocated:
    #!/usr/bin/env bash
    set -euo pipefail
    just _net
    API_URL="http://learnic-app:8000" NEXT_PUBLIC_SITE_URL="https://${SITE_DOMAIN}" docker compose up -d --build --wait

[doc("Stop the frontend stack (keeps Caddy volumes)")]
prod-down:
    docker compose --profile edge down --remove-orphans

[doc("Frontend quality gate: eslint + tsc + production build")]
check:
    pnpm lint
    pnpm exec tsc --noEmit
    pnpm build
