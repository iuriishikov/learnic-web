'use client';

import {
  BarChart3Icon,
  ShieldCheckIcon,
  SparklesIcon,
  type LucideIcon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { cn } from '@/shared/lib/utils';
import { Placeholder } from '@/shared/ui/placeholder';

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
        'relative isolate hidden overflow-hidden p-5 md:flex md:flex-col md:gap-3',
        className,
      )}
      aria-hidden="true"
    >
      <div className="absolute inset-0 -z-10">
        <Placeholder
          variant="brand"
          seed={`create-product-${productType}`}
          sizes="280px"
        />
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

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
