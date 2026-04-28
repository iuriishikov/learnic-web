import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { AuthLayout, RegisterForm } from '@/features/auth';
import { sanitizeRedirectTarget } from '@/features/auth/lib/redirect';
import { getCurrentUser } from '@/features/auth/server';
import { Link, redirect } from '@/shared/config/i18n/navigation';
import { buildPageMetadata } from '@/shared/lib/page-metadata';

type RegisterPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ from?: string }>;
};

export async function generateMetadata({
  params,
}: RegisterPageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({ locale, namespace: 'metadata.register' });
}

export default async function RegisterPage({
  params,
  searchParams,
}: RegisterPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { from } = await searchParams;
  const safeFrom = sanitizeRedirectTarget(from);

  const user = await getCurrentUser();
  if (user) redirect({ href: safeFrom ?? '/dashboard', locale });

  const t = await getTranslations('auth');

  return (
    <AuthLayout
      brandLabel={t('brand')}
      title={t('register.title')}
      description={t('register.description')}
      footer={
        <Link
          href="/forgot-password"
          className="font-semibold text-brand transition-colors hover:text-brand/80"
        >
          {t('forgotPassword.link')}
        </Link>
      }
    >
      <RegisterForm />
    </AuthLayout>
  );
}
