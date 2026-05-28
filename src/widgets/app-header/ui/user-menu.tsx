'use client';

import {
  BookOpenIcon,
  GraduationCapIcon,
  HelpCircleIcon,
  LayersIcon,
  LayoutDashboardIcon,
  LifeBuoyIcon,
  LogOutIcon,
  MailIcon,
  MoonIcon,
  SettingsIcon,
  UserIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useState, useSyncExternalStore, useTransition } from 'react';

import { logoutAction, type User } from '@/features/auth';
import { useAuth } from '@/shared/auth';
import { Link, useRouter, usePathname } from '@/shared/config/i18n/navigation';
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
  Menu,
  MenuActionButton,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuSwitchItem,
  MenuTrigger,
  MenuUserCard,
} from '@/shared/ui/menu';
import {
  UserAvatar,
  buildUserDisplayName,
  userAvatarRadiusClass,
  type AvatarUser,
} from '@/shared/ui/user-avatar';

import { APP_MODE_COOKIE, DEFAULT_APP_MODE, isAppMode } from './app-mode';

type UserMenuProps = {
  user: User;
};

const TEACH_PATH_PREFIXES = ['/products'] as const;
const LEARN_PATH_PREFIXES = [
  '/marketplace',
  '/my-courses',
  '/community',
] as const;
const MODE_NEUTRAL_PREFIXES = ['/settings'] as const;

function readModeCookie(): 'teach' | 'learn' | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${APP_MODE_COOKIE}=`));
  if (!match) return null;
  const value = decodeURIComponent(match.slice(APP_MODE_COOKIE.length + 1));
  return isAppMode(value) ? value : null;
}

const subscribeNoop = () => () => {};
const getServerSnapshot = (): 'teach' | 'learn' | null => null;

export function UserMenu({ user }: UserMenuProps) {
  const t = useTranslations('app-header');
  const tMenu = useTranslations('app-header.userMenu');
  const tConfirm = useTranslations('app-header.userMenu.confirmSignOut');
  const pathname = usePathname();
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isSigningOut, startSignOut] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const matchesPrefix = (prefix: string) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`);
  const isInTeachPath = TEACH_PATH_PREFIXES.some(matchesPrefix);
  const isInLearnPath = LEARN_PATH_PREFIXES.some(matchesPrefix);
  const isModeNeutral = MODE_NEUTRAL_PREFIXES.some(matchesPrefix);
  // On mode-neutral routes (`/settings`) the cookie set by `ModeTracker`
  // remembers which shell the user came from. Server snapshot is `null`
  // so the first client render matches SSR; the post-mount client snapshot
  // reads the cookie and re-renders with the correct mode.
  const cookieMode = useSyncExternalStore(
    subscribeNoop,
    readModeCookie,
    getServerSnapshot,
  );
  const resolvedCookieMode = isModeNeutral ? cookieMode : null;
  const isInTeach = isInTeachPath
    ? true
    : isInLearnPath
      ? false
      : (resolvedCookieMode ?? DEFAULT_APP_MODE) === 'teach';
  const modeTarget = isInTeach ? '/marketplace' : '/products';
  const modeLabel = isInTeach ? tMenu('openLearn') : tMenu('openStudio');
  const ModeIcon = isInTeach ? BookOpenIcon : GraduationCapIcon;

  const displayName = buildUserDisplayName(user) || user.email;
  const avatarUser: AvatarUser = {
    id: user.oid,
    fullName: user.fullName,
    avatar: user.avatar,
    isVerified: user.isVerified,
  };
  const profileHref = `/users/${user.oid}`;
  const isDark = theme === 'dark';

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
      <Menu>
        <MenuTrigger
          render={
            <button
              type="button"
              aria-label={t('userAvatar')}
              className={`inline-flex ${userAvatarRadiusClass()} outline-none transition-shadow duration-150 ease-out focus-visible:ring-3 focus-visible:ring-brand/40 data-[popup-open]:ring-3 data-[popup-open]:ring-brand/50 data-popup-open:ring-3 data-popup-open:ring-brand/50`}
            />
          }
        >
          <UserAvatar user={avatarUser} size="lg" />
        </MenuTrigger>

        <MenuContent
          align="end"
          sideOffset={10}
          size="lg"
          className="w-[300px]"
        >
          <MenuUserCard
            avatar={<UserAvatar user={avatarUser} size="lg" />}
            primary={displayName}
            secondary={user.email}
          />
          <MenuSeparator />

          <MenuGroup>
            <MenuItem
              render={<Link href={profileHref} />}
              leading={<UserIcon />}
              shortcut="⌘K→P"
            >
              {tMenu('myProfile')}
            </MenuItem>
            <MenuItem
              render={<Link href={modeTarget} />}
              leading={<ModeIcon />}
            >
              {modeLabel}
            </MenuItem>
            <MenuItem
              render={<Link href="/settings" />}
              leading={<SettingsIcon />}
              shortcut="⌘S"
            >
              {tMenu('settings')}
            </MenuItem>
            <MenuSwitchItem
              leading={<MoonIcon />}
              checked={isDark}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            >
              {tMenu('darkMode')}
            </MenuSwitchItem>
          </MenuGroup>

          <MenuSeparator />

          {isAdmin && (
            <>
              <MenuGroup>
                <MenuItem
                  render={<Link href="/admin" />}
                  leading={<LayoutDashboardIcon />}
                >
                  {tMenu('adminPanel')}
                </MenuItem>
              </MenuGroup>
              <MenuSeparator />
            </>
          )}

          <MenuGroup>
            <MenuItem
              render={<Link href="/blog" />}
              leading={<LayersIcon />}
            >
              {tMenu('changelog')}
            </MenuItem>
            <MenuSub>
              <MenuSubTrigger leading={<LifeBuoyIcon />}>
                {tMenu('support')}
              </MenuSubTrigger>
              <MenuSubContent>
                <MenuGroup>
                  <MenuItem
                    render={<Link href="/docs" />}
                    leading={<HelpCircleIcon />}
                  >
                    {tMenu('supportHelp')}
                  </MenuItem>
                  <MenuItem
                    render={<Link href="/help" />}
                    leading={<MailIcon />}
                  >
                    {tMenu('supportContact')}
                  </MenuItem>
                </MenuGroup>
              </MenuSubContent>
            </MenuSub>
          </MenuGroup>

          <MenuSeparator />
          <MenuActionButton
            leading={<LogOutIcon />}
            onClick={() => setConfirmOpen(true)}
          >
            {tMenu('signOut')}
          </MenuActionButton>
        </MenuContent>
      </Menu>

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
