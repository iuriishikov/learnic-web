import type { CardBank } from '@/shared/ui/payment-card-brands';

/**
 * Static BIN → bank table for the major Russian banks we render on the
 * dashboard. Keyed by the leading digits (4, 6 or 8 chars); during lookup
 * we try the longest prefix first and fall back to shorter ones.
 *
 * Coverage is pragmatic, not exhaustive — these are the well-known stable
 * prefixes that each bank still issues today (per public BIN registries).
 * If a card from a smaller / regional bank or a newly-allocated BIN comes
 * in, we return `null` and the caller decides how to handle it.
 */
export const BANK_BIN_PREFIXES: Record<string, CardBank> = {
  // ─── СберБанк ─────────────────────────────────────────────────────────
  '2202': 'sber', // МИР
  '4276': 'sber', // Visa
  '4279': 'sber', // Visa
  '5336': 'sber', // Mastercard
  '5469': 'sber', // Mastercard
  '6390': 'sber', // Maestro

  // ─── Альфа-Банк ───────────────────────────────────────────────────────
  '4154': 'alfa', // Visa
  '5486': 'alfa', // Mastercard
  '5559': 'alfa', // Mastercard
  '521178': 'alfa', // Mastercard
  '548673': 'alfa', // Mastercard

  // ─── Т-Банк (Тинькофф) ────────────────────────────────────────────────
  '4377': 'tinkoff', // Visa
  '4377722': 'tinkoff',
  '5213': 'tinkoff', // Mastercard
  '521324': 'tinkoff', // Mastercard
  '521335': 'tinkoff',
  '5489': 'tinkoff', // Mastercard
  '553691': 'tinkoff', // Mastercard
  '220070': 'tinkoff', // МИР (T-Black МИР)

  // ─── ВТБ ──────────────────────────────────────────────────────────────
  '4272': 'vtb', // Visa
  '4469': 'vtb', // Visa
  '5443': 'vtb', // Mastercard
  '522225': 'vtb',
  '447236': 'vtb',

  // ─── Райффайзенбанк ───────────────────────────────────────────────────
  '4627': 'raif', // Visa
  '5100': 'raif', // Mastercard
  '510172': 'raif',
  '462729': 'raif',

  // ─── Газпромбанк ──────────────────────────────────────────────────────
  '5483': 'gazprom', // Mastercard
  '5254': 'gazprom',
  '425482': 'gazprom',
  '548601': 'gazprom',

  // ─── Озон Банк ────────────────────────────────────────────────────────
  '2204': 'ozon', // МИР
  '220443': 'ozon',
  '220460': 'ozon',

  // ─── Точка ────────────────────────────────────────────────────────────
  '5536': 'tochka', // Mastercard — Точка использует этот префикс
  '526421': 'tochka',

  // ─── Совкомбанк ───────────────────────────────────────────────────────
  // Note: 4377 overlaps with Tinkoff — assigned to Tinkoff above.
  '5484': 'sovkom', // Mastercard
  '524826': 'sovkom',

  // ─── ФК Открытие ──────────────────────────────────────────────────────
  '4246': 'otkritie', // Visa
  '5246': 'otkritie', // Mastercard
  '4246160': 'otkritie',

  // ─── Яндекс Pay (фактически выпускается через банки-партнёры) ─────────
  '4274680': 'yandex',
  '559967': 'yandex',

  // ─── МТС Банк ─────────────────────────────────────────────────────────
  '5101': 'mts', // Mastercard
  '5599': 'mts',
  '510124': 'mts',
};

/** Lengths to probe, longest first. */
export const BIN_PREFIX_LENGTHS = [8, 7, 6, 5, 4] as const;
