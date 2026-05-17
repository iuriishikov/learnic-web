/**
 * Money-related primitives shared across features.
 *
 * Backend mirror: amounts travel as **integer minor units** of the
 * currency (kopecks for RUB). Floats never appear on the wire or in
 * arithmetic — every conversion to "1.50 RUB" happens at the render
 * boundary via `next-intl`'s formatter.
 *
 * The union currently lists every currency the backend ENUM reserves
 * for future markets (`KZT`/`BYN`), even though only `RUB` is live
 * today. Mirroring the wider backend type keeps the closed-set rule
 * from `CLAUDE.md` intact: missing variants would slip past `tsc` and
 * crash through `default:` branches at runtime when a future market
 * ships.
 */
export type Currency = 'USD' | 'EUR' | 'RUB' | 'KZT' | 'BYN';

/** Sum in the minimal unit of the currency (kopecks for RUB). */
export type MinorAmount = number;

export type Money = {
  amount: MinorAmount;
  currency: Currency;
};
