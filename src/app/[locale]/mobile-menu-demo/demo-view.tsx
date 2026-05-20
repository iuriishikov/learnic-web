'use client';

import { ChevronDownIcon, SettingsIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Link } from '@/shared/config/i18n/navigation';
import { cn } from '@/shared/lib/utils';
import { BrandMark } from '@/shared/ui/brand-mark';
import { Button } from '@/shared/ui/button';
import {
  MobileMenu,
  MobileMenuBody,
  MobileMenuContent,
  MobileMenuFooter,
  MobileMenuHeader,
  MobileMenuTrigger,
} from '@/shared/ui/mobile-menu';
import { Separator } from '@/shared/ui/separator';

type NavItem = { key: string; hasMenu: boolean };

const NAV_ITEMS: NavItem[] = [
  { key: 'products', hasMenu: true },
  { key: 'services', hasMenu: true },
  { key: 'pricing', hasMenu: false },
  { key: 'resources', hasMenu: true },
  { key: 'about', hasMenu: false },
];

const APP_NAV_ITEMS = [
  { key: 'home', href: '/' },
  { key: 'library', href: '#' },
  { key: 'activity', href: '#' },
  { key: 'pricing', href: '#' },
];

const FOOTER_COLUMNS: { items: string[] }[] = [
  { items: ['aboutUs', 'press', 'careers', 'legal'] },
  { items: ['support', 'contact', 'sitemap', 'cookie'] },
];

export function MobileMenuDemoView() {
  const t = useTranslations('mobile-menu-demo');

  return (
    <main className="mx-auto flex w-full max-w-[1100px] flex-col gap-8 px-4 py-10 md:px-8 md:py-14">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
          {t('title')}
        </h1>
        <p className="max-w-3xl text-base text-muted-foreground">
          {t('description')}
        </p>
      </header>

      <DemoCard title={t('sections.marketing.title')} description={t('sections.marketing.description')}>
        <MarketingFauxHeader />
      </DemoCard>

      <DemoCard title={t('sections.app.title')} description={t('sections.app.description')}>
        <AppFauxHeader />
      </DemoCard>

      <DemoCard title={t('sections.light.title')} description={t('sections.light.description')}>
        <LightToneFauxHero />
      </DemoCard>

      <ApiBlock />
    </main>
  );
}

// ───────────────────────────────────────────────────────────────────────
// Demos

function MarketingFauxHeader() {
  const t = useTranslations('mobile-menu-demo');
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-background/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between rounded-2xl px-3">
        <Link href="/" aria-label={t('brand')} className="inline-flex items-center">
          <BrandMark label={t('brand')} size="md" />
        </Link>

        <MobileMenu open={open} onOpenChange={setOpen}>
          <MobileMenuTrigger
            aria-label={t('openMenu')}
            hideFrom="none"
          />
          <MobileMenuContent srTitle={t('openMenu')}>
            <MobileMenuHeader closeAriaLabel={t('closeMenu')}>
              <Link
                href="/"
                aria-label={t('brand')}
                className="inline-flex items-center"
                onClick={() => setOpen(false)}
              >
                <BrandMark label={t('brand')} size="md" />
              </Link>
            </MobileMenuHeader>

            <MobileMenuBody>
              <nav className="flex flex-col px-2 py-3">
                {NAV_ITEMS.map((item) => (
                  <MarketingNavRow
                    key={item.key}
                    label={t(`nav.${item.key}`)}
                    hasMenu={item.hasMenu}
                    onClick={() => setOpen(false)}
                  />
                ))}
              </nav>

              <Separator />

              <div className="grid grid-cols-2 gap-x-6 gap-y-3 px-5 py-5">
                {FOOTER_COLUMNS.map((col, ci) => (
                  <ul key={ci} className="flex flex-col gap-3">
                    {col.items.map((labelKey) => (
                      <li key={labelKey}>
                        <a
                          href="#"
                          onClick={() => setOpen(false)}
                          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {t(`footer.${labelKey}`)}
                        </a>
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </MobileMenuBody>

            <MobileMenuFooter>
              <Button
                className="h-11 w-full rounded-lg bg-brand text-[15px] font-medium text-brand-foreground hover:bg-brand/90"
                onClick={() => setOpen(false)}
              >
                {t('signUp')}
              </Button>
              <Button
                variant="outline"
                className="h-11 w-full rounded-lg text-[15px] font-medium"
                onClick={() => setOpen(false)}
              >
                {t('logIn')}
              </Button>
            </MobileMenuFooter>
          </MobileMenuContent>
        </MobileMenu>
      </div>
    </div>
  );
}

function MarketingNavRow({
  label,
  hasMenu,
  onClick,
}: {
  label: string;
  hasMenu: boolean;
  onClick: () => void;
}) {
  return (
    <a
      href="#"
      onClick={onClick}
      className={cn(
        'flex items-center justify-between rounded-lg px-3 py-3 text-base font-semibold text-foreground no-underline',
        'transition-colors hover:bg-muted hover:no-underline',
      )}
    >
      <span>{label}</span>
      {hasMenu ? (
        <ChevronDownIcon className="size-5 shrink-0 text-muted-foreground" />
      ) : null}
    </a>
  );
}

function AppFauxHeader() {
  const t = useTranslations('mobile-menu-demo');
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-border bg-background">
      <div className="flex h-[72px] items-center justify-between px-4">
        <Link href="/" aria-label={t('brand')} className="inline-flex items-center">
          <BrandMark label={t('brand')} size="sm" />
        </Link>

        <MobileMenu open={open} onOpenChange={setOpen}>
          <MobileMenuTrigger
            aria-label={t('openMenu')}
            hideFrom="none"
          />
          <MobileMenuContent
            srTitle={t('openMenu')}
            className="data-[side=right]:sm:max-w-sm"
          >
            <MobileMenuHeader closeAriaLabel={t('closeMenu')}>
              <BrandMark label={t('brand')} size="md" />
            </MobileMenuHeader>

            <MobileMenuBody className="px-2 py-3">
              <nav className="flex flex-col">
                {APP_NAV_ITEMS.map((item) => (
                  <a
                    key={item.key}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted no-underline hover:no-underline"
                  >
                    {t(`appNav.${item.key}`)}
                  </a>
                ))}
              </nav>
              <div className="mt-4">
                <Button
                  variant="outline"
                  className="h-11 w-full justify-center gap-2 rounded-lg text-[15px] font-medium"
                  onClick={() => setOpen(false)}
                >
                  <SettingsIcon className="size-4" />
                  {t('settings')}
                </Button>
              </div>
            </MobileMenuBody>
          </MobileMenuContent>
        </MobileMenu>
      </div>
    </div>
  );
}

function LightToneFauxHero() {
  const t = useTranslations('mobile-menu-demo');
  const [open, setOpen] = useState(false);

  return (
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-brand">
      <div className="flex h-16 items-center justify-between px-3">
        <BrandMark label={t('brand')} size="md" tone="light" />

        <MobileMenu open={open} onOpenChange={setOpen}>
          <MobileMenuTrigger
            aria-label={t('openMenu')}
            tone="light"
            hideFrom="none"
          />
          <MobileMenuContent srTitle={t('openMenu')}>
            <MobileMenuHeader closeAriaLabel={t('closeMenu')}>
              <BrandMark label={t('brand')} size="md" />
            </MobileMenuHeader>
            <MobileMenuBody className="px-5 py-6">
              <p className="text-sm text-muted-foreground">
                {t('sections.light.bodyHint')}
              </p>
            </MobileMenuBody>
          </MobileMenuContent>
        </MobileMenu>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// API block

function ApiBlock() {
  const t = useTranslations('mobile-menu-demo.api');
  const rows: { name: string; desc: string }[] = [
    { name: 'MobileMenu', desc: t('rows.root') },
    { name: 'MobileMenuTrigger', desc: t('rows.trigger') },
    { name: 'MobileMenuContent', desc: t('rows.content') },
    { name: 'MobileMenuHeader', desc: t('rows.header') },
    { name: 'MobileMenuBody', desc: t('rows.body') },
    { name: 'MobileMenuFooter', desc: t('rows.footer') },
    { name: 'MobileMenuClose', desc: t('rows.close') },
  ];

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
      <header className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">{t('title')}</h3>
        <p className="text-sm text-muted-foreground">{t('description')}</p>
      </header>
      <ul className="flex flex-col divide-y divide-border">
        {rows.map((row) => (
          <li
            key={row.name}
            className="grid grid-cols-1 gap-1 py-3 md:grid-cols-[220px_1fr] md:gap-6"
          >
            <code className="font-mono text-sm font-medium text-foreground">
              {row.name}
            </code>
            <p className="text-sm text-muted-foreground">{row.desc}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ───────────────────────────────────────────────────────────────────────
// Card wrapper (matches other demo pages)

function DemoCard({
  title,
  description,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
      <header className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </header>
      <div className="flex flex-col items-stretch gap-4">{children}</div>
    </section>
  );
}
