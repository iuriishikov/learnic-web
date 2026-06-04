import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/utils';

type InfoCardProps = {
  title: string;
  icon?: LucideIcon;
  /** Right-aligned slot in the header (e.g. a summary count). */
  action?: ReactNode;
  className?: string;
  children: ReactNode;
};

/**
 * Bespoke section card for the product info/preview page. Mirrors the
 * `rounded-2xl border bg-card` surface used across the products feature
 * (editor sections, release rows) rather than the generic shadcn `Card`,
 * so the preview reads as part of the same surface family.
 */
export function InfoCard({
  title,
  icon: Icon,
  action,
  className,
  children,
}: InfoCardProps) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-border bg-card text-card-foreground',
        className,
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {Icon ? (
            <Icon className="size-4 text-muted-foreground" aria-hidden />
          ) : null}
          {title}
        </h2>
        {action}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

/** Label / value row for the details list. The value wraps on the right. */
export function InfoRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
      <dt className="shrink-0 pt-px text-sm text-muted-foreground">{label}</dt>
      <dd className="flex min-w-0 flex-col items-end text-right text-sm font-medium text-foreground">
        {children}
      </dd>
    </div>
  );
}
