'use client';

import { useQueryClient } from '@tanstack/react-query';
import { GraduationCapIcon, RadioIcon, RotateCwIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { ProductCover, type Product } from '@/features/products';
import { QueryProvider } from '@/shared/api/query-provider';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

const NOW = '2026-05-02T00:00:00.000Z';
const SEEDED_PRODUCT: Product = {
  id: 'demo-seeded-course',
  type: 'course',
  status: 'published',
  title: 'Marketing site redesign',
  description: '',
  durationHours: 8,
  priceAmount: '0',
  priceCurrency: 'RUB',
  author: {
    id: 'demo-author',
    firstName: 'Olivia',
    lastName: 'Rhye',
    patronymic: null,
  },
  webinarDetails: null,
  publishedAt: null,
  createdAt: NOW,
  updatedAt: NOW,
};

const FETCH_PRODUCT_ID = 'demo-fetch-product';
const ERROR_PRODUCT_ID = '__not_a_real_product_id__';

export function ProductCoverDemoClient() {
  return (
    <QueryProvider>
      <Demo />
    </QueryProvider>
  );
}

function Demo() {
  const t = useTranslations('product-cover-demo');
  const queryClient = useQueryClient();
  const [fetchKey, setFetchKey] = useState(0);
  const [errorKey, setErrorKey] = useState(0);

  function reload(scope: 'fetch' | 'error') {
    if (scope === 'fetch') {
      queryClient.removeQueries({ queryKey: ['product', FETCH_PRODUCT_ID] });
      setFetchKey((k) => k + 1);
    } else {
      queryClient.removeQueries({ queryKey: ['product', ERROR_PRODUCT_ID] });
      setErrorKey((k) => k + 1);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 py-8 md:px-8 md:py-12">
      <header className="flex flex-col gap-3">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {t('title')}
        </h1>
        <p className="max-w-[60ch] text-sm leading-relaxed text-muted-foreground md:text-base">
          {t('description')}
        </p>
        <div className="mt-2 inline-flex w-fit max-w-full items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-1.5 font-mono text-xs text-foreground">
          <span className="text-muted-foreground">{t('usage.title')}:</span>
          <code>{'<ProductCover productId={productId} />'}</code>
        </div>
      </header>

      <section className="mt-10">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <DemoCard
            title={t('cases.seeded.title')}
            description={t('cases.seeded.description')}
          >
            <div className="overflow-hidden rounded-2xl ring-1 ring-foreground/10">
              <ProductCover
                productId={SEEDED_PRODUCT.id}
                initialProduct={SEEDED_PRODUCT}
                className="h-32"
              >
                <CardOverlay type="course" label={t('card.course')} />
              </ProductCover>
            </div>
          </DemoCard>

          <DemoCard
            title={t('cases.fetch.title')}
            description={t('cases.fetch.description')}
            actions={
              <Button
                size="sm"
                variant="outline"
                onClick={() => reload('fetch')}
                className="gap-1.5"
              >
                <RotateCwIcon className="size-3.5" />
                {t('controls.reload')}
              </Button>
            }
          >
            <div className="overflow-hidden rounded-2xl ring-1 ring-foreground/10">
              <ProductCover
                key={`fetch-${fetchKey}`}
                productId={FETCH_PRODUCT_ID}
                className="h-32"
              />
            </div>
          </DemoCard>

          <DemoCard
            title={t('cases.error.title')}
            description={t('cases.error.description')}
            subtitle={t('cases.error.subtitle')}
            actions={
              <Button
                size="sm"
                variant="outline"
                onClick={() => reload('error')}
                className="gap-1.5"
              >
                <RotateCwIcon className="size-3.5" />
                {t('controls.reload')}
              </Button>
            }
          >
            <div className="overflow-hidden rounded-2xl ring-1 ring-foreground/10">
              <ProductCover
                key={`error-${errorKey}`}
                productId={ERROR_PRODUCT_ID}
                className="h-32"
              />
            </div>
          </DemoCard>

          <DemoCard
            title={t('cases.skeleton.title')}
            description={t('cases.skeleton.description')}
          >
            <div className="overflow-hidden rounded-2xl ring-1 ring-foreground/10">
              <div className="relative h-32 w-full overflow-hidden">
                <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
              </div>
            </div>
          </DemoCard>
        </div>
      </section>

      <section className="mt-12">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground md:text-xl">
            {t('sizes.title')}
          </h2>
          <p className="max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
            {t('sizes.description')}
          </p>
        </div>

        <div className="mt-5 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <SizeCase label={t('sizes.card')}>
            <div className="overflow-hidden rounded-2xl ring-1 ring-foreground/10">
              <ProductCover
                productId={SEEDED_PRODUCT.id}
                initialProduct={SEEDED_PRODUCT}
                className="h-32"
              />
            </div>
          </SizeCase>
          <SizeCase label={t('sizes.editor')}>
            <ProductCover
              productId={SEEDED_PRODUCT.id}
              initialProduct={SEEDED_PRODUCT}
              className="h-32 rounded-2xl ring-1 ring-foreground/5 md:h-44"
            />
          </SizeCase>
          <SizeCase label={t('sizes.wide')}>
            <ProductCover
              productId={SEEDED_PRODUCT.id}
              initialProduct={SEEDED_PRODUCT}
              className="aspect-[16/5] rounded-3xl ring-1 ring-foreground/10"
            />
          </SizeCase>
        </div>
      </section>
    </div>
  );
}

function DemoCard({
  title,
  description,
  subtitle,
  actions,
  children,
}: {
  title: string;
  description: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-card-foreground">
      {children}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="font-heading text-sm font-semibold tracking-tight text-foreground">
            {title}
          </h3>
          {subtitle ? (
            <p className="font-mono text-[11px] text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
    </article>
  );
}

function SizeCase({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      {children}
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

function CardOverlay({
  type,
  label,
}: {
  type: 'course' | 'webinar';
  label: string;
}) {
  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent"
      />
      <div className="absolute inset-x-0 top-3 px-3">
        <Badge
          variant="secondary"
          className="border-0 bg-black/30 text-white backdrop-blur-sm"
        >
          {type === 'course' ? (
            <GraduationCapIcon className="size-3" />
          ) : (
            <RadioIcon className="size-3" />
          )}
          {label}
        </Badge>
      </div>
    </>
  );
}
