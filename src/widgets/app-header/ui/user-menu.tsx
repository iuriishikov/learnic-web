'use client';

import {
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
import { useState, useTransition } from 'react';

import { logoutAction, type User } from '@/features/auth';
import { StorageQuotaIndicator, useStorageQuotaWs } from '@/features/billing';
import { useHasReleasedProducts } from '@/features/products';
import { useAuth } from '@/shared/auth';
import { Link, useRouter } from '@/shared/config/i18n/navigation';
import { useIsMac } from '@/shared/lib/platform';
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

type UserMenuProps = {
  user: User;
};

export function UserMenu({ user }: UserMenuProps) {
  const t = useTranslations('app-header');
  const tMenu = useTranslations('app-header.userMenu');
  const tConfirm = useTranslations('app-header.userMenu.confirmSignOut');
  const router = useRouter();
  const { isAdmin } = useAuth();
  const isMac = useIsMac();
  const { theme, setTheme } = useTheme();
  const [isSigningOut, startSignOut] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Storage is a creator-only concern, so the meter shows iff the user
  // has released at least one product of their own (`GET /users/{id}/
  // products` is PUBLISHED + author-scoped; a note publishes solely via
  // its first release). Defaults to `false` while the probe is in flight
  // so the meter never flashes for a learner. Gating the WS `enabled`
  // here means non-creators never even open the socket.
  const { data: hasReleasedProducts = false } = useHasReleasedProducts(
    user.oid,
  );
  // Lives here (always mounted) rather than inside MenuContent — the
  // dropdown unmounts on close, which would reopen the socket on every
  // open. One persistent connection; the meter renders instantly.
  const storageQuota = useStorageQuotaWs(hasReleasedProducts);

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

          {/* Live storage-quota meter (WS /users/me/storage). Shown only
              to users who have released a product of their own; within
              that group it renders nothing — and no divider — until the
              first snapshot lands. */}
          {hasReleasedProducts ? (
            <StorageQuotaIndicator quota={storageQuota} />
          ) : null}

          <MenuGroup>
            <MenuItem
              render={<Link href={profileHref} />}
              leading={<UserIcon />}
            >
              {tMenu('myProfile')}
            </MenuItem>
            {/* Studio entry point — the only two-line row in the menu. Its
                quiet subtitle gives it presence without a colour accent, so
                it reads as distinct but not loud. */}
            <MenuItem
              render={<Link href="/products" />}
              leading={<GraduationCapIcon />}
              description={tMenu('teachDescription')}
            >
              {tMenu('teach')}
            </MenuItem>
            <MenuItem
              render={<Link href="/settings" />}
              leading={<SettingsIcon />}
              shortcut={isMac ? '⌘S' : 'Ctrl S'}
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
