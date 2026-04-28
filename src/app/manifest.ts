import type { MetadataRoute } from 'next';

import { BRAND_COLOR, SITE_NAME } from '@/shared/config/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    start_url: '/',
    display: 'standalone',
    background_color: BRAND_COLOR,
    theme_color: BRAND_COLOR,
    icons: [
      {
        src: '/icon.svg',
        type: 'image/svg+xml',
        sizes: 'any',
        purpose: 'any',
      },
      {
        src: '/apple-icon',
        type: 'image/png',
        sizes: '180x180',
        purpose: 'any',
      },
    ],
  };
}
