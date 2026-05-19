'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { VideoPlayer } from '@/shared/ui/video-player';

const SAMPLE_SRC = 'https://media.w3.org/2010/05/sintel/trailer.mp4';
const SAMPLE_POSTER = 'https://media.w3.org/2010/05/sintel/poster.png';

export function VideoPlayerDemoView() {
  const t = useTranslations('video-player-demo');

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-8 md:px-6 md:py-12 lg:px-8 lg:py-16">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex flex-col gap-3"
      >
        <span className="w-fit rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.12em] text-brand">
          VideoPlayer
        </span>
        <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
          {t('title')}
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
          {t('description')}
        </p>
      </motion.header>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.45 }}
        className="flex flex-col gap-4"
      >
        <VideoPlayer
          src={SAMPLE_SRC}
          poster={SAMPLE_POSTER}
          ariaLabel={t('player.aria')}
          normalLabel={t('player.normal')}
        />
        <ul className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-muted-foreground md:text-sm">
          <li>
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground">
              Space
            </kbd>{' '}
            — {t('shortcuts.playPause')}
          </li>
          <li>
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground">
              ←
            </kbd>{' '}
            /{' '}
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground">
              →
            </kbd>{' '}
            — {t('shortcuts.seek')}
          </li>
          <li>
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground">
              ↑
            </kbd>{' '}
            /{' '}
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground">
              ↓
            </kbd>{' '}
            — {t('shortcuts.volume')}
          </li>
          <li>
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground">
              M
            </kbd>{' '}
            — {t('shortcuts.mute')}
          </li>
          <li>
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-foreground">
              F
            </kbd>{' '}
            — {t('shortcuts.fullscreen')}
          </li>
        </ul>
      </motion.section>
    </main>
  );
}
