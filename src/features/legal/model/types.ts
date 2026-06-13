/**
 * Slugs of the static legal documents. Each maps to a Markdown file in
 * `content/` and (where wired) to a public route of the same name.
 */
export const LEGAL_DOCUMENT_SLUGS = [
  'privacy',
  'terms',
  'consent-personal-data',
  'consent-distribution',
] as const;

export type LegalDocumentSlug = (typeof LEGAL_DOCUMENT_SLUGS)[number];

/** One top-level section, used to build the table-of-contents sidebar. */
export type LegalTocEntry = {
  /** Anchor id, matching the `id` on the rendered `<h2>`. */
  id: string;
  /** Section heading text, e.g. «1. Общие положения». */
  text: string;
};

export type LegalDocument = {
  slug: LegalDocumentSlug;
  /** Document heading, e.g. «Политика конфиденциальности …». */
  title: string;
  /** Optional sub-line under the title (e.g. the offer label on the Terms). */
  subtitle: string | null;
  /** Edition / revision note, e.g. «Редакция от …». */
  edition: string | null;
  /** Body rendered to trusted HTML (see `lib/markdown.ts`). */
  html: string;
  /** Top-level (`##`) sections, in document order. */
  toc: LegalTocEntry[];
};
