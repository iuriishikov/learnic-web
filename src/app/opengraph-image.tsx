import { ImageResponse } from 'next/og';

import { BRAND_COLOR, SITE_NAME } from '@/shared/config/site';

export const alt = `${SITE_NAME} — Платформа для современных команд`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: 80,
          background: `linear-gradient(135deg, ${BRAND_COLOR} 0%, #4B3FB8 100%)`,
          color: 'white',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
          }}
        >
          <svg
            width="88"
            height="88"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="100" height="100" rx="25" fill="white" fillOpacity="0.18" />
            <path d="M53 71C53 61.0589 61.0589 53 71 53C75.9706 53 80 57.0294 80 62C80 71.9411 71.9411 80 62 80C57.0294 80 53 75.9706 53 71Z" fill="white" fillOpacity="0.95" />
            <path d="M51.7143 38.8571C51.7143 28.4426 60.1569 20 70.5714 20C75.7787 20 80 24.2213 80 29.4286C80 39.8431 71.5574 48.2857 61.1429 48.2857C55.9356 48.2857 51.7143 44.0644 51.7143 38.8571Z" fill="white" fillOpacity="0.7" />
            <path d="M20 38C20 28.0589 28.0589 20 38 20C42.9706 20 47 24.0294 47 29C47 38.9411 38.9411 47 29 47C24.0294 47 20 42.9706 20 38Z" fill="white" fillOpacity="0.95" />
            <path d="M20 70.5714C20 60.1569 28.4426 51.7143 38.8571 51.7143C44.0644 51.7143 48.2857 55.9356 48.2857 61.1429C48.2857 71.5574 39.8431 80 29.4286 80C24.2213 80 20 75.7787 20 70.5714Z" fill="white" fillOpacity="0.7" />
          </svg>
          <span style={{ fontSize: 56, fontWeight: 700, letterSpacing: -1 }}>
            {SITE_NAME}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <span
            style={{
              fontSize: 76,
              fontWeight: 700,
              letterSpacing: -2,
              lineHeight: 1.05,
              maxWidth: 980,
            }}
          >
            Платформа для современных команд
          </span>
          <span
            style={{
              fontSize: 28,
              opacity: 0.85,
              maxWidth: 880,
              lineHeight: 1.3,
            }}
          >
            Аналитика, общие инбоксы и инструменты роста — всё в одном месте.
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
