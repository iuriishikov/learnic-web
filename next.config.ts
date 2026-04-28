import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin(
  './src/shared/config/i18n/request.ts',
);

const API_URL = process.env.API_URL ?? 'http://0.0.0.0:8000';

const nextConfig: NextConfig = {
  devIndicators: false,
  async rewrites() {
    // Proxy the presence WebSocket through Next.js so it's same-origin in
    // the browser. The `accessCookie` is httpOnly and scoped to the frontend
    // host — without this proxy the cookie never reaches the API host and
    // the WS handshake fails 401. Next.js forwards Upgrade requests to the
    // destination URL and passes the Cookie header through.
    return [
      { source: '/api/presence/ws', destination: `${API_URL}/presence/ws` },
    ];
  },
};

export default withNextIntl(nextConfig);
