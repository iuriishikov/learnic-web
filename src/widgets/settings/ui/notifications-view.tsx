'use client';

import {
  BellIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
  MailIcon,
  MonitorOffIcon,
  ShareIcon,
  ShieldAlertIcon,
  SmartphoneIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState, type ReactNode } from 'react';

import {
  ACTIVE_CATEGORIES,
  useNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
  type CategoryToggles,
  type NotificationCategory,
  type NotificationChannel,
  type NotificationPreferences,
} from '@/features/notifications';
import { usePushSubscription } from '@/features/web-push';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { useNotify } from '@/shared/lib/notify';
import { cn } from '@/shared/lib/utils';
import { Skeleton } from '@/shared/ui/skeleton';
import { Switch } from '@/shared/ui/switch';
import {
  AutosaveIndicator,
  SettingsRow,
  SettingsSection,
} from '@/widgets/settings';

const CHANNEL_ORDER: readonly NotificationChannel[] = [
  'push',
  'email',
  'inApp',
] as const;

const CHANNEL_ICONS: Record<NotificationChannel, typeof BellIcon> = {
  push: BellIcon,
  email: MailIcon,
  inApp: SmartphoneIcon,
};

const DEFAULT_PREFS: NotificationPreferences = {
  push: { invites: true, files: true, jobs: true, other: true },
  email: { invites: false, files: false, jobs: false, other: false },
};

const AUTOSAVE_DEBOUNCE_MS = 500;
const SAVED_INDICATOR_TTL_MS = 1500;

export function NotificationsView() {
  const t = useTranslations('settings.notifications');
  const tAutosave = useTranslations('settings.autosave');
  const tChannel = useTranslations('settings.notifications.channels');
  const tCategory = useTranslations('settings.notifications.categories');
  const notify = useNotify();

  const query = useNotificationPreferencesQuery();
  const mutation = useUpdateNotificationPreferencesMutation();
  const { mutateAsync, isPending } = mutation;

  const [override, setOverride] = useState<NotificationPreferences | null>(null);
  const [overrideBaseline, setOverrideBaseline] =
    useState<NotificationPreferences | null>(null);
  const [recentlySavedAt, setRecentlySavedAt] = useState<number | null>(null);

  // Reset the local draft whenever a fresh server snapshot arrives — the
  // baseline pointer detects identity changes without a setState-in-effect.
  if (query.data && query.data !== overrideBaseline) {
    setOverride(null);
    setOverrideBaseline(query.data);
  }

  const draft: NotificationPreferences = override ?? query.data ?? DEFAULT_PREFS;

  function setCell(
    channel: 'push' | 'email',
    category: NotificationCategory,
    enabled: boolean,
  ) {
    setOverride((prev) => {
      const base = prev ?? query.data ?? DEFAULT_PREFS;
      return {
        ...base,
        [channel]: { ...base[channel], [category]: enabled },
      };
    });
  }

  // Auto-save: every override change schedules a server PUT after a short
  // debounce. Successive toggles cancel the pending timer so we ship one
  // request per "burst" of clicks. Errors surface via toast — the local
  // override stays in place so the UI doesn't snap back, and the next
  // toggle retries the save.
  useEffect(() => {
    if (!override || !query.data) return;
    if (JSON.stringify(override) === JSON.stringify(query.data)) return;
    const timeout = setTimeout(() => {
      void mutateAsync({ push: override.push, email: override.email })
        .then(() => setRecentlySavedAt(Date.now()))
        .catch(() => {
          notify.error(t('saveFailed'));
        });
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [override, query.data, mutateAsync, notify, t]);

  // Drop the "Saved" pill after the TTL so it doesn't linger.
  useEffect(() => {
    if (recentlySavedAt === null) return;
    const timeout = setTimeout(
      () => setRecentlySavedAt(null),
      SAVED_INDICATOR_TTL_MS,
    );
    return () => clearTimeout(timeout);
  }, [recentlySavedAt]);

  if (query.isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{t('loadFailed')}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <DeviceStatusSection />

      <SettingsSection
        title={t('title')}
        description={t('description')}
        headerActions={
          <AutosaveIndicator
            saving={isPending}
            justSaved={recentlySavedAt !== null}
            savingLabel={tAutosave('saving')}
            savedLabel={tAutosave('saved')}
          />
        }
      >
        {ACTIVE_CATEGORIES.map((category) => (
          <SettingsRow
            key={category}
            label={tCategory(`${category}.label`)}
            description={tCategory(`${category}.description`)}
          >
            <div className="flex w-full max-w-md flex-col divide-y divide-border rounded-lg border border-border bg-card">
              {CHANNEL_ORDER.map((channel) => (
                <ChannelToggle
                  key={channel}
                  channel={channel}
                  category={category}
                  draft={draft}
                  onChange={setCell}
                  channelLabel={tChannel(`${channel}.label`)}
                  alwaysOnLabel={tChannel('inApp.alwaysOn')}
                />
              ))}
            </div>
          </SettingsRow>
        ))}
      </SettingsSection>
    </div>
  );
}

type ChannelToggleProps = {
  channel: NotificationChannel;
  category: NotificationCategory;
  draft: NotificationPreferences;
  channelLabel: string;
  alwaysOnLabel: string;
  onChange: (
    channel: 'push' | 'email',
    category: NotificationCategory,
    enabled: boolean,
  ) => void;
};

function ChannelToggle({
  channel,
  category,
  draft,
  channelLabel,
  alwaysOnLabel,
  onChange,
}: ChannelToggleProps) {
  const inApp = channel === 'inApp';
  const checked: boolean = inApp
    ? true
    : pickToggle(channel, draft)[category];
  const Icon = CHANNEL_ICONS[channel];

  return (
    <label
      className={cn(
        'flex items-center justify-between gap-3 px-4 py-3 transition-colors',
        !inApp && 'hover:bg-muted/40',
      )}
    >
      <span className="flex min-w-0 items-center gap-3 text-sm">
        <Icon
          className={cn(
            'size-4 shrink-0',
            checked ? 'text-brand' : 'text-muted-foreground',
          )}
          aria-hidden
        />
        <span className="truncate font-medium text-foreground">
          {channelLabel}
        </span>
        {inApp ? (
          <Badge variant="secondary" className="ml-1 shrink-0">
            {alwaysOnLabel}
          </Badge>
        ) : null}
      </span>
      <Switch
        checked={checked}
        disabled={inApp}
        aria-label={channelLabel}
        onCheckedChange={(value: boolean) => {
          if (inApp) return;
          onChange(channel, category, value);
        }}
      />
    </label>
  );
}

function pickToggle(
  channel: 'push' | 'email',
  prefs: NotificationPreferences,
): CategoryToggles {
  return channel === 'push' ? prefs.push : prefs.email;
}

type DeviceStatusView = {
  tone: 'positive' | 'warning' | 'info' | 'muted';
  icon: ReactNode;
  title: string;
  description: string;
  action: ReactNode | null;
};

function DeviceStatusSection() {
  const t = useTranslations('settings.notifications.device');
  const push = usePushSubscription();
  const notify = useNotify();
  const [busy, setBusy] = useState(false);

  async function handleSubscribe() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await push.subscribe();
      if (result.ok) {
        notify.success(t('subscribed'));
        return;
      }
      if (result.error.kind === 'forbidden') {
        notify.error(t('errors.permissionDenied'));
      } else if (result.error.kind === 'notConfigured') {
        notify.error(t('errors.notConfigured'));
      } else {
        notify.error(t('errors.generic'));
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleUnsubscribe() {
    if (busy) return;
    setBusy(true);
    try {
      const result = await push.unsubscribe();
      if (result.ok) {
        notify.success(t('unsubscribed'));
      } else {
        notify.error(t('errors.generic'));
      }
    } finally {
      setBusy(false);
    }
  }

  if (push.initializing) {
    return <Skeleton className="h-24 w-full rounded-xl" />;
  }

  const view: DeviceStatusView = (() => {
    switch (push.status) {
      case 'subscribed':
        return {
          tone: 'positive',
          icon: <CheckCircleIcon className="size-5 text-emerald-500" aria-hidden />,
          title: t('statuses.subscribed.title'),
          description: t('statuses.subscribed.description'),
          action: (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              aria-busy={busy}
              onClick={handleUnsubscribe}
            >
              {t('actions.unsubscribe')}
            </Button>
          ),
        };
      case 'permission-denied':
        return {
          tone: 'warning',
          icon: <ShieldAlertIcon className="size-5 text-amber-500" aria-hidden />,
          title: t('statuses.denied.title'),
          description: t('statuses.denied.description'),
          action: null,
        };
      case 'pwa-required':
        return {
          tone: 'info',
          icon: <ShareIcon className="size-5 text-brand" aria-hidden />,
          title: t('statuses.pwaRequired.title'),
          description: t('statuses.pwaRequired.description'),
          action: null,
        };
      case 'unsupported':
        return {
          tone: 'muted',
          icon: <MonitorOffIcon className="size-5 text-muted-foreground" aria-hidden />,
          title: t('statuses.unsupported.title'),
          description: t('statuses.unsupported.description'),
          action: null,
        };
      default:
        return {
          tone: 'muted',
          icon: <BellIcon className="size-5 text-muted-foreground" aria-hidden />,
          title: t('statuses.unsubscribed.title'),
          description: t('statuses.unsubscribed.description'),
          action: (
            <Button
              size="sm"
              disabled={busy}
              aria-busy={busy}
              onClick={handleSubscribe}
            >
              <BellIcon className="size-4" aria-hidden />
              {busy ? t('actions.subscribing') : t('actions.subscribe')}
            </Button>
          ),
        };
    }
  })();

  const toneClass = {
    positive: 'border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/5',
    warning: 'border-amber-500/30 bg-amber-50 dark:bg-amber-500/5',
    info: 'border-brand/30 bg-brand/5',
    muted: 'border-border bg-card',
  }[view.tone];

  return (
    <section
      className={cn(
        'flex flex-col gap-3 rounded-xl border p-5 md:flex-row md:items-center md:justify-between md:gap-6',
        toneClass,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-background/80 ring-1 ring-border">
          {view.icon}
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-sm font-semibold text-foreground">{view.title}</p>
          <p className="text-sm text-muted-foreground">{view.description}</p>
        </div>
      </div>
      {view.action ? (
        <div className="flex shrink-0 items-center gap-2 md:ml-auto">
          {view.action}
        </div>
      ) : push.status === 'pwa-required' ? (
        <a
          href="https://support.apple.com/guide/iphone/bookmark-favorite-webpages-iph42ab2f3a7/ios"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand hover:underline"
        >
          {t('actions.howTo')}
          <ExternalLinkIcon className="size-3.5" aria-hidden />
        </a>
      ) : null}
    </section>
  );
}
