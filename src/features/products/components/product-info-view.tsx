'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useFormatter, useTranslations } from 'next-intl';

import { hasDescriptionContent, looksLikeHtml } from '../lib/description-html';
import { PROSE_HTML_CLASS } from '../lib/prose';
import type { Product } from '../model/types';

import { ProductFaqSection } from './product-faq-section';
import { ProductInfoHero } from './product-info-hero';
import { InfoSection } from './product-info-section';
import { ProductInfoTypeSections } from './product-info-sections';

type ProductInfoViewProps = {
  product: Product;
  /** Author avatar URL, resolved from their public profile at the page level. */
  authorAvatarUrl?: string | null;
  /** Author verified badge, from the same public-profile lookup. */
  authorIsVerified?: boolean;
  /**
   * Whether the viewer already has an active enrollment on this product,
   * resolved server-side at the page level. Threaded into the hero CTA so it
   * shows «Продолжить изучение» (→ reader) instead of «Записаться».
   */
  viewerEnrolled?: boolean;
  /**
   * Whether the viewer is the owner or a collaborator on this product,
   * resolved server-side at the page level. Threaded into the hero CTA so it
   * shows «Открыть» (→ editor) instead of «Запросить доступ»/«Записаться».
   */
  viewerCanManage?: boolean;
};

/**
 * Public product landing shown BEFORE enrollment — the marketplace detail
 * page in the «Спотлайт» layout: a full-bleed cover hero (title, lead, CTA
 * and author over a scrim) followed by a single editorial reading column —
 * container-less sections separated by eyebrows + hairline rules. No sidebar,
 * no cards; the quick facts close the column as an inline colophon.
 */
export function ProductInfoView({
  product,
  authorAvatarUrl,
  authorIsVerified,
  viewerEnrolled,
  viewerCanManage,
}: ProductInfoViewProps) {
  const t = useTranslations('marketplace.detail');
  const reduceMotion = useReducedMotion();

  return (
    <>
      <ProductInfoHero
        product={product}
        authorAvatarUrl={authorAvatarUrl}
        authorIsVerified={authorIsVerified}
        viewerEnrolled={viewerEnrolled}
        viewerCanManage={viewerCanManage}
      />

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1], delay: 0.05 }}
        className="mx-auto w-full max-w-[820px] px-5 pb-20 md:px-6 md:pb-28"
      >
        {/* Always rendered (it owns the empty state), so it's the stable
            `first` section — every conditional section below carries the
            hairline divider. */}
        <InfoSection first eyebrow={t('overview.title')}>
          <ProductDescription description={product.description} />
        </InfoSection>

        <ProductInfoTypeSections product={product} />

        {product.tags.length > 0 ? (
          <InfoSection eyebrow={t('tags.title')}>
            <ul className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <li
                  key={tag.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-transparent px-3 py-1 text-xs text-foreground"
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
          </InfoSection>
        ) : null}

        <ProductFaqSection productId={product.id} />

        <InfoSection eyebrow={t('meta.title')}>
          <MetaFacts product={product} />
        </InfoSection>
      </motion.div>
    </>
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
      <p className="whitespace-pre-line text-base leading-[1.75] text-foreground md:text-[1.0625rem]">
        {description}
      </p>
    );
  }

  return (
    <div
      className={PROSE_HTML_CLASS}
      dangerouslySetInnerHTML={{ __html: description }}
    />
  );
}

/** Inline `label · value` facts — the editorial colophon closing the column. */
function MetaFacts({ product }: { product: Product }) {
  const t = useTranslations('marketplace.detail.meta');
  const tType = useTranslations('teach-products.type');
  const formatter = useFormatter();

  const facts = [
    { label: t('type'), value: tType(product.type) },
    {
      label: t('duration'),
      value:
        product.durationHours > 0
          ? t('durationValue', { hours: product.durationHours })
          : t('durationUnset'),
    },
    {
      label: t('updatedAt'),
      value: formatter.dateTime(new Date(product.updatedAt), {
        dateStyle: 'medium',
      }),
    },
  ];

  return (
    <dl className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
      {facts.map((fact) => (
        <div key={fact.label} className="flex items-center gap-1.5">
          <dt className="text-muted-foreground">{fact.label}</dt>
          <span aria-hidden className="text-muted-foreground/50">
            ·
          </span>
          <dd className="font-medium text-foreground">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}
