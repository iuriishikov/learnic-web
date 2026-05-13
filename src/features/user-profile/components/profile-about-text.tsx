'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { cn } from '@/shared/lib/utils';

type ProfileAboutTextProps = {
  /** Sanitized HTML returned by `/users/{user_id}`. */
  html: string | null;
  className?: string;
};


export function ProfileAboutText({ html, className }: ProfileAboutTextProps) {
  const t = useTranslations('user-profile.about');
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const [overflows, setOverflows] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Measure after every layout pass to decide whether the collapse
  // toggle is worth showing — short bios shouldn't grow a "Read more"
  // button that does nothing.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const expandedNow = el.dataset.expanded === 'true';
      if (expandedNow) return;
      setOverflows(el.scrollHeight > el.clientHeight + 2);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [html]);

  if (!html) return null;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <motion.div
        ref={ref}
        data-expanded={expanded ? 'true' : 'false'}
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: 'easeOut' }}
        className={cn(
          'text-sm leading-relaxed text-foreground/85 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-brand/80',
          !expanded && 'line-clamp-6',
        )}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {overflows || expanded ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="self-start text-sm font-semibold text-brand transition-colors hover:text-brand/80 focus-visible:rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {expanded ? t('readLess') : t('readMore')}
        </button>
      ) : null}
    </div>
  );
}
