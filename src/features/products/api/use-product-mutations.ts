'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import type { Product } from '../model/types';

import {
  archiveProductAction,
  changeProductDescriptionAction,
  changeProductDurationAction,
  changeProductNameAction,
  deleteProductAction,
  publishProductAction,
  removeProductCoverAction,
  setProductCoverAction,
  unarchiveProductAction,
} from './product-mutations';
import { myProductsKey } from './use-my-products';
import { productKey } from './use-product';

function useFailureToast() {
  const t = useTranslations('teach-products.editor.toast');
  return (key: string) => toast.error(t(key));
}

export function useChangeProductNameMutation(productId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<
    void,
    Error,
    { value: string },
    { previous?: Product }
  >({
    mutationFn: async ({ value }) => {
      const result = await changeProductNameAction({ productId, value });
      if (!result.ok) throw new Error(result.reason);
    },
    onMutate: async ({ value }) => {
      await qc.cancelQueries({ queryKey: productKey(productId) });
      const previous = qc.getQueryData<Product>(productKey(productId));
      if (previous) {
        qc.setQueryData<Product>(productKey(productId), {
          ...previous,
          title: value,
        });
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(productKey(productId), ctx.previous);
      }
      fail('renameProductFailed');
    },
    // PATCH /name returns 204 — the cache value we just wrote IS the new
    // server state. Refetching here would trigger a GET /products/{id} on
    // every keystroke-debounce; we trust the optimistic update instead.
  });
}

export function useChangeProductDescriptionMutation(productId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<
    void,
    Error,
    { value: string },
    { previous?: Product }
  >({
    mutationFn: async ({ value }) => {
      const result = await changeProductDescriptionAction({
        productId,
        value,
      });
      if (!result.ok) throw new Error(result.reason);
    },
    onMutate: async ({ value }) => {
      await qc.cancelQueries({ queryKey: productKey(productId) });
      const previous = qc.getQueryData<Product>(productKey(productId));
      if (previous) {
        qc.setQueryData<Product>(productKey(productId), {
          ...previous,
          description: value,
        });
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(productKey(productId), ctx.previous);
      }
      fail('updateDescriptionFailed');
    },
    // 204 — no server-derived state to fetch. Skip invalidation.
  });
}

export function useChangeProductDurationMutation(productId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<
    void,
    Error,
    { value: number },
    { previous?: Product }
  >({
    mutationFn: async ({ value }) => {
      const result = await changeProductDurationAction({
        productId,
        value,
      });
      if (!result.ok) throw new Error(result.reason);
    },
    onMutate: async ({ value }) => {
      await qc.cancelQueries({ queryKey: productKey(productId) });
      const previous = qc.getQueryData<Product>(productKey(productId));
      if (previous) {
        qc.setQueryData<Product>(productKey(productId), {
          ...previous,
          durationHours: value,
        });
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(productKey(productId), ctx.previous);
      }
      fail('updateDurationFailed');
    },
    // 204 — no server-derived state to fetch. Skip invalidation.
  });
}

export function useSetProductCoverMutation(productId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<{ fileId: string }, Error, { file: File }>({
    mutationFn: async ({ file }) => {
      const formData = new FormData();
      formData.append('file', file);
      const result = await setProductCoverAction(productId, formData);
      if (!result.ok) throw new Error(result.reason);
      return { fileId: result.fileId };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKey(productId) });
    },
    onError: () => fail('uploadCoverFailed'),
  });
}

export function useRemoveProductCoverMutation(productId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const result = await removeProductCoverAction({ productId });
      if (!result.ok) throw new Error(result.reason);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKey(productId) });
    },
    onError: () => fail('removeCoverFailed'),
  });
}

export function usePublishProductMutation(productId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const result = await publishProductAction({ productId });
      if (!result.ok) throw new Error(result.reason);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKey(productId) });
    },
    onError: () => fail('publishFailed'),
  });
}

export function useArchiveProductMutation(productId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const result = await archiveProductAction({ productId });
      if (!result.ok) throw new Error(result.reason);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKey(productId) });
      qc.invalidateQueries({ queryKey: myProductsKey });
    },
    onError: () => fail('archiveFailed'),
  });
}

export function useUnarchiveProductMutation(productId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const result = await unarchiveProductAction({ productId });
      if (!result.ok) throw new Error(result.reason);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKey(productId) });
      qc.invalidateQueries({ queryKey: myProductsKey });
    },
    onError: () => fail('unarchiveFailed'),
  });
}

export function useDeleteProductMutation(productId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const result = await deleteProductAction({ productId });
      if (!result.ok) throw new Error(result.reason);
    },
    onSuccess: () => {
      qc.removeQueries({ queryKey: productKey(productId) });
      qc.invalidateQueries({ queryKey: myProductsKey });
    },
    onError: () => fail('deleteProductFailed'),
  });
}
