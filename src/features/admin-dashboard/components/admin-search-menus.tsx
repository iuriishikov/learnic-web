'use client';

import {
  BanIcon,
  BookOpenIcon,
  CircleSlashIcon,
  ExternalLinkIcon,
  ShieldCheckIcon,
  SparklesIcon,
  Trash2Icon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useDebouncedValue } from '@/shared/hooks/use-debounced-value';
import { UserAvatar } from '@/shared/ui/user-avatar';

import { useAdminNoteSearch, useAdminUserSearch } from '../api/use-search';
import type { AdminNoteResult, AdminUserResult } from '../model/search';

import { AdminSearchMenu, type ActionDef } from './admin-search-menu';

type MenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/* ------------------------------- users ---------------------------------- */

export function UserSearchMenu({ open, onOpenChange }: MenuProps) {
  const t = useTranslations('admin-dashboard');
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 250);
  const { data, isError } = useAdminUserSearch(debounced);

  const buildActions = (user: AdminUserResult): ActionDef[] => [
    {
      key: 'open',
      label: t('actions.openProfile'),
      icon: <ExternalLinkIcon />,
      href: `/users/${user.id}`,
    },
    {
      key: 'grant',
      label: t('actions.grantBeta'),
      icon: <SparklesIcon />,
      mutation: 'grant',
      successMsg: t('actions.grantedSuccess', { name: user.fullName }),
    },
    {
      key: 'revoke',
      label: t('actions.revokeTariff'),
      icon: <CircleSlashIcon />,
      mutation: 'revoke',
      successMsg: t('actions.revokedSuccess', { name: user.fullName }),
    },
    // Banned → offer unban; not banned → offer ban (with confirm). Only
    // one of the two is ever shown, driven by the search result's status.
    user.isBanned
      ? {
          key: 'unban',
          label: t('actions.unbanUser'),
          icon: <ShieldCheckIcon />,
          mutation: 'unban',
          successMsg: t('actions.unbannedSuccess', { name: user.fullName }),
        }
      : {
          key: 'ban',
          label: t('actions.banUser'),
          icon: <BanIcon />,
          tone: 'destructive',
          mutation: 'ban',
          successMsg: t('actions.bannedSuccess', { name: user.fullName }),
          confirm: {
            title: t('actions.confirmBanTitle', { name: user.fullName }),
            description: t('actions.confirmBanDesc'),
            cta: t('actions.banCta'),
          },
        },
  ];

  return (
    <AdminSearchMenu
      open={open}
      onOpenChange={onOpenChange}
      title={t('search.usersTitle')}
      placeholder={t('search.usersPlaceholder')}
      query={query}
      setQuery={setQuery}
      data={data}
      isError={isError}
      emptyLabel={t('search.emptyUsers')}
      loadingShape="circle"
      getName={(user) => user.fullName}
      renderLeading={(user) => (
        <UserAvatar user={user} size="sm" shape="circle" showStatus={false} />
      )}
      buildActions={buildActions}
    />
  );
}

/* ------------------------------- notes ---------------------------------- */

export function NoteSearchMenu({ open, onOpenChange }: MenuProps) {
  const t = useTranslations('admin-dashboard');
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 250);
  const { data, isError } = useAdminNoteSearch(debounced);

  const buildActions = (note: AdminNoteResult): ActionDef[] => [
    {
      key: 'open',
      label: t('actions.openNote'),
      icon: <ExternalLinkIcon />,
      href: `/products/${note.id}`,
    },
    {
      key: 'delete',
      label: t('actions.deleteNote'),
      icon: <Trash2Icon />,
      tone: 'destructive',
      mutation: 'delete',
      successMsg: t('actions.deletedSuccess', { title: note.title }),
      confirm: {
        title: t('actions.confirmDeleteTitle', { title: note.title }),
        description: t('actions.confirmDeleteDesc'),
        cta: t('actions.deleteCta'),
      },
    },
  ];

  return (
    <AdminSearchMenu
      open={open}
      onOpenChange={onOpenChange}
      title={t('search.notesTitle')}
      placeholder={t('search.notesPlaceholder')}
      query={query}
      setQuery={setQuery}
      data={data}
      isError={isError}
      emptyLabel={t('search.emptyNotes')}
      loadingShape="square"
      getName={(note) => note.title}
      renderLeading={() => <BookOpenIcon />}
      renderDescription={(note) =>
        t('search.byAuthor', { author: note.authorName })
      }
      buildActions={buildActions}
    />
  );
}
