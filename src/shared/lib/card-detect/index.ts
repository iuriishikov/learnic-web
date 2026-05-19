import creditCardType from 'credit-card-type';

import type {
  CardBank,
  CardNetwork,
} from '@/shared/ui/payment-card-brands';

import { BANK_BIN_PREFIXES, BIN_PREFIX_LENGTHS } from './bank-bins';

export type DetectedCard = {
  /** Best-effort bank match, or null when the BIN is not in our table. */
  bank: CardBank | null;
  /** Best-effort payment network match (Visa / Mastercard / Mir / UnionPay). */
  network: CardNetwork | null;
};

const NETWORK_MAP: Record<string, CardNetwork> = {
  visa: 'visa',
  mastercard: 'mastercard',
  mir: 'mir',
  unionpay: 'unionpay',
};

/**
 * Offline-only card detector — no API calls.
 *
 * - **Bank** comes from a static BIN table (`bank-bins.ts`) covering the
 *   12 banks we render on the dashboard. Longest prefix wins.
 * - **Network** is delegated to `credit-card-type`, which covers Visa,
 *   Mastercard, Mir, UnionPay and several others.
 *
 * Accepts the card number with any whitespace / hyphens.
 * Works even on a partial input — useful for live preview as the user
 * types: the first 4-6 digits are enough to resolve both fields for most
 * Russian cards.
 */
export function detectCard(input: string): DetectedCard {
  const digits = (input ?? '').replace(/\D/g, '');
  return {
    bank: detectBank(digits),
    network: detectNetwork(digits),
  };
}

export function detectBank(digits: string): CardBank | null {
  if (!digits) return null;
  for (const len of BIN_PREFIX_LENGTHS) {
    if (digits.length < len) continue;
    const key = digits.slice(0, len);
    const bank = BANK_BIN_PREFIXES[key];
    if (bank) return bank;
  }
  return null;
}

export function detectNetwork(digits: string): CardNetwork | null {
  if (!digits) return null;
  const matches = creditCardType(digits);
  for (const match of matches) {
    const mapped = NETWORK_MAP[match.type];
    if (mapped) return mapped;
  }
  return null;
}

export { BANK_BIN_PREFIXES };
