'use client';

import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { toast } from 'sonner';

export type ApiErrorReason =
  | 'unauthorized'
  | 'network'
  | 'notFound'
  | 'validation'
  | 'unknown';

/**
 * Standard handler for ambient API failures — shows a localized toast based
 * on the discriminated reason from a server-action / fetch result. Pass
 * `override` for feature-specific copy when the generic message is too vague.
 */
export function useNotifyApiError() {
  const t = useTranslations('errors.api');
  return useCallback(
    (reason: ApiErrorReason, override?: string) => {
      toast.error(override ?? t(reason));
    },
    [t],
  );
}
