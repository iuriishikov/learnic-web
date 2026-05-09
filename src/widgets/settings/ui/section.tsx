import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/utils';

type SettingsSectionProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Right-aligned slot in the header (e.g. Save / Cancel buttons). */
  headerActions?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function SettingsSection({
  title,
  description,
  headerActions,
  className,
  children,
}: SettingsSectionProps) {
  return (
    <section className={cn('flex flex-col', className)}>
      <header className="flex flex-col gap-4 pb-5 md:flex-row md:items-start md:justify-between md:gap-6">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {headerActions ? (
          <div className="flex shrink-0 items-center gap-2">{headerActions}</div>
        ) : null}
      </header>
      <div className="border-t border-border">{children}</div>
    </section>
  );
}

type SettingsRowProps = {
  label: ReactNode;
  description?: ReactNode;
  /** Optional id to link the label to a control via htmlFor. */
  labelFor?: string;
  /** Class name applied to the row's right column wrapper. */
  controlClassName?: string;
  className?: string;
  children: ReactNode;
};

/**
 * Untitled-UI two-column row: label + helper text on the left,
 * controls on the right. Stacks on mobile; splits into a 1/3-2/3
 * split on tablet/desktop. Each row carries its own bottom border so
 * rows can be siblings under a `<form>` wrapper.
 */
export function SettingsRow({
  label,
  description,
  labelFor,
  controlClassName,
  className,
  children,
}: SettingsRowProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-b border-border py-5 last:border-b-0 md:flex-row md:items-start md:gap-8',
        className,
      )}
    >
      <div className="flex w-full max-w-xs shrink-0 flex-col gap-1 md:w-72">
        {labelFor ? (
          <label
            htmlFor={labelFor}
            className="text-sm font-semibold text-foreground"
          >
            {label}
          </label>
        ) : (
          <span className="text-sm font-semibold text-foreground">{label}</span>
        )}
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className={cn('flex min-w-0 flex-1 flex-col gap-2', controlClassName)}>
        {children}
      </div>
    </div>
  );
}

type SettingsFooterProps = {
  className?: string;
  children: ReactNode;
};

export function SettingsFooter({ className, children }: SettingsFooterProps) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse items-stretch justify-end gap-2 border-t border-border pt-5 md:flex-row md:items-center md:gap-3',
        className,
      )}
    >
      {children}
    </div>
  );
}
