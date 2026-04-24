import { cn } from '@/shared/lib/utils';
import { Logo } from '@/shared/ui/logo';

type BrandMarkSize = 'sm' | 'md';

const SIZE_CLASSES = {
  sm: { logo: 'size-8', text: 'text-[17px]', dot: 'text-xl' },
  md: { logo: 'size-10', text: 'text-[20px]', dot: 'text-2xl' },
} as const satisfies Record<BrandMarkSize, { logo: string; text: string; dot: string }>;

type BrandMarkProps = {
  label: string;
  size?: BrandMarkSize;
  className?: string;
};

export function BrandMark({ label, size = 'md', className }: BrandMarkProps) {
  const s = SIZE_CLASSES[size];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 font-semibold tracking-tight text-foreground',
        className,
      )}
    >
      <Logo className={s.logo} />
      <span className={s.text}>
        {label}
        <span className={cn('leading-none text-brand', s.dot)}>.</span>
      </span>
    </span>
  );
}
