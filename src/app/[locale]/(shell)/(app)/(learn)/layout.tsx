import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import {
  BreadcrumbConfig,
  ModeTracker,
  SubHeaderConfig,
  type AppSubHeaderTab,
} from '@/widgets/app-header';

type LearnLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LearnLayout({
  children,
  params,
}: LearnLayoutProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'learn-shell' });

  // This group never overrides the header — `DefaultHeaderConfig`
  // mounted by the shared `(shell)` layout stays in effect. Learn
  // navigation lives in the sub-header instead.
  const tabs: AppSubHeaderTab[] = [
    { key: 'marketplace', href: '/marketplace', label: t('nav.marketplace') },
    { key: 'my-notes', href: '/my-notes', label: t('nav.myNotes') },
    { key: 'community', href: '/community', label: t('nav.community') },
  ];

  return (
    <>
      <ModeTracker mode="learn" />
      <SubHeaderConfig
        sectionKey="learn"
        ariaLabel={t('subHeader.ariaLabel')}
        tabs={tabs}
      />
      <BreadcrumbConfig
        slot="learn-root"
        order={1}
        segments={[{ label: t('breadcrumbs.root'), href: '/marketplace' }]}
      />
      {children}
    </>
  );
}
