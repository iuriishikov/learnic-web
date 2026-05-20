'use client';

import { MenuIcon, XIcon } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/sheet';

type Tone = 'default' | 'light';
type HideFrom = 'md' | 'lg' | 'none';

const TRIGGER_TONE: Record<Tone, string> = {
  default: '',
  light:
    'text-brand-foreground hover:bg-brand-foreground/10 hover:text-brand-foreground',
};

const HIDE_FROM: Record<HideFrom, string> = {
  md: 'md:hidden',
  lg: 'lg:hidden',
  none: '',
};

type MobileMenuProps = ComponentProps<typeof Sheet>;

function MobileMenu(props: MobileMenuProps) {
  return <Sheet {...props} />;
}

type MobileMenuTriggerProps = {
  'aria-label': string;
  tone?: Tone;
  hideFrom?: HideFrom;
  className?: string;
};

function MobileMenuTrigger({
  tone = 'default',
  hideFrom = 'md',
  className,
  ...rest
}: MobileMenuTriggerProps) {
  return (
    <SheetTrigger
      render={
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'size-10',
            HIDE_FROM[hideFrom],
            TRIGGER_TONE[tone],
            className,
          )}
          aria-label={rest['aria-label']}
        />
      }
    >
      <MenuIcon className="size-6" />
    </SheetTrigger>
  );
}

type MobileMenuContentProps = {
  /** Always required for the underlying dialog — rendered sr-only. */
  srTitle: string;
  side?: 'left' | 'right';
  className?: string;
  children: ReactNode;
};

function MobileMenuContent({
  srTitle,
  side = 'right',
  className,
  children,
}: MobileMenuContentProps) {
  return (
    <SheetContent
      side={side}
      showCloseButton={false}
      className={cn(
        'flex flex-col gap-0 bg-background p-0',
        'data-[side=right]:w-full data-[side=right]:sm:max-w-md',
        'data-[side=left]:w-full data-[side=left]:sm:max-w-md',
        className,
      )}
    >
      <SheetTitle className="sr-only">{srTitle}</SheetTitle>
      {children}
    </SheetContent>
  );
}

type MobileMenuHeaderProps = {
  closeAriaLabel: string;
  children: ReactNode;
  className?: string;
};

function MobileMenuHeader({
  closeAriaLabel,
  children,
  className,
}: MobileMenuHeaderProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-between border-b border-border px-5 py-4',
        className,
      )}
    >
      {children}
      <SheetClose
        render={
          <Button
            variant="ghost"
            size="icon"
            className="-mr-2 size-10 text-muted-foreground hover:text-foreground"
            aria-label={closeAriaLabel}
          />
        }
      >
        <XIcon className="size-5" />
      </SheetClose>
    </div>
  );
}

type MobileMenuBodyProps = ComponentProps<'div'>;

function MobileMenuBody({ className, ...props }: MobileMenuBodyProps) {
  return (
    <div
      className={cn('flex-1 overflow-y-auto overscroll-contain', className)}
      {...props}
    />
  );
}

type MobileMenuFooterProps = ComponentProps<'div'>;

function MobileMenuFooter({ className, ...props }: MobileMenuFooterProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 flex-col gap-2 border-t border-border bg-background px-5 pt-4',
        'pb-[max(env(safe-area-inset-bottom),1rem)]',
        className,
      )}
      {...props}
    />
  );
}

export {
  MobileMenu,
  MobileMenuTrigger,
  MobileMenuContent,
  MobileMenuHeader,
  MobileMenuBody,
  MobileMenuFooter,
  SheetClose as MobileMenuClose,
};
