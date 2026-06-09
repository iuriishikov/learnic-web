'use client';

import { ChevronDownIcon, FileTextIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/shared/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/ui/collapsible';

import type { PublicModule } from '../model/public-content';

type ProductReaderNavProps = {
  modules: PublicModule[];
  selectedLessonId: string | null;
  /** Id of the module that currently holds the selected lesson, if any. */
  selectedModuleId: string | null;
  onSelectLesson: (lessonId: string) => void;
};

/**
 * The lesson navigation tree, shared verbatim between the desktop sidebar and
 * the mobile/tablet Sheet. Each module is a collapsible group; the module that
 * owns the selected lesson (and the first module) start open.
 */
export function ProductReaderNav({
  modules,
  selectedLessonId,
  selectedModuleId,
  onSelectLesson,
}: ProductReaderNavProps) {
  return (
    <nav className="flex flex-col gap-1">
      {modules.map((module, index) => (
        <ModuleGroup
          key={module.id}
          module={module}
          ordinal={index + 1}
          selectedLessonId={selectedLessonId}
          defaultOpen={module.id === selectedModuleId || index === 0}
          onSelectLesson={onSelectLesson}
        />
      ))}
    </nav>
  );
}

function ModuleGroup({
  module,
  ordinal,
  selectedLessonId,
  defaultOpen,
  onSelectLesson,
}: {
  module: PublicModule;
  ordinal: number;
  selectedLessonId: string | null;
  defaultOpen: boolean;
  onSelectLesson: (lessonId: string) => void;
}) {
  const t = useTranslations('product-reader');
  const ordinalLabel = String(ordinal).padStart(2, '0');

  return (
    <Collapsible defaultOpen={defaultOpen} className="flex flex-col">
      <CollapsibleTrigger className="group/module flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-muted-foreground transition-colors hover:text-foreground">
        <span className="text-xs font-medium tabular-nums">{ordinalLabel}</span>
        <span className="min-w-0 flex-1 truncate text-xs font-medium uppercase tracking-wide">
          {module.title}
        </span>
        <ChevronDownIcon
          aria-hidden
          className="size-4 shrink-0 transition-transform duration-200 group-data-[panel-open]/module:rotate-180"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        {module.lessons.length === 0 ? (
          <p className="px-2.5 py-1.5 text-xs text-muted-foreground">
            {t('nav.empty')}
          </p>
        ) : (
          <ul className="mt-0.5 flex flex-col gap-0.5 pb-1">
            {module.lessons.map((lesson) => {
              const selected = lesson.id === selectedLessonId;
              return (
                <li key={lesson.id}>
                  <button
                    type="button"
                    onClick={() => onSelectLesson(lesson.id)}
                    aria-current={selected ? 'true' : undefined}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors',
                      selected
                        ? 'bg-brand/10 font-medium text-brand'
                        : 'text-foreground/80 hover:bg-muted',
                    )}
                  >
                    <FileTextIcon className="size-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">
                      {lesson.title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
