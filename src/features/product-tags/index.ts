export { TagsInput } from './components/tags-input';
export { TagChip } from './components/tag-chip';
export {
  useProductTags,
  useTagSearch,
  useUpdateProductTagsMutation,
  productTagsKey,
  tagSearchKey,
} from './api/use-tags';
export {
  getProductTagsAction,
  searchTagsAction,
  updateProductTagsAction,
} from './api/tags';
export {
  PRODUCT_TAGS_MAX,
  TAG_NAME_MAX_LEN,
  type Tag,
  type UpdateProductTagsItem,
} from './model/types';
