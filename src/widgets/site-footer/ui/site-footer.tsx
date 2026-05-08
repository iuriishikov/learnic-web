import { getTranslations } from 'next-intl/server';

import { Link } from '@/shared/config/i18n/navigation';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { BrandMark } from '@/shared/ui/brand-mark';
import { ThemeToggle } from '@/shared/ui/theme-toggle';

import { NewsletterForm } from './newsletter-form';
import { SocialIcons } from './social-icons';

type FooterColumn = {
  title: string;
  items: Array<{ label: string; isNew?: boolean }>;
};

type SocialKey = 'x' | 'linkedin' | 'facebook' | 'github' | 'dribbble';
type SocialItem = { key: SocialKey; label: string };

export type SiteFooterVariant = 'purple' | 'white';

type SiteFooterProps = {
  variant?: SiteFooterVariant;
};

export async function SiteFooter({ variant = 'purple' }: SiteFooterProps = {}) {
  const t = await getTranslations('home.footer');
  const currentYear = new Date().getFullYear();
  const columns = t.raw('columns') as FooterColumn[];
  const socialItems = t.raw('social.items') as SocialItem[];

  const isPurple = variant === 'purple';

  const surfaceClasses = isPurple
    ? 'bg-[#5C45D1] text-brand-foreground'
    : 'bg-background text-foreground';

  const newsletterSurfaceClasses = isPurple
    ? 'bg-[#5C45D1]'
    : 'bg-secondary dark:bg-card';

  const dividerClasses = isPurple
    ? 'border-brand-foreground/15'
    : 'border-border';

  const headlineToneClasses = isPurple
    ? 'text-brand-foreground'
    : 'text-foreground';

  const subduedToneClasses = isPurple
    ? 'text-brand-foreground/70'
    : 'text-muted-foreground';

  const linkToneClasses = isPurple
    ? 'text-brand-foreground hover:text-brand-foreground/80'
    : 'text-foreground hover:text-brand';

  const newBadgeClasses = isPurple
    ? 'border-brand-foreground/30 text-brand-foreground/90'
    : 'border-border text-muted-foreground';

  const themeToggleClasses = isPurple
    ? 'text-brand-foreground/70 hover:bg-brand-foreground/10 hover:text-brand-foreground aria-expanded:bg-brand-foreground/10 aria-expanded:text-brand-foreground dark:hover:bg-brand-foreground/10'
    : 'text-muted-foreground hover:text-foreground';

  return (
    <footer className={cn('w-full', surfaceClasses)}>
      <div className={newsletterSurfaceClasses}>
        <div className="mx-auto w-full max-w-[1216px] px-4 py-12 md:px-6 md:py-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-10">
            <div className="flex flex-col gap-3">
              <h2
                className={cn(
                  'text-2xl font-semibold leading-tight tracking-tight md:text-[32px] md:leading-[1.15]',
                  headlineToneClasses,
                )}
              >
                {t('newsletter.title')}
              </h2>
              <p
                className={cn(
                  'max-w-[520px] text-base leading-relaxed',
                  subduedToneClasses,
                )}
              >
                {t('newsletter.description')}
              </p>
            </div>
            <NewsletterForm variant={variant} />
          </div>
        </div>
      </div>

      <div className={cn('border-t', dividerClasses)} />

      <div className="mx-auto w-full max-w-[1216px] px-4 py-12 md:px-6 md:py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[300px_1fr] lg:gap-16">
          <div className="flex flex-col gap-6">
            <Link
              href="/"
              aria-label={t('brand')}
              className="inline-flex w-fit"
            >
              <BrandMark
                label={t('brand')}
                size="md"
                tone={isPurple ? 'light' : 'dark'}
              />
            </Link>
            <p
              className={cn(
                'max-w-[280px] text-base leading-relaxed',
                subduedToneClasses,
              )}
            >
              {t('tagline')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-5">
            {columns.map((column) => (
              <div key={column.title} className="flex flex-col gap-4">
                <h3
                  className={cn(
                    'text-sm font-medium',
                    subduedToneClasses,
                  )}
                >
                  {column.title}
                </h3>
                <ul className="flex flex-col gap-3">
                  {column.items.map((item) => (
                    <li key={item.label}>
                      <a
                        href="#"
                        className={cn(
                          'inline-flex items-center gap-2 text-sm font-semibold transition-colors',
                          linkToneClasses,
                        )}
                      >
                        {item.label}
                        {item.isNew ? (
                          <Badge
                            variant="outline"
                            className={cn(
                              'h-[18px] rounded-md px-1.5 text-[10px]',
                              newBadgeClasses,
                            )}
                          >
                            {t('newBadge')}
                          </Badge>
                        ) : null}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className={cn('mt-12 border-t md:mt-16', dividerClasses)} />

        <div className="flex flex-col gap-6 pt-8 md:flex-row md:items-center md:justify-between">
          <p className={cn('text-sm', subduedToneClasses)}>
            {t('copyright', { year: currentYear })}
          </p>
          <div className="flex items-center gap-4 md:gap-6">
            <SocialIcons
              items={socialItems}
              variant={variant}
              label={t('social.label')}
            />
            <ThemeToggle className={themeToggleClasses} />
          </div>
        </div>
      </div>
    </footer>
  );
}
