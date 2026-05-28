'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { Placeholder } from '@/shared/ui/placeholder';

import { ContactForm } from './contact-form';

export function ContactSection({ contactEmail }: { contactEmail: string }) {
  const t = useTranslations('contact');
  const reduce = useReducedMotion();

  return (
    <section className="w-full py-12 md:py-16 lg:py-20">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="mx-auto flex w-full max-w-xl flex-col lg:mx-0">
            <motion.header
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="mb-8 lg:mb-10"
            >
              <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                {t('title')}
              </h1>
              <p className="mt-3 text-base text-muted-foreground md:text-lg">
                {t('subtitle')}
              </p>
            </motion.header>

            <ContactForm contactEmail={contactEmail} />
          </div>

          <motion.div
            aria-hidden
            initial={reduce ? false : { opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative hidden min-h-[480px] overflow-hidden rounded-2xl lg:block"
          >
            <Placeholder
              variant="brand"
              seed="contact-illustration"
              sizes="(min-width: 1024px) 50vw, 0px"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
