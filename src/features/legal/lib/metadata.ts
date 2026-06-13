import type { Metadata } from 'next';

import { getLegalDocument } from '../api/documents';
import type { LegalDocumentSlug } from '../model/types';

/**
 * Page metadata for a legal route — title taken from the document itself.
 * Shared by every legal `generateMetadata` so the title source stays in
 * one place.
 */
export async function legalDocumentMetadata(
  slug: LegalDocumentSlug,
): Promise<Metadata> {
  const doc = await getLegalDocument(slug);
  return doc ? { title: doc.title } : {};
}
