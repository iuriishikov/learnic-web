'use client';

import { GlobeIcon, LockIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/shared/lib/utils';

import type { ProductType, ProductVisibility } from '../model/types';

export function ProductTypeChip({
  type,
  className,
}: {
  type: ProductType;
  className?: string;
}) {
  const t = useTranslations('teach-products.type');
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.06em] text-foreground/80 ring-1 ring-foreground/10',
        className,
      )}
    >
      {t(type)}
    </span>
  );
}

export function ProductVisibilityChip({
  visibility,
  className,
}: {
  visibility: ProductVisibility;
  className?: string;
}) {
  const t = useTranslations('marketplace.detail.visibility');
  const isPublic = visibility === 'public';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-foreground/10',
        isPublic
          ? 'bg-muted text-muted-foreground'
          : 'bg-foreground/[0.06] text-foreground/80',
        className,
      )}
    >
      {isPublic ? (
        <GlobeIcon className="size-3" aria-hidden />
      ) : (
        <LockIcon className="size-3" aria-hidden />
      )}
      {isPublic ? t('public') : t('private')}
    </span>
  );
}
