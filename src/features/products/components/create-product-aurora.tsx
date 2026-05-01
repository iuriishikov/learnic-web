'use client';

import {
  BarChart3Icon,
  ShieldCheckIcon,
  SparklesIcon,
  type LucideIcon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { cn } from '@/shared/lib/utils';

import type { ProductType } from '../model/types';

type CreateProductAuroraProps = {
  productType: ProductType;
  className?: string;
};

const INFO_CARDS: Array<{
  key: 'control' | 'analytics' | 'reach';
  icon: LucideIcon;
}> = [
  { key: 'control', icon: ShieldCheckIcon },
  { key: 'analytics', icon: BarChart3Icon },
  { key: 'reach', icon: SparklesIcon },
];

export function CreateProductAurora({
  productType,
  className,
}: CreateProductAuroraProps) {
  const t = useTranslations('teach-products.create.info');
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={cn(
        'relative isolate hidden overflow-hidden bg-brand-700 p-5 md:flex md:flex-col md:gap-3',
        className,
      )}
      aria-hidden="true"
    >
      <AuroraBackdrop reduceMotion={reduceMotion ?? false} />

      <div className="relative z-10 flex h-full flex-col gap-3">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/85 ring-1 ring-white/15 backdrop-blur-sm">
          <SparklesIcon className="size-3" />
          {t(`eyebrow.${productType}`)}
        </span>

        <div className="mt-auto flex flex-col gap-2.5">
          {INFO_CARDS.map(({ key, icon: Icon }, index) => (
            <motion.div
              key={key}
              initial={
                reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8, scale: 0.98 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.32,
                delay: 0.08 + index * 0.07,
                ease: [0.22, 0.61, 0.36, 1],
              }}
              className="rounded-xl bg-white/[0.07] p-3 ring-1 ring-white/10 backdrop-blur-sm"
            >
              <span className="flex size-7 items-center justify-center rounded-lg bg-white/10 text-white ring-1 ring-white/15 [&>svg]:size-3.5">
                <Icon />
              </span>
              <p className="mt-2 text-[13px] font-semibold leading-tight text-white">
                {t(`${key}.title`)}
              </p>
              <p className="mt-1 text-xs leading-snug text-white/65">
                {t(`${key}.description`)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AuroraBackdrop({ reduceMotion }: { reduceMotion: boolean }) {
  const stars = useMemo(() => generateStars(28), []);

  return (
    <>
      <motion.div
        aria-hidden
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 100% 75% at 70% 105%, var(--brand-300) 0%, var(--brand-400) 22%, var(--brand-500) 50%, var(--brand-600) 75%, transparent 100%)',
        }}
      />
      <motion.div
        aria-hidden
        initial={reduceMotion ? false : { opacity: 0, scale: 0.85, x: 20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
        className="pointer-events-none absolute -right-10 -bottom-14 -z-10 size-64 rounded-full"
        style={{
          background:
            'radial-gradient(circle, color-mix(in oklch, var(--brand-200) 65%, transparent) 0%, color-mix(in oklch, var(--brand-400) 30%, transparent) 45%, transparent 75%)',
          filter: 'blur(18px)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 15% 5%, color-mix(in oklch, var(--brand-500) 70%, transparent) 0%, transparent 65%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-90"
      >
        {stars.map((star, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              top: `${star.top}%`,
              left: `${star.left}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
            }}
          />
        ))}
      </div>
    </>
  );
}

function generateStars(count: number) {
  const stars: Array<{
    top: number;
    left: number;
    size: number;
    opacity: number;
  }> = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      top: pseudoRandom(i * 7 + 3) * 100,
      left: pseudoRandom(i * 11 + 5) * 100,
      size: 1 + Math.round(pseudoRandom(i * 13 + 9) * 1.5),
      opacity: 0.4 + pseudoRandom(i * 17 + 1) * 0.5,
    });
  }
  return stars;
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}
