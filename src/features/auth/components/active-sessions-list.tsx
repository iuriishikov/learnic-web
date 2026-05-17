'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarIcon,
  ClockIcon,
  LaptopIcon,
  LogOutIcon,
  MapPinIcon,
  SmartphoneIcon,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useFormatter, useNow, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { useNotify } from '@/shared/lib/notify';
import { cn } from '@/shared/lib/utils';
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
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';

import {
  listActiveSessionsAction,
  revokeActiveSessionAction,
} from '../api/active-sessions';
import { logoutAllAction } from '../api/session';
import type { ActiveSession } from '../model/sessions';
import { useAuth } from '@/shared/auth';

const QUERY_KEY = ['auth', 'active-sessions'] as const;

const MOBILE_UA = /android|iphone|ipad|ipod|mobile|opera mini|silk/i;
const LOOPBACK_IP = /^(::1|127(\.\d{1,3}){3}|0\.0\.0\.0)$/;

function isMobile(userAgent: string | null): boolean {
  return !!userAgent && MOBILE_UA.test(userAgent);
}

export function ActiveSessionsList() {
  const t = useTranslations('settings.security.sessions');
  const tErrors = useTranslations('settings.errors');
  const formatter = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const notify = useNotify();
  const queryClient = useQueryClient();
  const { logout } = useAuth();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [logoutAllOpen, setLogoutAllOpen] = useState(false);
  const [logoutAllPending, startLogoutAllTransition] = useTransition();
  const reduceMotion = useReducedMotion();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const result = await listActiveSessionsAction();
      if (!result.ok) {
        const reason =
          result.error.kind === 'unknown'
            ? (result.error.message ?? 'unknown')
            : result.error.kind;
        throw new Error(reason);
      }
      return result.sessions;
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (session: ActiveSession) => {
      const result = await revokeActiveSessionAction(session.id);
      if (!result.ok) throw new Error(result.error.kind);
      return session;
    },
    onMutate: (session) => {
      setPendingId(session.id);
    },
    onSettled: () => {
      setPendingId(null);
    },
    onSuccess: (session) => {
      if (session.isCurrent) {
        notify.success(t('revokedCurrent'));
        logout();
        return;
      }
      queryClient.setQueryData<ActiveSession[]>(QUERY_KEY, (prev) =>
        prev ? prev.filter((s) => s.id !== session.id) : prev,
      );
      notify.success(t('revoked'));
    },
    onError: () => {
      notify.error(tErrors('saveFailed'));
    },
  });

  function handleLogoutAll() {
    startLogoutAllTransition(async () => {
      const result = await logoutAllAction();
      setLogoutAllOpen(false);
      if (result.ok) {
        notify.success(t('loggedOutAll'));
        await logout();
      } else {
        notify.error(tErrors('saveFailed'));
      }
    });
  }

  function formatIp(ip: string | null): string {
    if (!ip) return t('ipUnknown');
    if (LOOPBACK_IP.test(ip)) return t('ipLocal');
    return ip;
  }

  if (query.isPending) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SessionRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="flex flex-col items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <p className="text-sm font-medium text-destructive">
          {tErrors('loadFailed')}
        </p>
        <p className="text-xs text-destructive/80" title={query.error.message}>
          {query.error.message}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => query.refetch()}
        >
          {t('retry')}
        </Button>
      </div>
    );
  }

  const sessions = query.data ?? [];
  if (sessions.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('empty')}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2.5">
        <AnimatePresence initial={false} mode="popLayout">
          {sessions.map((session) => {
          const Icon = isMobile(session.userAgent) ? SmartphoneIcon : LaptopIcon;
          const isPending = pendingId === session.id;
          const lastActive = formatter.relativeTime(
            new Date(session.lastUsedAt),
            now,
          );
          const createdAt = formatter.dateTime(new Date(session.createdAt), {
            dateStyle: 'medium',
          });
          const ipLabel = formatIp(session.ipAddress);
          return (
            <motion.li
              key={session.id}
              layout
              initial={false}
              exit={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, x: 24, scale: 0.96 }
              }
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
              className={cn(
                'group/session flex flex-col gap-3 rounded-xl border bg-card p-4 transition-colors md:flex-row md:items-center md:gap-4',
                session.isCurrent
                  ? 'border-brand/40 bg-brand/[0.03]'
                  : 'border-border hover:border-foreground/15',
              )}
            >
              <div
                className={cn(
                  'flex size-11 shrink-0 items-center justify-center rounded-xl border',
                  session.isCurrent
                    ? 'border-brand/30 bg-brand/10 text-brand'
                    : 'border-border bg-muted/40 text-muted-foreground',
                )}
              >
                <Icon className="size-5" aria-hidden />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="truncate text-[15px] font-semibold text-foreground"
                    title={session.userAgent ?? undefined}
                  >
                    {session.deviceLabel ?? t('unknownDevice')}
                  </span>
                  {session.isCurrent ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
                      <span className="size-1.5 rounded-full bg-brand" />
                      {t('thisDevice')}
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <SessionMetaItem
                    icon={<MapPinIcon className="size-3.5" aria-hidden />}
                    value={ipLabel}
                  />
                  <SessionMetaSeparator />
                  <SessionMetaItem
                    icon={<ClockIcon className="size-3.5" aria-hidden />}
                    value={lastActive}
                  />
                  <SessionMetaSeparator />
                  <SessionMetaItem
                    icon={<CalendarIcon className="size-3.5" aria-hidden />}
                    value={t('createdAt', { date: createdAt })}
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => revokeMutation.mutate(session)}
                disabled={isPending}
                className={cn(
                  'shrink-0 self-start md:self-center',
                  session.isCurrent
                    ? 'text-destructive hover:bg-destructive/10 hover:text-destructive'
                    : '',
                )}
              >
                {session.isCurrent ? t('signOut') : t('revoke')}
              </Button>
            </motion.li>
          );
        })}
        </AnimatePresence>
      </ul>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setLogoutAllOpen(true)}
          className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOutIcon className="size-4" aria-hidden />
          {t('logOutAll')}
        </Button>
      </div>

      <AlertDialog open={logoutAllOpen} onOpenChange={setLogoutAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('logOutAllConfirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('logOutAllConfirm.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={logoutAllPending}>
              {t('logOutAllConfirm.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleLogoutAll}
              disabled={logoutAllPending}
            >
              {t('logOutAllConfirm.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

type SessionMetaItemProps = {
  icon: React.ReactNode;
  value: string;
};

function SessionMetaItem({ icon, value }: SessionMetaItemProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-muted-foreground/70">{icon}</span>
      <span className="truncate" title={value}>
        {value}
      </span>
    </span>
  );
}

function SessionMetaSeparator() {
  return (
    <span aria-hidden className="text-muted-foreground/40">
      ·
    </span>
  );
}

function SessionRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <Skeleton className="size-11 rounded-xl" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-72" />
      </div>
      <Skeleton className="h-9 w-24 rounded-md" />
    </div>
  );
}
