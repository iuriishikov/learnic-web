'use client';

import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Returns a handler that announces an unbuilt section via a toast.
 * The dashboard is a mock — its actions (filters, manage users/courses,
 * open course) have no destination yet, so they acknowledge the click
 * honestly instead of being dead buttons.
 */
export function useComingSoon(): () => void {
  const t = useTranslations('admin-dashboard');
  return useCallback(() => {
    toast(t('comingSoon'));
  }, [t]);
}
