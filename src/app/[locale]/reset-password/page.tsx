import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import {
  AuthLayout,
  getTokenStatusAction,
  ResetPasswordForm,
} from '@/features/auth';
import { Link } from '@/shared/config/i18n/navigation';
import { buildPageMetadata } from '@/shared/lib/page-metadata';

type ResetPasswordPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
};

export async function generateMetadata({
  params,
}: ResetPasswordPageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({ locale, namespace: 'metadata.resetPassword' });
}

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

  // Pre-check the token via the unified ``/auth/token-status`` peek
  // endpoint so a dead link shows "ссылка недействительна" before the
  // user fills out a new password instead of after submission. We
  // also defend against pasting a non-RESET token (e.g. a verify
  // token) into this URL — the form would not have rejected it
  // client-side but the consume call would; surface that here too.
  const status = await getTokenStatusAction({ token });
  const tokenLive = status.ok && status.purpose === 'reset';

  if (!tokenLive) {
    return (
      <AuthLayout
        brandLabel={t('brand')}
        title={t('resetPassword.linkInvalid.title')}
        description={t('resetPassword.linkInvalid.description')}
        footer={
          <Link
            href="/forgot-password"
            className="font-semibold text-brand transition-colors hover:text-brand/80"
          >
            {t('resetPassword.linkInvalid.requestAgain')}
          </Link>
        }
      >
        <div className="text-[15px] text-muted-foreground">
          {t('resetPassword.linkInvalid.placeholder')}
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
