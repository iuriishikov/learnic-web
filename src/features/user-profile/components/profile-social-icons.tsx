'use client';

import { useTranslations } from 'next-intl';

import type { SocialLink } from '@/features/user-contacts';
import { cn } from '@/shared/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/popover';

import {
  SocialIcon,
  getSocialLabel,
  resolveExtendedKind,
} from './social-icon-catalog';

type ProfileSocialIconsProps = {
  items: SocialLink[];
  className?: string;
};

// Cap the inline strip so a user with 30 services doesn't blow out the
// profile header. The rest collapse into a "+N" trigger that opens a
// popover with the full list — labelled, scrollable, keyboard-reachable.
const MAX_INLINE = 6;

export function ProfileSocialIcons({ items, className }: ProfileSocialIconsProps) {
  const t = useTranslations('user-profile.socials');
  if (items.length === 0) return null;

  const showOverflow = items.length > MAX_INLINE;
  const visibleCount = showOverflow ? MAX_INLINE - 1 : items.length;
  const visible = items.slice(0, visibleCount);
  const overflow = items.slice(visibleCount);

  return (
    <div className={cn('flex items-center gap-3.5', className)}>
      <ul className="flex items-center gap-4">
        {visible.map((item) => (
          <li key={`${item.kind}-${item.url}`}>
            <SocialAnchor link={item} />
          </li>
        ))}
      </ul>
      {overflow.length > 0 ? (
        <Popover>
          <PopoverTrigger
            render={
              <button
                type="button"
                aria-label={t('moreLabel', { count: overflow.length })}
                className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-muted px-2 text-xs font-semibold text-muted-foreground ring-1 ring-border transition-colors hover:bg-muted/80 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              />
            }
          >
            +{overflow.length}
          </PopoverTrigger>
          <PopoverContent align="end" sideOffset={8} className="w-72 p-0">
            <div className="border-b border-border px-3 py-2 text-xs font-semibold text-muted-foreground">
              {t('moreTitle')}
            </div>
            <ul className="max-h-72 overflow-y-auto p-1">
              {overflow.map((item) => (
                <SocialPopoverItem key={`${item.kind}-${item.url}`} link={item} />
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  );
}

function SocialAnchor({ link }: { link: SocialLink }) {
  const label = getSocialLabel(resolveExtendedKind(link));
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={label}
      title={label}
      className="inline-flex size-5 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <SocialIcon link={link} className="size-5" />
    </a>
  );
}

function SocialPopoverItem({ link }: { link: SocialLink }) {
  const label = getSocialLabel(resolveExtendedKind(link));
  const host = readableHost(link.url);
  return (
    <li>
      <a
        href={link.url}
        target="_blank"
        rel="noreferrer noopener"
        className="flex items-center gap-3 rounded-md px-2.5 py-2 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
      >
        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground ring-1 ring-border">
          <SocialIcon link={link} className="size-4" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium text-foreground">
            {label}
          </span>
          <span className="truncate text-xs text-muted-foreground">{host}</span>
        </span>
      </a>
    </li>
  );
}

function readableHost(url: string): string {
  if (url.startsWith('mailto:')) return url.replace(/^mailto:/, '');
  try {
    const { hostname, pathname } = new URL(url);
    const host = hostname.replace(/^www\./, '');
    const path = pathname.replace(/\/$/, '');
    return path && path !== '/' ? `${host}${path}` : host;
  } catch {
    return url;
  }
}
