export { hasDescriptionContent, looksLikeHtml } from './lib/description-html';
export { MarketplaceView } from './components/marketplace-view';
export { MarketplaceSkeleton } from './components/marketplace-skeleton';
export { getPublishedProductsAction } from './api/get-published-action';
export type { GetPublishedProductsResult } from './api/get-published';
export { getPopularTagsAction } from './api/get-popular-tags-action';
export type { GetPopularTagsResult } from './api/get-popular-tags';
export {
  usePublishedProducts,
  publishedProductsKey,
  type PublishedProductsPage,
} from './api/use-published-products';
// Pagination constants live in a non-``'use client'`` model module
// so Server Components (page.tsx, etc.) can import the raw numeric
// values — see ``model/pagination.ts``.
export {
  PUBLISHED_PRODUCTS_PAGE_SIZE,
  PUBLISHED_PRODUCTS_PER_PAGE_OPTIONS,
} from './model/pagination';
export { ProductsGeneralView } from './components/products-general-view';
export { ProductsGeneralViewSkeleton } from './components/products-general-view-skeleton';
export { ProductCardSkeleton } from './components/product-card-skeleton';
export {
  ProductShowcaseCard,
  accentFromId,
  type ProductShowcaseAccent,
  type ProductShowcaseTag,
  type ProductShowcaseType,
} from './components/product-showcase-card';
export { CreateProductDialog } from './components/create-product-dialog';
export { ProductCover } from './components/product-cover';
export { ProductEditorView } from './components/product-editor-view';
export { ProductEditorSkeleton } from './components/product-editor-skeleton';
export { getProductByIdAction } from './api/get-product-by-id-action';
export {
  useProductPermissions,
  type ProductCapabilities,
} from './api/use-product-permissions';
export {
  createProductAction,
  type CreateProductResult,
} from './api/create-product';
export {
  createProductSchema,
  type CreateProductInput,
} from './model/create-product';
export type {
  Currency,
  Product,
  ProductAuthor,
  ProductStatus,
  ProductType,
  WebinarDetails,
} from './model/types';
export type {
  CodeBlock,
  CodeBlockLanguage,
  CodeTab,
  CourseDraft,
  DraftLesson,
  DraftModule,
  HtmlBlock,
  KatexBlock,
  LessonBlock,
  LessonBlockType,
  RutubeVideoBlock,
} from './model/draft';
