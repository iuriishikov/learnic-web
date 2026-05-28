import { setRequestLocale } from 'next-intl/server';

import { AdminDashboard } from '@/features/admin-dashboard';
import { getCurrentUser } from '@/features/auth/server';

type AdminPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Guaranteed non-null: the `(app)` layout redirects anonymous users
  // and the `admin` layout 404s non-admins before this renders.
  const user = await getCurrentUser();

  return <AdminDashboard userName={user?.firstName ?? ''} />;
}
