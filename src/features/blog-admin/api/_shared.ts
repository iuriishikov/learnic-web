import 'server-only';

import type {
  BlogBlock,
  BlogFile,
  BlogPost,
  BlogPostSummary,
} from '../model/types';

/**
 * Why a reason union, not raw status codes: the blog API surfaces several
 * distinct 409s disambiguated by the `error` field of the body (slug taken
 * vs status transition vs reorder vs wrong block type vs quota) plus a 415
 * for wrong content type. Components branch on these reasons, never on HTTP.
 */
export type BlogFailReason =
  | 'unauthorized'
  | 'not-found'
  | 'validation'
  | 'slug-taken'
  | 'status-conflict'
  | 'wrong-block-type'
  | 'wrong-content-type'
  | 'quota-exceeded'
  | 'invalid-reorder'
  | 'network'
  | 'unknown';

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; reason: BlogFailReason };

export type VoidResult =
  | { ok: true }
  | { ok: false; reason: BlogFailReason };

// --- wire shapes (snake_case, mirrored from docs/api/openapi.json) --- //

type FileWire = {
  oid: string;
  content_type: string;
  size_bytes: number;
  url: string;
};

export type BlogPostSummaryWire = {
  oid: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  published_at: string | null;
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

export type BlogPostWire = BlogPostSummaryWire & {
  blocks: BlogBlockWire[];
};

type ErrorBody = { error?: string };

// --- mappers (snake_case wire → camelCase domain) --- //

function mapFile(file: FileWire | null): BlogFile | null {
  if (!file) return null;
  return {
    id: file.oid,
    contentType: file.content_type,
    sizeBytes: file.size_bytes,
    url: file.url,
  };
}

export function mapSummary(wire: BlogPostSummaryWire): BlogPostSummary {
  return {
    id: wire.oid,
    title: wire.title,
    slug: wire.slug,
    status: wire.status,
    createdAt: wire.created_at,
    updatedAt: wire.updated_at,
    publishedAt: wire.published_at,
  };
}

export function mapBlock(wire: BlogBlockWire): BlogBlock {
  switch (wire.type) {
    case 'html':
      return {
        type: 'html',
        id: wire.oid,
        position: wire.position,
        html: wire.html,
      };
    case 'image':
      return {
        type: 'image',
        id: wire.oid,
        position: wire.position,
        file: mapFile(wire.file),
        caption: wire.caption,
      };
    case 'video':
      return {
        type: 'video',
        id: wire.oid,
        position: wire.position,
        file: mapFile(wire.file),
        title: wire.title,
      };
  }
}

export function mapPost(wire: BlogPostWire): BlogPost {
  return {
    ...mapSummary(wire),
    blocks: [...wire.blocks]
      .sort((a, b) => a.position - b.position)
      .map(mapBlock),
  };
}

async function readErrorCode(res: Response): Promise<string | undefined> {
  try {
    const body = (await res.json()) as ErrorBody;
    return body.error;
  } catch {
    return undefined;
  }
}

/**
 * Map a non-2xx blog response to a `BlogFailReason`. The 409 family and 415
 * are disambiguated by the body's `error` discriminator; everything else is
 * by status code.
 */
export async function reasonFor(res: Response): Promise<BlogFailReason> {
  switch (res.status) {
    case 401:
    case 403:
      return 'unauthorized';
    case 404:
      return 'not-found';
    case 422:
      return 'validation';
    case 415:
      return 'wrong-content-type';
    case 409: {
      const code = await readErrorCode(res);
      switch (code) {
        case 'BlogPostSlugAlreadyTaken':
        case 'BlogPostSlugAlreadyTakenError':
          return 'slug-taken';
        case 'BlogPostStatusTransition':
        case 'BlogPostStatusTransitionError':
          return 'status-conflict';
        case 'WrongBlockType':
        case 'WrongBlockTypeError':
          return 'wrong-block-type';
        case 'ResourceLimitReached':
        case 'ResourceLimitReachedError':
          return 'quota-exceeded';
        case 'InvalidReorder':
        case 'InvalidReorderError':
          return 'invalid-reorder';
        default:
          return 'unknown';
      }
    }
    default:
      return 'unknown';
  }
}
