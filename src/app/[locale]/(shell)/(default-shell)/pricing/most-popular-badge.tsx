'use client';

import { useTranslations } from 'next-intl';

/**
 * Hand-drawn "Most popular!" annotation — a swooping arrow pointing down at
 * the card it decorates. Positioned by the parent (absolute, above the card).
 */
export function MostPopularBadge() {
  const t = useTranslations('pricing');

  return (
    <div className="flex items-start gap-1.5 text-brand">
      <svg
        viewBox="0 0 56 56"
        fill="none"
        className="mt-4 size-12 shrink-0"
        aria-hidden
      >
        <path
          d="M50 7C32 9 15 20 10.5 45"
          stroke="currentColor"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path
          d="M3.5 33.5 10.5 45 22 40.5"
          stroke="currentColor"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-heading text-xl font-extrabold tracking-tight whitespace-nowrap">
        {t('mostPopular')}
      </span>
    </div>
  );
}
