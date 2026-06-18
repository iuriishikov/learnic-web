import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { AuthLayout, LoginForm } from '@/features/auth';
import { sanitizeRedirectTarget } from '@/shared/lib/redirect';
import { getCurrentUser } from '@/features/auth/server';
import { Link, redirect } from '@/shared/config/i18n/navigation';
import { buildPageMetadata } from '@/shared/lib/page-metadata';

type LoginPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ from?: string }>;
};

export async function generateMetadata({
  params,
}: LoginPageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({ locale, namespace: 'metadata.login' });
}

export default async function LoginPage({
  params,
  searchParams,
}: LoginPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { from } = await searchParams;
  const safeFrom = sanitizeRedirectTarget(from);

  const user = await getCurrentUser();
  if (user) redirect({ href: safeFrom ?? '/', locale });

  const t = await getTranslations('auth');

  return (
    <AuthLayout
      brandLabel={t('brand')}
      title={t('login.title')}
      description={t('login.description')}
      footer={
        <Link
          href="/forgot-password"
          className="font-semibold text-brand transition-colors hover:text-brand/80"
        >
          {t('forgotPassword.link')}
        </Link>
      }
    >
      <LoginForm />
    </AuthLayout>
  );
}
