'use client';

import {
  createContext,
  useContext,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from 'react';

import { useIsMobile } from '@/shared/hooks/use-mobile';
import { cn } from '@/shared/lib/utils';
import {
  BottomSheet,
  BottomSheetBody,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetFooter,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetTrigger,
} from '@/shared/ui/bottom-sheet';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/sheet';

/**
 * Adaptive sheet that picks the right surface per viewport:
 *
 * - **Mobile (<768px):** vaul-powered `BottomSheet` — full-width sheet that
 *   slides up from the bottom, with a drag handle and safe-area padding.
 * - **Desktop (≥768px):** base-ui `Sheet` — floating right-side panel with a
 *   small margin from the viewport edges and modest corner rounding.
 *
 * The API matches the underlying primitives (Trigger, Content, Header, Title,
 * Description, Footer, Body, Close) so callers don't have to know which one
 * is rendering. Use the dedicated `Body` slot for scrollable content — the
 * footer stays pinned to the bottom in both modes.
 *
 * `useIsMobile` returns `false` on SSR and during the first client paint, so
 * the sheet renders its desktop variant until the viewport check runs in an
 * effect. The sheet is closed at that point, so the swap is invisible.
 */

const ResponsiveSheetContext = createContext<{ isMobile: boolean } | null>(
  null,
);

function useResponsiveSheet() {
  const ctx = useContext(ResponsiveSheetContext);
  if (!ctx) {
    throw new Error(
      'ResponsiveSheet subcomponents must be used inside <ResponsiveSheet>.',
    );
  }
  return ctx;
}

type ResponsiveSheetProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  dismissible?: boolean;
  children: ReactNode;
};

function ResponsiveSheet({
  open,
  defaultOpen,
  onOpenChange,
  modal,
  dismissible,
  children,
}: ResponsiveSheetProps) {
  const isMobile = useIsMobile();

  return (
    <ResponsiveSheetContext.Provider value={{ isMobile }}>
      {isMobile ? (
        <BottomSheet
          open={open}
          defaultOpen={defaultOpen}
          onOpenChange={onOpenChange}
          modal={modal}
          dismissible={dismissible}
        >
          {children}
        </BottomSheet>
      ) : (
        <Sheet
          open={open}
          defaultOpen={defaultOpen}
          onOpenChange={onOpenChange}
          modal={modal}
        >
          {children}
        </Sheet>
      )}
    </ResponsiveSheetContext.Provider>
  );
}

type ResponsiveSheetTriggerProps = {
  /**
   * Element to render as the trigger. Receives the open/close click handler
   * via composition — both primitives clone the rendered element with the
   * required props.
   */
  render: ReactElement;
};

function ResponsiveSheetTrigger({ render }: ResponsiveSheetTriggerProps) {
  const { isMobile } = useResponsiveSheet();
  if (isMobile) {
    return <BottomSheetTrigger asChild>{render}</BottomSheetTrigger>;
  }
  return <SheetTrigger render={render} />;
}

type ResponsiveSheetContentProps = {
  children: ReactNode;
  className?: string;
  /**
   * Hide the mobile drag handle. Has no effect on desktop. Defaults to
   * showing the handle.
   */
  showHandle?: boolean;
};

function ResponsiveSheetContent({
  children,
  className,
  showHandle,
}: ResponsiveSheetContentProps) {
  const { isMobile } = useResponsiveSheet();
  if (isMobile) {
    return (
      <BottomSheetContent
        showHandle={showHandle}
        className={cn('flex flex-col gap-0 p-0', className)}
      >
        {children}
      </BottomSheetContent>
    );
  }
  return (
    <SheetContent
      side="right"
      showCloseButton={false}
      className={cn(
        // Desktop floating right panel — small margin, gentle rounding.
        'data-[side=right]:left-auto data-[side=right]:top-2 data-[side=right]:bottom-2 data-[side=right]:right-2',
        'data-[side=right]:h-auto data-[side=right]:w-[calc(100%-1rem)] data-[side=right]:max-w-[420px] data-[side=right]:sm:max-w-[420px]',
        'data-[side=right]:border-l-0 data-[side=right]:rounded-xl',
        'data-[side=right]:data-starting-style:translate-x-6',
        'data-[side=right]:data-ending-style:translate-x-6',
        'bg-popover p-0 ring-1 ring-foreground/10 shadow-2xl',
        'flex flex-col gap-0',
        className,
      )}
    >
      {children}
    </SheetContent>
  );
}

function ResponsiveSheetHeader({
  className,
  ...props
}: ComponentProps<'div'>) {
  const { isMobile } = useResponsiveSheet();
  if (isMobile) {
    return <BottomSheetHeader className={className} {...props} />;
  }
  return (
    <div
      data-slot="responsive-sheet-header"
      className={cn(
        'flex items-start justify-between gap-3 border-b border-border px-5 pt-5 pb-4',
        className,
      )}
      {...props}
    />
  );
}

function ResponsiveSheetBody({
  className,
  ...props
}: ComponentProps<'div'>) {
  const { isMobile } = useResponsiveSheet();
  if (isMobile) {
    return <BottomSheetBody className={className} {...props} />;
  }
  return (
    <div
      data-slot="responsive-sheet-body"
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-5',
        className,
      )}
      {...props}
    />
  );
}

function ResponsiveSheetFooter({
  className,
  ...props
}: ComponentProps<'div'>) {
  const { isMobile } = useResponsiveSheet();
  if (isMobile) {
    return <BottomSheetFooter className={className} {...props} />;
  }
  return (
    <div
      data-slot="responsive-sheet-footer"
      className={cn(
        'flex items-center justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3',
        className,
      )}
      {...props}
    />
  );
}

type ResponsiveSheetTitleProps = {
  className?: string;
  children?: ReactNode;
};

function ResponsiveSheetTitle({
  className,
  children,
}: ResponsiveSheetTitleProps) {
  const { isMobile } = useResponsiveSheet();
  if (isMobile) {
    return <BottomSheetTitle className={className}>{children}</BottomSheetTitle>;
  }
  return (
    <SheetTitle
      className={cn(
        'font-heading text-lg font-semibold tracking-tight',
        className,
      )}
    >
      {children}
    </SheetTitle>
  );
}

type ResponsiveSheetDescriptionProps = {
  className?: string;
  children?: ReactNode;
};

function ResponsiveSheetDescription({
  className,
  children,
}: ResponsiveSheetDescriptionProps) {
  const { isMobile } = useResponsiveSheet();
  if (isMobile) {
    return (
      <BottomSheetDescription className={className}>
        {children}
      </BottomSheetDescription>
    );
  }
  return (
    <SheetDescription
      className={cn(
        'text-sm leading-relaxed text-muted-foreground',
        className,
      )}
    >
      {children}
    </SheetDescription>
  );
}

type ResponsiveSheetCloseProps = ComponentProps<typeof SheetClose>;

function ResponsiveSheetClose(props: ResponsiveSheetCloseProps) {
  const { isMobile } = useResponsiveSheet();
  if (isMobile) {
    return <BottomSheetClose {...(props as ComponentProps<typeof BottomSheetClose>)} />;
  }
  return <SheetClose {...props} />;
}

export {
  ResponsiveSheet,
  ResponsiveSheetBody,
  ResponsiveSheetClose,
  ResponsiveSheetContent,
  ResponsiveSheetDescription,
  ResponsiveSheetFooter,
  ResponsiveSheetHeader,
  ResponsiveSheetTitle,
  ResponsiveSheetTrigger,
};
