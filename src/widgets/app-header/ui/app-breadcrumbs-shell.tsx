'use client';

import { useMemo } from 'react';

import { AppBreadcrumbs } from './app-breadcrumbs';
import {
  useBreadcrumbContributions,
  type BreadcrumbSegment,
} from './breadcrumb-config-provider';

export function AppBreadcrumbsShell() {
  const contributions = useBreadcrumbContributions();

  const segments = useMemo<BreadcrumbSegment[]>(() => {
    return Array.from(contributions.values())
      .sort((a, b) => a.order - b.order)
      .flatMap((c) => c.segments);
  }, [contributions]);

  return <AppBreadcrumbs segments={segments} />;
}
