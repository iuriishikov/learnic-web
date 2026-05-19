'use client';

import { CreditCardIcon, TrashIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import * as React from 'react';

import { useNotify } from '@/shared/lib/notify';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  BANK_PRESETS,
  NetworkLogo,
} from '@/shared/ui/payment-card-brands';
import {
  ResponsiveSheet,
  ResponsiveSheetBody,
  ResponsiveSheetClose,
  ResponsiveSheetContent,
  ResponsiveSheetDescription,
  ResponsiveSheetFooter,
  ResponsiveSheetHeader,
  ResponsiveSheetTitle,
} from '@/shared/ui/responsive-sheet';

import type { WalletCard } from '../model/types';

type ManageCardsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cards: WalletCard[];
  onCardsChange: (cards: WalletCard[]) => void;
};

export function ManageCardsDialog({
  open,
  onOpenChange,
  cards,
  onCardsChange,
}: ManageCardsDialogProps) {
  const t = useTranslations('teach-dashboard.wallet.manageCards');
  const notify = useNotify();

  function handleRemove(card: WalletCard) {
    onCardsChange(cards.filter((c) => c.id !== card.id));
    notify.success(t('removedToast', { bank: BANK_PRESETS[card.bank].label }));
  }

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange}>
      <ResponsiveSheetContent>
        <ResponsiveSheetHeader>
          <div className="space-y-1">
            <ResponsiveSheetTitle>{t('title')}</ResponsiveSheetTitle>
            <ResponsiveSheetDescription>
              {t('description')}
            </ResponsiveSheetDescription>
          </div>
          <ResponsiveSheetClose />
        </ResponsiveSheetHeader>

        <ResponsiveSheetBody className="gap-6">
          {cards.length === 0 ? (
            <EmptyState />
          ) : (
            <section className="space-y-3">
              <header className="flex items-baseline justify-between">
                <h4 className="text-sm font-semibold text-foreground">
                  {t('existingTitle')}
                </h4>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {t('count', { count: cards.length })}
                </span>
              </header>
              <ul className="space-y-2">
                {cards.map((card) => (
                  <li
                    key={card.id}
                    className="group flex items-center gap-3 rounded-xl border border-border bg-card p-2 pr-3 transition-colors hover:bg-muted/40"
                  >
                    <div
                      className={cn(
                        'inline-flex size-10 shrink-0 items-center justify-center rounded-lg ring-1',
                        BANK_PRESETS[card.bank].background,
                        BANK_PRESETS[card.bank].ring,
                      )}
                    >
                      <span
                        className={cn(
                          'text-[10px] font-extrabold tracking-tight',
                          BANK_PRESETS[card.bank].onDark
                            ? 'text-white'
                            : 'text-neutral-900',
                        )}
                      >
                        {BANK_PRESETS[card.bank].label.slice(0, 4)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {BANK_PRESETS[card.bank].label}
                      </p>
                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <NetworkLogo
                          network={card.network}
                          className="h-3 shrink-0"
                          onDark={false}
                        />
                        <span>•• {card.last4}</span>
                        <span aria-hidden>·</span>
                        <span className="tabular-nums">
                          {String(card.expiryMonth).padStart(2, '0')}/
                          {String(card.expiryYear).padStart(2, '0')}
                        </span>
                        <span aria-hidden>·</span>
                        <span>{t(`kind.${card.kind}`)}</span>
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={t('removeAria', {
                        bank: BANK_PRESETS[card.bank].label,
                      })}
                      className="size-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemove(card)}
                    >
                      <TrashIcon className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="rounded-lg bg-muted/40 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
            {t('addInfo')}
          </p>
        </ResponsiveSheetBody>

        <ResponsiveSheetFooter>
          <ResponsiveSheetClose
            render={
              <Button type="button" variant="outline">
                {t('close')}
              </Button>
            }
          />
        </ResponsiveSheetFooter>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  );
}

function EmptyState() {
  const t = useTranslations('teach-dashboard.wallet.manageCards');
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
        <CreditCardIcon className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="font-heading text-sm font-semibold text-foreground">
          {t('emptyTitle')}
        </p>
        <p className="text-xs text-muted-foreground">{t('emptyDescription')}</p>
      </div>
    </div>
  );
}
