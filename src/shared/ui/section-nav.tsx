'use client';

import { motion } from 'motion/react';

import { cn } from '@/shared/lib/utils';

export type SectionNavItem<K extends string> = {
  key: K;
  label: string;
};

type SectionNavProps<K extends string> = {
  items: ReadonlyArray<SectionNavItem<K>>;
  value: K;
  onChange: (key: K) => void;
  variant: 'vertical' | 'horizontal';
  ariaLabel: string;
  underlineLayoutId?: string;
  className?: string;
};

export function SectionNav<K extends string>({
  items,
  value,
  onChange,
  variant,
  ariaLabel,
  underlineLayoutId,
  className,
}: SectionNavProps<K>) {
  if (variant === 'vertical') {
    return (
      <nav aria-label={ariaLabel} className={className}>
        <ul className="flex flex-col gap-1 text-sm">
          {items.map((item) => {
            const active = value === item.key;
            return (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => onChange(item.key)}
                  className={cn(
                    'w-full rounded-md px-2.5 py-1.5 text-left transition-colors',
                    active
                      ? 'bg-muted font-semibold text-foreground'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                  )}
                >
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label={ariaLabel} className={className}>
      <div className="flex w-max gap-1 border-b border-border">
        {items.map((item) => {
          const active = value === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={cn(
                'relative px-3 pb-2.5 text-sm font-medium transition-colors',
                active
                  ? 'text-brand'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
              {active && underlineLayoutId ? (
                <motion.span
                  layoutId={underlineLayoutId}
                  className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
