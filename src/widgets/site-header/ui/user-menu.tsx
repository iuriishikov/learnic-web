'use client';

import { LogOutIcon, UserIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

import { useAuth, type User } from '@/features/auth';
import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

type UserMenuProps = {
  user: User;
  align?: 'start' | 'end';
  tone?: 'dark' | 'light';
};

function buildInitials(user: User): string {
  const a = user.firstName?.[0] ?? '';
  const b = user.lastName?.[0] ?? '';
  const initials = `${a}${b}`.trim();
  return initials.length > 0 ? initials.toUpperCase() : '?';
}

function buildDisplayName(user: User): string {
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.join(' ').trim() || '—';
}

export function UserMenu({ user, align = 'end', tone = 'dark' }: UserMenuProps) {
  const t = useTranslations('home.header.userMenu');
  const { logout } = useAuth();
  const [isPending, startTransition] = useTransition();

  const isLight = tone === 'light';
  const triggerToneClasses = isLight
    ? 'text-brand-foreground hover:bg-brand-foreground/10'
    : 'text-foreground hover:bg-muted';

  const displayName = buildDisplayName(user);
  const initials = buildInitials(user);

  function onLogout() {
    startTransition(async () => {
      await logout();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className={cn(
              'h-10 gap-2 rounded-full pr-3 pl-1 text-[15px] font-medium',
              triggerToneClasses,
            )}
            aria-label={t('openLabel')}
          />
        }
      >
        <Avatar className="size-8">
          {user.avatarUrl ? (
            <AvatarImage src={user.avatarUrl} alt="" />
          ) : null}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <span className="hidden max-w-[160px] truncate lg:inline">
          {displayName}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} sideOffset={8} className="min-w-56">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="size-9">
            {user.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt="" />
            ) : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold text-foreground">
              {displayName}
            </span>
            {user.description ? (
              <span className="truncate text-xs text-muted-foreground">
                {user.description}
              </span>
            ) : null}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <UserIcon className="size-4" />
          {t('profile')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onLogout}
          disabled={isPending}
          className="text-destructive focus:text-destructive"
        >
          <LogOutIcon className="size-4" />
          {isPending ? t('loggingOut') : t('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
