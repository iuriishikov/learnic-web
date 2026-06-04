/**
 * Domain types for the admin blog editor (camelCase). The snake_case wire
 * payloads from `/admin/blog/*` are mapped to these at the `api/` boundary.
 * Mirrors the backend `BlogPostSchema` / block schemas (see docs/api/openapi.json,
 * tag "BlogPosts").
 */

export type BlogPostStatus = 'draft' | 'published';
export type BlogBlockType = 'html' | 'image' | 'video';

/** Resolved media file embedded in image/video blocks (presigned, short-lived URL). */
export type BlogFile = {
  id: string;
  contentType: string;
  sizeBytes: number;
  url: string;
};

export type BlogHtmlBlock = {
  type: 'html';
  id: string;
  position: number;
  html: string;
};

export type BlogImageBlock = {
  type: 'image';
  id: string;
  position: number;
  file: BlogFile | null;
  caption: string | null;
};

export type BlogVideoBlock = {
  type: 'video';
  id: string;
  position: number;
  file: BlogFile | null;
  title: string | null;
};

/** Discriminated on `type` — handle every variant exhaustively. */
export type BlogBlock = BlogHtmlBlock | BlogImageBlock | BlogVideoBlock;

export type BlogPostSummary = {
  id: string;
  title: string;
  slug: string;
  status: BlogPostStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

export type BlogPost = BlogPostSummary & {
  blocks: BlogBlock[];
};
