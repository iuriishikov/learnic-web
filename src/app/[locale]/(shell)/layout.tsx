import { setRequestLocale } from 'next-intl/server';
import type { ReactNode } from 'react';

import { DefaultHeaderConfig } from '@/widgets/app-header';
import { CommandPalette } from '@/widgets/command-palette';
import { PageHeader, PageHeaderConfigProvider } from '@/widgets/page-header';

type ShellLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

/**
 * Single app-wide chrome shell shared by both the auth-gated `(app)` group and
 * the public `(default-shell)` group, which now sit underneath it as nested
 * route groups.
 *
 * The header is rendered HERE — at the closest common ancestor of both groups —
 * so it mounts exactly once and is preserved across navigations that cross the
 * auth boundary (e.g. `/products` ↔ `/marketplace`). Previously each group
 * mounted its own `PageHeader`, so crossing groups unmounted one header subtree
 * and mounted the other (a full remount: sticky header rebuilt, active-pill
 * `layoutId` animation reset, `mobileOpen` state lost). With one shared
 * instance it only re-renders.
 *
 * - `PageHeaderConfigProvider` wraps both the header and the page so a page
 *   (e.g. `/pricing`) can still contribute `siteHeaderVariant` via
 *   `PageHeaderConfig`.
 * - `DefaultHeaderConfig` contributes the identical app-wide mode-entry nav.
 * - `PageHeader` renders the app header for authenticated users and the
 *   `SiteHeader` for anonymous visitors (it branches on `useAuth`).
 *
 * Auth gating stays an internal concern of `(app)/layout`; admin gating stays
 * in `(default-shell)/admin/layout`. Per-section sub-nav still flows through
 * `SubHeaderConfig`, breadcrumbs through `BreadcrumbConfig` — both unchanged.
 */
export default async function ShellLayout({
  children,
  params,
}: ShellLayoutProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PageHeaderConfigProvider>
        <DefaultHeaderConfig />
        <PageHeader />
        <CommandPalette />
        {children}
      </PageHeaderConfigProvider>
    </div>
  );
}
