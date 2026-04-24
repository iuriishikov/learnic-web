'use client';

import {
  CommandIcon,
  HeartHandshakeIcon,
  MessageCircleIcon,
  MessageSquareIcon,
  PieChartIcon,
  ZapIcon,
  type LucideIcon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

export type FeatureIconKey =
  | 'messageCircle'
  | 'zap'
  | 'pieChart'
  | 'messageSquare'
  | 'command'
  | 'heartHandshake';

const ICON_MAP: Record<FeatureIconKey, LucideIcon> = {
  messageCircle: MessageCircleIcon,
  zap: ZapIcon,
  pieChart: PieChartIcon,
  messageSquare: MessageSquareIcon,
  command: CommandIcon,
  heartHandshake: HeartHandshakeIcon,
};

type FeatureItemProps = {
  icon: FeatureIconKey;
  title: string;
  description: string;
  index: number;
};

export function FeatureItem({
  icon,
  title,
  description,
  index,
}: FeatureItemProps) {
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
      <div className="flex size-12 items-center justify-center rounded-xl border border-border bg-background shadow-sm">
        <Icon aria-hidden className="size-[22px] text-foreground" />
      </div>
      <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <p className="mt-2 max-w-[336px] text-base leading-relaxed text-muted-foreground">
        {description}
      </p>
    </motion.div>
  );
}
