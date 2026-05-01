'use client';

import {
  CheckIcon,
  CopyIcon,
  EllipsisIcon,
  MailIcon,
  MessageSquareIcon,
  PencilIcon,
  PlusIcon,
  UploadCloudIcon,
  UserPlusIcon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Input } from '@/shared/ui/input';

import { coverGradient, hueFromId } from '../lib/cover-hue';
import type { Product } from '../model/types';

const SECTION_KEYS = ['brief', 'goals', 'timeline', 'about', 'notes'] as const;
type SectionKey = (typeof SECTION_KEYS)[number];

type ProductEditorViewProps = {
  product: Product;
};

export function ProductEditorView({ product }: ProductEditorViewProps) {
  const t = useTranslations('teach-products.editor');
  const reduceMotion = useReducedMotion();

  const [activeSection, setActiveSection] = useState<SectionKey>('brief');
  const [emails, setEmails] = useState<string[]>(['', '']);
  const [copied, setCopied] = useState(false);

  const cover = coverGradient(product.id);
  const baseHue = hueFromId(product.id);

  const galleryHues = useMemo(
    () => [
      (baseHue + 25) % 360,
      (baseHue + 285) % 360,
      (baseHue + 130) % 360,
    ],
    [baseHue],
  );

  const onAddEmail = useCallback(() => {
    setEmails((prev) => [...prev, '']);
  }, []);

  const onChangeEmail = useCallback((index: number, value: string) => {
    setEmails((prev) => prev.map((email, i) => (i === index ? value : email)));
  }, []);

  const onCopyLink = useCallback(async () => {
    const link = t('share.linkValue');
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore — clipboard is best-effort
    }
  }, [t]);

  const titleText = product.title.trim().length > 0 ? product.title : t('untitled');

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-6 md:px-8 md:py-8">
      {/* Cover */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
        className="relative h-32 w-full overflow-hidden rounded-2xl ring-1 ring-foreground/5 md:h-44 lg:h-56"
        style={{ backgroundImage: cover }}
        aria-hidden
      />

      {/* Header */}
      <header className="mt-5 flex flex-col gap-3 md:mt-6 md:flex-row md:items-center md:justify-between md:gap-6">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground md:text-3xl lg:text-[28px]">
          {titleText}
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="lg" className="gap-1.5">
            <MessageSquareIcon /> {t('actions.messages')}
          </Button>
          <Button size="lg" className="gap-1.5 bg-brand text-brand-foreground hover:bg-brand/90">
            <PencilIcon /> {t('actions.edit')}
          </Button>
        </div>
      </header>

      <div className="mt-5 border-t border-border md:mt-6" />

      {/* Body */}
      <div className="mt-5 grid grid-cols-1 gap-6 md:mt-7 lg:grid-cols-[160px_minmax(0,1fr)_320px] lg:gap-8">
        {/* Sidebar nav (desktop) */}
        <aside className="hidden lg:block">
          <nav aria-label={t('overview.title')} className="sticky top-24">
            <ul className="flex flex-col gap-1 text-sm">
              {SECTION_KEYS.map((key) => {
                const active = activeSection === key;
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => setActiveSection(key)}
                      className={cn(
                        'w-full rounded-md px-2.5 py-1.5 text-left transition-colors',
                        active
                          ? 'bg-muted font-semibold text-foreground'
                          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                      )}
                    >
                      {t(`sections.${key}`)}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <main className="min-w-0">
          {/* Overview header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1">
              <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
                {t('overview.title')}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t('overview.description')}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t('actions.more')}
                    className="-mr-1 shrink-0 text-muted-foreground"
                  />
                }
              >
                <EllipsisIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem>
                  <PencilIcon /> {t('actions.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <PlusIcon /> {t('actions.addSection')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile/tablet horizontal tabs */}
          <div className="-mx-4 mt-5 overflow-x-auto px-4 lg:hidden [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            <div className="flex w-max gap-1 border-b border-border">
              {SECTION_KEYS.map((key) => {
                const active = activeSection === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveSection(key)}
                    className={cn(
                      'relative px-3 pb-2.5 text-sm font-medium transition-colors',
                      active
                        ? 'text-brand'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {t(`sections.${key}`)}
                    {active ? (
                      <motion.span
                        layoutId="editor-tab-underline"
                        className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Summary box */}
          <div className="mt-5 rounded-xl bg-muted/50 p-4 text-sm leading-relaxed text-foreground/80 md:mt-6">
            {t('summary')}
          </div>

          {/* About block */}
          <section className="mt-7 flex flex-col gap-3">
            <h3 className="font-heading text-base font-semibold tracking-tight text-foreground">
              {t('blocks.about.title')}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t('blocks.about.intro')}
            </p>
            <ul className="ml-5 list-disc space-y-1.5 text-sm leading-relaxed text-muted-foreground marker:text-muted-foreground/60">
              {[0, 1, 2, 3].map((i) => (
                <li key={i}>{t(`blocks.about.bullets.${i}`)}</li>
              ))}
            </ul>
          </section>

          {/* Media gallery */}
          <section className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
            {galleryHues.map((hue, i) => (
              <div
                key={i}
                className="aspect-[4/3] overflow-hidden rounded-xl ring-1 ring-foreground/5"
                style={{
                  backgroundImage: `linear-gradient(135deg, oklch(0.78 0.14 ${hue}) 0%, oklch(0.55 0.2 ${(hue + 40) % 360}) 100%)`,
                }}
                aria-hidden
              />
            ))}
            <UploadCard />
          </section>

          {/* Audience block */}
          <section className="mt-7 flex flex-col gap-3">
            <h3 className="font-heading text-base font-semibold tracking-tight text-foreground">
              {t('blocks.audience.title')}
            </h3>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {t('blocks.audience.body')}
            </p>
          </section>

          {/* Success block */}
          <section className="mt-7 flex flex-col gap-3">
            <h3 className="font-heading text-base font-semibold tracking-tight text-foreground">
              {t('blocks.success.title')}
            </h3>
            <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {t('blocks.success.body')}
            </p>
          </section>

          {/* Add section */}
          <div className="mt-8 flex justify-center border-t border-border pt-6">
            <Button variant="ghost" size="lg" className="gap-1.5 text-muted-foreground">
              <PlusIcon /> {t('actions.addSection')}
            </Button>
          </div>
        </main>

        {/* Right rail */}
        <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
          {/* Share card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="font-heading text-sm font-semibold tracking-tight text-foreground">
              {t('share.title')}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {t('share.description')}
            </p>
            <label className="mt-4 block text-xs font-medium text-foreground">
              {t('share.linkLabel')}
            </label>
            <div className="mt-1.5 flex items-center gap-1.5">
              <Input
                readOnly
                value={t('share.linkValue')}
                className="h-9 flex-1 text-sm"
              />
              <Button
                variant="outline"
                size="icon-lg"
                aria-label={t('share.copy')}
                onClick={onCopyLink}
                className="shrink-0"
              >
                {copied ? <CheckIcon className="text-brand" /> : <CopyIcon />}
              </Button>
            </div>
          </div>

          {/* Invite card */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex size-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <UserPlusIcon className="size-4" />
            </div>
            <h3 className="mt-3 font-heading text-sm font-semibold tracking-tight text-foreground">
              {t('invite.title')}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {t('invite.description')}
            </p>
            <label className="mt-4 block text-xs font-medium text-foreground">
              {t('invite.emailLabel')}
            </label>
            <div className="mt-1.5 flex flex-col gap-2">
              {emails.map((email, i) => (
                <div key={i} className="relative">
                  <MailIcon
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => onChangeEmail(i, event.target.value)}
                    placeholder={t('invite.emailPlaceholder')}
                    className="h-9 pl-8 text-sm"
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={onAddEmail}
              className="mt-2.5 inline-flex items-center gap-1 text-sm font-medium text-brand transition-colors hover:text-brand/80"
            >
              <PlusIcon className="size-4" /> {t('invite.addAnother')}
            </button>
            <div className="mt-5 flex items-center gap-2">
              <Button variant="outline" size="lg" className="flex-1">
                {t('invite.cancel')}
              </Button>
              <Button
                size="lg"
                className="flex-1 bg-brand text-brand-foreground hover:bg-brand/90"
              >
                {t('invite.confirm')}
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function UploadCard() {
  const t = useTranslations('teach-products.editor.upload');
  return (
    <button
      type="button"
      className={cn(
        'group/upload flex aspect-[4/3] flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-card text-center transition-colors',
        'hover:border-brand/40 hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      )}
    >
      <div className="flex size-9 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground group-hover/upload:border-brand/40 group-hover/upload:text-brand">
        <UploadCloudIcon className="size-4" />
      </div>
      <p className="text-sm">
        <span className="font-medium text-brand">{t('title')}</span>{' '}
        <span className="text-muted-foreground">{t('subtitle')}</span>
      </p>
      <p className="text-xs text-muted-foreground">{t('hint')}</p>
    </button>
  );
}
