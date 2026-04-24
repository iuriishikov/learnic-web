'use client';

import { Accordion as AccordionPrimitive } from '@base-ui/react/accordion';
import { MinusCircleIcon, PlusCircleIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

type FaqItem = {
  question: string;
  answer: string;
};

type FaqListProps = {
  items: FaqItem[];
};

export function FaqList({ items }: FaqListProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      <AccordionPrimitive.Root
        defaultValue={[0]}
        className="flex w-full flex-col"
      >
        {items.map((item, index) => (
          <AccordionPrimitive.Item
            key={item.question}
            value={index}
            className="border-b border-border last:border-b-0"
          >
            <AccordionPrimitive.Header className="flex">
              <AccordionPrimitive.Trigger className="group/faq-trigger flex w-full items-start justify-between gap-6 rounded-lg py-6 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                <span className="text-base font-semibold text-foreground md:text-lg">
                  {item.question}
                </span>
                <span className="relative mt-0.5 size-6 shrink-0 text-muted-foreground transition-colors group-hover/faq-trigger:text-foreground">
                  <PlusCircleIcon
                    aria-hidden
                    className="absolute inset-0 size-full transition-opacity group-aria-expanded/faq-trigger:opacity-0"
                  />
                  <MinusCircleIcon
                    aria-hidden
                    className="absolute inset-0 size-full opacity-0 transition-opacity group-aria-expanded/faq-trigger:opacity-100"
                  />
                </span>
              </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>
            <AccordionPrimitive.Panel className="overflow-hidden text-sm data-open:animate-accordion-down data-closed:animate-accordion-up">
              <div className="h-(--accordion-panel-height) pb-6 pr-10 text-base leading-relaxed text-muted-foreground data-ending-style:h-0 data-starting-style:h-0">
                {item.answer}
              </div>
            </AccordionPrimitive.Panel>
          </AccordionPrimitive.Item>
        ))}
      </AccordionPrimitive.Root>
    </motion.div>
  );
}
