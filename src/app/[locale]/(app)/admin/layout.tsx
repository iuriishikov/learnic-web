import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { getMyAdminStatus } from '@/features/auth/server';

type AdminLayoutProps = {
  children: ReactNode;
};

/**
 * Admin-only gate. The parent `(app)` layout already redirects
 * anonymous users to `/login`; this adds the platform-admin check on
 * top. Non-admins get a 404 (`notFound()`) rather than a 403 so the
 * route's existence isn't advertised — the backend `/admin/*` API
 * enforces the same flag independently.
 */
export default async function AdminLayout({ children }: AdminLayoutProps) {
  const isAdmin = await getMyAdminStatus();
  if (!isAdmin) notFound();
  return <>{children}</>;
}
