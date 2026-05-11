'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import type { UserExperience } from '../model/types';

import {
  addUserExperienceAction,
  deleteUserExperienceAction,
  deleteUserExperienceIconAction,
  listUserExperiencesAction,
  updateUserExperienceAction,
  uploadUserExperienceIconAction,
} from './experiences';

export const userExperiencesKey = (userId: string) =>
  ['user-experiences', userId] as const;

export function useUserExperiences(userId: string | undefined) {
  return useQuery<UserExperience[], Error>({
    queryKey: userExperiencesKey(userId ?? ''),
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) throw new Error('missing-user-id');
      const result = await listUserExperiencesAction(userId);
      if (!result.ok) throw new Error(result.reason);
      return result.entries;
    },
    staleTime: 30_000,
  });
}

type AddVars = {
  title: string;
  startDate: string;
  endDate: string | null;
  description: string | null;
  sourceUrl: string | null;
  /** Optional icon file to upload after the experience is created. */
  iconFile?: File | null;
};

export function useAddExperienceMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation<string, Error, AddVars>({
    mutationFn: async (vars) => {
      const created = await addUserExperienceAction({
        title: vars.title,
        startDate: vars.startDate,
        endDate: vars.endDate,
        description: vars.description,
        sourceUrl: vars.sourceUrl,
      });
      if (!created.ok) throw new Error(created.reason);
      if (vars.iconFile) {
        const formData = new FormData();
        formData.set('file', vars.iconFile);
        const upload = await uploadUserExperienceIconAction(
          created.id,
          formData,
        );
        if (!upload.ok) throw new Error(upload.reason);
      }
      return created.id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userExperiencesKey(userId) });
    },
  });
}

type UpdateVars = AddVars & { id: string };

export function useUpdateExperienceMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, UpdateVars>({
    mutationFn: async ({ id, iconFile, ...input }) => {
      const updated = await updateUserExperienceAction(id, {
        title: input.title,
        startDate: input.startDate,
        endDate: input.endDate,
        description: input.description,
        sourceUrl: input.sourceUrl,
      });
      if (!updated.ok) throw new Error(updated.reason);
      if (iconFile) {
        const formData = new FormData();
        formData.set('file', iconFile);
        const upload = await uploadUserExperienceIconAction(id, formData);
        if (!upload.ok) throw new Error(upload.reason);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userExperiencesKey(userId) });
    },
  });
}

export function useDeleteExperienceMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      const result = await deleteUserExperienceAction(id);
      if (!result.ok) throw new Error(result.reason);
    },
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: userExperiencesKey(userId) });
      const previous = qc.getQueryData<UserExperience[]>(
        userExperiencesKey(userId),
      );
      qc.setQueryData<UserExperience[]>(
        userExperiencesKey(userId),
        (entries) => entries?.filter((entry) => entry.id !== id),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      const previous = (ctx as { previous?: UserExperience[] } | undefined)
        ?.previous;
      if (previous) {
        qc.setQueryData(userExperiencesKey(userId), previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: userExperiencesKey(userId) });
    },
  });
}

export function useRemoveExperienceIconMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      const result = await deleteUserExperienceIconAction(id);
      if (!result.ok) throw new Error(result.reason);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: userExperiencesKey(userId) });
    },
  });
}
