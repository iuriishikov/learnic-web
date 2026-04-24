import { getTranslations } from 'next-intl/server';
import { ArrowRightIcon, PlayCircleIcon } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Separator } from '@/shared/ui/separator';

import { DeviceShowcase } from './device-showcase';
import { GridBackdrop } from './grid-backdrop';

export async function LandingHero() {
  const t = await getTranslations('home.hero');

  return (
    <section className="relative isolate -mt-20 w-full overflow-hidden md:-mt-24">
      <div className="relative mx-auto w-full max-w-[1216px] px-4 md:px-6">
        <div className="relative pt-40 pb-20 md:pt-52 md:pb-28">
          <GridBackdrop className="-inset-x-8 -bottom-20 md:-inset-x-16 md:-bottom-28 lg:-inset-x-32 xl:-inset-x-48" />

          <div className="relative flex flex-col items-center text-center">
            <a
              href="#"
              className="mb-6 inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-sm font-medium shadow-sm transition-colors hover:bg-muted md:mb-8"
            >
              <span className="-my-1 -ml-3 inline-flex items-center gap-2 rounded-full border-r border-border bg-foreground/[0.03] px-3 py-1 text-foreground">
                <span aria-hidden className="size-2 rounded-full bg-brand" />
                {t('featureBadge')}
              </span>
              <span className="flex items-center gap-2 pl-3 text-foreground">
                {t('featureLinkText')}
                <ArrowRightIcon className="size-4 shrink-0" />
              </span>
            </a>

            <h1 className="max-w-[860px] text-pretty text-[40px] font-semibold leading-[1.08] tracking-[-0.02em] text-foreground md:text-6xl lg:text-[72px]">
              {t('title')}
            </h1>

            <p className="mt-5 max-w-[640px] text-pretty text-base leading-[1.55] text-muted-foreground md:mt-6 md:text-lg">
              {t('description')}
            </p>

            <div className="mt-8 flex w-full flex-col-reverse gap-3 md:mt-10 md:w-auto md:flex-row md:justify-center md:gap-3">
              <Button
                variant="outline"
                className="h-12 w-full gap-2 rounded-lg px-5 text-base font-medium dark:bg-background dark:hover:bg-muted md:w-auto md:min-w-[120px]"
                render={<a href="#" />} nativeButton={false}
              >
                <PlayCircleIcon className="size-[18px]" />
                {t('demo')}
              </Button>
              <Button
                className="h-12 w-full gap-2 rounded-lg bg-brand px-5 text-base font-medium text-brand-foreground hover:bg-brand/90 md:w-auto md:min-w-[120px]"
                render={<a href="#" />} nativeButton={false}
              >
                {t('signUp')}
              </Button>
            </div>
          </div>
        </div>

        <DeviceShowcase className="relative" />

        <div className="relative z-10 mt-px -mx-8 md:-mx-16 lg:-mx-32 xl:-mx-48">
          <Separator className="h-px w-full" />
        </div>
      </div>
    </section>
  );
}
