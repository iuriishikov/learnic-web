import { getTranslations, setRequestLocale } from 'next-intl/server';

import { AuthLayout, LoginForm } from '@/features/auth';
import { Link } from '@/shared/config/i18n/navigation';

type LoginPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
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
