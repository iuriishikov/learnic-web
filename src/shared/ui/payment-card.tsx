import * as React from 'react';

import { cn } from '@/shared/lib/utils';

import {
  BANK_PRESETS,
  CardChip,
  NetworkLogo,
  type CardBank,
  type CardNetwork,
} from './payment-card-brands';

type PaymentCardProps = React.ComponentProps<'div'> & {
  bank: CardBank;
  network: CardNetwork;
  /** First 6-8 digits (BIN) — safe to store and display. */
  firstDigits: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  holderName: string;
};

export function PaymentCard({
  bank,
  network,
  firstDigits,
  last4,
  expiryMonth,
  expiryYear,
  holderName,
  className,
  ...props
}: PaymentCardProps) {
  const preset = BANK_PRESETS[bank];
  const groups = buildMaskedGroups(firstDigits, last4);
  const Wordmark = preset.Wordmark;
  const onDark = preset.onDark;
  const expiry = `${String(expiryMonth).padStart(2, '0')}/${String(expiryYear).padStart(2, '0')}`;

  return (
    <div
      data-slot="payment-card"
      data-bank={bank}
      className={cn(
        'relative isolate flex aspect-[1.586] w-full flex-col overflow-hidden rounded-2xl p-5 shadow-lg select-none',
        preset.background,
        'ring-1',
        preset.ring,
        onDark ? 'text-white' : 'text-neutral-900',
        className,
      )}
      {...props}
    >
      <div className="relative z-10">
        <Wordmark />
      </div>

      <div className="relative z-10 mt-auto space-y-3">
        <CardChip />
        <div className="flex items-center gap-3 text-[11px] font-medium tracking-[0.18em]">
          <span className="uppercase">{holderName}</span>
          <span className="opacity-70">{expiry}</span>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div
            className="flex items-baseline gap-2 font-mono text-[15px] tracking-[0.08em] tabular-nums"
            aria-label={`Card number ending in ${last4}`}
          >
            {groups.map((group, i) => (
              <span key={i}>{group}</span>
            ))}
          </div>
          <NetworkLogo network={network} className="h-6 shrink-0" onDark={onDark} />
        </div>
      </div>
    </div>
  );
}

/**
 * Build the 4×4-digit groups for display from the safe-to-store mask:
 * BIN (6) + filler (•) + last4. Result is always 16 chars over 4 groups.
 */
function buildMaskedGroups(firstDigits: string, last4: string): string[] {
  const bin = firstDigits.replace(/\D/g, '').slice(0, 8).padEnd(6, '•');
  const tail = last4.replace(/\D/g, '').slice(-4).padStart(4, '•');
  const middle = '•'.repeat(Math.max(0, 16 - bin.length - 4));
  const masked = bin + middle + tail;
  return [0, 4, 8, 12].map((start) => masked.slice(start, start + 4));
}
