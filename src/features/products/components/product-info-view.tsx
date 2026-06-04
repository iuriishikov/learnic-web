'use client';

import { ArrowLeftIcon, FileTextIcon, TagIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { Link } from '@/shared/config/i18n/navigation';
import { cn } from '@/shared/lib/utils';
import { buttonVariants } from '@/shared/ui/button';

import { hasDescriptionContent, looksLikeHtml } from '../lib/description-html';
import type { Product } from '../model/types';

import { ProductFaqSection } from './product-faq-section';
import { InfoCard } from './product-info-card';
import { ProductInfoHero } from './product-info-hero';
import { ProductInfoTypeSections } from './product-info-sections';
import { ProductInfoSidebar } from './product-info-sidebar';

const SECTION_TRANSITION = { duration: 0.25, ease: [0.32, 0.72, 0, 1] } as const;

type ProductInfoViewProps = {
  product: Product;
  /** Author avatar URL, resolved from their public profile at the page level. */
  authorAvatarUrl?: string | null;
  /** Author verified badge, from the same public-profile lookup. */
  authorIsVerified?: boolean;
};

/**
 * Public product landing shown BEFORE enrollment — the marketplace detail
 * page. Composes the shared product fields (description, tags, Q&A) with the
 * per-type preview sections (note curriculum) and a sticky enroll rail.
 */
export function ProductInfoView({
  product,
  authorAvatarUrl,
  authorIsVerified,
}: ProductInfoViewProps) {
  const t = useTranslations('marketplace.detail');
  const reduceMotion = useReducedMotion();

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-6 md:px-8 md:py-8">
      <div className="mb-5">
        <Link
          href="/marketplace"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            '-ml-2 gap-1.5 text-muted-foreground hover:text-foreground',
          )}
        >
          <ArrowLeftIcon className="size-4" />
          {t('back')}
        </Link>
      </div>

      <ProductInfoHero
        product={product}
        authorAvatarUrl={authorAvatarUrl}
        authorIsVerified={authorIsVerified}
      />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SECTION_TRANSITION, delay: 0.05 }}
          className="flex min-w-0 flex-col gap-6"
        >
          <InfoCard title={t('overview.title')} icon={FileTextIcon}>
            <ProductDescription description={product.description} />
          </InfoCard>

          {product.tags.length > 0 ? (
            <InfoCard title={t('tags.title')} icon={TagIcon}>
              <ul className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <li
                    key={tag.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground"
                  >
                    <span
                      aria-hidden
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="max-w-[12rem] truncate">{tag.name}</span>
                  </li>
                ))}
              </ul>
            </InfoCard>
          ) : null}

          <ProductInfoTypeSections product={product} />

          <ProductFaqSection productId={product.id} />
        </motion.div>

        {/*
          Sticky enroll rail. Offset = app header height (72px, `sticky top-0`)
          + 16px breathing room, so the card pins just below the chrome instead
          of sliding under it. `self-start` keeps the column from stretching to
          the main column's height (a stretched flex item can't go sticky).
        */}
        <motion.aside
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SECTION_TRANSITION, delay: 0.1 }}
          className="flex flex-col gap-6 lg:sticky lg:top-[88px] lg:self-start"
        >
          <ProductInfoSidebar product={product} />
        </motion.aside>
      </div>
    </div>
  );
}

/**
 * Renders the product description. The backend stores it as sanitized HTML;
 * legacy / other-client rows may be plain text. {@link looksLikeHtml} picks
 * the safe path: HTML goes through `dangerouslySetInnerHTML` (already
 * sanitized server-side), plain text renders with preserved line breaks.
 */
function ProductDescription({ description }: { description: string }) {
  const t = useTranslations('marketplace.detail');

  if (!hasDescriptionContent(description)) {
    return <p className="text-sm text-muted-foreground">{t('overview.empty')}</p>;
  }

  if (!looksLikeHtml(description)) {
    return (
      <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
        {description}
      </p>
    );
  }

  return (
    <div
      className="text-sm leading-relaxed text-foreground [&_a]:break-words [&_a]:text-brand [&_a]:underline [&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em] [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-base [&_h3]:font-semibold [&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-lg [&_li]:my-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_strong]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_em]:italic [&_*:first-child]:mt-0 [&_*:last-child]:mb-0"
      dangerouslySetInnerHTML={{ __html: description }}
    />
  );
}
