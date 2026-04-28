import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';

import { routing } from '@/shared/config/i18n/routing';

const handleI18nRouting = createMiddleware(routing);

function stripLocalePrefix(pathname: string): string {
  for (const locale of routing.locales) {
    const prefix = `/${locale}`;
    if (pathname === prefix) return '/';
    if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length);
  }
  return pathname;
}

export default function middleware(request: NextRequest) {
  const path =
    stripLocalePrefix(request.nextUrl.pathname) + request.nextUrl.search;
  request.headers.set('x-pathname', path);
  return handleI18nRouting(request);
}

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|opengraph-image|twitter-image|apple-icon|.*\\..*).*)',
  ],
};
