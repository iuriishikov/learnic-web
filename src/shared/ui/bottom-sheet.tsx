'use client';

import { Drawer as DrawerPrimitive } from 'vaul';
import { type ComponentProps } from 'react';

import { cn } from '@/shared/lib/utils';

/**
 * Mobile-first bottom sheet built on `vaul`. Locked to `direction="bottom"`
 * with a built-in drag handle, rounded top corners and a sensible max height
 * — the standard pattern for mobile modal flows. Use the generic `Drawer`
 * primitive directly when you need a different side, snap points, or other
 * vaul features that don't apply to a plain bottom sheet.
 */
function BottomSheet({
  ...props
}: ComponentProps<typeof DrawerPrimitive.Root>) {
  return (
    <DrawerPrimitive.Root
      data-slot="bottom-sheet"
      {...props}
      direction="bottom"
    />
  );
}

function BottomSheetTrigger({
  ...props
}: ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return (
    <DrawerPrimitive.Trigger data-slot="bottom-sheet-trigger" {...props} />
  );
}

function BottomSheetPortal({
  ...props
}: ComponentProps<typeof DrawerPrimitive.Portal>) {
  return (
    <DrawerPrimitive.Portal data-slot="bottom-sheet-portal" {...props} />
  );
}

function BottomSheetClose({
  ...props
}: ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="bottom-sheet-close" {...props} />;
}

function BottomSheetOverlay({
  className,
  ...props
}: ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="bottom-sheet-overlay"
      className={cn(
        'fixed inset-0 z-50 bg-black/30 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0',
        className,
      )}
      {...props}
    />
  );
}

type BottomSheetContentProps = ComponentProps<typeof DrawerPrimitive.Content> & {
  /**
   * Render the drag handle at the top of the sheet. Defaults to `true`.
   * Hide it when the sheet is non-dismissible or has its own visual
   * affordance for closing.
   */
  showHandle?: boolean;
};

function BottomSheetContent({
  className,
  children,
  showHandle = true,
  ...props
}: BottomSheetContentProps) {
  return (
    <BottomSheetPortal>
      <BottomSheetOverlay />
      <DrawerPrimitive.Content
        data-slot="bottom-sheet-content"
        className={cn(
          'group/bottom-sheet fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto max-h-[92vh] flex-col rounded-t-3xl bg-popover text-sm text-popover-foreground ring-1 ring-foreground/10 outline-none',
          className,
        )}
        {...props}
      >
        {showHandle ? (
          <div
            aria-hidden
            className="mx-auto mt-3 h-1 w-12 shrink-0 rounded-full bg-muted-foreground/30"
          />
        ) : null}
        {children}
      </DrawerPrimitive.Content>
    </BottomSheetPortal>
  );
}

function BottomSheetHeader({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      data-slot="bottom-sheet-header"
      className={cn(
        'flex flex-col gap-1 px-5 pt-4 pb-3',
        className,
      )}
      {...props}
    />
  );
}

function BottomSheetFooter({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      data-slot="bottom-sheet-footer"
      className={cn(
        'mt-auto flex items-center justify-end gap-2 border-t border-border bg-muted/30 px-5 py-3',
        'pb-[max(0.75rem,env(safe-area-inset-bottom))]',
        className,
      )}
      {...props}
    />
  );
}

function BottomSheetTitle({
  className,
  ...props
}: ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="bottom-sheet-title"
      className={cn(
        'font-heading text-lg font-semibold tracking-tight text-foreground',
        className,
      )}
      {...props}
    />
  );
}

function BottomSheetDescription({
  className,
  ...props
}: ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="bottom-sheet-description"
      className={cn('text-sm leading-relaxed text-muted-foreground', className)}
      {...props}
    />
  );
}

function BottomSheetBody({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      data-slot="bottom-sheet-body"
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-4',
        className,
      )}
      {...props}
    />
  );
}

export {
  BottomSheet,
  BottomSheetBody,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetFooter,
  BottomSheetHeader,
  BottomSheetOverlay,
  BottomSheetPortal,
  BottomSheetTitle,
  BottomSheetTrigger,
};
