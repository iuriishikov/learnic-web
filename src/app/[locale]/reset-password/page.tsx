import { getTranslations, setRequestLocale } from 'next-intl/server';

import { AuthLayout, ResetPasswordForm } from '@/features/auth';
import { Link } from '@/shared/config/i18n/navigation';

type ResetPasswordPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({
  params,
  searchParams,
}: ResetPasswordPageProps) {
  const { locale } = await params;
  const { token } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations('auth');

  if (!token) {
    return (
      <AuthLayout
        brandLabel={t('brand')}
        title={t('resetPassword.missingToken.title')}
        description={t('resetPassword.missingToken.description')}
        footer={
          <Link
            href="/forgot-password"
            className="font-semibold text-brand transition-colors hover:text-brand/80"
          >
            {t('resetPassword.missingToken.requestAgain')}
          </Link>
        }
      >
        <div className="text-[15px] text-muted-foreground">
          {t('resetPassword.missingToken.placeholder')}
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      brandLabel={t('brand')}
      title={t('resetPassword.title')}
      description={t('resetPassword.description')}
      footer={
        <Link
          href="/login"
          className="font-semibold text-brand transition-colors hover:text-brand/80"
        >
          {t('resetPassword.backToLogin')}
        </Link>
      }
    >
      <ResetPasswordForm token={token} />
    </AuthLayout>
  );
}
