'use client';

import { ArrowLeftIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/utils';
import {
  CommandMenu,
  CommandMenuFooter,
  CommandMenuHint,
  CommandMenuItem,
  CommandMenuList,
} from '@/shared/ui/command-menu';
import { Skeleton } from '@/shared/ui/skeleton';

type SearchMenuShellProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** sr-only dialog title. */
  title: string;
  /** Top bar — the search input (search view) or a back header (action view). */
  topbar: ReactNode;
  children: ReactNode;
};

/** Command-palette chrome shared by the admin user / note search menus. */
export function SearchMenuShell({
  open,
  onOpenChange,
  title,
  topbar,
  children,
}: SearchMenuShellProps) {
  const t = useTranslations('admin-dashboard');
  return (
    <CommandMenu
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      shouldFilter={false}
    >
      {topbar}
      <CommandMenuList>{children}</CommandMenuList>
      <CommandMenuFooter>
        <CommandMenuHint keys={['↑', '↓']} label={t('search.navHint')} />
        <CommandMenuHint keys={['Esc']} label={t('search.closeHint')} />
      </CommandMenuFooter>
    </CommandMenu>
  );
}

/** Back-arrow + entity name header shown above an entity's action list. */
export function MenuBackHeader({
  title,
  onBack,
  backLabel,
}: {
  title: string;
  onBack: () => void;
  backLabel: string;
}) {
  return (
    <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-3">
      <button
        type="button"
        onClick={onBack}
        aria-label={backLabel}
        className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeftIcon className="size-4" />
      </button>
      <span className="truncate text-sm font-medium text-foreground">
        {title}
      </span>
    </div>
  );
}

/** An action row inside an entity's action list. */
export function ActionItem({
  value,
  icon,
  label,
  tone = 'default',
  disabled,
  onSelect,
}: {
  value: string;
  icon: ReactNode;
  label: ReactNode;
  tone?: 'default' | 'destructive';
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <CommandMenuItem
      value={value}
      leading={icon}
      disabled={disabled}
      onSelect={onSelect}
      className={cn(
        tone === 'destructive' &&
          'text-destructive [&_svg]:text-destructive data-[selected=true]:bg-destructive/10',
      )}
    >
      {label}
    </CommandMenuItem>
  );
}

/** Centered non-result state (idle hint / empty / error / confirm prompt). */
export function SearchStateBlock({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: ReactNode;
  description?: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center"
    >
      <div className="flex size-11 items-center justify-center rounded-xl border border-border bg-muted/40 text-muted-foreground">
        {icon}
      </div>
      <p className="mt-1 max-w-xs text-sm font-medium text-foreground">
        {title}
      </p>
      {description != null && (
        <p className="max-w-xs text-xs text-muted-foreground">{description}</p>
      )}
    </motion.div>
  );
}

/** Layout-matching skeleton rows shown while a search request is in flight. */
export function SearchLoadingRows({ shape }: { shape: 'circle' | 'square' }) {
  return (
    <div className="flex flex-col gap-1 p-1" aria-hidden>
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5"
        >
          <Skeleton
            className={cn(
              'size-8 shrink-0',
              shape === 'circle' ? 'rounded-full' : 'rounded-lg',
            )}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-40 max-w-full" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
