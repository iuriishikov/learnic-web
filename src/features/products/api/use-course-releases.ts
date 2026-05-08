'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  type CourseReleaseKind,
  type CourseReleaseSummary,
  createCourseReleaseAction,
  listCourseReleasesAction,
  resetCourseDraftAction,
} from './releases';
import { courseDraftKey } from './use-course-draft';
import { productKey } from './use-product';

export const courseReleasesKey = (courseId: string) =>
  ['course-releases', courseId] as const;

export type CourseReleasesErrorReason =
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'not-a-course'
  | 'network'
  | 'unknown';

export class CourseReleasesError extends Error {
  constructor(public readonly reason: CourseReleasesErrorReason) {
    super(reason);
    this.name = 'CourseReleasesError';
  }
}

function useFailureToast() {
  const t = useTranslations('teach-products.editor.toast');
  return (key: string) => toast.error(t(key));
}

export function useCourseReleases(courseId: string, enabled: boolean) {
  return useQuery<CourseReleaseSummary[], CourseReleasesError>({
    queryKey: courseReleasesKey(courseId),
    queryFn: async () => {
      const result = await listCourseReleasesAction(courseId);
      if (!result.ok) throw new CourseReleasesError(result.reason);
      return result.releases;
    },
    enabled,
    staleTime: 30_000,
  });
}

export function useCreateCourseReleaseMutation(courseId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<
    CourseReleaseSummary,
    Error,
    { kind: CourseReleaseKind; notes: string | null }
  >({
    mutationFn: async ({ kind, notes }) => {
      const result = await createCourseReleaseAction({
        courseId,
        kind,
        notes,
      });
      if (!result.ok) throw new Error(result.reason);
      return result.release;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: courseReleasesKey(courseId) });
      // First release flips the product to "published" — refresh the product.
      qc.invalidateQueries({ queryKey: productKey(courseId) });
    },
    onError: () => fail('createReleaseFailed'),
  });
}

export function useResetCourseDraftMutation(courseId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<void, Error, { releaseId: string }>({
    mutationFn: async ({ releaseId }) => {
      const result = await resetCourseDraftAction({ courseId, releaseId });
      if (!result.ok) throw new Error(result.reason);
    },
    onSuccess: () => {
      // The DRAFT_RESET WS event also invalidates this; we invalidate
      // explicitly so the local tab refetches without waiting for the push.
      qc.invalidateQueries({ queryKey: courseDraftKey(courseId) });
    },
    onError: () => fail('resetDraftFailed'),
  });
}
