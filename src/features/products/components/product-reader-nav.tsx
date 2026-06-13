'use client';

import { useTranslations } from 'next-intl';

import { OutlineNav, type OutlineNavItem } from '@/shared/ui/outline-nav';

import type { PublicSchemeModule } from '../model/public-scheme';

type ProductReaderNavProps = {
  modules: PublicSchemeModule[];
  selectedLessonId: string | null;
  /** Id of the module that currently holds the selected lesson, if any. */
  selectedModuleId: string | null;
  onSelectLesson: (lessonId: string) => void;
};

/**
 * The lesson navigation tree, shared verbatim between the desktop sidebar and
 * the mobile/tablet Sheet. Built on the shared {@link OutlineNav} primitive:
 * each module is a collapsible group of lessons, the selected lesson drives
 * the active highlight, and its module auto-expands. Only leaf lessons fire
 * `onSelectLesson` — clicking a module row just toggles it.
 */
export function ProductReaderNav({
  modules,
  selectedLessonId,
  selectedModuleId,
  onSelectLesson,
}: ProductReaderNavProps) {
  const t = useTranslations('product-reader');

  const items: OutlineNavItem[] = modules.map((module, index) => ({
    id: module.id,
    // Modules read brighter than their (muted) lessons, matching the design.
    label: (
      <span className="font-medium text-foreground">
        {index + 1}. {module.title}
      </span>
    ),
    children:
      module.lessons.length > 0
        ? module.lessons.map((lesson) => ({
            id: lesson.id,
            label: lesson.title,
          }))
        : // Keep empty modules visible (and expandable) with a disabled note,
          // matching the previous behaviour.
          [{ id: `${module.id}::empty`, label: t('nav.empty'), disabled: true }],
  }));

  // The selected module and the first one start open; OutlineNav also keeps
  // the active lesson's module expanded on its own.
  const defaultExpandedIds = [modules[0]?.id, selectedModuleId].filter(
    (id): id is string => Boolean(id),
  );

  return (
    <OutlineNav
      items={items}
      ariaLabel={t('nav.ariaLabel')}
      collapsible
      activeId={selectedLessonId ?? undefined}
      defaultExpandedIds={defaultExpandedIds}
      onSelect={(id, item) => {
        // Module rows (with children) only toggle; lessons load.
        if (!item.children?.length) onSelectLesson(id);
      }}
    />
  );
}
