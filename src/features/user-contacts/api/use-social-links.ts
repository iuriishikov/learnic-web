'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  listSocialLinksAction,
  setSocialLinksAction,
} from './social-links';
import type { SocialLink, SocialLinkDraft } from '../model/types';

export const socialLinksKey = (userId: string) =>
  ['user-social-links', userId] as const;

export function useSocialLinks(userId: string | undefined) {
  return useQuery<SocialLink[], Error>({
    queryKey: socialLinksKey(userId ?? ''),
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) throw new Error('missing-user-id');
      const result = await listSocialLinksAction(userId);
      if (!result.ok) throw new Error(result.reason);
      return result.entries;
    },
    staleTime: 30_000,
  });
}

export function useSetSocialLinksMutation(userId: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, { items: SocialLinkDraft[] }>({
    mutationFn: async ({ items }) => {
      const result = await setSocialLinksAction(items);
      if (!result.ok) throw new Error(result.reason);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: socialLinksKey(userId) });
    },
  });
}
