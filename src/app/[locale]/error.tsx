'use client';

import { useEffect } from 'react';

import { parseHttpStatusFromDigest } from '@/shared/lib/http-error';
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
      <PageHeader />
      <main className="flex-1">
        <StatusErrorContent status={status} />
      </main>
      <SiteFooter />
    </div>
  );
}
