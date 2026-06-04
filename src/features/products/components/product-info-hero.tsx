'use client';

import { ClockIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { UserAvatar } from '@/shared/ui/user-avatar';

import type { Product } from '../model/types';

import { ProductTypeChip, ProductVisibilityChip } from './product-info-badges';
import { ProductCover } from './product-cover';

type ProductInfoHeroProps = {
  product: Product;
  /**
   * Author's resolved avatar URL, looked up from their public profile at the
   * page level (`Product.author` itself carries no avatar). `null` when the
   * author has no avatar or the secondary profile fetch failed — `UserAvatar`
   * then falls back to initials.
   */
  authorAvatarUrl?: string | null;
  /** Author's verified badge, from the same public-profile lookup. */
  authorIsVerified?: boolean;
};

/**
 * Landing hero for a learner BEFORE enrollment: cover, note type, title,
 * author and a couple of quick facts. No editor affordances (status, ids,
 * timestamps) — those live in the teach editor, not the public storefront.
 */
export function ProductInfoHero({
  product,
  authorAvatarUrl,
  authorIsVerified,
}: ProductInfoHeroProps) {
  const t = useTranslations('marketplace.detail');
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
      className="flex flex-col gap-5"
    >
      <ProductCover
        productId={product.id}
        initialProduct={product}
        className="aspect-[16/10] rounded-2xl border border-border sm:aspect-[16/9] md:aspect-[2.6/1]"
      />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <ProductTypeChip type={product.type} />
          {/* Private products stay visible in the catalog — the chip signals
              the learner can't self-enroll (access is by invite). */}
          {product.visibility === 'private' ? (
            <ProductVisibilityChip visibility={product.visibility} />
          ) : null}
        </div>

        <h1 className="text-pretty text-2xl font-semibold leading-tight tracking-tight text-foreground md:text-3xl lg:text-4xl">
          {product.title}
        </h1>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <UserAvatar
              user={{
                id: product.author.id,
                fullName: product.author.fullName,
                avatar: null,
                isVerified: authorIsVerified ?? false,
              }}
              imageUrl={authorAvatarUrl ?? null}
              size="sm"
              statusType={authorIsVerified ? 'verified' : null}
            />
            <span className="font-medium text-foreground">
              {product.author.fullName}
            </span>
          </span>
          {product.durationHours > 0 ? (
            <>
              <Dot />
              <span className="inline-flex items-center gap-1.5">
                <ClockIcon className="size-3.5" aria-hidden />
                {t('meta.durationValue', { hours: product.durationHours })}
              </span>
            </>
          ) : null}
        </div>
      </div>
    </motion.section>
  );
}

function Dot() {
  return (
    <span aria-hidden className="size-1 rounded-full bg-muted-foreground/40" />
  );
}
