'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { isResourceLimitError } from '@/shared/api/resource-limit';
import { useNotify } from '@/shared/lib/notify';
import { failMutation } from '@/shared/ui/resource-limit-dialog';

import {
  addProductQAAction,
  changeProductQAAnswerAction,
  changeProductQAQuestionAction,
  deleteProductQAAction,
  getProductQAListAction,
  reorderProductQAAction,
  type ProductQA,
} from './qa';

export const productQAKey = (productId: string) =>
  ['product-qa', productId] as const;

function useFailureToast() {
  const t = useTranslations('teach-products.editor.toast');
  const notify = useNotify();
  return (key: string, err?: unknown) => {
    if (isResourceLimitError(err)) return;
    notify.error(t(key));
  };
}

export function useProductQA(productId: string) {
  return useQuery<ProductQA[], Error>({
    queryKey: productQAKey(productId),
    queryFn: async () => {
      const result = await getProductQAListAction(productId);
      if (!result.ok) throw new Error(result.reason);
      return result.entries;
    },
    staleTime: 30_000,
  });
}

type Ctx = { previous?: ProductQA[]; tempId?: string };

function snapshot(qc: QueryClient, productId: string): Ctx {
  return {
    previous: qc.getQueryData<ProductQA[]>(productQAKey(productId)),
  };
}

function restore(
  qc: QueryClient,
  productId: string,
  ctx: Ctx | undefined,
): void {
  if (ctx?.previous) {
    qc.setQueryData(productQAKey(productId), ctx.previous);
  }
}

function setList(
  qc: QueryClient,
  productId: string,
  fn: (entries: ProductQA[]) => ProductQA[],
): void {
  qc.setQueryData<ProductQA[]>(productQAKey(productId), (current) => {
    if (!current) return current;
    return fn(current);
  });
}

function reposition(entries: ProductQA[]): ProductQA[] {
  return entries.map((entry, index) => ({ ...entry, position: index }));
}

function tempId(): string {
  return `qa-tmp-${Math.random().toString(36).slice(2, 10)}`;
}

export function useAddQAMutation(productId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<
    { id: string; tempId: string },
    Error,
    { question: string; answer: string },
    Ctx
  >({
    mutationFn: async ({ question, answer }) => {
      const current =
        qc.getQueryData<ProductQA[]>(productQAKey(productId)) ?? [];
      const result = await addProductQAAction({
        productId,
        question,
        answer,
        position: current.length,
      });
      if (!result.ok) failMutation(result);
      return { id: result.id, tempId: '' };
    },
    onMutate: async ({ question, answer }) => {
      await qc.cancelQueries({ queryKey: productQAKey(productId) });
      const ctx = snapshot(qc, productId);
      const newId = tempId();
      const current =
        qc.getQueryData<ProductQA[]>(productQAKey(productId)) ?? [];
      qc.setQueryData<ProductQA[]>(productQAKey(productId), [
        ...current,
        {
          id: newId,
          productId,
          question,
          answer,
          position: current.length,
        },
      ]);
      return { ...ctx, tempId: newId };
    },
    onSuccess: ({ id }, _vars, ctx) => {
      if (!ctx?.tempId) return;
      setList(qc, productId, (entries) =>
        entries.map((e) => (e.id === ctx.tempId ? { ...e, id } : e)),
      );
    },
    onError: (_err, _vars, ctx) => {
      restore(qc, productId, ctx);
      fail('addQAFailed', _err);
    },
    // Server appends at the position we sent (= current length); the temp-id
    // swap above already reconciles. Refetching here would just GET the same
    // list back.
  });
}

export function useChangeQAQuestionMutation(productId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<void, Error, { qaId: string; value: string }, Ctx>({
    mutationFn: async ({ qaId, value }) => {
      const result = await changeProductQAQuestionAction({
        productId,
        qaId,
        value,
      });
      if (!result.ok) throw new Error(result.reason);
    },
    onMutate: async ({ qaId, value }) => {
      await qc.cancelQueries({ queryKey: productQAKey(productId) });
      const ctx = snapshot(qc, productId);
      setList(qc, productId, (entries) =>
        entries.map((e) => (e.id === qaId ? { ...e, question: value } : e)),
      );
      return ctx;
    },
    onError: (_err, _vars, ctx) => {
      restore(qc, productId, ctx);
      fail('updateQAFailed');
    },
  });
}

export function useChangeQAAnswerMutation(productId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<void, Error, { qaId: string; value: string }, Ctx>({
    mutationFn: async ({ qaId, value }) => {
      const result = await changeProductQAAnswerAction({
        productId,
        qaId,
        value,
      });
      if (!result.ok) throw new Error(result.reason);
    },
    onMutate: async ({ qaId, value }) => {
      await qc.cancelQueries({ queryKey: productQAKey(productId) });
      const ctx = snapshot(qc, productId);
      setList(qc, productId, (entries) =>
        entries.map((e) => (e.id === qaId ? { ...e, answer: value } : e)),
      );
      return ctx;
    },
    onError: (_err, _vars, ctx) => {
      restore(qc, productId, ctx);
      fail('updateQAFailed');
    },
  });
}

export function useDeleteQAMutation(productId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<void, Error, { qaId: string }, Ctx>({
    mutationFn: async ({ qaId }) => {
      const result = await deleteProductQAAction({ productId, qaId });
      if (!result.ok) throw new Error(result.reason);
    },
    onMutate: async ({ qaId }) => {
      await qc.cancelQueries({ queryKey: productQAKey(productId) });
      const ctx = snapshot(qc, productId);
      setList(qc, productId, (entries) =>
        reposition(entries.filter((e) => e.id !== qaId)),
      );
      return ctx;
    },
    onError: (_err, _vars, ctx) => {
      restore(qc, productId, ctx);
      fail('deleteQAFailed');
    },
    // Local filter + reposition matches the server's outcome on delete.
  });
}

export function useReorderQAMutation(productId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<
    void,
    Error,
    { qaId: string; position: number },
    Ctx
  >({
    mutationFn: async ({ qaId, position }) => {
      const result = await reorderProductQAAction({
        productId,
        qaId,
        position,
      });
      if (!result.ok) throw new Error(result.reason);
    },
    onMutate: async ({ qaId, position }) => {
      await qc.cancelQueries({ queryKey: productQAKey(productId) });
      const ctx = snapshot(qc, productId);
      setList(qc, productId, (entries) => {
        const fromIdx = entries.findIndex((e) => e.id === qaId);
        if (fromIdx === -1) return entries;
        const next = [...entries];
        const [moved] = next.splice(fromIdx, 1);
        const target = Math.max(0, Math.min(position, next.length));
        next.splice(target, 0, moved);
        return reposition(next);
      });
      return ctx;
    },
    onError: (_err, _vars, ctx) => {
      restore(qc, productId, ctx);
      fail('reorderQAFailed');
    },
    onSettled: () =>
      qc.invalidateQueries({ queryKey: productQAKey(productId) }),
  });
}
