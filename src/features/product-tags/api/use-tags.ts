'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { useNotify } from '@/shared/lib/notify';

import type { Tag } from '../model/types';
import {
  getProductTagsAction,
  searchTagsAction,
  updateProductTagsAction,
} from './tags';

export const productTagsKey = (productId: string) =>
  ['product-tags', productId] as const;

export const tagSearchKey = (query: string) =>
  ['tag-search', query] as const;

export function useProductTags(productId: string) {
  return useQuery<Tag[], Error>({
    queryKey: productTagsKey(productId),
    queryFn: async () => {
      const result = await getProductTagsAction(productId);
      if (!result.ok) throw new Error(result.reason);
      return result.items;
    },
    staleTime: 30_000,
  });
}

export function useTagSearch(query: string, enabled: boolean = true) {
  return useQuery<Tag[], Error>({
    queryKey: tagSearchKey(query),
    queryFn: async () => {
      const result = await searchTagsAction({ query, limit: 20 });
      if (!result.ok) throw new Error(result.reason);
      return result.items;
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    enabled,
  });
}

/**
 * Replace the product's tag set in one shot.
 *
 * Callers pass the **desired final list** of tags (full objects,
 * including the ones already attached). Pending-id tags
 * (``__pending-N``) are mapped to ``{kind:'new'}`` on the wire;
 * everything else is sent as ``{kind:'existing', tag_id}``. The
 * optimistic update stores the caller's list verbatim, so chips
 * render with their real name + color before the server responds.
 */
export function useUpdateProductTagsMutation(productId: string) {
  const qc = useQueryClient();
  const t = useTranslations('teach-products.editor.tags.toast');
  const notify = useNotify();
  return useMutation<
    Tag[],
    Error,
    { tags: Tag[] },
    { previous?: Tag[] }
  >({
    mutationFn: async ({ tags }) => {
      const items = tags.map((tag) =>
        tag.id.startsWith('__pending-')
          ? ({ kind: 'new', name: tag.name, color: tag.color } as const)
          : ({ kind: 'existing', tagId: tag.id } as const),
      );
      const result = await updateProductTagsAction({ productId, items });
      if (!result.ok) throw new Error(result.reason);
      return result.items;
    },
    onMutate: async ({ tags }) => {
      await qc.cancelQueries({ queryKey: productTagsKey(productId) });
      const previous = qc.getQueryData<Tag[]>(productTagsKey(productId));
      qc.setQueryData<Tag[]>(productTagsKey(productId), tags);
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(productTagsKey(productId), ctx.previous);
      }
      notify.error(t('updateError'));
    },
    onSuccess: (items) => {
      qc.setQueryData<Tag[]>(productTagsKey(productId), items);
    },
  });
}
