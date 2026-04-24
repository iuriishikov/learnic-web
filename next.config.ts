import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin(
  './src/shared/config/i18n/request.ts',
);

const nextConfig: NextConfig = {
  devIndicators: false
};

export default withNextIntl(nextConfig);
