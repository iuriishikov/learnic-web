import { ArrowUpRightIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/shared/lib/utils';

import type { PublicUserProfile } from '../model/types';

type ProfileInfoRowProps = {
  profile: PublicUserProfile;
  className?: string;
};

function stripScheme(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '');
}

export function ProfileInfoRow({ profile, className }: ProfileInfoRowProps) {
  const t = useTranslations('user-profile.info');

  const cells: Array<{
    key: string;
    label: string;
    href: string | null;
    display: string | null;
    external: boolean;
  }> = [
    {
      key: 'website',
      label: t('website'),
      href: profile.websiteUrl,
      display: profile.websiteUrl ? stripScheme(profile.websiteUrl) : null,
      external: true,
    },
    {
      key: 'portfolio',
      label: t('portfolio'),
      href: profile.portfolioUrl,
      display: profile.portfolioUrl ? stripScheme(profile.portfolioUrl) : null,
      external: true,
    },
    {
      key: 'email',
      label: t('email'),
      href: profile.publicEmail ? `mailto:${profile.publicEmail}` : null,
      display: profile.publicEmail,
      external: false,
    },
  ];

  return (
    <dl
      className={cn(
        'grid grid-cols-1 gap-x-6 gap-y-4 rounded-xl bg-muted/50 p-4 ring-1 ring-border/70 sm:grid-cols-3 md:p-5 dark:bg-muted/30',
        className,
      )}
    >
      {cells.map((cell) => (
        <div key={cell.key} className="flex min-w-0 flex-col gap-1">
          <dt className="text-xs font-medium text-muted-foreground">
            {cell.label}
          </dt>
          <dd className="min-w-0 truncate">
            {cell.href && cell.display ? (
              <ContactLink href={cell.href} external={cell.external}>
                {cell.display}
              </ContactLink>
            ) : (
              <span
                aria-label={t('empty')}
                className="text-sm font-semibold text-brand"
              >
                —
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ContactLink({
  href,
  children,
  external,
}: {
  href: string;
  children: React.ReactNode;
  external: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : null)}
      className="inline-flex max-w-full items-center gap-1 text-sm font-semibold text-brand transition-colors hover:text-brand/80 focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <span className="truncate">{children}</span>
      {external ? (
        <ArrowUpRightIcon className="size-3.5 shrink-0" aria-hidden="true" />
      ) : null}
    </a>
  );
}
