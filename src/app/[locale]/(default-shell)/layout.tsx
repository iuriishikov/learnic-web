import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';

import { DefaultHeaderConfig } from '@/widgets/app-header';
import { PageHeader } from '@/widgets/page-header';

type DefaultShellLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

/**
 * Public-shell layout for routes that use the standard header (landing,
 * marketplace, public profiles, help, …). It mounts the shell once for the
 * whole group instead of repeating it per page:
 *
 * - `DefaultHeaderConfig` contributes the default mode-entry nav into the
 *   `HeaderConfigProvider` (mounted at the root locale layout).
 * - `PageHeader` renders that config, branching to `SiteHeader` for anonymous
 *   visitors.
 *
 * The footer is intentionally NOT mounted here — pages in this group own their
 * own footer and add `SiteFooter` themselves where it makes sense (the layouts
 * vary too much to share one footer across the whole group).
 *
 * Pages in this group render only their own `<main>`. Mounting the config here
 * keeps it contributed once and stable across intra-group navigation (it no
 * longer unmounts/remounts on every page change). Routes that need a different
 * header belong in their own group/layout (`(app)` / `(learn)` / `(teach)`) —
 * don't add a competing `HeaderConfig` inside this group, or "last mount wins"
 * becomes dependent on effect order.
 */
export default async function DefaultShellLayout({
  children,
  params,
}: DefaultShellLayoutProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DefaultHeaderConfig />
      <PageHeader />
      {children}
    </div>
  );
}
