'use client';

import {
  FlagIcon,
  HeartIcon,
  MessageCircleIcon,
  SettingsIcon,
  SmileIcon,
  SparklesIcon,
  type LucideIcon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

export type CoreValueIconKey =
  | 'smile'
  | 'heart'
  | 'sparkles'
  | 'messageCircle'
  | 'flag'
  | 'settings';

const ICON_MAP: Record<CoreValueIconKey, LucideIcon> = {
  smile: SmileIcon,
  heart: HeartIcon,
  sparkles: SparklesIcon,
  messageCircle: MessageCircleIcon,
  flag: FlagIcon,
  settings: SettingsIcon,
};

type CoreValueItemProps = {
  icon: CoreValueIconKey;
  title: string;
  description: string;
  index: number;
};

export function CoreValueItem({
  icon,
  title,
  description,
  index,
}: CoreValueItemProps) {
  const shouldReduceMotion = useReducedMotion();
  const Icon = ICON_MAP[icon];

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: 'easeOut' }}
      className="flex flex-col items-center text-center"
    >
      <div className="flex size-12 items-center justify-center rounded-xl bg-brand">
        <Icon aria-hidden className="size-6 text-brand-foreground" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 max-w-[360px] text-base leading-relaxed text-muted-foreground">
        {description}
      </p>
    </motion.div>
  );
}
