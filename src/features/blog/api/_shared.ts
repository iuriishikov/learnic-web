import 'server-only';

import type {
  PublishedPost,
  PublishedPostBlock,
  PublishedPostSummary,
} from '../model/types';

export type PublicBlogFailReason = 'not-found' | 'network' | 'unknown';

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; reason: PublicBlogFailReason };

// --- wire shapes (snake_case, mirrored from docs/api/openapi.json) --- //

type FileWire = {
  oid: string;
  content_type: string;
  size_bytes: number;
  url: string;
};

export type PublishedPostSummaryWire = {
  oid: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  published_at: string | null;
  cover: FileWire | null;
};

type BlogBlockWire =
  | { type: 'html'; oid: string; position: number; html: string }
  | {
      type: 'image';
      oid: string;
      position: number;
      file: FileWire | null;
      caption: string | null;
    }
  | {
      type: 'video';
      oid: string;
      position: number;
      file: FileWire | null;
      title: string | null;
    };

type BlogAuthorWire = {
  name: string;
  avatar: FileWire | null;
};

export type PublishedPostWire = PublishedPostSummaryWire & {
  topic: string | null;
  subtitle: string | null;
  author: BlogAuthorWire | null;
  blocks: BlogBlockWire[];
};

// --- mappers (snake_case wire → camelCase domain) --- //

export function mapSummary(
  wire: PublishedPostSummaryWire,
): PublishedPostSummary {
  return {
    slug: wire.slug,
    title: wire.title,
    publishedAt: wire.published_at,
    cover: wire.cover ? { url: wire.cover.url } : null,
  };
}

function mapBlock(wire: BlogBlockWire): PublishedPostBlock {
  if (wire.type === 'html') return { type: 'html', html: wire.html };
  if (wire.type === 'image') {
    return {
      type: 'image',
      url: wire.file?.url ?? null,
      caption: wire.caption,
    };
  }
  return { type: 'video', url: wire.file?.url ?? null, title: wire.title };
}

export function mapPost(wire: PublishedPostWire): PublishedPost {
  // The backend already returns blocks ordered by position.
  return {
    ...mapSummary(wire),
    topic: wire.topic,
    subtitle: wire.subtitle,
    author: wire.author
      ? {
          name: wire.author.name,
          avatarUrl: wire.author.avatar?.url ?? null,
        }
      : null,
    blocks: wire.blocks.map(mapBlock),
  };
}

export function reasonFor(res: Response): PublicBlogFailReason {
  if (res.status === 404) return 'not-found';
  return 'unknown';
}
