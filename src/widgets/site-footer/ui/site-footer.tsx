'use client';

import { useTranslations } from 'next-intl';

import { Link } from '@/shared/config/i18n/navigation';
import { BrandMark } from '@/shared/ui/brand-mark';

type FooterLink = { label: string; href: string };

export function SiteFooter() {
  const t = useTranslations('home.footer');
  const currentYear = new Date().getFullYear();
  const nav = t.raw('nav') as FooterLink[];
  const legal = t.raw('legal') as FooterLink[];

  return (
    <footer className="w-full bg-background text-foreground">
      <div className="mx-auto w-full max-w-[1216px] px-4 py-12 md:px-6 md:py-16">
        <div className="flex flex-col items-center gap-8 md:gap-10">
          <Link
            href="/"
            aria-label={t('brand')}
            className="inline-flex w-fit"
          >
            <BrandMark label={t('brand')} size="md" tone="dark" />
          </Link>
          <nav aria-label={t('navLabel')}>
            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 md:gap-x-8">
              {nav.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 border-t border-border md:mt-16" />

        <div className="flex flex-col items-center gap-4 pt-8 md:flex-row md:justify-between md:gap-6">
          <p className="text-sm text-muted-foreground">
            {t('copyright', { year: currentYear })}
          </p>
          <ul
            aria-label={t('legalLabel')}
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
          >
            {legal.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
