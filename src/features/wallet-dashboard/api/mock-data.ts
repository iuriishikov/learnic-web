import { detectCard } from '@/shared/lib/card-detect';

import type {
  Account,
  BalancePoint,
  Transaction,
  WalletCard,
} from '../model/types';

import type {
  CardBank,
  CardNetwork,
} from '@/shared/ui/payment-card-brands';

type CardSeed = Omit<WalletCard, 'bank' | 'network'> & {
  /** Override the auto-detected bank — useful when the BIN is ambiguous. */
  bank?: CardBank;
  network?: CardNetwork;
};

function fillCard(seed: CardSeed): WalletCard {
  const detected = detectCard(seed.firstDigits);
  return {
    ...seed,
    bank: seed.bank ?? detected.bank ?? 'sber',
    network: seed.network ?? detected.network ?? 'mir',
  };
}

const AVAILABLE_BALANCE = 40_206.2;
const PENDING_BALANCE = 6_421.1;

function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function getAccountsMock(): Promise<Account[]> {
  const accounts: Account[] = [
    {
      id: 'available',
      kind: 'available',
      balance: AVAILABLE_BALANCE,
      trendPercent: 3.4,
    },
    {
      id: 'pending',
      kind: 'pending',
      balance: PENDING_BALANCE,
      trendPercent: 2,
      holdDays: 14,
    },
  ];
  return delay(accounts, 650);
}

export function getBalanceSeriesMock(): Promise<BalancePoint[]> {
  const base = 18_500;
  const noise = [0, -1100, 700, 1800, 1200, 2500, 3300, 4400, 4100, 5600, 6900, 8200];
  const secondary = [0, -800, 200, 700, 900, 1400, 1900, 2300, 2500, 3100, 3600, 4200];
  const series: BalancePoint[] = noise.map((n, i) => ({
    monthIndex: i,
    current: Math.round(base + n + Math.sin(i * 1.4) * 600),
    previous: Math.round(base - 3500 + secondary[i]! + Math.cos(i * 1.1) * 400),
  }));
  return delay(series, 800);
}

export function getCardsMock(): Promise<WalletCard[]> {
  const seeds: CardSeed[] = [
    {
      id: 'card-sber',
      processor: 'yookassa',
      processorToken: 'pm_yk_5b1f4e9a-sber-mock',
      firstDigits: '220220',
      last4: '5678',
      expiryMonth: 6,
      expiryYear: 28,
      holderName: 'Iurii Shikov',
      kind: 'debit',
      dailyWithdrawalUsed: 18_400,
      dailyWithdrawalLimit: 150_000,
    },
    {
      id: 'card-tinkoff',
      processor: 'yookassa',
      processorToken: 'pm_yk_7c2d1a3b-tcs-mock',
      firstDigits: '553691',
      last4: '5678',
      expiryMonth: 12,
      expiryYear: 29,
      holderName: 'Iurii Shikov',
      kind: 'credit',
      dailyWithdrawalUsed: 42_500,
      dailyWithdrawalLimit: 100_000,
    },
    {
      id: 'card-alfa',
      processor: 'yookassa',
      processorToken: 'pm_yk_9e3f2c4d-alfa-mock',
      firstDigits: '415481',
      last4: '1234',
      expiryMonth: 3,
      expiryYear: 27,
      holderName: 'Iurii Shikov',
      kind: 'debit',
      dailyWithdrawalUsed: 7_900,
      dailyWithdrawalLimit: 200_000,
    },
    {
      id: 'card-ozon',
      processor: 'yookassa',
      processorToken: 'pm_yk_a1b2c3d4-ozon-mock',
      firstDigits: '220443',
      last4: '5678',
      expiryMonth: 9,
      expiryYear: 28,
      holderName: 'Iurii Shikov',
      kind: 'debit',
      dailyWithdrawalUsed: 0,
      dailyWithdrawalLimit: 75_000,
    },
  ];
  return delay(seeds.map(fillCard), 700);
}

export function getRecentTransactionsMock(): Promise<Transaction[]> {
  const transactions: Transaction[] = [
    { id: 't1', kind: 'deposit', method: 'card', title: 'Покупка курса «Алгебра 11 класс»', meta: 'Visa •• 1234', amount: 4_990, occurredAt: '2026-05-18T18:14:00' },
    { id: 't2', kind: 'withdrawal', method: 'sber-online', title: 'Вывод на СберБанк •• 5678', meta: 'СБП • 2 минуты', amount: -12_500, occurredAt: '2026-05-18T16:02:00' },
    { id: 't3', kind: 'deposit', method: 'sbp', title: 'Покупка курса «Подготовка к ЕГЭ»', meta: 'СБП • Анна К.', amount: 8_900, occurredAt: '2026-05-18T13:40:00' },
    { id: 't4', kind: 'withdrawal', method: 'card', title: 'Вывод на Т-Банк •• 9931', meta: 'Mastercard • моментально', amount: -25_000, occurredAt: '2026-05-17T22:11:00' },
    { id: 't5', kind: 'deposit', method: 'yoomoney', title: 'Покупка вебинара «Python для всех»', meta: 'ЮMoney', amount: 1_990, occurredAt: '2026-05-17T19:05:00' },
    { id: 't6', kind: 'deposit', method: 'stripe', title: 'Поступление от Stripe Connect', meta: 'billing@stripe.com', amount: 33_700, occurredAt: '2026-05-17T11:23:00' },
    { id: 't7', kind: 'withdrawal', method: 'card', title: 'Вывод на Альфа-Банк •• 1234', meta: 'Visa • 30 секунд', amount: -18_400, occurredAt: '2026-05-16T20:38:00' },
    { id: 't8', kind: 'deposit', method: 'sbp', title: 'Покупка интенсива «Геометрия»', meta: 'СБП • Михаил Д.', amount: 5_400, occurredAt: '2026-05-16T14:50:00' },
    { id: 't9', kind: 'deposit', method: 'card', title: 'Покупка курса «История XX века»', meta: 'Mastercard •• 4421', amount: 7_900, occurredAt: '2026-05-16T10:01:00' },
    { id: 't10', kind: 'deposit', method: 'sbp', title: 'Покупка курса «Сценарий короткого фильма»', meta: 'СБП • Дарья И.', amount: 12_300, occurredAt: '2026-05-15T22:48:00' },
    { id: 't11', kind: 'withdrawal', method: 'card', title: 'Вывод на ВТБ •• 3344', meta: 'МИР • моментально', amount: -42_000, occurredAt: '2026-05-15T18:22:00' },
    { id: 't12', kind: 'deposit', method: 'applePay', title: 'Покупка курса «Алгебра 11 класс»', meta: 'Apple Pay • Andrew M.', amount: 4_990, occurredAt: '2026-05-15T15:05:00' },
    { id: 't13', kind: 'deposit', method: 'stripe', title: 'Поступление от Stripe Connect', meta: 'billing@stripe.com', amount: 18_400, occurredAt: '2026-05-15T11:33:00' },
    { id: 't14', kind: 'deposit', method: 'sbp', title: 'Покупка интенсива «Геометрия»', meta: 'СБП • Олег Р.', amount: 5_400, occurredAt: '2026-05-14T20:18:00' },
    { id: 't15', kind: 'withdrawal', method: 'sber-online', title: 'Вывод на СберБанк •• 5678', meta: 'СБП • 1 минута', amount: -27_000, occurredAt: '2026-05-14T14:00:00' },
    { id: 't16', kind: 'deposit', method: 'card', title: 'Покупка курса «Профориентация подростков»', meta: 'Visa •• 8842', amount: 9_900, occurredAt: '2026-05-14T11:55:00' },
    { id: 't17', kind: 'deposit', method: 'yoomoney', title: 'Покупка вебинара «Python для всех»', meta: 'ЮMoney', amount: 1_990, occurredAt: '2026-05-13T22:42:00' },
    { id: 't18', kind: 'deposit', method: 'sbp', title: 'Покупка курса «Алгебра 11 класс»', meta: 'СБП • Камилла З.', amount: 4_990, occurredAt: '2026-05-13T19:11:00' },
    { id: 't19', kind: 'deposit', method: 'paypal', title: 'Поступление от PayPal', meta: 'alina@untitledui.com', amount: 8_300, occurredAt: '2026-05-13T15:00:00' },
    { id: 't20', kind: 'withdrawal', method: 'card', title: 'Вывод на Озон Банк •• 5611', meta: 'МИР • моментально', amount: -10_000, occurredAt: '2026-05-13T09:48:00' },
    { id: 't21', kind: 'deposit', method: 'card', title: 'Покупка курса «Подготовка к ЕГЭ»', meta: 'Mastercard •• 1108', amount: 8_900, occurredAt: '2026-05-12T21:30:00' },
    { id: 't22', kind: 'deposit', method: 'sbp', title: 'Покупка интенсива «Геометрия»', meta: 'СБП • Полина Б.', amount: 5_400, occurredAt: '2026-05-12T17:14:00' },
    { id: 't23', kind: 'withdrawal', method: 'sber-online', title: 'Вывод на СберБанк •• 5678', meta: 'СБП • 30 секунд', amount: -15_500, occurredAt: '2026-05-12T13:02:00' },
    { id: 't24', kind: 'deposit', method: 'card', title: 'Покупка курса «История XX века»', meta: 'Visa •• 4421', amount: 7_900, occurredAt: '2026-05-12T09:45:00' },
    { id: 't25', kind: 'deposit', method: 'sbp', title: 'Покупка курса «Подготовка к ОГЭ»', meta: 'СБП • Артур К.', amount: 6_900, occurredAt: '2026-05-11T21:55:00' },
    { id: 't26', kind: 'withdrawal', method: 'card', title: 'Вывод на Т-Банк •• 9931', meta: 'Mastercard • моментально', amount: -33_000, occurredAt: '2026-05-11T17:30:00' },
    { id: 't27', kind: 'deposit', method: 'card', title: 'Покупка вебинара «React для дизайнеров»', meta: 'Mastercard •• 8842', amount: 3_500, occurredAt: '2026-05-11T13:10:00' },
    { id: 't28', kind: 'deposit', method: 'applePay', title: 'Покупка интенсива «Алгоритмы»', meta: 'Apple Pay • Lena S.', amount: 12_300, occurredAt: '2026-05-11T09:48:00' },
    { id: 't29', kind: 'deposit', method: 'sbp', title: 'Покупка курса «Сценарий короткого фильма»', meta: 'СБП • Игорь М.', amount: 12_300, occurredAt: '2026-05-10T22:13:00' },
    { id: 't30', kind: 'withdrawal', method: 'sber-online', title: 'Вывод на СберБанк •• 5678', meta: 'СБП • 45 секунд', amount: -50_000, occurredAt: '2026-05-10T18:00:00' },
    { id: 't31', kind: 'deposit', method: 'card', title: 'Покупка курса «Алгебра 11 класс»', meta: 'Visa •• 4421', amount: 4_990, occurredAt: '2026-05-10T14:25:00' },
    { id: 't32', kind: 'deposit', method: 'sbp', title: 'Покупка вебинара «Python для всех»', meta: 'СБП • Надежда Х.', amount: 1_990, occurredAt: '2026-05-10T10:02:00' },
    { id: 't33', kind: 'deposit', method: 'yoomoney', title: 'Покупка интенсива «Геометрия»', meta: 'ЮMoney', amount: 5_400, occurredAt: '2026-05-09T20:50:00' },
    { id: 't34', kind: 'deposit', method: 'stripe', title: 'Поступление от Stripe Connect', meta: 'billing@stripe.com', amount: 22_400, occurredAt: '2026-05-09T16:34:00' },
    { id: 't35', kind: 'withdrawal', method: 'card', title: 'Вывод на ВТБ •• 3344', meta: 'МИР • моментально', amount: -15_000, occurredAt: '2026-05-09T12:11:00' },
    { id: 't36', kind: 'deposit', method: 'card', title: 'Покупка курса «Подготовка к ЕГЭ»', meta: 'Mastercard •• 1108', amount: 8_900, occurredAt: '2026-05-09T08:46:00' },
    { id: 't37', kind: 'deposit', method: 'sbp', title: 'Покупка курса «История XX века»', meta: 'СБП • Виктор Е.', amount: 7_900, occurredAt: '2026-05-08T23:00:00' },
    { id: 't38', kind: 'deposit', method: 'card', title: 'Покупка курса «Профориентация подростков»', meta: 'Visa •• 8842', amount: 9_900, occurredAt: '2026-05-08T19:14:00' },
    { id: 't39', kind: 'deposit', method: 'paypal', title: 'Поступление от PayPal', meta: 'mark@untitledui.com', amount: 14_500, occurredAt: '2026-05-08T14:42:00' },
    { id: 't40', kind: 'withdrawal', method: 'card', title: 'Вывод на Альфа-Банк •• 1234', meta: 'Visa • 25 секунд', amount: -22_000, occurredAt: '2026-05-08T10:30:00' },
    { id: 't41', kind: 'deposit', method: 'sbp', title: 'Покупка интенсива «Алгоритмы»', meta: 'СБП • Мария О.', amount: 12_300, occurredAt: '2026-05-07T21:25:00' },
    { id: 't42', kind: 'deposit', method: 'applePay', title: 'Покупка курса «Алгебра 11 класс»', meta: 'Apple Pay • Tom B.', amount: 4_990, occurredAt: '2026-05-07T17:08:00' },
    { id: 't43', kind: 'deposit', method: 'card', title: 'Покупка вебинара «React для дизайнеров»', meta: 'Mastercard •• 4421', amount: 3_500, occurredAt: '2026-05-07T12:55:00' },
    { id: 't44', kind: 'deposit', method: 'sbp', title: 'Покупка курса «Сценарий короткого фильма»', meta: 'СБП • Илья Б.', amount: 12_300, occurredAt: '2026-05-07T09:20:00' },
    { id: 't45', kind: 'withdrawal', method: 'sber-online', title: 'Вывод на СберБанк •• 5678', meta: 'СБП • 1 минута', amount: -38_500, occurredAt: '2026-05-06T22:00:00' },
    { id: 't46', kind: 'deposit', method: 'card', title: 'Покупка интенсива «Геометрия»', meta: 'Visa •• 4421', amount: 5_400, occurredAt: '2026-05-06T17:43:00' },
    { id: 't47', kind: 'deposit', method: 'yoomoney', title: 'Покупка вебинара «Python для всех»', meta: 'ЮMoney', amount: 1_990, occurredAt: '2026-05-06T13:12:00' },
    { id: 't48', kind: 'deposit', method: 'sbp', title: 'Покупка курса «Подготовка к ОГЭ»', meta: 'СБП • Ксения А.', amount: 6_900, occurredAt: '2026-05-06T08:55:00' },
    { id: 't49', kind: 'deposit', method: 'card', title: 'Покупка курса «Алгебра 11 класс»', meta: 'Mastercard •• 1108', amount: 4_990, occurredAt: '2026-05-05T20:11:00' },
    { id: 't50', kind: 'withdrawal', method: 'card', title: 'Вывод на Озон Банк •• 5611', meta: 'МИР • моментально', amount: -8_000, occurredAt: '2026-05-05T15:34:00' },
    { id: 't51', kind: 'deposit', method: 'stripe', title: 'Поступление от Stripe Connect', meta: 'billing@stripe.com', amount: 41_200, occurredAt: '2026-05-05T11:05:00' },
    { id: 't52', kind: 'deposit', method: 'sbp', title: 'Покупка интенсива «Алгоритмы»', meta: 'СБП • Алиса Н.', amount: 12_300, occurredAt: '2026-05-04T22:46:00' },
    { id: 't53', kind: 'deposit', method: 'card', title: 'Покупка курса «История XX века»', meta: 'Visa •• 4421', amount: 7_900, occurredAt: '2026-05-04T18:00:00' },
    { id: 't54', kind: 'withdrawal', method: 'card', title: 'Вывод на Т-Банк •• 9931', meta: 'Mastercard • моментально', amount: -19_000, occurredAt: '2026-05-04T13:25:00' },
    { id: 't55', kind: 'deposit', method: 'paypal', title: 'Поступление от PayPal', meta: 'sara@untitledui.com', amount: 5_700, occurredAt: '2026-05-04T09:00:00' },
  ];
  return delay(transactions, 900);
}
