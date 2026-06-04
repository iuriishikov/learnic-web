/**
 * Client-side limits mirroring the backend admin-write constraints
 * (`entities/blog_post/constants.py`, `entities/blog_post_block/constants.py`).
 * Source of truth is still the server (it re-validates); these let the UI
 * reject bad input before a round-trip.
 */

export const BLOG_POST_TITLE_MAX_LEN = 200;
export const BLOG_POST_SLUG_MIN_LEN = 3;
export const BLOG_POST_SLUG_MAX_LEN = 200;
/** lowercase alphanum, single hyphens, no leading/trailing/double hyphen. */
export const BLOG_POST_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const BLOG_HTML_BLOCK_MAX_LEN = 50_000;
/** Shared by image `caption` and video `title`. */
export const BLOG_BLOCK_CAPTION_MAX_LEN = 280;

export const BLOG_IMAGE_BLOCK_MAX_BYTES = 10 * 1024 * 1024; // 10 MB
export const BLOG_VIDEO_BLOCK_MAX_BYTES = 1024 * 1024 * 1024; // 1 GB
