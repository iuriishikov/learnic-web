'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { useRouter } from '@/shared/config/i18n/navigation';
import { useNotify } from '@/shared/lib/notify';

import {
  type NoteReleaseSummary,
  listMyEnrollmentReleasesAction,
  repinMyEnrollmentAction,
} from './releases';
import { noteLessonsPrefix } from './use-note-lesson';
import { noteSchemeKey } from './use-note-scheme';
import { myBlockAnswersKey } from './use-saved-answers';

export const myEnrollmentReleasesKey = (enrollmentId: string) =>
  ['my-enrollment-releases', enrollmentId] as const;

export type MyEnrollmentReleasesErrorReason =
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'not-a-note'
  | 'network'
  | 'unknown';

export class MyEnrollmentReleasesError extends Error {
  constructor(public readonly reason: MyEnrollmentReleasesErrorReason) {
    super(reason);
    this.name = 'MyEnrollmentReleasesError';
  }
}

/** Releases the enrolled student can switch their own enrollment to. */
export function useMyEnrollmentReleases(
  enrollmentId: string,
  enabled: boolean = true,
) {
  return useQuery<NoteReleaseSummary[], MyEnrollmentReleasesError>({
    queryKey: myEnrollmentReleasesKey(enrollmentId),
    queryFn: async () => {
      const result = await listMyEnrollmentReleasesAction(enrollmentId);
      if (!result.ok) throw new MyEnrollmentReleasesError(result.reason);
      return result.releases;
    },
    enabled,
    staleTime: 60_000,
  });
}

/**
 * Switch the student's pinned release. On success the note-scheme AND
 * saved-answers caches are invalidated so the reader and the landing's
 * curriculum preview refetch the newly-pinned release's tree along with the
 * answers saved against it (answers are per-release), while the per-lesson
 * caches are REMOVED outright — lesson ids are release-scoped, so a stale id
 * must never refetch (it would 404 against the new release). The router cache
 * is refreshed too: without it a Back-navigation would restore the reader's
 * pre-repin RSC payload and the re-seed effect would stamp the old release's
 * tree back into the query cache. Failures roll nothing back (the pin is
 * server-side) and surface a toast.
 */
export function useRepinMyEnrollmentMutation(
  productId: string,
  enrollmentId: string,
) {
  const qc = useQueryClient();
  const router = useRouter();
  const t = useTranslations('product-reader');
  const notify = useNotify();

  return useMutation<void, Error, { releaseId: string }>({
    mutationFn: async ({ releaseId }) => {
      const result = await repinMyEnrollmentAction({ enrollmentId, releaseId });
      if (!result.ok) throw new Error(result.reason);
    },
    onSuccess: () => {
      qc.removeQueries({ queryKey: noteLessonsPrefix(productId) });
      qc.invalidateQueries({ queryKey: noteSchemeKey(productId) });
      qc.invalidateQueries({ queryKey: myBlockAnswersKey(productId) });
      router.refresh();
    },
    onError: () => notify.error(t('release.switchFailed')),
  });
}
