'use client';

import { SparklesIcon, ZapIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/shared/ui/badge';

import { PlanCard, type PlanKey } from './plan-card';
import { PricingFaq } from './pricing-faq';
import { PricingRibbons } from './pricing-ribbons';

import type { LucideIcon } from 'lucide-react';

type PlanConfig = {
  key: PlanKey;
  icon: LucideIcon;
  priceCompact?: boolean;
  mostPopular?: boolean;
  cta: { kind: 'disabled' } | { kind: 'link'; href: string };
};

const PLANS: ReadonlyArray<PlanConfig> = [
  { key: 'free', icon: ZapIcon, cta: { kind: 'disabled' } },
  {
    key: 'beta',
    icon: SparklesIcon,
    priceCompact: true,
    mostPopular: true,
    cta: { kind: 'link', href: '/help' },
  },
];

export function PricingView() {
  const t = useTranslations('pricing');
  const shouldReduceMotion = useReducedMotion();

  const heroEntry = (order: number) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y: 16 },
    animate: shouldReduceMotion ? undefined : { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay: order * 0.08, ease: 'easeOut' as const },
  });

  return (
    <main className="relative isolate flex-1 overflow-hidden bg-background">
      {/* Tinted hero backdrop with a diagonal cut running along the ribbons —
          the page fades to the plain background below that line. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[53rem] bg-surface-subtle/50 [clip-path:polygon(0_0,100%_0,100%_73%,0_100%)] md:h-[50rem] md:[clip-path:polygon(0_0,100%_0,100%_80%,0_100%)]"
      />
      <PricingRibbons />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-4 pt-24 pb-16 md:px-6 md:pt-28 md:pb-20 lg:px-8 lg:pt-32 lg:pb-24">
        <motion.div {...heroEntry(0)}>
          <Badge
            variant="outline"
            className="h-auto bg-card px-3 py-1 text-[13px] font-medium text-brand shadow-xs"
          >
            {t('badge')}
          </Badge>
        </motion.div>

        <motion.h1
          {...heroEntry(1)}
          className="mt-4 text-center font-heading text-4xl font-bold tracking-tight text-foreground md:text-5xl"
        >
          {t('title')}
        </motion.h1>

        <motion.p
          {...heroEntry(2)}
          className="mt-5 max-w-3xl text-center text-lg text-brand md:text-xl"
        >
          {t('subtitle')}
        </motion.p>

        <div className="mt-20 grid w-full max-w-md grid-cols-1 gap-6 lg:mt-28 lg:max-w-3xl lg:grid-cols-2 lg:gap-8">
          {PLANS.map((plan, index) => (
            <PlanCard
              key={plan.key}
              planKey={plan.key}
              icon={plan.icon}
              index={index}
              priceCompact={plan.priceCompact}
              mostPopular={plan.mostPopular}
              cta={plan.cta}
            />
          ))}
        </div>

        <div className="mt-24 w-full md:mt-28 lg:mt-32">
          <PricingFaq />
        </div>
      </div>
    </main>
  );
}
