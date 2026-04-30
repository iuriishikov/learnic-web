'use client';

import {
  GraduationCapIcon,
  PlusIcon,
  RadioIcon,
  SearchIcon,
  SparklesIcon,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/shared/ui/tabs';

import { MOCK_PRODUCTS } from '../lib/mock-products';
import type { Product, ProductType } from '../model/types';

import { CreateProductDialog } from './create-product-dialog';
import { ProductCard } from './product-card';

type Filter = 'all' | ProductType;

type ProductsGeneralViewProps = {
  initialProducts?: Product[];
};

export function ProductsGeneralView({
  initialProducts = MOCK_PRODUCTS,
}: ProductsGeneralViewProps) {
  const t = useTranslations('teach-products.general');
  const tFilter = useTranslations('teach-products.filter');
  const reduceMotion = useReducedMotion();

  const [products] = useState<Product[]>(initialProducts);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const counts = useMemo(() => {
    return products.reduce(
      (acc, p) => {
        acc.all += 1;
        acc[p.type] += 1;
        return acc;
      },
      { all: 0, course: 0, webinar: 0 } as Record<Filter, number>,
    );
  }, [products]);

  const visible = useMemo(() => {
    const q = search.trim().toLocaleLowerCase();
    return products.filter((p) => {
      if (filter !== 'all' && p.type !== filter) return false;
      if (!q) return true;
      return (
        p.title.toLocaleLowerCase().includes(q) ||
        p.description.toLocaleLowerCase().includes(q)
      );
    });
  }, [products, filter, search]);

  const showEmpty = visible.length === 0;
  const isFiltered = search.trim().length > 0 || filter !== 'all';

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-8 md:py-10">
      <Hero t={t} />

      <div className="mt-8 flex flex-col gap-3 md:mt-10 md:flex-row md:items-center md:justify-between">
        <Tabs
          value={filter}
          onValueChange={(value) => setFilter(value as Filter)}
        >
          <TabsList className="h-9">
            <FilterTab value="all" label={tFilter('all')} count={counts.all} />
            <FilterTab
              value="course"
              label={tFilter('courses')}
              count={counts.course}
            />
            <FilterTab
              value="webinar"
              label={tFilter('webinars')}
              count={counts.webinar}
            />
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('searchPlaceholder')}
              className="h-9 pl-8"
              aria-label={t('searchAriaLabel')}
            />
          </div>
          <CreateProductDialog
            trigger={
              <Button size="lg" className="h-9 gap-1.5">
                <PlusIcon /> {t('createCta')}
              </Button>
            }
          />
        </div>
      </div>

      <div className="mt-6 md:mt-8">
        <AnimatePresence mode="popLayout" initial={false}>
          {showEmpty ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <EmptyState filtered={isFiltered} />
            </motion.div>
          ) : (
            <motion.ul
              key="grid"
              initial={false}
              className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3"
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {visible.map((product, index) => (
                  <motion.li
                    key={product.id}
                    layout
                    initial={
                      reduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: 12, scale: 0.98 }
                    }
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{
                      duration: 0.22,
                      delay: reduceMotion ? 0 : Math.min(index * 0.03, 0.15),
                      ease: [0.32, 0.72, 0, 1],
                    }}
                  >
                    <ProductCard product={product} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Hero({ t }: { t: (key: string) => string }) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand/95 via-brand to-brand-800 px-6 py-7 text-brand-foreground md:px-9 md:py-9">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-20 size-72 rounded-full bg-brand-300/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-12 size-72 rounded-full bg-brand-900/40 blur-3xl"
      />
      <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
            <SparklesIcon className="size-3" />
            {t('heroEyebrow')}
          </span>
          <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight md:text-4xl">
            {t('title')}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80 md:text-base">
            {t('description')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CreateProductDialog
            trigger={
              <Button
                size="lg"
                variant="secondary"
                className="h-10 gap-1.5 bg-white text-brand hover:bg-white/90"
              >
                <PlusIcon /> {t('heroCreate')}
              </Button>
            }
          />
        </div>
      </div>
    </section>
  );
}

function FilterTab({
  value,
  label,
  count,
}: {
  value: Filter;
  label: string;
  count: number;
}) {
  return (
    <TabsTrigger value={value} className="gap-1.5">
      {label}
      <span
        className={cn(
          'inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-muted-foreground/15 px-1.5 text-[10px] font-semibold leading-none text-muted-foreground tabular-nums',
          'group-data-[variant=default]/tabs-list:data-[active]:bg-foreground/10',
        )}
      >
        {count}
      </span>
    </TabsTrigger>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  const t = useTranslations('teach-products.empty');

  return (
    <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-14 text-center md:py-20">
      <div className="relative">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          {filtered ? (
            <SearchIcon className="size-7" />
          ) : (
            <GraduationCapIcon className="size-7" />
          )}
        </div>
        {!filtered ? (
          <div className="absolute -right-3 -bottom-3 flex size-9 items-center justify-center rounded-xl bg-card ring-1 ring-foreground/10 text-brand">
            <RadioIcon className="size-4" />
          </div>
        ) : null}
      </div>

      <div className="space-y-1.5 max-w-md">
        <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
          {filtered ? t('filteredTitle') : t('title')}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {filtered ? t('filteredDescription') : t('description')}
        </p>
      </div>

      {!filtered ? (
        <CreateProductDialog
          trigger={
            <Button size="lg" className="h-10 gap-1.5">
              <PlusIcon /> {t('cta')}
            </Button>
          }
        />
      ) : null}
    </div>
  );
}
