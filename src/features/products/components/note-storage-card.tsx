'use client';

import { useTranslations } from 'next-intl';

import { useRouter } from '@/shared/config/i18n/navigation';
import { formatBytes } from '@/shared/lib/format-bytes';
import { CircularProgress } from '@/shared/ui/circular-progress';
import { PromoCard } from '@/shared/ui/promo-card';

import type { NoteStorage } from '../model/note-storage';

export type NoteStorageCardProps = {
  /** Latest snapshot from `useNoteStorageWs`. The parent gates on null. */
  quota: NoteStorage;
  /**
   * Whether the viewer is the note's author (the quota owner). Authors
   * get an "upgrade plan" primary action — collaborators consume the
   * author's pool and cannot upgrade it, so they only see the numbers.
   */
  isAuthor: boolean;
  className?: string;
};

/**
 * Live storage plaque for the note editor sidebar. Purely presentational —
 * the WS hook (`useNoteStorageWs`) lives in the always-mounted editor view
 * and feeds this card a fresh snapshot. Shows the author's pool usage as a
 * circular gauge, plus the bytes this note's own files consume and the
 * remaining pool headroom.
 *
 * Dismissable for the current editor session only (no `storageKey`): the
 * card returns on the next visit — quota visibility should not be
 * permanently opt-out. For the author the primary action routes to the
 * pricing page (`/pricing` — page not implemented yet, the link is the
 * contract).
 */
export function NoteStorageCard({
  quota,
  isAuthor,
  className,
}: NoteStorageCardProps) {
  const t = useTranslations('teach-products.editor.storage');
  const router = useRouter();

  const percent =
    quota.maxBytes > 0
      ? Math.min(100, Math.round((quota.usedBytes / quota.maxBytes) * 100))
      : 0;

  return (
    <PromoCard
      size="sm"
      className={className}
      dismissLabel={t('dismiss')}
      closeLabel={t('close')}
      primaryAction={
        isAuthor
          ? {
              label: t('upgrade'),
              onClick: () => router.push('/pricing'),
            }
          : undefined
      }
      visual={<CircularProgress value={percent} size={56} strokeWidth={7} />}
      title={t('title')}
      description={
        <span className="flex flex-col gap-1">
          <span>{t('noteUsed', { noteUsed: formatBytes(quota.noteUsedBytes) })}</span>
          <span>
            {t('poolRemaining', {
              remaining: formatBytes(quota.remainingBytes),
              max: formatBytes(quota.maxBytes),
            })}
          </span>
        </span>
      }
    />
  );
}
