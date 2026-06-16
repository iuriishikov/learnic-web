'use client';

import { useTranslations } from 'next-intl';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Kbd, KbdGroup } from '@/shared/ui/kbd';

type ShortcutsOverlayProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** macOS shows ⌘; everything else shows Ctrl. Resolved by the parent. */
  isMac: boolean;
};

type ShortcutRow = { keys: string[]; label: string };
type ShortcutGroup = { title: string; rows: ShortcutRow[] };

/**
 * The `?` reference card — lists every shortcut active on the current screen,
 * grouped by context. Discoverability surface #3 from the keyboard-shortcuts
 * contract (alongside the command palette and the in-menu hints).
 */
export function ShortcutsOverlay({
  open,
  onOpenChange,
  isMac,
}: ShortcutsOverlayProps) {
  const t = useTranslations('command-palette.overlay');
  const mod = isMac ? '⌘' : 'Ctrl';

  const groups: ShortcutGroup[] = [
    {
      title: t('groups.global'),
      rows: [
        { keys: [mod, 'K'], label: t('items.openPalette') },
        { keys: [mod, 'S'], label: t('items.goSettings') },
        { keys: ['?'], label: t('items.showShortcuts') },
        { keys: ['Esc'], label: t('items.close') },
      ],
    },
    {
      title: t('groups.list'),
      rows: [
        { keys: ['↑', '↓'], label: t('items.navigateList') },
        { keys: ['↵'], label: t('items.selectItem') },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <div key={group.title} className="flex flex-col gap-2">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {group.title}
              </p>
              <div className="flex flex-col">
                {group.rows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-4 rounded-lg px-2 py-2"
                  >
                    <span className="text-sm text-foreground">{row.label}</span>
                    <KbdGroup>
                      {row.keys.map((key, index) => (
                        <Kbd key={index}>{key}</Kbd>
                      ))}
                    </KbdGroup>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
