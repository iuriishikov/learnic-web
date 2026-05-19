import { ArrowRightIcon, GraduationCapIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/shared/config/i18n/navigation';
import { cn } from '@/shared/lib/utils';

type TeachButtonProps = {
  /** Override the default destination if the studio root path is different in your app. */
  href?: string;
  className?: string;
};

/**
 * Compact brand CTA that pulls the user from the learn shell into the teach shell.
 *
 * `GraduationCap` sits on the left; on hover/focus an `ArrowRight` slides in
 * from the right rail and the button gains a touch of right padding to host it.
 * No glow, no shine, no sparkles — the rail is the entire effect.
 */
export function TeachButton({ href = '/products', className }: TeachButtonProps) {
  const t = useTranslations('learn-shell.teachButton');

  return (
    <Link
      href={href}
      aria-label={t('label')}
      className={cn(
        'group/teach-button relative inline-flex h-10 shrink-0 items-center gap-2 overflow-hidden rounded-lg bg-brand pr-3 pl-3 text-sm font-semibold whitespace-nowrap text-brand-foreground outline-none transition-[padding,background-color,transform] duration-200 ease-out',
        'hover:bg-brand/90 hover:pr-8',
        'focus-visible:bg-brand/90 focus-visible:pr-8 focus-visible:ring-3 focus-visible:ring-brand/40',
        'active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100',
        className,
      )}
    >
      <GraduationCapIcon className="size-4" aria-hidden />
      <span>{t('label')}</span>
      <ArrowRightIcon
        aria-hidden
        className="pointer-events-none absolute right-2 size-4 -translate-x-1 opacity-0 transition-[opacity,transform] duration-200 ease-out group-hover/teach-button:translate-x-0 group-hover/teach-button:opacity-100 group-focus-visible/teach-button:translate-x-0 group-focus-visible/teach-button:opacity-100 motion-reduce:transition-none"
      />
    </Link>
  );
}
