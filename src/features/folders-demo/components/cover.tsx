import { cn } from '@/shared/lib/utils';

import type { DemoCoverGradient } from '../model/types';

type CoverProps = {
  cover: DemoCoverGradient;
  className?: string;
  emojiClassName?: string;
  rounded?: 'top' | 'all' | 'none';
};

export function Cover({
  cover,
  className,
  emojiClassName,
  rounded = 'top',
}: CoverProps) {
  const radius =
    rounded === 'top'
      ? 'rounded-t-2xl'
      : rounded === 'all'
        ? 'rounded-2xl'
        : '';
  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden',
        radius,
        className,
      )}
      style={{
        backgroundImage: `linear-gradient(135deg, ${cover.from}, ${cover.to})`,
      }}
    >
      <span
        className={cn('select-none drop-shadow-sm', emojiClassName)}
        aria-hidden
      >
        {cover.emoji}
      </span>
    </div>
  );
}
