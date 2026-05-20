'use client';

import { RotateCwIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';

import { Button } from '@/shared/ui/button';
import { Image } from '@/shared/ui/image';

const SAMPLE_IMAGES = [
  '/placeholders/01-aurora.svg',
  '/placeholders/02-prism-fade.svg',
  '/placeholders/03-heatmap.svg',
  '/placeholders/04-liquid-chrome.svg',
  '/placeholders/05-dreamy-blur.svg',
  '/placeholders/06-film-grain.svg',
  '/placeholders/07-dynamic-mesh.svg',
] as const;

const BROKEN_SRC = '/this-file-does-not-exist.png';

/* -------------------------------------------------------------------------- */
/* Demo wrapper                                                               */
/* -------------------------------------------------------------------------- */

function DemoCard({
  title,
  description,
  action,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6"
    >
      <header className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className="flex flex-col gap-4">{children}</div>
    </motion.section>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-muted-foreground text-center">{children}</p>
  );
}

/* -------------------------------------------------------------------------- */
/* View                                                                       */
/* -------------------------------------------------------------------------- */

export function ImageDemoView() {
  const t = useTranslations('image-demo');

  // Bumping this key remounts every Image in the page so the skeleton briefly
  // shows on every reload — gives the user a way to *see* the loading state.
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((n) => n + 1), []);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 md:px-6 md:py-12">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold text-foreground md:text-3xl">
          {t('title')}
        </h1>
        <p className="text-sm text-muted-foreground md:text-base">
          {t('description')}
        </p>
      </header>

      {/* ------------------------------ Sizes ------------------------------ */}
      <DemoCard
        title={t('sections.sizes.title')}
        description={t('sections.sizes.description')}
      >
        <div
          key={`sizes-${reloadKey}`}
          className="flex flex-wrap items-end gap-6"
        >
          <div className="flex flex-col items-center gap-2">
            <Image
              src={SAMPLE_IMAGES[0]}
              alt={t('ariaPlaceholders')}
              width={48}
              height={48}
              rounded="full"
              errorSize="icon"
            />
            <Caption>{t('labels.small')}</Caption>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Image
              src={SAMPLE_IMAGES[1]}
              alt={t('ariaPlaceholders')}
              width={192}
              height={192}
              rounded="xl"
            />
            <Caption>{t('labels.medium')}</Caption>
          </div>
          <div className="flex w-full max-w-[640px] flex-col items-center gap-2">
            <div className="relative aspect-[16/9] w-full">
              <Image
                src={SAMPLE_IMAGES[2]}
                alt={t('ariaPlaceholders')}
                fill
                sizes="(max-width: 768px) 100vw, 640px"
                rounded="2xl"
              />
            </div>
            <Caption>{t('labels.large')}</Caption>
          </div>
        </div>
      </DemoCard>

      {/* ----------------------------- Loading ----------------------------- */}
      <DemoCard
        title={t('sections.loading.title')}
        description={t('sections.loading.description')}
        action={
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={reload}
            className="gap-1.5"
          >
            <RotateCwIcon className="size-3.5" />
            {t('sections.loading.reload')}
          </Button>
        }
      >
        <div
          key={`loading-${reloadKey}`}
          className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {[SAMPLE_IMAGES[3], SAMPLE_IMAGES[4], SAMPLE_IMAGES[5]].map(
            (src, idx) => (
              <div key={src} className="relative aspect-[4/3] w-full">
                <Image
                  src={`${src}?reload=${reloadKey}-${idx}`}
                  alt={t('ariaPlaceholders')}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 100vw, 33vw"
                  rounded="lg"
                />
              </div>
            ),
          )}
        </div>
      </DemoCard>

      {/* ------------------------------ Errors ----------------------------- */}
      <DemoCard
        title={t('sections.errors.title')}
        description={t('sections.errors.description')}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex flex-col items-center gap-2">
            <div className="relative aspect-[16/9] w-full">
              <Image
                src={`${BROKEN_SRC}?large=${reloadKey}`}
                alt={t('ariaPlaceholders')}
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, 40vw"
                rounded="xl"
                errorSize="text"
              />
            </div>
            <Caption>{t('labels.errorLarge')}</Caption>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Image
              src={`${BROKEN_SRC}?medium=${reloadKey}`}
              alt={t('ariaPlaceholders')}
              width={192}
              height={192}
              unoptimized
              rounded="xl"
              errorSize="auto"
            />
            <Caption>{t('labels.errorMedium')}</Caption>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Image
              src={`${BROKEN_SRC}?small=${reloadKey}`}
              alt={t('ariaPlaceholders')}
              width={48}
              height={48}
              unoptimized
              rounded="full"
              errorSize="icon"
            />
            <Caption>{t('labels.errorSmall')}</Caption>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t('labels.errorAuto')}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Below 12rem (192px) → icon-only */}
            <Image
              src={`${BROKEN_SRC}?auto-small=${reloadKey}`}
              alt={t('ariaPlaceholders')}
              width={160}
              height={120}
              unoptimized
              rounded="lg"
              errorSize="auto"
            />
            {/* Above 12rem → text + retry */}
            <Image
              src={`${BROKEN_SRC}?auto-large=${reloadKey}`}
              alt={t('ariaPlaceholders')}
              width={320}
              height={180}
              unoptimized
              rounded="lg"
              errorSize="auto"
            />
          </div>
        </div>
      </DemoCard>

      {/* ----------------------------- Lightbox ---------------------------- */}
      <DemoCard
        title={t('sections.lightbox.title')}
        description={t('sections.lightbox.description')}
      >
        <p className="text-xs italic text-muted-foreground">
          {t('sections.lightbox.hint')}
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <div className="relative aspect-[16/10] w-full">
              <Image
                src={SAMPLE_IMAGES[0]}
                alt={t('ariaPlaceholders')}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                rounded="xl"
                lightbox
                caption={t('labels.captionSample')}
              />
            </div>
            <Caption>{t('labels.lightboxLabelled')}</Caption>
          </div>
          <div className="flex flex-col gap-2">
            <div className="relative aspect-[16/10] w-full">
              <Image
                src={SAMPLE_IMAGES[6]}
                alt={t('ariaPlaceholders')}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                rounded="xl"
                lightbox
              />
            </div>
            <Caption>{t('labels.lightboxBare')}</Caption>
          </div>
        </div>
      </DemoCard>

      {/* --------------------------- Integration --------------------------- */}
      <DemoCard
        title={t('sections.integration.title')}
        description={t('sections.integration.description')}
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Mini avatar — Image with errorSize="icon", rounded="full" */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-4">
            <Image
              src={SAMPLE_IMAGES[1]}
              alt={t('labels.miniAvatarName')}
              width={56}
              height={56}
              rounded="full"
              errorSize="icon"
              lightbox
              caption={t('labels.miniAvatarName')}
            />
            <div className="flex flex-col">
              <p className="text-sm font-semibold text-foreground">
                {t('labels.miniAvatarName')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('labels.miniAvatarSubtitle')}
              </p>
            </div>
          </div>

          {/* Cover-style usage — like ProductCover's URL branch */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t('labels.coverHeading')}
            </p>
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl ring-1 ring-border">
              <Image
                src={SAMPLE_IMAGES[3]}
                alt={t('ariaPlaceholders')}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                rounded="2xl"
              />
            </div>
          </div>
        </div>
      </DemoCard>
    </main>
  );
}
