'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  banUserAction,
  deleteNoteAction,
  grantBetaAction,
  revokeTariffAction,
  unbanUserAction,
} from './admin-actions';

/** Which moderation mutation to run against an entity id. */
export type AdminActionKind = 'ban' | 'unban' | 'grant' | 'revoke' | 'delete';

const RUNNERS = {
  ban: banUserAction,
  unban: unbanUserAction,
  grant: grantBetaAction,
  revoke: revokeTariffAction,
  delete: deleteNoteAction,
} as const;

/**
 * One mutation for every admin moderation action. The caller passes the
 * `kind` + entity `id`; on success the relevant search cache is
 * invalidated so a deleted note (or changed user) doesn't linger.
 */
export function useAdminActionMutation() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { kind: AdminActionKind; id: string }>({
    mutationFn: async ({ kind, id }) => {
      const result = await RUNNERS[kind](id);
      if (!result.ok) throw new Error(result.reason);
    },
    onSuccess: (_data, { kind }) => {
      const key = kind === 'delete' ? 'admin-note-search' : 'admin-user-search';
      queryClient.invalidateQueries({ queryKey: [key] });
    },
  });
}
