'use client';

import { GraduationCapIcon } from 'lucide-react';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import { useFormatter, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { Link, useRouter } from '@/shared/config/i18n/navigation';
import { Button } from '@/shared/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/shared/ui/empty';
import { NavTabs, type NavTab } from '@/shared/ui/nav-tabs';

import type { EnrolledProduct } from '../model/enrollment';

import { ProductShowcaseCard, accentFromId } from './product-showcase-card';

type MyLearningViewProps = {
  items: EnrolledProduct[];
};

/**
 * Content-type tabs. Keys mirror `ProductType` so the grid filters by
 * `product.type` and real products slot into the right tab automatically
 * as new types ship. Today only `note` has products — the rest render an
 * empty placeholder.
 */
const CONTENT_TYPES = [
  { key: 'note', labelKey: 'notes' },
  { key: 'webinar', labelKey: 'webinars' },
] as const;

/**
 * "Моё обучение" — every product the learner is enrolled in. An in-page
 * underlined tab strip switches between content types (Конспекты,
 * Вебинары, …); the grid below filters by the active type. Cards are the
 * standard `ProductShowcaseCard` (shared with the marketplace and teach
 * catalogs); each opens the reader at `/products/[id]`.
 */
export function MyLearningView({ items }: MyLearningViewProps) {
  const t = useTranslations('learning');
  const reduceMotion = useReducedMotion();
  const [activeType, setActiveType] = useState<string>(CONTENT_TYPES[0].key);

  const countByType = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const item of items) {
      acc[item.product.type] = (acc[item.product.type] ?? 0) + 1;
    }
    return acc;
  }, [items]);

  const tabs: NavTab[] = CONTENT_TYPES.map((ct) => {
    const count = countByType[ct.key] ?? 0;
    return {
      key: ct.key,
      label: t(`tabs.${ct.labelKey}`),
      badge: count > 0 ? count : undefined,
    };
  });

  const visible = items.filter((item) => item.product.type === activeType);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-8 md:py-10">
      <header>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {t('page.title')}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground md:text-base">
          {t('page.description')}
        </p>
      </header>

      <div className="mt-6 border-b border-border">
        <NavTabs
          tabs={tabs}
          activeKey={activeType}
          onChange={setActiveType}
          variant="underline"
          layoutId="my-learning-tabs"
          ariaLabel={t('tabsAriaLabel')}
        />
      </div>

      <div className="mt-6 md:mt-8">
        <motion.div
          key={activeType}
          initial={reduceMotion ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {visible.length === 0 ? (
            <EmptyState isGloballyEmpty={items.length === 0} />
          ) : (
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-[repeat(auto-fill,minmax(340px,1fr))]">
              {visible.map((item) => (
                <MyLearningCard key={item.product.id} item={item} />
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function MyLearningCard({ item }: { item: EnrolledProduct }) {
  const t = useTranslations('learning.card');
  const tType = useTranslations('learning.type');
  const format = useFormatter();
  const router = useRouter();
  const { product } = item;

  const enrolled = format.relativeTime(new Date(item.enrolledAt), {
    now: new Date(),
  });

  return (
    <li>
      <ProductShowcaseCard
        type={product.type}
        typeLabel={tType(product.type)}
        title={product.title}
        description={product.description}
        onClick={() => router.push(`/products/${product.id}`)}
        durationLabel={
          product.durationHours > 0
            ? t('durationHours', { hours: product.durationHours })
            : null
        }
        dueLabel={t('enrolled', { time: enrolled })}
        accent={accentFromId(product.id)}
        coverUrl={product.cover?.url ?? null}
        tags={product.tags}
      />
    </li>
  );
}

/** Gentle cascade for the empty-state pieces — opacity + small lift only. */
const EMPTY_CONTAINER: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

const EMPTY_ITEM: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

function EmptyState({ isGloballyEmpty }: { isGloballyEmpty: boolean }) {
  const t = useTranslations('learning.empty');
  const reduceMotion = useReducedMotion();

  return (
    <Empty className="rounded-2xl border border-dashed border-border/70 bg-gradient-to-b from-muted/35 to-muted/[0.08] px-6 py-16 md:py-20">
      <motion.div
        variants={reduceMotion ? undefined : EMPTY_CONTAINER}
        initial={reduceMotion ? false : 'hidden'}
        animate="visible"
        className="flex w-full flex-col items-center gap-5"
      >
        {/* Concentric-ring medallion: a calm, considered focal point that
            reads as intentional rather than a lone grey circle. */}
        <motion.div variants={EMPTY_ITEM}>
          <div className="relative flex size-28 items-center justify-center md:size-32">
            <span
              aria-hidden
              className="absolute inset-0 rounded-full border border-border/30"
            />
            <span
              aria-hidden
              className="absolute inset-[18%] rounded-full border border-border/50"
            />
            <span className="relative flex size-14 items-center justify-center rounded-full border border-border bg-background text-foreground/70 shadow-sm">
              <GraduationCapIcon className="size-6" aria-hidden />
            </span>
          </div>
        </motion.div>

        <motion.div variants={EMPTY_ITEM}>
          <EmptyHeader className="gap-1.5">
            <EmptyTitle className="text-base">
              {isGloballyEmpty ? t('title') : t('tabTitle')}
            </EmptyTitle>
            <EmptyDescription className="text-balance">
              {isGloballyEmpty ? t('description') : t('tabDescription')}
            </EmptyDescription>
          </EmptyHeader>
        </motion.div>

        {/* Always offer a way forward — even on a type-empty tab the catalogue
            is where the learner finds something to enrol in. */}
        <motion.div variants={EMPTY_ITEM}>
          <Button
            variant={isGloballyEmpty ? 'default' : 'outline'}
            size="sm"
            render={<Link href="/marketplace" />}
            nativeButton={false}
          >
            {t('cta')}
          </Button>
        </motion.div>
      </motion.div>
    </Empty>
  );
}
