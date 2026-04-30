'use client';

import { Menu as MenuPrimitive } from '@base-ui/react/menu';
import {
  BookOpenIcon,
  GraduationCapIcon,
  LogOutIcon,
  UserIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import {
  UserAvatar,
  buildUserDisplayName,
  logoutAction,
  type User,
} from '@/features/auth';
import { usePresence } from '@/features/presence';
import { Link, useRouter, usePathname } from '@/shared/config/i18n/navigation';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Logo } from '@/shared/ui/logo';

type UserMenuProps = {
  user: User;
};

const ITEM_BASE =
  'group/menu-row flex h-10 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-sm font-semibold text-muted-foreground transition-colors duration-150 ease-out hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-highlighted:bg-muted data-highlighted:text-foreground';

const ITEM_DESTRUCTIVE =
  'group/menu-row flex h-10 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-sm font-semibold text-destructive transition-colors duration-150 ease-out hover:bg-destructive/10 focus:bg-destructive/10 data-highlighted:bg-destructive/10';

const ICON_NEUTRAL =
  'size-[18px] shrink-0 text-muted-foreground transition-colors duration-150 ease-out group-hover/menu-row:text-brand group-focus/menu-row:text-brand group-data-highlighted/menu-row:text-brand';

const ICON_DESTRUCTIVE = 'size-[18px] shrink-0 text-destructive';

const TEACH_PATH_PREFIXES = ['/dashboard', '/products', '/settings'] as const;

export function UserMenu({ user }: UserMenuProps) {
  const t = useTranslations('app-header');
  const tMenu = useTranslations('app-header.userMenu');
  const tConfirm = useTranslations('app-header.userMenu.confirmSignOut');
  const pathname = usePathname();
  const router = useRouter();
  const presence = usePresence(user.oid);
  const isOnline = presence === 'online';
  const [isSigningOut, startSignOut] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isInTeach = TEACH_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const modeTarget = isInTeach ? '/marketplace' : '/dashboard';
  const modeLabel = isInTeach ? tMenu('openLearn') : tMenu('openStudio');
  const ModeIcon = isInTeach ? BookOpenIcon : GraduationCapIcon;

  const displayName = buildUserDisplayName(user) || user.firstName;
  const handle = buildUserHandle(user);
  const profileHref = `/users/${user.oid}`;
  const year = new Date().getFullYear();

  function handleSignOut() {
    startSignOut(async () => {
      await logoutAction();
      setConfirmOpen(false);
      router.replace('/login');
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label={t('userAvatar')}
              className="rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            />
          }
        >
          <UserAvatar user={user} size="lg" online={isOnline} />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={10}
          className="w-[320px] rounded-2xl border border-border/70 bg-[oklch(0.985_0_0)] p-1.5 shadow-lg dark:bg-[oklch(0.18_0_0)]"
        >
          <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-background p-3 shadow-xs">
            <UserAvatar user={user} size="lg" online={isOnline} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {displayName}
              </p>
              <p className="truncate text-sm text-muted-foreground">{handle}</p>
            </div>
            <span
              role="img"
              aria-label={tMenu('accountSelected')}
              className="flex size-4 shrink-0 items-center justify-center rounded-full bg-background ring-2 ring-brand ring-inset"
            >
              <span aria-hidden className="size-2 rounded-full bg-brand" />
            </span>
          </div>

          <div className="mt-1.5 flex flex-col gap-0.5 rounded-xl border border-border/70 bg-background p-1 shadow-xs">
            <MenuRow
              render={<Link href={profileHref} />}
              className={ITEM_BASE}
            >
              <UserIcon className={ICON_NEUTRAL} aria-hidden />
              <span className="truncate">{tMenu('myProfile')}</span>
              <span className="ml-1 truncate text-sm font-normal text-muted-foreground">
                {handle}
              </span>
            </MenuRow>

            <MenuRow
              render={<Link href={modeTarget} />}
              className={ITEM_BASE}
            >
              <ModeIcon className={ICON_NEUTRAL} aria-hidden />
              <span className="flex-1 truncate">{modeLabel}</span>
            </MenuRow>

            <MenuRow
              onClick={() => setConfirmOpen(true)}
              className={ITEM_DESTRUCTIVE}
            >
              <LogOutIcon className={ICON_DESTRUCTIVE} aria-hidden />
              <span className="flex-1 truncate">{tMenu('signOut')}</span>
            </MenuRow>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 px-2 pb-0.5 pt-1">
            <span className="inline-flex items-center gap-2">
              <Logo className="size-7 shrink-0" />
              <span className="text-base font-semibold text-foreground">
                {t('brand')}
              </span>
            </span>
            <span className="text-xs text-muted-foreground">© {year}</span>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tConfirm('title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tConfirm('description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSigningOut}>
              {tConfirm('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              {tConfirm('confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function MenuRow({
  className,
  ...props
}: MenuPrimitive.Item.Props) {
  return (
    <MenuPrimitive.Item
      data-slot="user-menu-row"
      className={cn(
        'relative outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

function buildUserHandle(user: User): string {
  const first = (user.firstName ?? '').toLowerCase().replace(/\s+/g, '');
  const last = (user.lastName ?? '').toLowerCase().replace(/\s+/g, '');
  if (!first && !last) return `@${user.oid.slice(0, 8)}`;
  if (first && last) return `@${first}.${last}`;
  return `@${first || last}`;
}
