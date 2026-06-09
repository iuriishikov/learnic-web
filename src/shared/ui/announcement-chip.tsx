import { ArrowRightIcon } from 'lucide-react';

import { Badge } from '@/shared/ui/badge';

export type AnnouncementChipProps = {
  badge: string;
  linkText: string;
  href?: string;
  /** Open the link in a new tab (external destinations). */
  external?: boolean;
};

export function AnnouncementChip({
  badge,
  linkText,
  href = '#',
  external = false,
}: AnnouncementChipProps) {
  return (
    <Badge
      variant="outline"
      render={
        <a
          href={href}
          target={external ? '_blank' : undefined}
          rel={external ? 'noopener noreferrer' : undefined}
        />
      }
      className="inline-flex h-auto items-center gap-2 overflow-visible rounded-lg border-border bg-background p-1 pr-3.5 text-[13px] font-medium shadow-sm hover:bg-muted/40"
    >
      <span className="inline-flex items-center gap-1.5 rounded-[6px] border border-border bg-background px-2.5 py-1 text-foreground">
        <span
          aria-hidden
          className="relative inline-flex size-1.5 shrink-0 items-center justify-center"
        >
          <span className="absolute inline-block size-3 rounded-full bg-brand/25" />
          <span className="relative inline-block size-1.5 rounded-full bg-brand" />
        </span>
        {badge}
      </span>
      <span className="inline-flex items-center gap-1.5 text-foreground">
        {linkText}
        <ArrowRightIcon className="size-3.5 shrink-0 text-muted-foreground" />
      </span>
    </Badge>
  );
}
