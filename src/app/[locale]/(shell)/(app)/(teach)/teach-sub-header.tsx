import { getTranslations } from 'next-intl/server';

import { SubHeaderConfig, type AppSubHeaderTab } from '@/widgets/app-header';

type TeachSubHeaderProps = {
  locale: string;
};

/**
 * Studio section sub-header (single "Продукты" tab). Contributed by the
 * browse-level pages (`/products`, `/products/catalog`) instead of the
 * `(teach)` layout, so the focused product editor
 * (`/products/[id]/editor`) — the authoring window — renders without the
 * section tab row. Keeping it at the page level rather than clearing it
 * from a nested route avoids the restore-on-back-navigation gap (a deeper
 * config's cleanup can't re-arm a parent layout's contribution).
 */
export async function TeachSubHeader({ locale }: TeachSubHeaderProps) {
  const t = await getTranslations({ locale, namespace: 'teach-shell' });
  const tabs: AppSubHeaderTab[] = [
    { key: 'products', href: '/products', label: t('nav.products') },
  ];

  return (
    <SubHeaderConfig
      sectionKey="teach"
      ariaLabel={t('subHeader.ariaLabel')}
      tabs={tabs}
    />
  );
}
