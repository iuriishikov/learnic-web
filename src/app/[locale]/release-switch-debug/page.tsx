'use client';

// THROWAWAY DEBUG ROUTE — reproduces the note-reader sidebar chrome + release
// switcher menu to diagnose the clipped left border. Delete after diagnosis.

import { ArrowLeftIcon, BookOpenIcon, ChevronDownIcon } from 'lucide-react';

import {
  Menu,
  MenuContent,
  MenuGroup,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from '@/shared/ui/menu';
import { ScrollArea } from '@/shared/ui/scroll-area';
import { Separator } from '@/shared/ui/separator';

const RELEASES = [
  { id: 'r4', label: 'v1.3.0', ordinal: 4, latest: true },
  { id: 'r3', label: 'v1.2.0', ordinal: 3, latest: false },
  { id: 'r2', label: 'v1.1.0', ordinal: 2, latest: false },
  { id: 'r1', label: 'v1.0.0', ordinal: 1, latest: false },
];

function SwitcherMenu({ triggerId }: { triggerId: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Версия конспекта
      </span>
      <Menu>
        <MenuTrigger
          id={triggerId}
          className="group/release inline-flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm font-medium text-foreground outline-none transition-colors hover:bg-muted/40 data-popup-open:border-brand data-popup-open:ring-3 data-popup-open:ring-brand/20"
        >
          <span className="truncate">v1.3.0</span>
          <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-data-popup-open/release:rotate-180" />
        </MenuTrigger>
        <MenuContent size="md" align="start" className="overflow-y-auto">
          <MenuGroup>
            <MenuLabel>Сменить версию</MenuLabel>
            <MenuRadioGroup value="r4">
              {RELEASES.map((r) => (
                <MenuRadioItem
                  key={r.id}
                  value={r.id}
                  shortcut={`Выпуск #${r.ordinal}`}
                >
                  <span className="inline-flex items-center gap-2 whitespace-nowrap">
                    {r.label}
                    {r.latest ? (
                      <span className="inline-flex items-center rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold text-brand">
                        Последняя
                      </span>
                    ) : null}
                  </span>
                </MenuRadioItem>
              ))}
            </MenuRadioGroup>
          </MenuGroup>
        </MenuContent>
      </Menu>
    </div>
  );
}

// Faithful copy of ProductReaderView's sidebar column.
export default function ReleaseSwitchDebugPage() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-5 pt-6 md:px-6 md:pt-8 lg:px-8">
      <div className="grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10">
        <aside className="hidden self-start lg:sticky lg:top-[88px] lg:block">
          <ScrollArea className="max-h-[calc(100vh-112px)]">
            <div className="flex flex-col gap-4 pr-3">
              <button className="-ml-1 w-fit text-sm text-muted-foreground">
                <ArrowLeftIcon className="inline size-4" /> О конспекте
              </button>
              <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-gradient-to-br from-muted to-muted/40">
                <BookOpenIcon className="size-7 text-muted-foreground" />
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-foreground">Docker</p>
                <p className="text-xs text-muted-foreground">1 модуль · 1 урок</p>
              </div>
              <Separator />
              <SwitcherMenu triggerId="trigger-A" />
              <Separator />
              <div className="h-96 rounded-lg bg-muted/40" />
            </div>
          </ScrollArea>
        </aside>
        <div className="min-w-0">
          <div className="h-screen rounded-lg bg-muted/20" />
        </div>
      </div>
    </div>
  );
}
