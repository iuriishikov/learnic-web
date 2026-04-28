import { getTranslations, setRequestLocale } from 'next-intl/server';

import { AuthLayout, VerifyEmailClient } from '@/features/auth';
import { Link } from '@/shared/config/i18n/navigation';

type VerifyEmailPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string; email?: string }>;
};

export default async function VerifyEmailPage({
  params,
  searchParams,
}: VerifyEmailPageProps) {
  const { locale } = await params;
  const { token, email } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations('auth');

  const title = token
    ? t('verifyEmail.pageTitle.token')
    : t('verifyEmail.pageTitle.waiting');
  const description = token
    ? t('verifyEmail.pageDescription.token')
    : t('verifyEmail.pageDescription.waiting');

  return (
    <AuthLayout
      brandLabel={t('brand')}
      title={title}
      description={description}
      footer={
        <Link
          href="/login"
          className="font-semibold text-brand transition-colors hover:text-brand/80"
        >
          {t('verifyEmail.backToLogin')}
        </Link>
      }
    >
      <VerifyEmailClient token={token} email={email} />
    </AuthLayout>
  );
}
