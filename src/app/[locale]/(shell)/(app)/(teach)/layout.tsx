import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import { BreadcrumbConfig, ModeTracker } from '@/widgets/app-header';

type TeachLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function TeachLayout({
  children,
  params,
}: TeachLayoutProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'teach-shell' });

  // This group never overrides the header — `DefaultHeaderConfig`
  // mounted by the shared `(shell)` layout stays in effect. The studio
  // sub-header (`<TeachSubHeader>`) is contributed by the browse-level
  // pages, not here, so the product editor renders without the tab row.
  return (
    <>
      <ModeTracker mode="teach" />
      <BreadcrumbConfig
        slot="teach-root"
        order={1}
        segments={[{ label: t('breadcrumbs.root'), href: '/products' }]}
      />
      {children}
    </>
  );
}
