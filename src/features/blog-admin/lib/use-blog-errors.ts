'use client';

import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { toast } from 'sonner';

import type { BlogFailReason } from '../api/_shared';

/**
 * Maps a `BlogFailReason` to a localized toast. Field-level reasons that a
 * form can attach inline (e.g. `slug-taken` on the slug input) are handled
 * by the caller; this is the catch-all for everything surfaced as a toast.
 */
export function useBlogErrorToast(): (reason: BlogFailReason) => void {
  const t = useTranslations('blog-admin');
  return useCallback(
    (reason: BlogFailReason) => {
      const key = `errors.${reason}` as const;
      // next-intl returns the key path if missing; fall back to the generic.
      const message = t.has(key) ? t(key) : t('errors.unknown');
      toast.error(message);
    },
    [t],
  );
}
