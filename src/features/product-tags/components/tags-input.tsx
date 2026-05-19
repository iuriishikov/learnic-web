'use client';

import {
  useProductTags,
  useUpdateProductTagsMutation,
} from '../api/use-tags';
import type { Tag } from '../model/types';
import { TagsField } from './tags-field';

type TagsInputProps = {
  productId: string;
  readOnly?: boolean;
  disabledTitle?: string;
};

/**
 * Server-backed tag picker for an existing product. Owns the
 * `useProductTags` query and pipes every change through the
 * `useUpdateProductTagsMutation` (which handles the optimistic
 * cache update + error toast). The picker UI itself lives in the
 * shared `TagsField` so the create-product flow can drive the same
 * popover with local state.
 */
export function TagsInput({
  productId,
  readOnly,
  disabledTitle,
}: TagsInputProps) {
  const { data: tags = [] } = useProductTags(productId);
  const update = useUpdateProductTagsMutation(productId);

  function commit(next: Tag[]) {
    update.mutate({ tags: next });
  }

  return (
    <TagsField
      value={tags}
      onChange={commit}
      readOnly={readOnly}
      disabledTitle={disabledTitle}
    />
  );
}
