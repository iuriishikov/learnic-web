'use client';

import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import type { Locale as RdpLocale } from 'react-day-picker';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { TextInput } from '@/shared/ui/input-extended';
import { Separator } from '@/shared/ui/separator';

export function DateDisplayInput({
  date,
  locale,
  ariaLabel,
  placeholder,
  className,
  formatStr = 'PP',
}: {
  date: Date | undefined;
  locale: RdpLocale;
  ariaLabel?: string;
  placeholder?: string;
  className?: string;
  formatStr?: string;
}) {
  const value = date ? format(date, formatStr, { locale }) : '';
  return (
    <TextInput
      type="text"
      readOnly
      value={value}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={cn(
        'h-9 cursor-default font-medium text-foreground',
        className,
      )}
    />
  );
}

export function FooterStacked({
  onCancel,
  onApply,
  applyDisabled,
}: {
  onCancel: () => void;
  onApply: () => void;
  applyDisabled?: boolean;
}) {
  const t = useTranslations('date-picker.buttons');
  return (
    <>
      <Separator />
      <div className="grid grid-cols-2 gap-2 p-3">
        <Button
          variant="outline"
          size="lg"
          onClick={onCancel}
          className="w-full"
        >
          {t('cancel')}
        </Button>
        <Button
          size="lg"
          onClick={onApply}
          disabled={applyDisabled}
          className="w-full"
        >
          {t('apply')}
        </Button>
      </div>
    </>
  );
}

export function InlineFooterActions({
  onCancel,
  onApply,
  applyDisabled,
}: {
  onCancel: () => void;
  onApply: () => void;
  applyDisabled?: boolean;
}) {
  const t = useTranslations('date-picker.buttons');
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="lg" onClick={onCancel}>
        {t('cancel')}
      </Button>
      <Button size="lg" onClick={onApply} disabled={applyDisabled}>
        {t('apply')}
      </Button>
    </div>
  );
}
