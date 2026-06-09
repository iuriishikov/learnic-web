'use client';

import { ChevronDownIcon, Loader2Icon, SparklesIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from '@/shared/ui/menu';
import { Skeleton } from '@/shared/ui/skeleton';

import type { NoteReleaseSummary } from '../api/releases';
import {
  useMyEnrollmentReleases,
  useRepinMyEnrollmentMutation,
} from '../api/use-my-enrollment-releases';

function releaseLabel(r: NoteReleaseSummary): string {
  return `v${r.version.major}.${r.version.minor}.${r.version.patch}`;
}

/**
 * Lets an enrolled student switch which release of the note they study.
 * Shows the currently-pinned version with a picker of every available
 * release (newest first); choosing a different one self-re-pins the
 * enrollment and the reader reloads onto that release's content. A small
 * "new version" cue appears when a release newer than the pinned one exists.
 */
export function ProductReaderReleaseSwitcher({
  productId,
  enrollmentId,
  currentReleaseId,
}: {
  productId: string;
  enrollmentId: string;
  currentReleaseId: string;
}) {
  const t = useTranslations('product-reader');
  const { data: releases, isPending, isError } =
    useMyEnrollmentReleases(enrollmentId);
  const repin = useRepinMyEnrollmentMutation(productId, enrollmentId);

  const sorted = useMemo(
    () => (releases ? [...releases].sort((a, b) => b.ordinal - a.ordinal) : []),
    [releases],
  );

  const current = sorted.find((r) => r.id === currentReleaseId) ?? null;
  const latest = sorted[0] ?? null;
  const updateAvailable =
    current !== null && latest !== null && latest.ordinal > current.ordinal;

  // Hidden until releases load; if the list errors or has a single release
  // there is nothing to switch between, so the block stays out of the way.
  if (isError) return null;

  if (isPending) {
    return (
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
    );
  }

  if (sorted.length <= 1) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t('release.label')}
        </span>
        {updateAvailable ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand">
            <SparklesIcon className="size-3" />
            {t('release.updateAvailable')}
          </span>
        ) : null}
      </div>

      <Menu>
        <MenuTrigger
          disabled={repin.isPending}
          aria-label={t('release.pickerLabel')}
          className="group/release inline-flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm font-medium text-foreground outline-none transition-colors hover:bg-muted/40 focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-60 data-popup-open:border-brand data-popup-open:ring-3 data-popup-open:ring-brand/20"
        >
          <span className="truncate">
            {current ? releaseLabel(current) : t('release.none')}
          </span>
          {repin.isPending ? (
            <Loader2Icon className="size-4 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-data-popup-open/release:rotate-180" />
          )}
        </MenuTrigger>
        {/* `overflow-y-auto` so a long release list (or a very short window)
            scrolls instead of clipping — the shared popup style is
            `overflow-hidden`, which would otherwise cut the bottom items. */}
        <MenuContent size="md" align="start" className="overflow-y-auto">
          <MenuGroup>
            <MenuLabel>{t('release.change')}</MenuLabel>
            <MenuRadioGroup
              value={currentReleaseId}
              onValueChange={(value) => {
                if (value && value !== currentReleaseId) {
                  repin.mutate({ releaseId: String(value) });
                }
              }}
            >
              {sorted.map((r) => (
                <MenuRadioItem key={r.id} value={r.id}>
                  <span className="inline-flex items-center gap-2 whitespace-nowrap">
                    {releaseLabel(r)}
                    {r.id === latest?.id ? (
                      <span className="inline-flex items-center rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand">
                        {t('release.latest')}
                      </span>
                    ) : null}
                  </span>
                </MenuRadioItem>
              ))}
            </MenuRadioGroup>
          </MenuGroup>
        </MenuContent>
      </Menu>
    </div>
  );
}
