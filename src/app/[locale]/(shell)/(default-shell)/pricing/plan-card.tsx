'use client';

import { CheckIcon, type LucideIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { Link } from '@/shared/config/i18n/navigation';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardFooter } from '@/shared/ui/card';

import { MostPopularBadge } from './most-popular-badge';

export type PlanKey = 'free' | 'beta';

type PlanCardProps = {
  planKey: PlanKey;
  icon: LucideIcon;
  index: number;
  /** Render the price slot smaller (for a phrase like "По приглашению"). */
  priceCompact?: boolean;
  /** Renders the hand-drawn "Самый популярный!" arrow above the card. */
  mostPopular?: boolean;
  /**
   * CTA behaviour: a disabled button (the free tier everyone already has) or a
   * link to a target (Beta is invite-only → the help page).
   */
  cta: { kind: 'disabled' } | { kind: 'link'; href: string };
};

export function PlanCard({
  planKey,
  icon: Icon,
  index,
  priceCompact,
  mostPopular,
  cta,
}: PlanCardProps) {
  const t = useTranslations('pricing');
  const shouldReduceMotion = useReducedMotion();
  const features = t.raw(`plans.${planKey}.features`) as string[];
  const ctaLabel = t(`plans.${planKey}.cta`);

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: 'easeOut' }}
      className={cn('relative h-full', mostPopular && 'mt-20 lg:mt-0')}
    >
      {mostPopular ? (
        <div className="pointer-events-none absolute bottom-full left-5 mb-1.5">
          <MostPopularBadge />
        </div>
      ) : null}

      <Card className="h-full gap-0 rounded-2xl pt-8 shadow-lg shadow-foreground/5">
        <CardContent className="flex flex-1 flex-col items-center px-6">
          <div className="flex size-12 items-center justify-center rounded-lg bg-card shadow-xs ring-1 ring-foreground/10">
            <Icon className="size-5 text-brand" aria-hidden />
          </div>

          <h2 className="mt-4 font-heading text-lg font-semibold text-brand">
            {t(`plans.${planKey}.name`)}
          </h2>

          <div
            className={cn(
              'mt-2 font-heading font-bold tracking-tight text-foreground',
              priceCompact ? 'text-2xl md:text-3xl' : 'text-4xl',
            )}
          >
            {t(`plans.${planKey}.price`)}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {t(`plans.${planKey}.billed`)}
          </p>

          <ul className="mt-8 w-full space-y-4 pb-8">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/10">
                  <CheckIcon
                    className="size-3.5 text-brand"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                </span>
                <span className="text-sm leading-6 text-muted-foreground">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>

        <CardFooter className="p-6">
          {cta.kind === 'disabled' ? (
            <Button
              variant="outline"
              disabled
              className="h-11 w-full text-[15px] font-semibold"
            >
              {ctaLabel}
            </Button>
          ) : (
            <Button
              render={<Link href={cta.href} />}
              nativeButton={false}
              className="h-11 w-full text-[15px] font-semibold"
            >
              {ctaLabel}
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
