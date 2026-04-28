import { getTranslations, setRequestLocale } from 'next-intl/server';

import { AuthLayout, ForgotPasswordForm } from '@/features/auth';
import { Link } from '@/shared/config/i18n/navigation';

type ForgotPasswordPageProps = {
  params: Promise<{ locale: string }>;
};

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
