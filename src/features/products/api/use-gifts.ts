'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { useNotify } from '@/shared/lib/notify';

import type { Gift } from '../model/gifts';

import {
  listProductGifts,
  revokeGiftAction,
  sendGiftByEmailAction,
  sendGiftByUserAction,
} from './gifts';

export const productGiftsKey = (productId: string) =>
  ['product-gifts', productId] as const;

function useGiftFailureToast() {
  const t = useTranslations('teach-products.editor.toast');
  const notify = useNotify();
  return (key: string) => notify.error(t(key));
}

/* -------------------------------------------------------------------------- */
/* Query                                                                      */
/* -------------------------------------------------------------------------- */

export function useProductGifts(productId: string) {
  return useQuery<Gift[], Error>({
    queryKey: productGiftsKey(productId),
    queryFn: async () => {
      const result = await listProductGifts({ productId });
      if (!result.ok) throw new Error(result.reason);
      return result.items;
    },
    staleTime: 15_000,
  });
}

/* -------------------------------------------------------------------------- */
/* Mutations                                                                  */
/* -------------------------------------------------------------------------- */

export function useGiftByUserMutation(productId: string) {
  const qc = useQueryClient();
  const fail = useGiftFailureToast();
  return useMutation<{ id: string }, Error, { userId: string }>({
    mutationFn: async ({ userId }) => {
      const result = await sendGiftByUserAction({ productId, userId });
      if (!result.ok) throw new Error(result.reason);
      return { id: result.id };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productGiftsKey(productId) });
    },
    onError: () => fail('giftFailed'),
  });
}

export function useGiftByEmailMutation(productId: string) {
  const qc = useQueryClient();
  const fail = useGiftFailureToast();
  return useMutation<{ id: string }, Error, { email: string }>({
    mutationFn: async ({ email }) => {
      const result = await sendGiftByEmailAction({ productId, email });
      if (!result.ok) throw new Error(result.reason);
      return { id: result.id };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productGiftsKey(productId) });
    },
    onError: () => fail('giftFailed'),
  });
}

export function useRevokeGiftMutation(productId: string) {
  const qc = useQueryClient();
  const fail = useGiftFailureToast();
  return useMutation<
    void,
    Error,
    { giftId: string },
    { previous?: Gift[] }
  >({
    mutationFn: async ({ giftId }) => {
      const result = await revokeGiftAction({ giftId });
      if (!result.ok) throw new Error(result.reason);
    },
    onMutate: async ({ giftId }) => {
      await qc.cancelQueries({ queryKey: productGiftsKey(productId) });
      const previous = qc.getQueryData<Gift[]>(productGiftsKey(productId));
      if (previous) {
        qc.setQueryData<Gift[]>(
          productGiftsKey(productId),
          previous.filter((g) => g.id !== giftId),
        );
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(productGiftsKey(productId), ctx.previous);
      }
      fail('revokeGiftFailed');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: productGiftsKey(productId) });
    },
  });
}
