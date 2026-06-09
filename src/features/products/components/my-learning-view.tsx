'use client';

import { CalendarIcon, ClockIcon, GraduationCapIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useFormatter, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { Link, useRouter } from '@/shared/config/i18n/navigation';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { NavTabs, type NavTab } from '@/shared/ui/nav-tabs';

import { descriptionExcerpt } from '../lib/description-html';
import type { EnrolledProduct } from '../model/enrollment';

type MyLearningViewProps = {
  items: EnrolledProduct[];
};

/** Chip-row cap so card heights stay even across the grid. */
const MAX_VISIBLE_TAGS = 3;

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
 * Вебинары, …); the grid below filters by the active type. Restrained,
 * editorial card — neutral covers, sober labels, crisp borders. Each
 * card opens the reader at `/products/[id]`.
 */
export function MyLearningView({ items }: MyLearningViewProps) {
  const t = useTranslations('my-notes');
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
  const t = useTranslations('my-notes.card');
  const tType = useTranslations('my-notes.type');
  const format = useFormatter();
  const router = useRouter();
  const { product } = item;

  const open = () => router.push(`/products/${product.id}`);
  const lead = descriptionExcerpt(product.description);
  const monogram = product.title.trim().charAt(0).toUpperCase() || '•';
  const enrolled = format.relativeTime(new Date(item.enrolledAt), {
    now: new Date(),
  });
  const visibleTags = product.tags.slice(0, MAX_VISIBLE_TAGS);
  const overflowTags = product.tags.slice(MAX_VISIBLE_TAGS);

  return (
    <li>
      <article
        role="button"
        tabIndex={0}
        aria-label={product.title}
        onClick={open}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            open();
          }
        }}
        className={cn(
          'group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors',
          'hover:border-foreground/25 hover:bg-accent/30',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        )}
      >
        <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-border bg-muted">
          {product.cover?.url ? (
            <div
              role="img"
              aria-label={product.title}
              className="absolute inset-0 bg-cover bg-center transition-transform duration-300 ease-out group-hover:scale-[1.03]"
              style={{ backgroundImage: `url(${product.cover.url})` }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                aria-hidden
                className="select-none font-heading text-7xl font-semibold leading-none text-foreground/[0.07]"
              >
                {monogram}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <span className="text-[11px] font-medium uppercase tracking-[0.09em] text-muted-foreground">
            {tType(product.type)}
          </span>
          <div className="space-y-1">
            <h3 className="font-heading text-[15px] font-semibold leading-snug tracking-tight text-foreground line-clamp-2">
              {product.title}
            </h3>
            {lead ? (
              <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {lead}
              </p>
            ) : null}
          </div>

          <div className="mt-auto flex flex-col gap-2.5 pt-1">
            {visibleTags.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5">
                {visibleTags.map((tag) => (
                  <li
                    key={tag.id}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground"
                  >
                    <span
                      aria-hidden
                      className="size-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span className="max-w-[8rem] truncate">{tag.name}</span>
                  </li>
                ))}
                {overflowTags.length > 0 ? (
                  <li
                    title={overflowTags.map((tag) => tag.name).join(', ')}
                    className="inline-flex items-center rounded-md border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground"
                  >
                    +{overflowTags.length}
                  </li>
                ) : null}
              </ul>
            ) : null}

            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border/60 pt-2.5 text-xs text-muted-foreground">
              {product.durationHours > 0 ? (
                <>
                  <span className="inline-flex items-center gap-1">
                    <ClockIcon className="size-3.5" />
                    {t('durationHours', { hours: product.durationHours })}
                  </span>
                  <span
                    aria-hidden
                    className="size-0.5 rounded-full bg-muted-foreground/40"
                  />
                </>
              ) : null}
              <span className="inline-flex items-center gap-1">
                <CalendarIcon className="size-3.5" />
                {t('enrolled', { time: enrolled })}
              </span>
            </div>
          </div>
        </div>
      </article>
    </li>
  );
}

function EmptyState({ isGloballyEmpty }: { isGloballyEmpty: boolean }) {
  const t = useTranslations('my-notes.empty');

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full border border-border text-muted-foreground">
        <GraduationCapIcon className="size-5" />
      </div>

      <div className="max-w-sm space-y-1">
        <h2 className="font-heading text-base font-semibold tracking-tight text-foreground">
          {isGloballyEmpty ? t('title') : t('tabTitle')}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {isGloballyEmpty ? t('description') : t('tabDescription')}
        </p>
      </div>

      {isGloballyEmpty ? (
        <Button
          variant="outline"
          size="sm"
          render={<Link href="/marketplace" />}
          nativeButton={false}
        >
          {t('cta')}
        </Button>
      ) : null}
    </div>
  );
}
