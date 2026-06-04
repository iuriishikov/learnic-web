'use client';

import { useTranslations } from 'next-intl';

import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';

import type { BlogPostStatus } from '../model/types';

type StatusBadgeProps = {
  status: BlogPostStatus;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const t = useTranslations('blog-admin');
  const published = status === 'published';
  return (
    <Badge
      variant={published ? 'default' : 'secondary'}
      className={cn(
        'gap-1.5',
        published
          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
          : 'bg-muted text-muted-foreground',
        className,
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          published ? 'bg-emerald-500' : 'bg-muted-foreground/50',
        )}
        aria-hidden
      />
      {t(`status.${status}`)}
    </Badge>
  );
}
