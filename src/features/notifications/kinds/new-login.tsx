import { ShieldAlertIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/shared/lib/utils';

import { NotificationNewLoginAction } from '../components/notification-new-login-action';

import type { KindDescriptor } from './types';

export type NewLoginRaw = {
  type: 'new_login';
  session_id: string;
  session_revoked: boolean;
  device_label: string | null;
  user_agent: string | null;
  ip_address: string | null;
};

export type NewLoginDetails = {
  type: 'new_login';
  sessionId: string;
  sessionRevoked: boolean;
  deviceLabel: string | null;
  userAgent: string | null;
  ipAddress: string | null;
};

function NewLoginLine({ details }: { details: NewLoginDetails }) {
  const t = useTranslations('notifications');
  const device =
    details.deviceLabel ??
    details.userAgent ??
    t('lines.newLogin.unknownDevice');
  return (
    <span>
      <span className="text-foreground">
        {t('lines.newLogin.lead')}
      </span>{' '}
      <strong className="font-semibold">{device}</strong>
    </span>
  );
}

function NewLoginAvatar() {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex size-9 shrink-0 items-center justify-center',
        'rounded-full bg-brand/10 text-brand ring-1 ring-brand/30',
      )}
    >
      <ShieldAlertIcon className="size-4" />
    </span>
  );
}

export const newLoginDescriptor: KindDescriptor<NewLoginRaw, NewLoginDetails> = {
  leadKey: 'newLogin',
  parseRaw: (raw) => ({
    type: 'new_login',
    sessionId: raw.session_id,
    sessionRevoked: raw.session_revoked,
    deviceLabel: raw.device_label,
    userAgent: raw.user_agent,
    ipAddress: raw.ip_address,
  }),
  renderLine: NewLoginLine,
  renderAvatar: NewLoginAvatar,
  Action: ({ details, onResolved }) => (
    <NotificationNewLoginAction
      sessionId={details.sessionId}
      sessionRevoked={details.sessionRevoked}
      onResolved={onResolved}
    />
  ),
};
