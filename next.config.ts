import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin(
  './src/shared/config/i18n/request.ts',
);

const API_URL = process.env.API_URL ?? 'http://127.0.0.1:8000';

const nextConfig: NextConfig = {
  devIndicators: false,
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
        source: '/api/courses/:courseId/events',
        destination: `${API_URL}/courses/:courseId/events`,
      },
      {
        source: '/api/users/me/confirm-events',
        destination: `${API_URL}/users/me/confirm-events`,
      },
      {
        source: '/api/users/me/notifications/ws',
        destination: `${API_URL}/users/me/notifications`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
