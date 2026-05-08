'use client';

import { useQuery } from '@tanstack/react-query';

import type { CourseDraft } from '../model/draft';

import { getCourseDraftAction } from './draft-action';

export const courseDraftKey = (courseId: string) =>
  ['course-draft', courseId] as const;

export type CourseDraftErrorReason =
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'not-a-course'
  | 'network'
  | 'unknown';

export class CourseDraftError extends Error {
  constructor(public readonly reason: CourseDraftErrorReason) {
    super(reason);
    this.name = 'CourseDraftError';
  }
}

export function useCourseDraft(courseId: string, enabled: boolean = true) {
  return useQuery<CourseDraft, CourseDraftError>({
    queryKey: courseDraftKey(courseId),
    queryFn: async () => {
      const result = await getCourseDraftAction(courseId);
      if (!result.ok) throw new CourseDraftError(result.reason);
      return result.draft;
    },
    enabled,
    staleTime: 30_000,
  });
}
