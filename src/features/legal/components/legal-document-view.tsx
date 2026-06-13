import { getTranslations } from 'next-intl/server';

import { cn } from '@/shared/lib/utils';
import { OutlineNav, type OutlineNavItem } from '@/shared/ui/outline-nav';

import type { LegalDocument } from '../model/types';

import { LegalTocSheet } from './legal-toc-sheet';

type LegalDocumentViewProps = {
  document: LegalDocument;
  className?: string;
};

/**
 * Reading page for a static legal document (privacy policy, terms,
 * consents). A two-column docs layout: a sticky table-of-contents sidebar
 * with scroll-spy on the left (desktop) and the reading column on the
 * right; under `lg` the TOC collapses into a disclosure above the body.
 * The body is trusted HTML produced by `lib/markdown.ts`, injected the
 * same way the blog renders its `html` blocks.
 */
export async function LegalDocumentView({
  document,
  className,
}: LegalDocumentViewProps) {
  const t = await getTranslations('legal');
  const hasToc = document.toc.length > 0;
  const tocHeading = t('toc.heading');
  const tocAriaLabel = t('toc.ariaLabel');
  const navItems: OutlineNavItem[] = document.toc.map((section) => ({
    id: section.id,
    label: section.text,
  }));

  return (
    <article
      className={cn('w-full pb-16 pt-10 md:pb-24 md:pt-14 lg:pt-16', className)}
    >
      <div
        className={cn(
          'mx-auto w-full px-4 md:px-6',
          hasToc ? 'max-w-[64rem]' : 'max-w-[45rem]',
        )}
      >
        <div
          className={cn(
            hasToc && 'lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-x-12',
          )}
        >
          {hasToc ? (
            <aside className="hidden lg:block">
              {/* `top-32` clears the floating anonymous SiteHeader (whose
                  inset bottom sits ~96px down) with breathing room; on the
                  edge-to-edge app header it just reads as a roomier gap. */}
              <div className="sticky top-32 max-h-[calc(100vh-9rem)] overflow-y-auto py-1">
                <OutlineNav items={navItems} ariaLabel={tocAriaLabel} scrollSpy />
              </div>
            </aside>
          ) : null}

          <div className="mx-auto min-w-0 max-w-[45rem] lg:mx-0 lg:max-w-none">
            <header className="border-b border-border pb-6 md:pb-8">
              <h1 className="font-heading text-2xl font-semibold leading-tight tracking-tight text-foreground md:text-3xl">
                {document.title}
              </h1>

              {document.subtitle ? (
                <p className="mt-2 text-base text-muted-foreground md:text-lg">
                  {document.subtitle}
                </p>
              ) : null}

              {document.edition ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  {document.edition}
                </p>
              ) : null}
            </header>

            {hasToc ? (
              <div className="mt-6 lg:hidden">
                <LegalTocSheet
                  items={navItems}
                  heading={tocHeading}
                  ariaLabel={tocAriaLabel}
                />
              </div>
            ) : null}

            <div
              className={cn(
                'rich-editor-content mt-8 text-[15px] leading-7 text-foreground md:text-base',
                // Sober, document-grade typography on top of the editor
                // defaults: clear section headings, roomy paragraphs, simple
                // bulleted lists, brand links and inline code chips.
                // `scroll-mt-24` clears the sticky site header on anchor jumps.
                '[&_p]:my-3 [&_p:first-child]:mt-0',
                '[&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:scroll-mt-32 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground md:[&_h2]:text-xl',
                '[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:scroll-mt-32 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground',
                '[&_:is(h2,h3):first-child]:mt-0',
                '[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:my-1 [&_li]:leading-7',
                '[&_strong]:font-semibold [&_strong]:text-foreground',
                '[&_a]:font-medium [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-2 [&_a]:break-words',
                '[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em]',
              )}
              // Trusted, build-time HTML from our own Markdown (see lib/markdown.ts).
              dangerouslySetInnerHTML={{ __html: document.html }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
