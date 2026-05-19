'use client';

import { useEffect } from 'react';

import { parseHttpStatusFromDigest } from '@/shared/lib/http-error';
import { DefaultHeaderConfig } from '@/widgets/app-header';
import {
  StatusErrorContent,
  resolveSupportedStatus,
} from '@/widgets/error-content';
import { PageHeader } from '@/widgets/page-header';
import { SiteFooter } from '@/widgets/site-footer';

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function LocaleErrorPage({ error }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const status = resolveSupportedStatus(parseHttpStatusFromDigest(error.digest));

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/*
        Contribute the three mode-entry tabs to the locale-root
        HeaderConfigProvider so the AppHeader on the error page
        still feels navigable. ``[locale]/(app)/(learn)`` /
        ``(teach)`` layouts would normally set their own
        ``HeaderConfig``, but on a thrown error the closest
        ``error.tsx`` boundary replaces the page subtree — those
        layout configs unmount and we'd be left with the empty
        ``DEFAULT_CONFIG`` without this.
      */}
      <DefaultHeaderConfig />
      <PageHeader />
      <main className="flex-1">
        <StatusErrorContent status={status} />
      </main>
      <SiteFooter />
    </div>
  );
}
