'use client';

import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/utils';
import { RequiredMark } from '@/shared/ui/required-mark';

type EditorSectionProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Two-column settings-style section: title + description on the section header,
 * then a vertical stack of `EditorRow`s with horizontal dividers between them.
 *
 * The header itself participates in `divide-y`, so the line between the header
 * and the first row appears automatically — no extra `border-t` needed.
 */
export function EditorSection({
  title,
  description,
  actions,
  children,
  className,
}: EditorSectionProps) {
  return (
    <section className={cn('divide-y divide-border', className)}>
      <header className="flex flex-col gap-3 pb-6 md:flex-row md:items-start md:justify-between md:gap-6">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="font-heading text-base font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          {description ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </header>
      {children}
    </section>
  );
}

type EditorRowProps = {
  label: string;
  description?: string;
  /**
   * Optional secondary content under the label/description on the left column —
   * e.g. a small "View examples" link.
   */
  hint?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
  /**
   * Visually align the right column with a different label tone (e.g. for the
   * destructive "danger zone" row).
   */
  tone?: 'default' | 'danger';
};

/**
 * One row inside an `EditorSection`. Mobile: stacks (label above control).
 * Tablet+: two columns with the label fixed at ~280px.
 */
export function EditorRow({
  label,
  description,
  hint,
  required,
  children,
  className,
  tone = 'default',
}: EditorRowProps) {
  return (
    <div
      className={cn(
        'grid gap-3 py-6 md:grid-cols-[minmax(220px,280px)_1fr] md:gap-8',
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <p
          className={cn(
            'text-sm font-medium',
            tone === 'danger' ? 'text-destructive' : 'text-foreground',
          )}
        >
          {label}
          {required ? <RequiredMark /> : null}
        </p>
        {description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
        {hint ? <div className="mt-1">{hint}</div> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
