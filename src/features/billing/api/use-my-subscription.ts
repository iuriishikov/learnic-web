'use client';

import { useQuery } from '@tanstack/react-query';

import { type MySubscription } from '../model/subscription';

import { getMySubscriptionAction } from './get-my-subscription';

export const mySubscriptionKey = ['my-subscription'] as const;

/**
 * Polls /users/me/subscription on focus + every 60s.
 *
 * Storage usage updates as the user adds file-backed blocks across
 * their notes; refetching on focus keeps the displayed "X of Y GB"
 * close to live without a WS channel. The 60s background interval
 * catches passive growth (e.g. a collaborator uploaded in another
 * tab).
 */
export function useMySubscription(): {
  data: MySubscription | null;
  isPending: boolean;
  isError: boolean;
} {
  const query = useQuery({
    queryKey: mySubscriptionKey,
    queryFn: async () => {
      const result = await getMySubscriptionAction();
      if (result.ok) return result.subscription;
      // Anonymous (401) and transient (network/unknown) are treated as
      // "no subscription data" — the calling card chooses to render
      // nothing rather than a noisy error.
      return null;
    },
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
  });
  return {
    data: query.data ?? null,
    isPending: query.isPending,
    isError: query.isError,
  };
}
