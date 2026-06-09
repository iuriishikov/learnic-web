'use client';

import { useTranslations } from 'next-intl';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';

type DeletePostDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Post title interpolated into the description. */
  postTitle: string;
  busy?: boolean;
  onConfirm: () => void;
};

/**
 * Branded confirm for the irreversible post delete — replaces the native
 * `window.confirm`. Same shape as the sign-out confirm in the user menu:
 * controlled `AlertDialog`, destructive action, cancel disabled while busy.
 */
export function DeletePostDialog({
  open,
  onOpenChange,
  postTitle,
  busy,
  onConfirm,
}: DeletePostDialogProps) {
  const t = useTranslations('blog-admin.list.confirmDelete');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('description', { title: postTitle })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={onConfirm}
            disabled={busy}
          >
            {t('confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
