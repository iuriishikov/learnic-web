'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { useNotify } from '@/shared/lib/notify';

import type { Product, ProductVisibility } from '../model/types';

import {
  archiveProductAction,
  changeProductDescriptionAction,
  changeProductDurationAction,
  changeProductNameAction,
  changeProductPriceAction,
  changeProductVisibilityAction,
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
  const notify = useNotify();
  return (key: string) => notify.error(t(key));
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

export function useChangeProductPriceMutation(productId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<
    void,
    Error,
    { amount: number },
    { previous?: Product }
  >({
    mutationFn: async ({ amount }) => {
      const result = await changeProductPriceAction({
        productId,
        amount,
      });
      if (!result.ok) throw new Error(result.reason);
    },
    onMutate: async ({ amount }) => {
      await qc.cancelQueries({ queryKey: productKey(productId) });
      const previous = qc.getQueryData<Product>(productKey(productId));
      if (previous) {
        qc.setQueryData<Product>(productKey(productId), {
          ...previous,
          priceAmount: amount,
        });
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(productKey(productId), ctx.previous);
      }
      fail('updatePriceFailed');
    },
    // 204 — no server-derived state to fetch. Skip invalidation.
  });
}

export function useChangeProductVisibilityMutation(productId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<
    void,
    Error,
    { visibility: ProductVisibility },
    { previous?: Product }
  >({
    mutationFn: async ({ visibility }) => {
      const result = await changeProductVisibilityAction({
        productId,
        visibility,
      });
      if (!result.ok) throw new Error(result.reason);
    },
    onMutate: async ({ visibility }) => {
      await qc.cancelQueries({ queryKey: productKey(productId) });
      const previous = qc.getQueryData<Product>(productKey(productId));
      if (previous) {
        qc.setQueryData<Product>(productKey(productId), {
          ...previous,
          visibility,
        });
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(productKey(productId), ctx.previous);
      }
      fail('changeVisibilityFailed');
    },
    // PATCH /visibility returns 204 — the optimistic cache write IS the
    // new server state. No follow-up GET. Visibility doesn't change
    // which products appear in the catalog/search (private products
    // stay listed); it only gates self-enrollment, so there are no
    // list caches to invalidate here.
  });
}

// The five product-state mutations below all consume the full
// `ProductSchema` body the backend echoes on success. We splice that
// entity straight into the `productKey(id)` cache — no follow-up GET,
// no `invalidateQueries` for the detail view. `myProducts` is a
// separate paginated list whose sort key (`status`) shifts on
// archive/unarchive, so we keep `invalidateQueries(myProductsKey)`
// there to drive a list refetch.
export function useSetProductCoverMutation(productId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<Product, Error, { file: File }>({
    mutationFn: async ({ file }) => {
      const formData = new FormData();
      formData.append('file', file);
      const result = await setProductCoverAction(productId, formData);
      if (!result.ok) throw new Error(result.reason);
      return result.product;
    },
    onSuccess: (product) => {
      qc.setQueryData<Product>(productKey(productId), product);
    },
    onError: () => fail('uploadCoverFailed'),
  });
}

export function useRemoveProductCoverMutation(productId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<Product, Error, void>({
    mutationFn: async () => {
      const result = await removeProductCoverAction({ productId });
      if (!result.ok) throw new Error(result.reason);
      return result.product;
    },
    onSuccess: (product) => {
      qc.setQueryData<Product>(productKey(productId), product);
    },
    onError: () => fail('removeCoverFailed'),
  });
}

export function usePublishProductMutation(productId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<Product, Error, void>({
    mutationFn: async () => {
      const result = await publishProductAction({ productId });
      if (!result.ok) throw new Error(result.reason);
      return result.product;
    },
    onSuccess: (product) => {
      qc.setQueryData<Product>(productKey(productId), product);
    },
    onError: () => fail('publishFailed'),
  });
}

export function useArchiveProductMutation(productId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<Product, Error, void>({
    mutationFn: async () => {
      const result = await archiveProductAction({ productId });
      if (!result.ok) throw new Error(result.reason);
      return result.product;
    },
    onSuccess: (product) => {
      qc.setQueryData<Product>(productKey(productId), product);
      qc.invalidateQueries({ queryKey: myProductsKey });
    },
    onError: () => fail('archiveFailed'),
  });
}

export function useUnarchiveProductMutation(productId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<Product, Error, void>({
    mutationFn: async () => {
      const result = await unarchiveProductAction({ productId });
      if (!result.ok) throw new Error(result.reason);
      return result.product;
    },
    onSuccess: (product) => {
      qc.setQueryData<Product>(productKey(productId), product);
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
