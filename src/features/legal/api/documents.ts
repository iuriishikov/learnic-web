import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { cache } from 'react';

import { parseLegalDocument } from '../lib/markdown';
import {
  type LegalDocument,
  type LegalDocumentSlug,
  LEGAL_DOCUMENT_SLUGS,
} from '../model/types';

/**
 * Loader for the static legal documents. The Markdown lives in
 * `content/` and is read at build time during static generation, so the
 * rendered HTML is baked into the output (no per-request filesystem read
 * in production). `cache` dedupes the read across `generateMetadata` and
 * the page render within one request.
 *
 * These are Server-only helpers — they touch the filesystem and must
 * never be imported into a Client Component.
 */

const CONTENT_DIR = path.join(process.cwd(), 'src/features/legal/content');

const FILE_BY_SLUG: Record<LegalDocumentSlug, string> = {
  privacy: 'privacy-policy.md',
  terms: 'terms-of-service.md',
  'consent-personal-data': 'consent-personal-data.md',
  'consent-distribution': 'consent-distribution.md',
};

export const getLegalDocument = cache(
  async (slug: LegalDocumentSlug): Promise<LegalDocument | null> => {
    const file = FILE_BY_SLUG[slug];
    if (!file) return null;

    let raw: string;
    try {
      raw = await readFile(path.join(CONTENT_DIR, file), 'utf8');
    } catch {
      return null;
    }

    const { title, subtitle, edition, html, toc } = parseLegalDocument(raw);
    return { slug, title, subtitle, edition, html, toc };
  },
);

export { LEGAL_DOCUMENT_SLUGS };
