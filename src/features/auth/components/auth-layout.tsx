import type { ReactNode } from 'react';

import { Link } from '@/shared/config/i18n/navigation';
import { cn } from '@/shared/lib/utils';
import { BrandMark } from '@/shared/ui/brand-mark';
import { Placeholder } from '@/shared/ui/placeholder';

type AuthLayoutProps = {
  brandLabel: string;
  title: string;
  description: string;
  footer: ReactNode;
  children: ReactNode;
};

export function AuthLayout({
  brandLabel,
  title,
  description,
  footer,
  children,
}: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen w-screen bg-background">
      <div className="flex w-full flex-col lg:w-1/2">
        <header className="px-6 pt-6 md:px-10 md:pt-10">
          <Link href="/" aria-label={brandLabel} className="inline-flex">
            <BrandMark label={brandLabel} size="md" />
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center px-6 py-10 md:px-10">
          <div className="flex w-full max-w-[360px] flex-col gap-8">
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-[30px]">
                {title}
              </h1>
              <p className="text-[15px] text-muted-foreground">{description}</p>
            </div>
            {children}
            <p className="text-center text-[15px] text-muted-foreground">
              {footer}
            </p>
          </div>
        </main>
      </div>

      <aside
        aria-hidden
        className={cn(
          'relative hidden w-1/2 overflow-hidden lg:block',
        )}
      >
        <Placeholder
          variant="brand"
          seed="auth-side-panel"
          priority
          sizes="(min-width: 1024px) 50vw, 0px"
        />
      </aside>
    </div>
  );
}
