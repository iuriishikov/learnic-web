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
  MY_PRODUCTS_PAGE_SIZE,
  MY_PRODUCTS_PER_PAGE_OPTIONS,
  PUBLISHED_PRODUCTS_PAGE_SIZE,
  PUBLISHED_PRODUCTS_PER_PAGE_OPTIONS,
  USER_PRODUCTS_PAGE_SIZE,
} from './model/pagination';
export {
  getUserProductsAction,
} from './api/get-user-products-action';
export type { GetUserProductsResult } from './api/get-user-products';
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
export { ProductInfoView } from './components/product-info-view';
export { ProductInfoSkeleton } from './components/product-info-skeleton';
export { ProductReaderView } from './components/product-reader-view';
export { ProductReaderSkeleton } from './components/product-reader-skeleton';
export { NoteReaderDemoView } from './components/note-reader-demo-view';
export { MyLearningView } from './components/my-learning-view';
export { MyLearningSkeleton } from './components/my-learning-skeleton';
export { enrollIntoProductAction } from './api/enrollment-action';
export type { EnrollIntoProductResult } from './api/enrollment';
export type {
  Enrollment,
  EnrollmentKind,
  EnrollmentStatus,
  NoteEnrollmentDetails,
  EnrolledProduct,
} from './model/enrollment';
export type {
  PublicLesson,
  PublicLessonBlock,
} from './model/public-content';
export { getProductByIdAction } from './api/get-product-by-id-action';
export { useHasReleasedProducts } from './api/use-has-released-products';
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
  ProductVisibility,
} from './model/types';
export type {
  Gift,
  GiftStatus,
  GiftUserRef,
} from './model/gifts';
export type {
  CodeBlock,
  CodeBlockLanguage,
  CodeTab,
  NoteDraft,
  DraftLesson,
  DraftModule,
  HtmlBlock,
  KatexBlock,
  LessonBlock,
  LessonBlockType,
  RutubeVideoBlock,
} from './model/draft';
