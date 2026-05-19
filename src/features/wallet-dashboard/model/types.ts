import type {
  CardBank,
  CardNetwork,
} from '@/shared/ui/payment-card-brands';

export type AccountKind = 'available' | 'pending';

export type Account = {
  id: string;
  kind: AccountKind;
  balance: number;
  trendPercent: number;
  holdDays?: number;
};

export type BalancePoint = {
  monthIndex: number;
  current: number;
  previous: number;
};

export type WalletCardKind = 'debit' | 'credit';

export type CardProcessor = 'yookassa' | 'tinkoff' | 'cloudpayments';

export type WalletCard = {
  id: string;
  processor: CardProcessor;
  /** Token issued by the processor — replaces PAN in our DB. */
  processorToken: string;

  /** Masked display data — safe to store in plain text per PCI DSS. */
  firstDigits: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  holderName: string;

  /** Derived from firstDigits at card-binding time. */
  bank: CardBank;
  network: CardNetwork;
  kind: WalletCardKind;

  dailyWithdrawalUsed: number;
  dailyWithdrawalLimit: number;
};

export type TxKind = 'deposit' | 'withdrawal';

export type TxMethod =
  | 'card'
  | 'sbp'
  | 'stripe'
  | 'paypal'
  | 'applePay'
  | 'yoomoney'
  | 'sber-online';

export type Transaction = {
  id: string;
  kind: TxKind;
  method: TxMethod;
  title: string;
  meta: string;
  amount: number;
  occurredAt: string;
};

export type Period = '12m' | '30d' | '7d' | '24h';
