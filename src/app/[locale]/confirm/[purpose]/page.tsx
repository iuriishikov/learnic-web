import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { AuthLayout, GenericConfirmClient } from '@/features/auth';
import { CONFIRM_REGISTRY } from '@/features/auth/model/confirm-registry';
import { Link } from '@/shared/config/i18n/navigation';
import { buildPageMetadata } from '@/shared/lib/page-metadata';

type ConfirmPageProps = {
  params: Promise<{ locale: string; purpose: string }>;
  searchParams: Promise<{ token?: string }>;
};

export async function generateMetadata({
  params,
}: ConfirmPageProps): Promise<Metadata> {
  const { locale, purpose } = await params;
  const namespace =
    CONFIRM_REGISTRY[purpose]?.namespace ?? 'metadata.confirmGeneric';
  return buildPageMetadata({ locale, namespace });
}

export default async function ConfirmPage({
  params,
  searchParams,
}: ConfirmPageProps) {
  const { locale, purpose } = await params;
  const { token } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations('auth');
  const entry = CONFIRM_REGISTRY[purpose];

  if (entry) {
    if (!token) notFound();
    const namespaced = await getTranslations(entry.namespace);
    return (
      <AuthLayout
        brandLabel={t('brand')}
        title={namespaced('title')}
        description={namespaced('description')}
        footer={
          <Link
            href="/login"
            className="font-semibold text-brand transition-colors hover:text-brand/80"
          >
            {t('verifyEmail.backToLogin')}
          </Link>
        }
      >
        <entry.Component token={token} />
      </AuthLayout>
    );
  }

  const generic = await getTranslations('confirm.generic');
  return (
    <AuthLayout
      brandLabel={t('brand')}
      title={generic('pageTitle')}
      description={generic('pageDescription')}
      footer={
        <Link
          href="/login"
          className="font-semibold text-brand transition-colors hover:text-brand/80"
        >
          {t('verifyEmail.backToLogin')}
        </Link>
      }
    >
      <GenericConfirmClient token={token} />
    </AuthLayout>
  );
}
