'use client';

import { BellIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useIsMobile } from '@/shared/hooks/use-mobile';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/shared/ui/sheet';

import { useNotificationCountersQuery } from '../api/queries';
import { useNotificationsWebSocket } from '../api/use-notifications-ws';

import { NotificationsPanel } from './notifications-panel';

const MAX_BADGE_COUNT = 99;

/**
 * Header bell that opens the notifications panel.
 *
 * Uses `Popover` on tablet/desktop and a `Sheet` (slide-up from
 * the right edge) on mobile per the responsive translation rule —
 * the desktop popover does not fit a 375px viewport.
 *
 * The WebSocket is held open for as long as the bell is mounted so
 * the unread badge reacts to push deltas in real time even when the
 * panel is closed; the alternative — opening on panel-mount — meant
 * Redis pub/sub messages were dropped while the panel was closed
 * (no subscriber, no replay), and the badge had to wait out the
 * 30s counters staleTime before it could surface a new invite.
 */
export function NotificationsBell() {
  const t = useTranslations('notifications');
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const countersQuery = useNotificationCountersQuery(true);
  const unread = countersQuery.data?.unread ?? 0;

  useNotificationsWebSocket(true);

  const trigger = (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="relative size-10 rounded-lg shadow-xs"
      aria-label={t('triggerAriaLabel', { count: unread })}
    >
      <BellIcon className="size-[18px]" />
      {unread > 0 ? (
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute -top-1.5 -right-1.5',
            'inline-flex h-[18px] min-w-[18px] items-center justify-center',
            'rounded-full border-2 border-background bg-brand px-1',
            'text-[10px] font-semibold leading-none text-brand-foreground',
          )}
        >
          {unread > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : unread}
        </span>
      ) : null}
    </Button>
  );

  const handleClose = () => setOpen(false);

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger render={trigger} />
        <SheetContent
          side="right"
          showCloseButton={false}
          className="w-[88vw] max-w-[360px] gap-0 p-0"
        >
          <NotificationsPanel open={open} onClose={handleClose} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={trigger} />
      <PopoverContent
        align="end"
        sideOffset={10}
        className="h-[min(520px,calc(100dvh-6rem))] w-[360px] max-w-[calc(100vw-2rem)] gap-0 overflow-hidden p-0"
      >
        <NotificationsPanel open={open} onClose={handleClose} />
      </PopoverContent>
    </Popover>
  );
}
