export { hasDescriptionContent, looksLikeHtml } from './lib/description-html';
export { ProductsGeneralView } from './components/products-general-view';
export { ProductsGeneralViewSkeleton } from './components/products-general-view-skeleton';
export { ProductCard } from './components/product-card';
export { ProductCardSkeleton } from './components/product-card-skeleton';
export { CreateProductDialog } from './components/create-product-dialog';
export { ProductCover } from './components/product-cover';
export { ProductEditorView } from './components/product-editor-view';
export { ProductEditorSkeleton } from './components/product-editor-skeleton';
export { getProductByIdAction } from './api/get-product-by-id-action';
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
