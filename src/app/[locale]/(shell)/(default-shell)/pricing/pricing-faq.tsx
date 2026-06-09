'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { Link } from '@/shared/config/i18n/navigation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/ui/accordion';

type FaqItem = {
  question: string;
  answer: string;
};

export function PricingFaq() {
  const t = useTranslations('pricing.faq');
  const shouldReduceMotion = useReducedMotion();
  const items = t.raw('items') as FaqItem[];

  return (
    <motion.section
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="grid grid-cols-1 gap-x-16 gap-y-8 lg:grid-cols-2"
    >
      <div className="lg:max-w-sm">
        <p className="text-sm font-semibold text-brand">{t('eyebrow')}</p>
        <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {t('title')}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          {t.rich('description', {
            chat: (chunks) => (
              <Link
                href="/help"
                className="font-medium text-foreground underline underline-offset-4 transition-colors hover:text-brand"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>

      <Accordion defaultValue={[0]}>
        {items.map((item, index) => (
          <AccordionItem
            key={item.question}
            value={index}
            // Closed items keep a straight hairline divider (base
            // `not-last:border-b`). Only the open item rounds into a soft card
            // and drops its divider — otherwise the rounded corners bend the
            // hairline into a stray outline. The item *above* an open one also
            // drops its divider, so no line floats over the card's top edge.
            className="border-border px-4 transition-colors data-open:rounded-2xl data-open:border-transparent data-open:bg-muted/50 [&:has(+[data-open])]:border-transparent md:px-5"
          >
            <AccordionTrigger className="py-5 md:text-base">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="pb-5 text-sm">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </motion.section>
  );
}
