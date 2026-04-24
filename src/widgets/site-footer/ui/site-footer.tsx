import { getTranslations } from 'next-intl/server';

import { Link } from '@/shared/config/i18n/navigation';
import { Badge } from '@/shared/ui/badge';
import { BrandMark } from '@/shared/ui/brand-mark';
import { Separator } from '@/shared/ui/separator';
import { ThemeToggle } from '@/shared/ui/theme-toggle';

type FooterColumn = {
  title: string;
  items: Array<{ label: string; isNew?: boolean }>;
};

export async function SiteFooter() {
  const t = await getTranslations('home.footer');
  const currentYear = new Date().getFullYear();
  const columns = t.raw('columns') as FooterColumn[];

  return (
    <footer className="w-full">
      <div className="mx-auto w-full max-w-[1216px] px-4 md:px-6">
        <Separator />
        <div className="pt-12 md:pt-16">
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-6">
            {columns.map((column) => (
              <div key={column.title} className="flex flex-col gap-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {column.title}
                </h3>
                <ul className="flex flex-col gap-3">
                  {column.items.map((item) => (
                    <li key={item.label}>
                      <a
                        href="#"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-brand"
                      >
                        {item.label}
                        {item.isNew ? (
                          <Badge
                            variant="outline"
                            className="h-[18px] rounded-md px-1.5 text-[10px] text-muted-foreground"
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

        <Separator className="mt-12 md:mt-16" />
        <div className="flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between">
          <Link href="/" aria-label={t('brand')}>
            <BrandMark label={t('brand')} size="sm" />
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <p className="text-sm text-muted-foreground">
              {t('copyright', { year: currentYear })}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
