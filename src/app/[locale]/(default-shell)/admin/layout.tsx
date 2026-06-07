import type { ReactNode } from 'react';

import { getMyAdminStatus } from '@/features/auth/server';
import { httpStatusForReason } from '@/shared/lib/http-error';

type AdminLayoutProps = {
  children: ReactNode;
};

/**
 * Admin-only gate. The parent `(app)` layout already redirects
 * anonymous users to `/login`; this adds the platform-admin check on
 * top. Authenticated non-admins get a 403 "Доступ ограничен" page —
 * the thrown `HttpStatusError` carries an `HTTP_STATUS:403` digest that
 * the `[locale]/error.tsx` boundary reads to render `StatusErrorContent`.
 * This matches the backend, which independently rejects every
 * `/admin/*` call with HTTP 403 (`NotAdminError`).
 */
export default async function AdminLayout({ children }: AdminLayoutProps) {
  const isAdmin = await getMyAdminStatus();
  if (!isAdmin) throw httpStatusForReason('forbidden');
  return <>
    
    {children}
  </>;
}
