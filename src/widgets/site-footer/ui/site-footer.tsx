'use client';

import { motion, useReducedMotion, type Variants } from 'motion/react';
import { useTranslations } from 'next-intl';

import { Link } from '@/shared/config/i18n/navigation';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { BrandMark } from '@/shared/ui/brand-mark';

type FooterLink = { label: string; href: string; badge?: string };
type FooterColumn = { heading: string; links: FooterLink[] };

type SiteFooterProps = {
  className?: string;
};

export function SiteFooter({ className }: SiteFooterProps) {
  const t = useTranslations('home.footer');
  const reduceMotion = useReducedMotion();
  const currentYear = new Date().getFullYear();
  const columns = t.raw('columns') as FooterColumn[];

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduceMotion ? 0 : 0.06 } },
  };
  const item: Variants = reduceMotion
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 8 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
        },
      };

  return (
    <footer className={cn('w-full bg-background text-foreground', className)}>
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-10% 0px' }}
        variants={container}
        className="mx-auto w-full max-w-[1216px] px-4 py-12 md:px-6 md:py-16"
      >
        {/* Brand + navigation columns */}
        <div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-between md:gap-8">
          <motion.div variants={item}>
            <Link
              href="/"
              aria-label={t('brand')}
              className="inline-flex w-fit"
            >
              <BrandMark label={t('brand')} size="md" tone="dark" />
            </Link>
          </motion.div>

          <nav
            aria-label={t('navLabel')}
            className="grid grid-cols-2 gap-x-8 gap-y-10 md:flex md:gap-12 lg:gap-24"
          >
            {columns.map((column) => (
              <motion.div
                key={column.heading}
                variants={item}
                className="flex flex-col gap-3"
              >
                <h2 className="mb-1 text-xs font-semibold text-muted-foreground">
                  {column.heading}
                </h2>
                <ul className="flex flex-col gap-3">
                  {column.links.map((link) => (
                    <li key={link.label} className="flex items-center gap-2">
                      <a
                        href={link.href}
                        className="text-sm font-semibold text-foreground/80 transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                      {link.badge ? (
                        <Badge variant="outline" className="rounded-md">
                          {link.badge}
                        </Badge>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </nav>
        </div>

        {/* Divider */}
        <motion.div
          variants={item}
          className="my-12 border-t border-border md:my-16"
        />

        {/* Tagline + copyright */}
        <motion.div
          variants={item}
          className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-8"
        >
          <div className="flex flex-col gap-2">
            <h2 className="text-base font-semibold text-foreground">
              {t('cta.title')}
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              {t('cta.description')}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('copyright', { year: currentYear })}
          </p>
        </motion.div>
      </motion.div>
    </footer>
  );
}
