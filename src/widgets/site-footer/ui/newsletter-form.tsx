'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

type NewsletterFormProps = {
  variant?: 'purple' | 'white';
  className?: string;
};

export function NewsletterForm({
  variant = 'purple',
  className,
}: NewsletterFormProps) {
  const t = useTranslations('home.footer.newsletter');
  const [email, setEmail] = useState('');

  const isPurple = variant === 'purple';

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
      }}
      className={cn(
        'flex w-full flex-col gap-3 sm:flex-row sm:items-center md:w-auto',
        className,
      )}
    >
      <label htmlFor="footer-newsletter-email" className="sr-only">
        {t('emailLabel')}
      </label>
      <Input
        id="footer-newsletter-email"
        type="email"
        autoComplete="email"
        required
        placeholder={t('emailPlaceholder')}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={cn(
          'h-12 w-full rounded-lg px-4 text-base md:w-[280px]',
          isPurple
            ? 'border-transparent bg-card text-foreground placeholder:text-muted-foreground focus-visible:border-brand-foreground/40 focus-visible:ring-brand-foreground/20 dark:border-transparent dark:bg-card'
            : 'border-input bg-background text-foreground placeholder:text-muted-foreground',
        )}
      />
      <Button
        type="submit"
        className={cn(
          'h-12 w-full shrink-0 rounded-lg px-5 text-base font-medium sm:w-auto',
          isPurple
            ? 'bg-brand-500 text-brand-foreground hover:bg-brand-400'
            : 'bg-brand text-brand-foreground hover:bg-brand/90',
        )}
      >
        {t('subscribe')}
      </Button>
    </form>
  );
}
