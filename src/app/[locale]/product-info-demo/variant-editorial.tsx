'use client';

import { ArrowLeftIcon } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Button, buttonVariants } from '@/shared/ui/button';

import { DemoAuthorRow, DemoEditorialSections } from './demo-blocks';
import { DEMO_PRODUCT, DemoChip, DemoCover } from './demo-data';

/**
 * Variant B — «Журнал». A single editorial reading column: a contained banner
 * cover, the title block below it, then container-less sections separated by
 * eyebrows + hairline rules. No sidebar, no cards. The cover stays contained
 * (not full-screen) — the milder take on the editorial direction.
 */
export function VariantEditorial() {
  return (
    <div className="mx-auto w-full max-w-[820px] px-5 pb-20 pt-12 md:px-6 md:pb-28">
      <div className="mb-5">
        <span
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            '-ml-2 gap-1.5 text-muted-foreground',
          )}
        >
          <ArrowLeftIcon className="size-4" />В каталог
        </span>
      </div>

      <DemoCover className="aspect-[21/9] w-full rounded-2xl border border-border" />

      <div className="mt-6 flex flex-col items-start gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <DemoChip>{DEMO_PRODUCT.typeLabel}</DemoChip>
        </div>
        <h1 className="text-balance text-3xl font-semibold leading-[1.1] tracking-tight text-foreground md:text-4xl lg:text-5xl">
          {DEMO_PRODUCT.title}
        </h1>
        <DemoAuthorRow />
        <Button
          type="button"
          size="lg"
          className="mt-1 h-12 w-full bg-brand px-7 text-brand-foreground hover:bg-brand/90 sm:w-auto"
        >
          Записаться
        </Button>
      </div>

      <DemoEditorialSections />
    </div>
  );
}
