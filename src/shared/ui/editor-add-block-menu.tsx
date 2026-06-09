'use client';

import { PlusIcon } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { useIsMobile } from '@/shared/hooks/use-mobile';
import { cn } from '@/shared/lib/utils';
import {
  BottomSheet,
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetTrigger,
} from '@/shared/ui/bottom-sheet';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

export type EditorAddBlockEntry = {
  key: string;
  /** Lucide icon node for the tile chip. */
  icon: ReactNode;
  /** Tile title — already localized by the caller. */
  label: string;
  /** One-line explanation under the title — already localized. */
  description: string;
  /**
   * The caller owns what happens next: resolve inline (create an empty
   * block) or open an upload dialog first — the menu stays presentational.
   */
  onSelect: () => void;
};

export type EditorAddBlockMenuProps = {
  entries: ReadonlyArray<EditorAddBlockEntry>;
  /** Trigger button label — already localized by the caller. */
  triggerLabel: string;
  /** Uppercase header above the picker grid — already localized. */
  menuLabel: string;
  /** Tightens the top margin while the block list above is still empty. */
  hasBlocks: boolean;
  disabled?: boolean;
  /** Tooltip shown on the disabled trigger. */
  disabledTitle?: string;
  className?: string;
};

/**
 * Bottom-anchored "add block" affordance shared by the block editors (note
 * lessons, admin blog posts): a single centered trigger straddling a divider
 * line that opens a two-column picker of block-type tiles — a `DropdownMenu`
 * on desktop, a `BottomSheet` on mobile.
 *
 * Complements `EditorBlockShell`/`EditorBlockList`: the rows above are the
 * shared per-block chrome, this is the shared "append a new one" entry point.
 */
export function EditorAddBlockMenu({
  entries,
  triggerLabel,
  menuLabel,
  hasBlocks,
  disabled,
  disabledTitle,
  className,
}: EditorAddBlockMenuProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn(
        'relative flex items-center justify-center',
        hasBlocks ? 'mt-8' : 'mt-2',
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border"
      />
      {isMobile ? (
        <BottomSheet open={open} onOpenChange={setOpen}>
          <BottomSheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={disabled}
              title={disabled ? disabledTitle : undefined}
              className="relative gap-1.5 bg-background hover:bg-muted dark:bg-background dark:hover:bg-muted"
            >
              <PlusIcon /> {triggerLabel}
            </Button>
          </BottomSheetTrigger>
          <BottomSheetContent>
            <BottomSheetHeader>
              <BottomSheetTitle className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {menuLabel}
              </BottomSheetTitle>
            </BottomSheetHeader>
            <BottomSheetBody className="py-3">
              <div className="grid auto-rows-fr grid-cols-2 gap-2">
                {entries.map((entry) => (
                  <BlockTypeTileButton
                    key={entry.key}
                    icon={entry.icon}
                    label={entry.label}
                    description={entry.description}
                    onSelect={() => {
                      setOpen(false);
                      entry.onSelect();
                    }}
                  />
                ))}
              </div>
            </BottomSheetBody>
          </BottomSheetContent>
        </BottomSheet>
      ) : (
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                disabled={disabled}
                title={disabled ? disabledTitle : undefined}
                className="relative gap-1.5 bg-background hover:bg-muted dark:bg-background dark:hover:bg-muted"
              />
            }
          >
            <PlusIcon /> {triggerLabel}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="center"
            sideOffset={8}
            className="w-[560px] p-1.5"
          >
            <p className="px-2 pt-1 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {menuLabel}
            </p>
            <div className="grid auto-rows-fr grid-cols-2 gap-1">
              {entries.map((entry) => (
                <BlockTypeMenuItem
                  key={entry.key}
                  icon={entry.icon}
                  label={entry.label}
                  description={entry.description}
                  onSelect={entry.onSelect}
                />
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

type BlockTypeTileProps = {
  icon: ReactNode;
  label: string;
  description: string;
  onSelect: () => void;
};

function BlockTypeTileInner({
  icon,
  label,
  description,
}: Omit<BlockTypeTileProps, 'onSelect'>) {
  return (
    <>
      <span
        aria-hidden
        className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-foreground/[0.04] text-foreground/80 ring-1 ring-foreground/10 transition-colors group-hover/item:bg-foreground/10 group-hover/item:text-foreground group-focus/item:bg-foreground/10 group-focus/item:text-foreground"
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5 pt-0.5">
        <span className="truncate text-sm font-medium leading-tight text-foreground">
          {label}
        </span>
        <span className="text-xs leading-snug text-muted-foreground">
          {description}
        </span>
      </span>
    </>
  );
}

function BlockTypeMenuItem({
  icon,
  label,
  description,
  onSelect,
}: BlockTypeTileProps) {
  return (
    <DropdownMenuItem
      onClick={onSelect}
      className="group/item flex h-full cursor-pointer items-start gap-3 rounded-md p-2"
    >
      <BlockTypeTileInner
        icon={icon}
        label={label}
        description={description}
      />
    </DropdownMenuItem>
  );
}

function BlockTypeTileButton({
  icon,
  label,
  description,
  onSelect,
}: BlockTypeTileProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group/item flex h-full w-full items-start gap-3 rounded-md p-2 text-left outline-none transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
    >
      <BlockTypeTileInner
        icon={icon}
        label={label}
        description={description}
      />
    </button>
  );
}
