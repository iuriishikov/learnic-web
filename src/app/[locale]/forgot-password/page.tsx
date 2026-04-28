import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { AuthLayout, ForgotPasswordForm } from '@/features/auth';
import { Link } from '@/shared/config/i18n/navigation';
import { buildPageMetadata } from '@/shared/lib/page-metadata';

type ForgotPasswordPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: ForgotPasswordPageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({ locale, namespace: 'metadata.forgotPassword' });
}

export default async function ForgotPasswordPage({
  params,
}: ForgotPasswordPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('auth');

  return (
    <AuthLayout
      brandLabel={t('brand')}
      title={t('forgotPassword.title')}
      description={t('forgotPassword.description')}
      footer={
        <Link
          href="/login"
          className="font-semibold text-brand transition-colors hover:text-brand/80"
        >
          {t('forgotPassword.backToLogin')}
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
