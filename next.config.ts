import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin(
  './src/shared/config/i18n/request.ts',
);

const API_URL = process.env.API_URL ?? 'http://127.0.0.1:8000';

const nextConfig: NextConfig = {
  devIndicators: false,
  experimental: {
    serverActions: {
      // Lesson-block uploads (video 1 GB, collage up to 12 × 80 MB,
      // file 50 MB) go through Server Actions as multipart FormData.
      // The Next.js default cap is 1 MB — without lifting it, every
      // non-trivial upload fails before the body reaches the backend.
      // Keep this in lockstep with
      // `presentation/http/common/upload_limits.py` on the backend.
      bodySizeLimit: '1100mb',
    },
    // Next 16: with a middleware/proxy present (`src/middleware.ts`,
    // next-intl), the server buffers every request body and truncates
    // it at 10 MB by default — a truncated multipart upload then dies
    // in the Server Action parser with "Unexpected end of form". Must
    // match `serverActions.bodySizeLimit` above, or uploads > 10 MB
    // never reach the action at all.
    proxyClientMaxBodySize: '1100mb',
  },
  async rewrites() {
    // Proxy backend WebSockets through Next.js so they're same-origin in the
    // browser. The `accessCookie` is httpOnly and scoped to the frontend host
    // — without this proxy the cookie never reaches the API host and the WS
    // handshake fails 401. Next.js forwards Upgrade requests to the
    // destination URL and passes the Cookie header through.
    return [
      { source: '/api/presence/ws', destination: `${API_URL}/presence/ws` },
      {
        source: '/api/products/:productId/events',
        destination: `${API_URL}/products/:productId/events`,
      },
      {
        source: '/api/products/:productId/cursors',
        destination: `${API_URL}/products/:productId/cursors`,
      },
      {
        source: '/api/notes/:noteId/storage',
        destination: `${API_URL}/notes/:noteId/storage`,
      },
      {
        source: '/api/users/me/confirm-events',
        destination: `${API_URL}/users/me/confirm-events`,
      },
      {
        source: '/api/users/me/notifications/ws',
        destination: `${API_URL}/users/me/notifications`,
      },
      {
        source: '/api/users/me/storage',
        destination: `${API_URL}/users/me/storage`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
