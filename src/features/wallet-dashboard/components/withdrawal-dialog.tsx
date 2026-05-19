'use client';

import { ArrowUpRightIcon, CheckIcon } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import * as React from 'react';

import { useNotify } from '@/shared/lib/notify';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@/shared/ui/number-field';
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

type WithdrawalDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
  cards: WalletCard[];
};

const FEE_PERCENT = 0.5; // 0.5% mock fee

export function WithdrawalDialog({
  open,
  onOpenChange,
  availableBalance,
  cards,
}: WithdrawalDialogProps) {
  const t = useTranslations('teach-dashboard.wallet.withdrawal');
  const format = useFormatter();
  const notify = useNotify();

  const [amount, setAmount] = React.useState<number>(() =>
    Math.min(10_000, availableBalance),
  );
  const [cardId, setCardId] = React.useState<string>(cards[0]?.id ?? '');

  const fee = Math.max(0, Math.round(amount * FEE_PERCENT) / 100);
  const total = Math.max(0, amount - fee);
  const selectedCard = cards.find((c) => c.id === cardId);
  const overLimit = amount > availableBalance;
  const tooSmall = amount < 100;
  const disabled = !selectedCard || overLimit || tooSmall;

  function handleSubmit() {
    if (!selectedCard) return;
    notify.success(
      t('successTitle', {
        amount: format.number(total, {
          style: 'currency',
          currency: 'RUB',
          maximumFractionDigits: 2,
        }),
      }),
      {
        description: t('successDescription', {
          bank: BANK_PRESETS[selectedCard.bank].label,
          last4: selectedCard.last4,
        }),
      },
    );
    onOpenChange(false);
  }

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange}>
      <ResponsiveSheetContent>
        <ResponsiveSheetHeader>
          <div className="space-y-1">
            <ResponsiveSheetTitle>{t('title')}</ResponsiveSheetTitle>
            <ResponsiveSheetDescription>
              {t('description', {
                balance: format.number(availableBalance, {
                  style: 'currency',
                  currency: 'RUB',
                  maximumFractionDigits: 2,
                }),
              })}
            </ResponsiveSheetDescription>
          </div>
          <ResponsiveSheetClose />
        </ResponsiveSheetHeader>

        <ResponsiveSheetBody className="gap-5">
          <section className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              {t('amountLabel')}
            </label>
            <NumberField
              value={amount}
              onValueChange={(v) => setAmount(v ?? 0)}
              min={0}
              max={availableBalance}
              step={500}
            >
              <NumberFieldGroup className="h-12">
                <NumberFieldDecrement />
                <NumberFieldInput className="text-center text-lg font-semibold" />
                <NumberFieldIncrement />
              </NumberFieldGroup>
            </NumberField>
            <div className="flex flex-wrap gap-2">
              {[1_000, 5_000, 10_000, availableBalance].map((value, i) => (
                <button
                  key={i}
                  type="button"
                  className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted/70"
                  onClick={() => setAmount(value)}
                >
                  {i === 3
                    ? t('amountMax')
                    : format.number(value, {
                        style: 'currency',
                        currency: 'RUB',
                        maximumFractionDigits: 0,
                      })}
                </button>
              ))}
            </div>
            {overLimit ? (
              <p className="text-xs text-destructive">{t('errorOverLimit')}</p>
            ) : tooSmall ? (
              <p className="text-xs text-destructive">{t('errorTooSmall')}</p>
            ) : null}
          </section>

          <section className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              {t('cardLabel')}
            </label>
            <div role="radiogroup" className="space-y-2">
              {cards.map((card) => {
                const checked = card.id === cardId;
                return (
                  <button
                    key={card.id}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    onClick={() => setCardId(card.id)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                      checked
                        ? 'border-brand bg-brand/5 ring-1 ring-brand/40'
                        : 'border-border hover:bg-muted/40',
                    )}
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
                      </p>
                    </div>
                    {checked ? (
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
                        <CheckIcon className="size-3" />
                      </span>
                    ) : (
                      <span
                        aria-hidden
                        className="size-5 shrink-0 rounded-full border-2 border-muted-foreground/30"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-2 rounded-xl bg-muted/40 p-3 text-xs">
            <Row
              label={t('summary.amount')}
              value={format.number(amount, {
                style: 'currency',
                currency: 'RUB',
                maximumFractionDigits: 2,
              })}
            />
            <Row
              label={t('summary.fee', { percent: FEE_PERCENT })}
              value={`− ${format.number(fee, {
                style: 'currency',
                currency: 'RUB',
                maximumFractionDigits: 2,
              })}`}
            />
            <div className="my-1 border-t border-border" />
            <Row
              label={t('summary.total')}
              value={format.number(total, {
                style: 'currency',
                currency: 'RUB',
                maximumFractionDigits: 2,
              })}
              emphasize
            />
          </section>
        </ResponsiveSheetBody>

        <ResponsiveSheetFooter>
          <ResponsiveSheetClose
            render={
              <Button type="button" variant="outline">
                {t('cancel')}
              </Button>
            }
          />
          <Button
            type="button"
            disabled={disabled}
            className="gap-1.5"
            onClick={handleSubmit}
          >
            <ArrowUpRightIcon className="size-4" />
            {t('submit', {
              amount: format.number(total, {
                style: 'currency',
                currency: 'RUB',
                maximumFractionDigits: 0,
              }),
            })}
          </Button>
        </ResponsiveSheetFooter>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  );
}

function Row({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          'font-medium tabular-nums',
          emphasize
            ? 'font-heading text-sm font-semibold text-foreground'
            : 'text-foreground',
        )}
      >
        {value}
      </span>
    </div>
  );
}
