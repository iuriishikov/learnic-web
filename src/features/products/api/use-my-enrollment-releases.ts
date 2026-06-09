'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { useNotify } from '@/shared/lib/notify';

import {
  type NoteReleaseSummary,
  listMyEnrollmentReleasesAction,
  repinMyEnrollmentAction,
} from './releases';
import { noteContentKey } from './use-note-content';
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
 * Switch the student's pinned release. On success the note-content AND
 * saved-answers caches are invalidated so the reader refetches both the
 * newly-pinned release's tree and the answers saved against it (answers are
 * per-release); failures roll nothing back (the pin is server-side) and
 * surface a toast.
 */
export function useRepinMyEnrollmentMutation(
  productId: string,
  enrollmentId: string,
) {
  const qc = useQueryClient();
  const t = useTranslations('product-reader');
  const notify = useNotify();

  return useMutation<void, Error, { releaseId: string }>({
    mutationFn: async ({ releaseId }) => {
      const result = await repinMyEnrollmentAction({ enrollmentId, releaseId });
      if (!result.ok) throw new Error(result.reason);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: noteContentKey(productId) });
      qc.invalidateQueries({ queryKey: myBlockAnswersKey(productId) });
    },
    onError: () => notify.error(t('release.switchFailed')),
  });
}
