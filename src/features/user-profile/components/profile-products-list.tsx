'use client';

import { motion, useReducedMotion, type Variants } from 'motion/react';
import { useTranslations } from 'next-intl';

import { ProductShowcaseCard } from '@/features/products';
import { useRouter } from '@/shared/config/i18n/navigation';

import type { PublicProfileProduct } from '../model/types';

type ProfileProductsListProps = {
  products: PublicProfileProduct[];
};

const LIST_VARIANTS: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const ITEM_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' } },
};

export function ProfileProductsList({ products }: ProfileProductsListProps) {
  const t = useTranslations('user-profile.products');
  const reduceMotion = useReducedMotion();
  const router = useRouter();

  if (products.length === 0) {
    return (
      <p className="rounded-xl bg-muted/40 px-4 py-6 text-sm text-muted-foreground ring-1 ring-border">
        {t('empty')}
      </p>
    );
  }

  return (
    <motion.ul
      initial={reduceMotion ? false : 'hidden'}
      animate="visible"
      variants={LIST_VARIANTS}
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
    >
      {products.map((product) => (
        <motion.li
          key={product.id}
          variants={ITEM_VARIANTS}
          className="min-w-0"
        >
          <ProductShowcaseCard
            type={product.type}
            typeLabel={t(`type.${product.type}`)}
            title={product.title}
            description={product.description}
            durationLabel={product.durationLabel}
            dueLabel={product.dueLabel ?? undefined}
            accent={product.accent}
            coverUrl={product.cover?.url ?? null}
            tags={product.tags}
            onClick={() => router.push(`/products/${product.id}`)}
          />
        </motion.li>
      ))}
    </motion.ul>
  );
}
