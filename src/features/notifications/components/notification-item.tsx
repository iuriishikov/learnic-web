'use client';

import { motion } from 'motion/react';
import { useFormatter, useNow, useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

import { cn } from '@/shared/lib/utils';
import { buildUserDisplayName, UserAvatar } from '@/shared/ui/user-avatar';

import { lookupKind } from '../kinds/registry';
import type { Notification } from '../model/types';

type NotificationItemProps = {
  notification: Notification;
  onMarkRead: (id: string) => void;
};

const CATEGORY_TAG: Record<Notification['category'], string> = {
  teaching: 'teaching',
  learning: 'learning',
  security: 'security',
  files: 'files',
  jobs: 'jobs',
  other: 'general',
};

export function NotificationItem({
  notification,
  onMarkRead,
}: NotificationItemProps) {
  const t = useTranslations('notifications');
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const isUnread = notification.readAt === null;
  const { descriptor } = lookupKind(notification.details);
  const fallbackActor = descriptor.getFallbackActor?.(notification.details);
  const displayActor = notification.actor ?? fallbackActor ?? null;
  const tag = t(`categoryTag.${CATEGORY_TAG[notification.category]}`);
  const Action = descriptor.Action;
  const RenderLine = descriptor.renderLine;
  const RenderAvatar = descriptor.renderAvatar;

  function handlePointerEnter() {
    if (!isUnread) return;
    onMarkRead(notification.oid);
  }

  // Mark as read once the item scrolls into view inside the notifications
  // panel. The observer's ``root`` is the scroll-area viewport (looked up via
  // a stable ``data-slot`` selector) so items clipped by overflow aren't
  // counted as visible just because they sit within the document viewport.
  const itemRef = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (!isUnread) return;
    const el = itemRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const root =
      (el.closest('[data-slot="scroll-area-viewport"]') as HTMLElement | null) ??
      null;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            onMarkRead(notification.oid);
            observer.disconnect();
            break;
          }
        }
      },
      { root, threshold: 0.6 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isUnread, onMarkRead, notification.oid]);

  return (
    <motion.li
      ref={itemRef}
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      onMouseEnter={handlePointerEnter}
      onFocus={handlePointerEnter}
      className={cn('group flex gap-2.5 px-3 py-2.5 transition-colors')}
    >
      <div className="relative shrink-0">
        {RenderAvatar ? (
          <RenderAvatar details={notification.details} />
        ) : (
          <UserAvatar
            user={
              displayActor
                ? {
                    id: displayActor.oid,
                    fullName: displayActor.fullName,
                    avatar: null,
                  }
                : null
            }
            size="lg"
            shape="circle"
          />
        )}
        {isUnread ? (
          <span
            aria-label={t('unread')}
            className={cn(
              'absolute -left-0.5 -top-0.5 z-10',
              'inline-block size-2.5 rounded-full bg-brand',
              'ring-2 ring-popover',
            )}
          />
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="text-sm leading-snug text-foreground">
          {RenderLine ? (
            <RenderLine details={notification.details} />
          ) : (
            <DefaultNotificationLine
              notification={notification}
              displayActor={displayActor}
              leadKey={descriptor.leadKey}
            />
          )}
        </p>
        <p className="text-xs text-muted-foreground">
          <span>{format.relativeTime(new Date(notification.createdAt), now)}</span>
          <span className="mx-1.5 opacity-60">•</span>
          <span>{tag}</span>
        </p>

        {Action ? (
          <div className="mt-1.5">
            <Action
              details={notification.details}
              onResolved={() => onMarkRead(notification.oid)}
            />
          </div>
        ) : null}
      </div>
    </motion.li>
  );
}

function DefaultNotificationLine({
  notification,
  displayActor,
  leadKey,
}: {
  notification: Notification;
  displayActor: Notification['actor'];
  leadKey: string;
}) {
  const t = useTranslations('notifications');
  const actorName = displayActor
    ? buildUserDisplayName({ fullName: displayActor.fullName })
    : t('actorUnknown');
  const details = notification.details as { product?: { name?: string } };
  const productName = details.product?.name || t('productFallback');
  return (
    <NotificationLine
      actorName={actorName}
      productName={productName}
      leadKey={leadKey}
    />
  );
}

function NotificationLine({
  actorName,
  productName,
  leadKey,
}: {
  actorName: string;
  productName: string;
  leadKey: string;
}) {
  const t = useTranslations('notifications');
  return (
    <span>
      <strong className="font-semibold">{actorName}</strong>{' '}
      <span className="text-muted-foreground">
        {t(`lines.${leadKey}.lead`)}
      </span>{' '}
      <strong className="font-semibold">«{productName}»</strong>
    </span>
  );
}
