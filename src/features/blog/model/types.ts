/**
 * Public (read-only) blog domain types — the published-post projections
 * the home page, post page, and admin dashboard render. Mirrors the
 * public `GET /blog/posts` + `GET /blog/posts/{slug}` payloads (see
 * docs/api/openapi.json, tag "BlogPosts"), mapped to camelCase at the
 * `api/` boundary.
 */

/** Resolved cover image (presigned, short-lived URL). */
export type BlogCover = {
  url: string;
};

export type PublishedPostSummary = {
  slug: string;
  title: string;
  /** ISO-8601 publish timestamp (published posts always have one). */
  publishedAt: string | null;
  cover: BlogCover | null;
};

/**
 * Resolved author byline for the post page: name + avatar come from the
 * post's creating admin. `null` on the post when the creating admin's
 * account is gone.
 */
export type BlogAuthor = {
  name: string;
  /** Presigned avatar URL, or `null` — the UI falls back to initials. */
  avatarUrl: string | null;
};

/**
 * Block projection. `html` carries the sanitized body; `image` / `video`
 * carry the resolved media URL (presigned, short-lived) plus their
 * caption / title so the post page can render them inline. `url` is
 * `null` only in the brief window after the backing file was removed.
 */
export type PublishedPostBlock =
  | { type: 'html'; html: string }
  | { type: 'image'; url: string | null; caption: string | null }
  | { type: 'video'; url: string | null; title: string | null };

export type PublishedPost = PublishedPostSummary & {
  /** Optional category label shown above the title (e.g. "Design"). */
  topic: string | null;
  /** Optional short description shown under the title. */
  subtitle: string | null;
  author: BlogAuthor | null;
  blocks: PublishedPostBlock[];
};

/** Flattened, presentation-ready shape consumed by `BlogPostCard`. */
export type BlogPostCardData = {
  slug: string;
  title: string;
  publishedAt: string | null;
  excerpt: string;
  coverUrl: string | null;
};
