import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';

import { refreshTokensIfNeeded } from '@/shared/api/auth-refresh';
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

function extractLocale(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return locale;
    }
  }
  return routing.defaultLocale;
}

export default async function proxy(request: NextRequest) {
  const path =
    stripLocalePrefix(request.nextUrl.pathname) + request.nextUrl.search;
  request.headers.set('x-pathname', path);
  request.headers.set('x-locale', extractLocale(request.nextUrl.pathname));

  const refresh = await refreshTokensIfNeeded(request);
  if (refresh.kind === 'fresh') {
    for (const cookie of refresh.cookies) {
      request.cookies.set(cookie.name, cookie.value);
    }
  }

  const response = handleI18nRouting(request);

  if (refresh.kind === 'fresh') {
    for (const cookie of refresh.cookies) {
      response.cookies.set({
        name: cookie.name,
        value: cookie.value,
        ...cookie.options,
      });
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|healthz|opengraph-image|twitter-image|apple-icon|.*\\..*).*)',
  ],
};
