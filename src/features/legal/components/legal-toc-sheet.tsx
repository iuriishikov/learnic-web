'use client';

import { ListTreeIcon } from 'lucide-react';
import { useState } from 'react';

import {
  BottomSheet,
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
} from '@/shared/ui/bottom-sheet';
import { Button } from '@/shared/ui/button';
import { OutlineNav, type OutlineNavItem } from '@/shared/ui/outline-nav';

import { scrollToLegalSection } from '../lib/scroll';

type LegalTocSheetProps = {
  items: OutlineNavItem[];
  heading: string;
  ariaLabel: string;
};

/**
 * Mobile / tablet form of the table of contents: a compact pill button
 * opens a bottom sheet listing the sections. Picking one closes the sheet
 * and then jumps to the section — the scroll runs after the sheet's close
 * releases the body scroll lock, so the page actually moves. `OutlineNav`
 * runs in scroll-spy mode (for the active highlight) but with
 * `scrollOnSelect` off, since the sheet owns the deferred scroll.
 */
export function LegalTocSheet({ items, heading, ariaLabel }: LegalTocSheetProps) {
  const [open, setOpen] = useState(false);

  function handleNavigate(id: string) {
    setOpen(false);
    // Wait for the sheet to close and vaul to restore body scroll, then
    // jump to the section.
    window.setTimeout(() => scrollToLegalSection(id), 330);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-full"
        onClick={() => setOpen(true)}
      >
        <ListTreeIcon className="size-4" aria-hidden />
        {heading}
      </Button>

      <BottomSheet open={open} onOpenChange={setOpen}>
        <BottomSheetContent className="max-h-[80vh]">
          <BottomSheetHeader>
            <BottomSheetTitle>{heading}</BottomSheetTitle>
          </BottomSheetHeader>
          <BottomSheetBody>
            <OutlineNav
              items={items}
              ariaLabel={ariaLabel}
              scrollSpy
              scrollOnSelect={false}
              onSelect={handleNavigate}
            />
          </BottomSheetBody>
        </BottomSheetContent>
      </BottomSheet>
    </>
  );
}
