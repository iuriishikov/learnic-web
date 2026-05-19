import * as React from 'react';

export type CardBank =
  | 'sber'
  | 'alfa'
  | 'tinkoff'
  | 'vtb'
  | 'raif'
  | 'gazprom'
  | 'ozon'
  | 'tochka'
  | 'sovkom'
  | 'otkritie'
  | 'yandex'
  | 'mts';

export type CardNetwork = 'mir' | 'visa' | 'mastercard' | 'unionpay';

export type BankPreset = {
  id: CardBank;
  label: string;
  /** Tailwind class for the card background — full gradient + base colour. */
  background: string;
  /** Subtle ring colour on top. */
  ring: string;
  /** Whether the surface reads as dark (white text) or light (dark text). */
  onDark: boolean;
  /** The brand mark — logo + wordmark. */
  Wordmark: React.ComponentType<{ className?: string }>;
};

export const BANK_PRESETS: Record<CardBank, BankPreset> = {
  sber: {
    id: 'sber',
    label: 'СберБанк',
    background:
      'bg-[radial-gradient(120%_140%_at_0%_0%,#3FCB7B_0%,#1FA957_45%,#0C6035_100%)]',
    ring: 'ring-white/15',
    onDark: true,
    Wordmark: SberWordmark,
  },
  alfa: {
    id: 'alfa',
    label: 'Альфа-Банк',
    background:
      'bg-[radial-gradient(120%_140%_at_0%_0%,#FF5040_0%,#D8302A_45%,#6F1714_100%)]',
    ring: 'ring-white/15',
    onDark: true,
    Wordmark: AlfaWordmark,
  },
  tinkoff: {
    id: 'tinkoff',
    label: 'Т-Банк',
    background:
      'bg-[radial-gradient(120%_140%_at_0%_0%,#FFE074_0%,#FFD028_55%,#B58A00_100%)]',
    ring: 'ring-black/10',
    onDark: false,
    Wordmark: TinkoffWordmark,
  },
  vtb: {
    id: 'vtb',
    label: 'ВТБ',
    background:
      'bg-[radial-gradient(120%_140%_at_0%_0%,#3FB6FF_0%,#0F5BA0_50%,#03234A_100%)]',
    ring: 'ring-white/20',
    onDark: true,
    Wordmark: VtbWordmark,
  },
  raif: {
    id: 'raif',
    label: 'Райффайзен',
    background:
      'bg-[radial-gradient(120%_140%_at_0%_0%,#FFE371_0%,#FFD028_45%,#3A2C00_100%)]',
    ring: 'ring-black/15',
    onDark: false,
    Wordmark: RaiffeisenWordmark,
  },
  gazprom: {
    id: 'gazprom',
    label: 'Газпромбанк',
    background:
      'bg-[radial-gradient(120%_140%_at_0%_0%,#2AB6FF_0%,#0B7DC4_45%,#03284B_100%)]',
    ring: 'ring-white/15',
    onDark: true,
    Wordmark: GazpromWordmark,
  },
  ozon: {
    id: 'ozon',
    label: 'Озон Банк',
    background:
      'bg-[radial-gradient(120%_140%_at_0%_0%,#3F8AFF_0%,#005BFF_45%,#01237A_100%)]',
    ring: 'ring-white/15',
    onDark: true,
    Wordmark: OzonWordmark,
  },
  tochka: {
    id: 'tochka',
    label: 'Точка',
    background:
      'bg-[radial-gradient(120%_140%_at_0%_0%,#3F3F3F_0%,#1B1B1B_45%,#050505_100%)]',
    ring: 'ring-white/12',
    onDark: true,
    Wordmark: TochkaWordmark,
  },
  sovkom: {
    id: 'sovkom',
    label: 'Совкомбанк',
    background:
      'bg-[radial-gradient(120%_140%_at_0%_0%,#FF6663_0%,#D62F2C_45%,#7B0E0D_100%)]',
    ring: 'ring-white/15',
    onDark: true,
    Wordmark: SovkomWordmark,
  },
  otkritie: {
    id: 'otkritie',
    label: 'Открытие',
    background:
      'bg-[radial-gradient(120%_140%_at_0%_0%,#33D4B8_0%,#0BA48A_45%,#054C40_100%)]',
    ring: 'ring-white/15',
    onDark: true,
    Wordmark: OtkritieWordmark,
  },
  yandex: {
    id: 'yandex',
    label: 'Яндекс Pay',
    background:
      'bg-[radial-gradient(120%_140%_at_0%_0%,#FFE066_0%,#FFC400_45%,#9C7100_100%)]',
    ring: 'ring-black/10',
    onDark: false,
    Wordmark: YandexWordmark,
  },
  mts: {
    id: 'mts',
    label: 'МТС Банк',
    background:
      'bg-[radial-gradient(120%_140%_at_0%_0%,#FF5560_0%,#E1112A_45%,#7A0717_100%)]',
    ring: 'ring-white/15',
    onDark: true,
    Wordmark: MtsWordmark,
  },
};

export const BANK_LIST: BankPreset[] = Object.values(BANK_PRESETS);

// EMV-style chip element — gold rectangle with subtle grid lines.
export function CardChip() {
  return (
    <svg
      viewBox="0 0 32 24"
      className="h-6 w-8 shrink-0 drop-shadow-sm"
      aria-hidden
    >
      <defs>
        <linearGradient id="chip-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F1C95B" />
          <stop offset="55%" stopColor="#C99830" />
          <stop offset="100%" stopColor="#8C6A18" />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="31" height="23" rx="4" fill="url(#chip-grad)" />
      <g stroke="rgba(0,0,0,0.35)" strokeWidth="0.6" fill="none">
        <path d="M0 7h12" />
        <path d="M0 17h12" />
        <path d="M20 7h12" />
        <path d="M20 17h12" />
        <path d="M16 0v6" />
        <path d="M16 18v6" />
        <rect x="12" y="6" width="8" height="12" rx="1" />
      </g>
    </svg>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Wordmarks — bank label with a small inline logo.

function SberWordmark({ className }: { className?: string }) {
  return (
    <span className={'inline-flex items-center gap-2 ' + (className ?? '')}>
      <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="2.4" />
        <path
          d="m6 12 4 4 9-9"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-heading text-[15px] font-semibold tracking-tight">
        СберБанк
      </span>
    </span>
  );
}

function AlfaWordmark({ className }: { className?: string }) {
  return (
    <span className={'inline-flex items-center gap-1.5 ' + (className ?? '')}>
      <span className="font-heading text-[20px] font-extrabold leading-none">α</span>
      <span className="font-heading text-[15px] font-semibold tracking-tight">
        Альфа-Банк
      </span>
    </span>
  );
}

function TinkoffWordmark({ className }: { className?: string }) {
  return (
    <span className={'inline-flex items-center gap-1.5 ' + (className ?? '')}>
      <span className="flex size-6 items-center justify-center rounded-md bg-neutral-900 font-heading text-xs font-extrabold leading-none text-[#FFDD2D]">
        Т
      </span>
      <span className="font-heading text-[15px] font-semibold tracking-tight">
        Т-Банк
      </span>
    </span>
  );
}

function VtbWordmark({ className }: { className?: string }) {
  return (
    <span className={'inline-flex items-center gap-1.5 ' + (className ?? '')}>
      <span className="flex size-6 items-center justify-center rounded-sm bg-white/95 font-heading text-[11px] font-extrabold leading-none text-[#0F5BA0]">
        ВТБ
      </span>
      <span className="font-heading text-[15px] font-semibold tracking-tight">
        ВТБ
      </span>
    </span>
  );
}

function RaiffeisenWordmark({ className }: { className?: string }) {
  return (
    <span className={'font-heading text-[15px] font-semibold tracking-tight ' + (className ?? '')}>
      Raiffeisen
    </span>
  );
}

function GazpromWordmark({ className }: { className?: string }) {
  return (
    <span className={'inline-flex items-center gap-1.5 ' + (className ?? '')}>
      <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
        <path
          d="M12 3 q-4 4 -4 8 a4 4 0 0 0 8 0 q0 -4 -4 -8 z"
          fill="currentColor"
        />
      </svg>
      <span className="font-heading text-[15px] font-semibold tracking-tight">
        Газпромбанк
      </span>
    </span>
  );
}

function OzonWordmark({ className }: { className?: string }) {
  return (
    <span className={'inline-flex items-baseline gap-1.5 ' + (className ?? '')}>
      <span className="font-heading text-[16px] font-extrabold leading-none">
        ozon
      </span>
      <span className="font-heading text-[10px] font-medium uppercase tracking-[0.18em] opacity-80">
        банк
      </span>
    </span>
  );
}

function TochkaWordmark({ className }: { className?: string }) {
  return (
    <span className={'font-heading text-[15px] font-semibold tracking-tight ' + (className ?? '')}>
      точка<span style={{ color: '#FF4F44' }}>.</span>
    </span>
  );
}

function SovkomWordmark({ className }: { className?: string }) {
  return (
    <span className={'font-heading text-[15px] font-semibold tracking-tight ' + (className ?? '')}>
      Совкомбанк
    </span>
  );
}

function OtkritieWordmark({ className }: { className?: string }) {
  return (
    <span className={'font-heading text-[15px] font-semibold tracking-tight ' + (className ?? '')}>
      Открытие
    </span>
  );
}

function YandexWordmark({ className }: { className?: string }) {
  return (
    <span className={'inline-flex items-baseline gap-1.5 ' + (className ?? '')}>
      <span className="font-heading text-[18px] font-extrabold leading-none">Я</span>
      <span className="font-heading text-[15px] font-semibold tracking-tight">
        Pay
      </span>
    </span>
  );
}

function MtsWordmark({ className }: { className?: string }) {
  return (
    <span className={'font-heading text-[15px] font-semibold tracking-tight ' + (className ?? '')}>
      МТС Банк
    </span>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Network logos

type NetworkLogoProps = { className?: string; onDark: boolean };

export function NetworkLogo({
  network,
  className,
  onDark,
}: { network: CardNetwork } & NetworkLogoProps) {
  switch (network) {
    case 'mir':
      return <MirLogo className={className} onDark={onDark} />;
    case 'visa':
      return <VisaLogo className={className} onDark={onDark} />;
    case 'mastercard':
      return <MastercardLogo className={className} />;
    case 'unionpay':
      return <UnionPayLogo className={className} />;
  }
}

function MirLogo({ className, onDark }: NetworkLogoProps) {
  return (
    <svg viewBox="0 0 60 22" fill="none" className={className} aria-label="МИР">
      <text
        x="0"
        y="17"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="800"
        fontStyle="italic"
        fontSize="20"
        letterSpacing="0.5"
        fill={onDark ? '#ffffff' : '#0F754E'}
      >
        МИР
      </text>
    </svg>
  );
}

function VisaLogo({ className, onDark }: NetworkLogoProps) {
  return (
    <svg viewBox="0 0 50 16" fill="none" className={className} aria-label="Visa">
      <text
        x="0"
        y="13"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="800"
        fontStyle="italic"
        fontSize="15"
        fill={onDark ? '#ffffff' : '#1A1F71'}
        letterSpacing="0.5"
      >
        VISA
      </text>
    </svg>
  );
}

function MastercardLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 24" fill="none" className={className} aria-label="Mastercard">
      <circle cx="15" cy="12" r="9" fill="#EB001B" />
      <circle cx="25" cy="12" r="9" fill="#F79E1B" />
      <path d="M20 5.5a9 9 0 0 1 0 13 9 9 0 0 1 0-13z" fill="#FF5F00" />
    </svg>
  );
}

function UnionPayLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 22" fill="none" className={className} aria-label="UnionPay">
      <text x="0" y="17" fontFamily="Inter, system-ui, sans-serif" fontWeight="700" fontSize="13" fill="#1B7CC1">
        Union
      </text>
      <text x="32" y="17" fontFamily="Inter, system-ui, sans-serif" fontWeight="700" fontSize="13" fill="#E22A29">
        Pay
      </text>
    </svg>
  );
}
