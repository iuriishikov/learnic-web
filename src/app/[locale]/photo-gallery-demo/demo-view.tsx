'use client';

import { RotateCwIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';

import { Button } from '@/shared/ui/button';
import { PhotoGallery, type PhotoGalleryPhoto } from '@/shared/ui/photo-gallery';

/**
 * Photos come from picsum.photos — a public placeholder service — so the demo
 * works without hitting the real S3 storage. `unoptimized` is required:
 * the host is not in next.config `remotePatterns`.
 */
function photoUrl(seed: string, height: number, aspectRatio: number, heightFactor = 1) {
  const h = Math.round(height * heightFactor * 2); // 2x for retina
  const w = Math.round(h * aspectRatio);
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

const REFERENCE_HEIGHT = 480;

const REFERENCE_SHAPES = [
  { seed: 'atelier-pair', aspectRatio: 0.72, heightFactor: 1 },
  { seed: 'studio-talk', aspectRatio: 1.36, heightFactor: 0.66 },
  { seed: 'paper-stack', aspectRatio: 0.78, heightFactor: 0.78 },
  { seed: 'fabric-light', aspectRatio: 0.75, heightFactor: 1 },
  { seed: 'window-shadow', aspectRatio: 1.3, heightFactor: 0.6 },
  { seed: 'desk-tools', aspectRatio: 0.8, heightFactor: 0.85 },
] as const;

const LIGHTBOX_HEIGHT = 400;

const LIGHTBOX_SHAPES = [
  { seed: 'morning-coffee', aspectRatio: 0.8, heightFactor: 1, captionKey: 'caption1' },
  { seed: 'city-walk', aspectRatio: 1.4, heightFactor: 0.7, captionKey: 'caption2' },
  { seed: 'quiet-desk', aspectRatio: 0.75, heightFactor: 0.9, captionKey: 'caption3' },
  { seed: 'green-yard', aspectRatio: 1.2, heightFactor: 0.65, captionKey: 'caption4' },
] as const;

const FILMSTRIP_HEIGHT = 320;
const FILMSTRIP_SEEDS = [
  'frame-one',
  'frame-two',
  'frame-three',
  'frame-four',
  'frame-five',
  'frame-six',
] as const;

const STATES_HEIGHT = 320;
const BROKEN_SRC = '/this-photo-does-not-exist.jpg';

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

/* -------------------------------------------------------------------------- */
/* View                                                                       */
/* -------------------------------------------------------------------------- */

export function PhotoGalleryDemoView() {
  const t = useTranslations('photo-gallery-demo');

  // Bumping this key remounts the "states" gallery so the skeletons briefly
  // show again — gives the user a way to *see* the loading state.
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((n) => n + 1), []);

  const referencePhotos: PhotoGalleryPhoto[] = REFERENCE_SHAPES.map((shape) => ({
    src: photoUrl(shape.seed, REFERENCE_HEIGHT, shape.aspectRatio, shape.heightFactor),
    alt: t('labels.photoAlt'),
    aspectRatio: shape.aspectRatio,
    heightFactor: shape.heightFactor,
  }));

  const lightboxPhotos: PhotoGalleryPhoto[] = LIGHTBOX_SHAPES.map((shape) => ({
    src: photoUrl(shape.seed, LIGHTBOX_HEIGHT, shape.aspectRatio, shape.heightFactor),
    alt: t('labels.photoAlt'),
    aspectRatio: shape.aspectRatio,
    heightFactor: shape.heightFactor,
    caption: t(`labels.${shape.captionKey}`),
  }));

  const filmstripPhotos: PhotoGalleryPhoto[] = FILMSTRIP_SEEDS.map((seed) => ({
    src: photoUrl(seed, FILMSTRIP_HEIGHT, 0.8),
    alt: t('labels.photoAlt'),
    aspectRatio: 0.8,
  }));

  const statesPhotos: PhotoGalleryPhoto[] = [
    {
      src: `${photoUrl('states-one', STATES_HEIGHT, 0.75)}?reload=${reloadKey}`,
      alt: t('labels.photoAlt'),
      aspectRatio: 0.75,
    },
    {
      src: `${BROKEN_SRC}?reload=${reloadKey}`,
      alt: t('labels.photoAlt'),
      aspectRatio: 1.3,
      heightFactor: 0.7,
    },
    {
      src: `${photoUrl('states-two', STATES_HEIGHT, 0.8, 0.85)}?reload=${reloadKey}`,
      alt: t('labels.photoAlt'),
      aspectRatio: 0.8,
      heightFactor: 0.85,
    },
    {
      src: `${photoUrl('states-three', STATES_HEIGHT, 1.36, 0.66)}?reload=${reloadKey}`,
      alt: t('labels.photoAlt'),
      aspectRatio: 1.36,
      heightFactor: 0.66,
    },
  ];

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

      {/* ---------------------------- Reference ---------------------------- */}
      <DemoCard
        title={t('sections.reference.title')}
        description={t('sections.reference.description')}
      >
        <PhotoGallery
          photos={referencePhotos}
          height={REFERENCE_HEIGHT}
          unoptimized
          prevLabel={t('labels.prev')}
          nextLabel={t('labels.next')}
          ariaLabel={t('labels.galleryAria')}
        />
      </DemoCard>

      {/* ----------------------------- Lightbox ---------------------------- */}
      <DemoCard
        title={t('sections.lightbox.title')}
        description={t('sections.lightbox.description')}
      >
        <p className="text-xs italic text-muted-foreground">
          {t('sections.lightbox.hint')}
        </p>
        <PhotoGallery
          photos={lightboxPhotos}
          height={LIGHTBOX_HEIGHT}
          lightbox
          unoptimized
          prevLabel={t('labels.prev')}
          nextLabel={t('labels.next')}
          ariaLabel={t('labels.galleryAria')}
        />
      </DemoCard>

      {/* ------------------------ Rounded / filmstrip ----------------------- */}
      <DemoCard
        title={t('sections.rounded.title')}
        description={t('sections.rounded.description')}
      >
        <PhotoGallery
          photos={filmstripPhotos}
          height={FILMSTRIP_HEIGHT}
          rounded="xl"
          unoptimized
          prevLabel={t('labels.prev')}
          nextLabel={t('labels.next')}
          ariaLabel={t('labels.galleryAria')}
        />
      </DemoCard>

      {/* ------------------------------ States ------------------------------ */}
      <DemoCard
        title={t('sections.states.title')}
        description={t('sections.states.description')}
        action={
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={reload}
            className="gap-1.5"
          >
            <RotateCwIcon className="size-3.5" />
            {t('sections.states.reload')}
          </Button>
        }
      >
        <PhotoGallery
          key={`states-${reloadKey}`}
          photos={statesPhotos}
          height={STATES_HEIGHT}
          rounded="lg"
          unoptimized
          prevLabel={t('labels.prev')}
          nextLabel={t('labels.next')}
          ariaLabel={t('labels.galleryAria')}
        />
      </DemoCard>
    </main>
  );
}
