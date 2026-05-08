'use client';

import {
  CopyIcon,
  ExternalLinkIcon,
  MailIcon,
  MailPlusIcon,
  MoreHorizontalIcon,
  TimerIcon,
  Trash2Icon,
  UserPlusIcon,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useFormatter, useTranslations } from 'next-intl';

import { cn } from '@/shared/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

import {
  BUILTIN_ROLES,
  CUSTOM_ROLES,
  MOCK_INVITATIONS,
  type PendingInvitation,
  getInitials,
  roleColorClasses,
} from './team-mock';

const ROLES = [...BUILTIN_ROLES, ...CUSTOM_ROLES];

export function TeamInvitationsTab() {
  const t = useTranslations('teach-products.editor.team.invitations');
  const reduceMotion = useReducedMotion();
  const invitations = MOCK_INVITATIONS;

  return (
    <motion.div
      key="invitations-tab"
      initial={reduceMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="font-heading text-lg font-semibold tracking-tight text-foreground">
            {t('title')}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="h-9 shrink-0 gap-1.5 bg-brand px-3 text-brand-foreground hover:bg-brand/90 sm:px-4"
        >
          <UserPlusIcon className="size-4" />
          {t('addCta')}
        </Button>
      </div>

      {invitations.length === 0 ? (
        <EmptyInvitations />
      ) : (
        <ul className="flex flex-col gap-2">
          {invitations.map((invitation) => (
            <li key={invitation.id}>
              <InvitationCard invitation={invitation} />
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}

function InvitationCard({ invitation }: { invitation: PendingInvitation }) {
  const t = useTranslations('teach-products.editor.team.invitations');
  const tActions = useTranslations(
    'teach-products.editor.team.invitations.actions',
  );
  const tRoles = useTranslations('teach-products.editor.team.roles');
  const formatter = useFormatter();
  const role = ROLES.find((r) => r.id === invitation.roleId);
  const roleName = role?.builtIn
    ? tRoles(role.name)
    : role?.name ?? invitation.roleId;
  const tone = role ? roleColorClasses(role.color) : roleColorClasses('brand');
  const expiringSoon = invitation.expiresInDays <= 1;

  return (
    <article className="group/inv flex flex-col gap-3 rounded-2xl border border-border bg-background p-4 transition-colors hover:border-foreground/15 sm:flex-row sm:items-center sm:gap-5">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-full ring-1 ring-foreground/10',
            tone.bgSoft,
          )}
        >
          <MailIcon className={cn('size-4', tone.text)} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate text-sm font-semibold text-foreground">
            {invitation.email}
          </span>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
                tone.bgSoft,
                tone.text,
              )}
            >
              <span aria-hidden className={cn('size-1.5 rounded-full', tone.dot)} />
              {roleName}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Avatar size="sm">
                {invitation.invitedByAvatarUrl ? (
                  <AvatarImage src={invitation.invitedByAvatarUrl} alt="" />
                ) : null}
                <AvatarFallback>
                  {getInitials(invitation.invitedByName)}
                </AvatarFallback>
              </Avatar>
              {t('inviteFrom', { name: invitation.invitedByName })}
            </span>
            <span className="hidden sm:inline">
              {t('sentAt', {
                date: formatter.dateTime(new Date(invitation.sentAt), {
                  dateStyle: 'medium',
                }),
              })}
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1',
                expiringSoon
                  ? 'font-medium text-amber-600 dark:text-amber-400'
                  : '',
              )}
            >
              <TimerIcon className="size-3" />
              {expiringSoon
                ? t('expiresSoon')
                : t('expiresIn', { days: invitation.expiresInDays })}
            </span>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 bg-background px-2.5"
        >
          <MailPlusIcon className="size-3.5" />
          <span className="hidden lg:inline">{tActions('resend')}</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 bg-background px-2.5"
        >
          <CopyIcon className="size-3.5" />
          <span className="hidden lg:inline">{tActions('copyLink')}</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Действия"
                className="text-muted-foreground hover:text-foreground"
              >
                <MoreHorizontalIcon />
              </Button>
            }
          />
          <DropdownMenuContent align="end" sideOffset={4} className="w-48">
            <DropdownMenuItem>
              <ExternalLinkIcon />
              {tActions('copyLink')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <Trash2Icon />
              {tActions('revoke')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  );
}

function EmptyInvitations() {
  const t = useTranslations('teach-products.editor.team.invitations.empty');
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-background text-muted-foreground ring-1 ring-foreground/10">
        <MailIcon className="size-5" />
      </div>
      <p className="text-sm font-semibold text-foreground">{t('title')}</p>
      <p className="max-w-xs text-xs leading-snug text-muted-foreground">
        {t('description')}
      </p>
    </div>
  );
}
