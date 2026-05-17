'use client';

import { MailIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/shared/ui/button';

import { PasswordResetDialog } from './password-reset-dialog';

/**
 * Settings → Security → Change password.
 *
 * The backend exposes only the email-link reset flow (no
 * change-while-logged-in endpoint), and the user's email is privacy-masked
 * server-side. The dialog hosts the request-reset form in place so the user
 * does not have to navigate to a separate page just to type their email.
 */
export function PasswordResetButton() {
  const t = useTranslations('settings.security.password');
  return (
    <PasswordResetDialog
      trigger={
        <Button variant="outline" className="gap-2">
          <MailIcon className="size-4" aria-hidden />
          {t('cta')}
        </Button>
      }
    />
  );
}
