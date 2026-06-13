'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { Button } from '@/shared/ui/button';

export function TeamHero() {
  const t = useTranslations('team.hero');
  const shouldReduceMotion = useReducedMotion();

  const heroEntry = (order: number) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y: 16 },
    animate: shouldReduceMotion ? undefined : { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay: order * 0.08, ease: 'easeOut' as const },
  });

  return (
    <section className="w-full py-16 md:py-24">
      <div className="mx-auto flex w-full max-w-[768px] flex-col items-center px-4 text-center md:px-6">
        <motion.span {...heroEntry(0)} className="text-sm font-semibold text-brand">
          {t('eyebrow')}
        </motion.span>

        <motion.h1
          {...heroEntry(1)}
          className="mt-3 text-pretty text-4xl font-semibold tracking-tight text-foreground md:text-5xl"
        >
          {t('title')}
        </motion.h1>

        <motion.p
          {...heroEntry(2)}
          className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground md:mt-6 md:text-xl"
        >
          {t('description')}
        </motion.p>

        <motion.div {...heroEntry(3)} className="mt-10 md:mt-12">
          <Button
            className="h-10 gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground hover:bg-brand/90"
            render={<a href="#" />}
            nativeButton={false}
          >
            {t('cta')}
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
