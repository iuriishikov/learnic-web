'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { isResourceLimitError } from '@/shared/api/resource-limit';
import { useNotify } from '@/shared/lib/notify';
import { failMutation } from '@/shared/ui/resource-limit-dialog';

import {
  type NoteReleaseKind,
  type NoteReleaseSummary,
  createNoteReleaseAction,
  listNoteReleasesAction,
  resetNoteDraftAction,
} from './releases';
import { noteDraftKey } from './use-note-draft';
import { productKey } from './use-product';

export const noteReleasesKey = (noteId: string) =>
  ['note-releases', noteId] as const;

export type NoteReleasesErrorReason =
  | 'unauthorized'
  | 'forbidden'
  | 'not-found'
  | 'not-a-note'
  | 'network'
  | 'unknown';

export class NoteReleasesError extends Error {
  constructor(public readonly reason: NoteReleasesErrorReason) {
    super(reason);
    this.name = 'NoteReleasesError';
  }
}

function useFailureToast() {
  const t = useTranslations('teach-products.editor.toast');
  const notify = useNotify();
  return (key: string, err?: unknown) => {
    if (isResourceLimitError(err)) return;
    notify.error(t(key));
  };
}

export function useNoteReleases(noteId: string, enabled: boolean) {
  return useQuery<NoteReleaseSummary[], NoteReleasesError>({
    queryKey: noteReleasesKey(noteId),
    queryFn: async () => {
      const result = await listNoteReleasesAction(noteId);
      if (!result.ok) throw new NoteReleasesError(result.reason);
      return result.releases;
    },
    enabled,
    staleTime: 30_000,
  });
}

export function useCreateNoteReleaseMutation(noteId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<
    NoteReleaseSummary,
    Error,
    { kind: NoteReleaseKind; notes: string | null }
  >({
    mutationFn: async ({ kind, notes }) => {
      const result = await createNoteReleaseAction({
        noteId,
        kind,
        notes,
      });
      if (!result.ok) failMutation(result);
      return result.release;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: noteReleasesKey(noteId) });
      // First release flips the product to "published" — refresh the product.
      qc.invalidateQueries({ queryKey: productKey(noteId) });
    },
    onError: (err) => fail('createReleaseFailed', err),
  });
}

export function useResetNoteDraftMutation(noteId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<void, Error, { releaseId: string }>({
    mutationFn: async ({ releaseId }) => {
      const result = await resetNoteDraftAction({ noteId, releaseId });
      if (!result.ok) throw new Error(result.reason);
    },
    onSuccess: () => {
      // The DRAFT_RESET WS event also invalidates this; we invalidate
      // explicitly so the local tab refetches without waiting for the push.
      qc.invalidateQueries({ queryKey: noteDraftKey(noteId) });
    },
    onError: () => fail('resetDraftFailed'),
  });
}
