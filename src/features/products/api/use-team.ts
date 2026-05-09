'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { useNotify } from '@/shared/lib/notify';

import type {
  Collaboration,
  GrantSpec,
  Permission,
  Role,
  UserSearchResult,
} from '../model/team';

import type { EffectivePermissions } from './team';
import {
  createCustomRoleAction,
  deleteCustomRoleAction,
  getMyEffectivePermissionsAction,
  inviteCollaboratorByEmailAction,
  inviteCollaboratorByUserAction,
  listProductCollaborationsAction,
  listProductRolesAction,
  revokeCollaborationAction,
  searchUsersAction,
  updateCollaborationGrantsAction,
  updateCustomRoleAction,
} from './team';

export const productRolesKey = (productId: string) =>
  ['product-roles', productId] as const;

export const productCollaborationsKey = (productId: string) =>
  ['product-collaborations', productId] as const;

export const productMyPermissionsKey = (productId: string) =>
  ['product-my-permissions', productId] as const;

function useFailureToast() {
  const t = useTranslations('teach-products.editor.toast');
  const notify = useNotify();
  return (key: string) => notify.error(t(key));
}

/* -------------------------------------------------------------------------- */
/* Queries                                                                    */
/* -------------------------------------------------------------------------- */

export function useProductRoles(productId: string) {
  return useQuery<Role[], Error>({
    queryKey: productRolesKey(productId),
    queryFn: async () => {
      const result = await listProductRolesAction(productId);
      if (!result.ok) throw new Error(result.reason);
      return result.roles;
    },
    staleTime: 30_000,
  });
}

export const userSearchKey = (query: string) =>
  ['user-search', query.trim().toLowerCase()] as const;

export function useUserSearch(query: string, options?: { enabled?: boolean }) {
  const trimmed = query.trim();
  return useQuery<UserSearchResult[], Error>({
    queryKey: userSearchKey(trimmed),
    queryFn: async () => {
      const result = await searchUsersAction({ query: trimmed });
      if (!result.ok) throw new Error(result.reason);
      return result.users;
    },
    enabled: (options?.enabled ?? true) && trimmed.length >= 2,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useProductCollaborations(productId: string) {
  return useQuery<Collaboration[], Error>({
    queryKey: productCollaborationsKey(productId),
    queryFn: async () => {
      const result = await listProductCollaborationsAction({ productId });
      if (!result.ok) throw new Error(result.reason);
      return result.items;
    },
    staleTime: 15_000,
  });
}

export function useMyEffectivePermissions(
  productId: string,
  options?: { enabled?: boolean },
) {
  return useQuery<EffectivePermissions, Error>({
    queryKey: productMyPermissionsKey(productId),
    queryFn: async () => {
      const result = await getMyEffectivePermissionsAction(productId);
      if (!result.ok) throw new Error(result.reason);
      return result.data;
    },
    staleTime: 60_000,
    enabled: options?.enabled ?? true,
  });
}

/* -------------------------------------------------------------------------- */
/* Mutations — collaborations                                                 */
/* -------------------------------------------------------------------------- */

type InviteByEmailError = Error & {
  reason?: string;
  limit?: number;
  retryAfterSeconds?: number;
};

export function useInviteByEmailMutation(productId: string) {
  const qc = useQueryClient();
  const t = useTranslations('teach-products.editor.toast');
  const notify = useNotify();
  return useMutation<
    { id: string },
    InviteByEmailError,
    { email: string; grants: GrantSpec[] }
  >({
    mutationFn: async ({ email, grants }) => {
      const result = await inviteCollaboratorByEmailAction({
        productId,
        email,
        grants,
      });
      if (!result.ok) {
        const error: InviteByEmailError = Object.assign(
          new Error(result.reason),
          { reason: result.reason },
        );
        if (result.reason === 'rate-limited') {
          error.limit = result.limit;
          error.retryAfterSeconds = result.retryAfterSeconds;
        }
        throw error;
      }
      return { id: result.id };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productCollaborationsKey(productId) });
    },
    onError: (err) => {
      if (err.reason === 'rate-limited' && typeof err.limit === 'number') {
        notify.error(
          t('inviteRateLimited', {
            limit: err.limit,
            hours: Math.max(
              1,
              Math.round((err.retryAfterSeconds ?? 0) / 3600),
            ),
          }),
        );
        return;
      }
      notify.error(t('inviteCollaboratorFailed'));
    },
  });
}

export function useInviteByUserMutation(productId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<
    { id: string },
    Error,
    { userId: string; grants: GrantSpec[] }
  >({
    mutationFn: async ({ userId, grants }) => {
      const result = await inviteCollaboratorByUserAction({
        productId,
        userId,
        grants,
      });
      if (!result.ok) throw new Error(result.reason);
      return { id: result.id };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productCollaborationsKey(productId) });
    },
    onError: () => fail('inviteCollaboratorFailed'),
  });
}

export function useRevokeCollaborationMutation(productId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<
    void,
    Error,
    { collaborationId: string },
    { previous?: Collaboration[] }
  >({
    mutationFn: async ({ collaborationId }) => {
      const result = await revokeCollaborationAction({ collaborationId });
      if (!result.ok) throw new Error(result.reason);
    },
    onMutate: async ({ collaborationId }) => {
      await qc.cancelQueries({
        queryKey: productCollaborationsKey(productId),
      });
      const previous = qc.getQueryData<Collaboration[]>(
        productCollaborationsKey(productId),
      );
      if (previous) {
        qc.setQueryData<Collaboration[]>(
          productCollaborationsKey(productId),
          previous.filter((c) => c.id !== collaborationId),
        );
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(productCollaborationsKey(productId), ctx.previous);
      }
      fail('revokeCollaborationFailed');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: productCollaborationsKey(productId) });
    },
  });
}

export function useUpdateGrantsMutation(productId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<
    void,
    Error,
    { collaborationId: string; grants: GrantSpec[] }
  >({
    mutationFn: async ({ collaborationId, grants }) => {
      const result = await updateCollaborationGrantsAction({
        collaborationId,
        grants,
      });
      if (!result.ok) throw new Error(result.reason);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productCollaborationsKey(productId) });
    },
    onError: () => fail('updateGrantsFailed'),
  });
}

/* -------------------------------------------------------------------------- */
/* Mutations — roles                                                          */
/* -------------------------------------------------------------------------- */

export function useCreateRoleMutation(productId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<
    { id: string },
    Error,
    { name: string; description?: string; permissions: Permission[] }
  >({
    mutationFn: async ({ name, description, permissions }) => {
      const result = await createCustomRoleAction({
        productId,
        name,
        description,
        permissions,
      });
      if (!result.ok) throw new Error(result.reason);
      return { id: result.id };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productRolesKey(productId) });
    },
    onError: () => fail('createRoleFailed'),
  });
}

export function useUpdateRoleMutation(productId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<
    void,
    Error,
    {
      roleId: string;
      name?: string;
      description?: string | null;
      clearDescription?: boolean;
      permissions?: Permission[];
    }
  >({
    mutationFn: async (vars) => {
      const result = await updateCustomRoleAction(vars);
      if (!result.ok) throw new Error(result.reason);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productRolesKey(productId) });
    },
    onError: () => fail('updateRoleFailed'),
  });
}

export function useDeleteRoleMutation(productId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<void, Error, { roleId: string }>({
    mutationFn: async ({ roleId }) => {
      const result = await deleteCustomRoleAction({ roleId });
      if (!result.ok) {
        throw new Error(result.reason === 'conflict' ? 'role-in-use' : result.reason);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productRolesKey(productId) });
    },
    onError: (err) => {
      if (err.message === 'role-in-use') {
        fail('deleteRoleInUse');
        return;
      }
      fail('deleteRoleFailed');
    },
  });
}
