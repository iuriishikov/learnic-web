import { notFound } from 'next/navigation';

import { getLegalDocument } from '../api/documents';
import type { LegalDocumentSlug } from '../model/types';

import { LegalDocumentView } from './legal-document-view';

type LegalDocumentScreenProps = {
  slug: LegalDocumentSlug;
};

/**
 * Server component that loads a legal document by slug and renders it,
 * or 404s when the document is missing. Shared by every legal route
 * (`/privacy`, `/terms`, the consents) so each `page.tsx` stays a thin
 * composition. The page is responsible for the surrounding shell
 * (`<main>` + `SiteFooter`), which lives in the app/widget layers.
 */
export async function LegalDocumentScreen({ slug }: LegalDocumentScreenProps) {
  const doc = await getLegalDocument(slug);
  if (!doc) notFound();

  return <LegalDocumentView document={doc} />;
}
