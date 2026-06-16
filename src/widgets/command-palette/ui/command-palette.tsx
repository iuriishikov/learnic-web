'use client';

import {
  GraduationCapIcon,
  HelpCircleIcon,
  LayersIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MailIcon,
  MoonIcon,
  SettingsIcon,
  SunIcon,
  UserIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useState, useTransition } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import { logoutAction } from '@/features/auth';
import { useAuth } from '@/shared/auth';
import { useRouter } from '@/shared/config/i18n/navigation';
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
  CommandMenu,
  CommandMenuEmpty,
  CommandMenuFooter,
  CommandMenuGroup,
  CommandMenuHint,
  CommandMenuInput,
  CommandMenuItem,
  CommandMenuList,
  CommandMenuSeparator,
  CommandMenuShortcut,
} from '@/shared/ui/command-menu';

import { ShortcutsOverlay } from './shortcuts-overlay';

/**
 * App-wide command palette (⌘/Ctrl + K) plus the global keyboard shortcuts that
 * back the hints shown elsewhere in the chrome:
 *
 * - `⌘K` toggles the palette — the entry point for discovering every command.
 * - `⌘S` jumps to Settings (the hint advertised on the header button and the
 *   user-menu row). `preventDefault` stops the browser "save page" dialog.
 * - `?` opens the shortcuts overlay (the power-user reference card).
 *
 * Mounted once in the shared shell layout so a single instance owns the
 * bindings on every authenticated route without remounting on navigation. The
 * palette mirrors the user-menu so keyboard-first users reach the same
 * destinations without the mouse. All bindings are gated on an authenticated
 * user (`enabled`) and the surface renders nothing for anonymous visitors.
 *
 * Shortcuts go through `react-hotkeys-hook` (the project's single shortcut
 * system) — not ad-hoc `keydown` listeners.
 */
export function CommandPalette() {
  const { user, isAdmin } = useAuth();
  const t = useTranslations('command-palette');
  const tConfirm = useTranslations('app-header.userMenu.confirmSignOut');
  const router = useRouter();
  const isMac = useIsMac();
  const { theme, setTheme } = useTheme();

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSigningOut, startSignOut] = useTransition();

  const enabled = Boolean(user);
  const mod = isMac ? '⌘' : 'Ctrl';

  // ⌘K — toggle the palette. Enabled inside inputs too so it's always reachable.
  useHotkeys(
    'mod+k',
    () => {
      setOverlayOpen(false);
      setPaletteOpen((prev) => !prev);
    },
    { enabled, enableOnFormTags: true, enableOnContentEditable: true, preventDefault: true },
  );

  // ⌘S — go to Settings. Fires from inputs too (matches the advertised hint);
  // preventDefault suppresses the browser's native save-page dialog.
  useHotkeys(
    'mod+s',
    () => {
      setPaletteOpen(false);
      router.push('/settings');
    },
    { enabled, enableOnFormTags: true, enableOnContentEditable: true, preventDefault: true },
  );

  // ? — shortcuts overlay. Letter-key binding: does NOT fire while typing.
  useHotkeys(
    'shift+slash',
    () => {
      setPaletteOpen(false);
      setOverlayOpen((prev) => !prev);
    },
    { enabled, preventDefault: true },
  );

  if (!user) return null;

  const isDark = theme === 'dark';

  function runCommand(action: () => void) {
    setPaletteOpen(false);
    action();
  }

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
      <CommandMenu
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        title={t('title')}
        description={t('description')}
      >
        <CommandMenuInput placeholder={t('placeholder')} hint={null} />
        <CommandMenuList>
          <CommandMenuEmpty
            title={t('empty.title')}
            description={t('empty.description')}
          />

          <CommandMenuGroup heading={t('groups.navigation')}>
            <CommandMenuItem
              value={t('commands.profile')}
              leading={<UserIcon />}
              onSelect={() => runCommand(() => router.push(`/users/${user.oid}`))}
            >
              {t('commands.profile')}
            </CommandMenuItem>
            <CommandMenuItem
              value={t('commands.teach')}
              leading={<GraduationCapIcon />}
              onSelect={() => runCommand(() => router.push('/products'))}
            >
              {t('commands.teach')}
            </CommandMenuItem>
            <CommandMenuItem
              value={t('commands.settings')}
              leading={<SettingsIcon />}
              trailing={<CommandMenuShortcut keys={[mod, 'S']} />}
              onSelect={() => runCommand(() => router.push('/settings'))}
            >
              {t('commands.settings')}
            </CommandMenuItem>
            {isAdmin && (
              <CommandMenuItem
                value={t('commands.admin')}
                leading={<LayoutDashboardIcon />}
                onSelect={() => runCommand(() => router.push('/admin'))}
              >
                {t('commands.admin')}
              </CommandMenuItem>
            )}
          </CommandMenuGroup>

          <CommandMenuSeparator />

          <CommandMenuGroup heading={t('groups.appearance')}>
            <CommandMenuItem
              value={isDark ? t('commands.themeToLight') : t('commands.themeToDark')}
              leading={isDark ? <SunIcon /> : <MoonIcon />}
              onSelect={() =>
                runCommand(() => setTheme(isDark ? 'light' : 'dark'))
              }
            >
              {isDark ? t('commands.themeToLight') : t('commands.themeToDark')}
            </CommandMenuItem>
          </CommandMenuGroup>

          <CommandMenuSeparator />

          <CommandMenuGroup heading={t('groups.support')}>
            <CommandMenuItem
              value={t('commands.changelog')}
              leading={<LayersIcon />}
              onSelect={() => runCommand(() => router.push('/blog'))}
            >
              {t('commands.changelog')}
            </CommandMenuItem>
            <CommandMenuItem
              value={t('commands.supportHelp')}
              leading={<HelpCircleIcon />}
              onSelect={() => runCommand(() => router.push('/docs'))}
            >
              {t('commands.supportHelp')}
            </CommandMenuItem>
            <CommandMenuItem
              value={t('commands.supportContact')}
              leading={<MailIcon />}
              onSelect={() => runCommand(() => router.push('/help'))}
            >
              {t('commands.supportContact')}
            </CommandMenuItem>
          </CommandMenuGroup>

          <CommandMenuSeparator />

          <CommandMenuGroup heading={t('groups.account')}>
            <CommandMenuItem
              value={t('commands.signOut')}
              leading={<LogOutIcon />}
              onSelect={() => runCommand(() => setConfirmOpen(true))}
            >
              {t('commands.signOut')}
            </CommandMenuItem>
          </CommandMenuGroup>
        </CommandMenuList>

        <CommandMenuFooter>
          <CommandMenuHint keys={['↑', '↓']} label={t('footer.navigate')} />
          <CommandMenuHint keys={['↵']} label={t('footer.select')} />
          <CommandMenuHint keys={['Esc']} label={t('footer.close')} />
        </CommandMenuFooter>
      </CommandMenu>

      <ShortcutsOverlay
        open={overlayOpen}
        onOpenChange={setOverlayOpen}
        isMac={isMac}
      />

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
