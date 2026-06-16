// Liveness probe for the container orchestrator (Docker HEALTHCHECK) and the
// Caddy reverse proxy. It deliberately lives outside the `[locale]` segment
// and is excluded from the i18n proxy matcher (see `src/proxy.ts`),
// so a request to `/healthz` is never redirected to `/ru/healthz`. It does no
// data fetching — it only answers "the Next server is up and serving".

// Never cache: the probe must reflect the live process, not a build-time value.
export const dynamic = 'force-dynamic';

export function GET() {
  return new Response('ok', {
    status: 200,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
