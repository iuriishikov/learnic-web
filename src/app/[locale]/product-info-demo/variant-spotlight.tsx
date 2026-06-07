'use client';

import { ArrowLeftIcon } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Button, buttonVariants } from '@/shared/ui/button';

import { DemoAuthorRow, DemoEditorialSections } from './demo-blocks';
import { DEMO_PRODUCT, DemoChip, DemoCover } from './demo-data';

/**
 * Variant C — «Спотлайт». A prominent full-bleed cover hero with the title,
 * lead, author and CTA laid over a scrim — sized as a generous banner (a share
 * of the viewport, capped so it never gets gigantic on large screens), not the
 * whole screen. Below it, the same single editorial column as «Журнал».
 */
export function VariantSpotlight() {
  return (
    <>
      <DemoCover
        overlay
        className="relative h-[58svh] max-h-[600px] min-h-[460px] w-full"
      >
        <span
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'absolute left-4 top-5 z-10 h-9 gap-1.5 bg-black/25 px-3 text-white ring-1 ring-white/20 backdrop-blur-sm hover:bg-black/40 hover:text-white md:left-6 md:top-6',
          )}
        >
          <ArrowLeftIcon className="size-4" />В каталог
        </span>

        <div className="absolute inset-x-0 bottom-0 z-10">
          <div className="mx-auto flex w-full max-w-[820px] flex-col items-start gap-3.5 px-5 pb-10 md:gap-4 md:px-6 md:pb-14">
            <DemoChip className="bg-white/15 text-white ring-white/25 backdrop-blur-sm">
              {DEMO_PRODUCT.typeLabel}
            </DemoChip>
            <h1 className="text-balance text-3xl font-semibold leading-[1.08] tracking-tight text-white md:text-4xl lg:text-5xl">
              {DEMO_PRODUCT.title}
            </h1>
            <p className="line-clamp-2 max-w-[44rem] text-pretty text-base leading-snug text-white/80 md:text-lg">
              {DEMO_PRODUCT.lead}
            </p>
            <div className="mt-1 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
              <Button
                type="button"
                size="lg"
                className="h-12 bg-brand px-7 text-brand-foreground hover:bg-brand/90"
              >
                Записаться
              </Button>
              <DemoAuthorRow onDark />
            </div>
          </div>
        </div>
      </DemoCover>

      <div className="mx-auto w-full max-w-[820px] px-5 pb-20 md:px-6 md:pb-28">
        <DemoEditorialSections />
      </div>
    </>
  );
}
