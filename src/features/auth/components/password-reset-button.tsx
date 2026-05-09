'use client';

import { MailIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/shared/config/i18n/navigation';
import { Button } from '@/shared/ui/button';

/**
 * Settings → Security → Change password.
 *
 * The backend exposes only the email-link reset flow (no
 * change-while-logged-in endpoint), and the user's email is privacy-masked
 * server-side. Sending the user to `/forgot-password` lets them type the
 * exact address they want the reset link delivered to.
 */
export function PasswordResetButton() {
  const t = useTranslations('settings.security.password');
  return (
    <Button
      variant="outline"
      className="gap-2"
      render={<Link href="/forgot-password" />}
      nativeButton={false}
    >
      <MailIcon className="size-4" aria-hidden />
      {t('cta')}
    </Button>
  );
}
