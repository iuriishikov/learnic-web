'use client';

import { MoreHorizontalIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/shared/ui/button';
import { Separator } from '@/shared/ui/separator';

import { useComingSoon } from '../lib/use-coming-soon';

type SectionHeaderProps = {
  title: string;
  /** Render the underline rule beneath the heading row. Defaults to `true`. */
  showSeparator?: boolean;
};

export function SectionHeader({
  title,
  showSeparator = true,
}: SectionHeaderProps) {
  const t = useTranslations('admin-dashboard');
  const comingSoon = useComingSoon();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('moreActions')}
          onClick={comingSoon}
        >
          <MoreHorizontalIcon />
        </Button>
      </div>
      {showSeparator ? <Separator /> : null}
    </div>
  );
}
