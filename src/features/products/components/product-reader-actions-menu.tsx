'use client';

import { InfoIcon, MoreVerticalIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { useRouter } from '@/shared/config/i18n/navigation';
import { Button } from '@/shared/ui/button';
import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from '@/shared/ui/menu';

import type { NoteReleaseSummary } from '../api/releases';
import {
  useMyEnrollmentReleases,
  useRepinMyEnrollmentMutation,
} from '../api/use-my-enrollment-releases';

function releaseLabel(r: NoteReleaseSummary): string {
  return `v${r.version.major}.${r.version.minor}.${r.version.patch}`;
}

type ProductReaderActionsMenuProps = {
  productId: string;
  /** Enrollment id when the viewer is enrolled — enables release switching. */
  enrollmentId: string | null;
  currentReleaseId: string;
};

/**
 * The reader's overflow ("⋮") menu. Always offers "About the note" (back to
 * its marketplace page); for enrolled students it also lists every release as
 * a radio group so they can re-pin which one they study. A small dot on the
 * trigger flags that a newer release than the pinned one exists.
 */
export function ProductReaderActionsMenu({
  productId,
  enrollmentId,
  currentReleaseId,
}: ProductReaderActionsMenuProps) {
  const t = useTranslations('product-reader');
  const router = useRouter();

  const { data: releases } = useMyEnrollmentReleases(
    enrollmentId ?? '',
    Boolean(enrollmentId),
  );
  const repin = useRepinMyEnrollmentMutation(productId, enrollmentId ?? '');

  const sorted = useMemo(
    () => (releases ? [...releases].sort((a, b) => b.ordinal - a.ordinal) : []),
    [releases],
  );
  const current = sorted.find((r) => r.id === currentReleaseId) ?? null;
  const latest = sorted[0] ?? null;
  const updateAvailable =
    current !== null && latest !== null && latest.ordinal > current.ordinal;
  const canSwitchRelease = Boolean(enrollmentId) && sorted.length > 1;

  return (
    <Menu>
      <MenuTrigger
        render={
          <Button
            size="icon"
            variant="ghost"
            aria-label={t('actions.menuLabel')}
            className="relative shrink-0 text-muted-foreground"
          >
            <MoreVerticalIcon className="size-4" aria-hidden />
            {updateAvailable ? (
              <>
                <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-brand ring-2 ring-background" />
                <span className="sr-only">{t('release.updateAvailable')}</span>
              </>
            ) : null}
          </Button>
        }
      />
      <MenuContent align="end" sideOffset={8} size="md">
        <MenuGroup>
          <MenuItem
            leading={<InfoIcon />}
            onClick={() => router.push(`/marketplace/${productId}`)}
          >
            {t('nav.about')}
          </MenuItem>
        </MenuGroup>

        {canSwitchRelease ? (
          <>
            <MenuSeparator />
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
                  <MenuRadioItem
                    key={r.id}
                    value={r.id}
                    disabled={repin.isPending}
                  >
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
          </>
        ) : null}
      </MenuContent>
    </Menu>
  );
}
