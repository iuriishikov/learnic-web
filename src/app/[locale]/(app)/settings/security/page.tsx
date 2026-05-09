import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import {
  ActiveSessionsList,
  PasswordResetButton,
} from '@/features/auth';
import { buildPageMetadata } from '@/shared/lib/page-metadata';
import { SettingsRow, SettingsSection } from '@/widgets/settings';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    locale,
    namespace: 'settings.security.password',
    noindex: true,
  });
}

export default async function SettingsSecurityPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'settings.security' });

  return (
    <div className="flex flex-col gap-12">
      <SettingsSection
        title={t('password.title')}
        description={t('password.description')}
      >
        <SettingsRow
          label={t('password.label')}
          description={t('password.hint')}
        >
          <div className="flex">
            <PasswordResetButton />
          </div>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection
        title={t('sessions.title')}
        description={t('sessions.description')}
      >
        <SettingsRow
          label={t('sessions.label')}
          description={t('sessions.hint')}
        >
          <ActiveSessionsList />
        </SettingsRow>
      </SettingsSection>
    </div>
  );
}
