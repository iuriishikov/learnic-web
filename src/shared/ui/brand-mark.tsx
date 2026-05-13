import { cn } from '@/shared/lib/utils';
import { Logo } from '@/shared/ui/logo';

type BrandMarkSize = 'sm' | 'md';
export type BrandMarkTone = 'dark' | 'light';

const SIZE_CLASSES = {
  sm: { logo: 'size-8', height: 'h-8', text: 'text-[17px]', dot: 'text-xl' },
  md: { logo: 'size-10', height: 'h-10', text: 'text-[20px]', dot: 'text-2xl' },
} as const satisfies Record<
  BrandMarkSize,
  { logo: string; height: string; text: string; dot: string }
>;

const TONE_CLASSES = {
  dark: { wordmark: 'text-foreground', dot: 'text-brand' },
  light: { wordmark: 'text-brand-foreground', dot: 'text-brand-foreground' },
} as const satisfies Record<BrandMarkTone, { wordmark: string; dot: string }>;

type BrandMarkProps = {
  label: string;
  size?: BrandMarkSize;
  tone?: BrandMarkTone;
  className?: string;
};

export function BrandMark({
  label,
  size = 'md',
  tone = 'dark',
  className,
}: BrandMarkProps) {
  const s = SIZE_CLASSES[size];
  const tc = TONE_CLASSES[tone];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 font-semibold tracking-tight',
        tc.wordmark,
        className,
      )}
    >
      <Logo className={s.logo} />
      <span
        className={cn('inline-flex items-center', s.height, s.text, 'leading-none')}
      >
        {label}
        <span className={cn(tc.dot, s.dot, 'leading-none')}>.</span>
      </span>
    </span>
  );
}
