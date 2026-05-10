'use client';

import { motion } from 'motion/react';
import { useFormatter, useNow, useTranslations } from 'next-intl';

import { cn } from '@/shared/lib/utils';
import { buildUserDisplayName, UserAvatar } from '@/shared/ui/user-avatar';

import { lookupKind } from '../kinds/registry';
import type { Notification } from '../model/types';

type NotificationItemProps = {
  notification: Notification;
  onMarkRead: (id: string) => void;
};

const CATEGORY_TAG: Record<Notification['category'], string> = {
  invites: 'team',
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
  const actorName = displayActor
    ? buildUserDisplayName({ fullName: displayActor.fullName })
    : t('actorUnknown');
  const tag = t(`categoryTag.${CATEGORY_TAG[notification.category]}`);
  const productName =
    notification.details.product.name || t('productFallback');
  const Action = descriptor.Action;

  function handlePointerEnter() {
    if (!isUnread) return;
    onMarkRead(notification.oid);
  }

  return (
    <motion.li
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
        <UserAvatar
          user={
            displayActor
              ? {
                  id: displayActor.oid,
                  fullName: displayActor.fullName,
                  avatarUrl: null,
                }
              : null
          }
          size="lg"
          shape="circle"
        />
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
          <NotificationLine
            actorName={actorName}
            productName={productName}
            leadKey={descriptor.leadKey}
          />
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
