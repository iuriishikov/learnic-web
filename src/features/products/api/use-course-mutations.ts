'use client';

import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { useNotify } from '@/shared/lib/notify';

import type {
  CodeBlock,
  CodeBlockLanguage,
  CodeTab,
  CourseDraft,
  DraftLesson,
  DraftModule,
  HtmlBlock,
  KatexBlock,
  LessonBlock,
} from '../model/draft';

import {
  addCodeBlockAction,
  addHtmlBlockAction,
  addKatexBlockAction,
  deleteLessonBlockAction,
  reorderLessonBlocksAction,
  updateCodeBlockAction,
  updateHtmlBlockAction,
  updateKatexBlockAction,
} from './blocks';
import {
  addCourseLessonAction,
  deleteCourseLessonAction,
  moveCourseLessonAction,
  renameCourseLessonAction,
  reorderCourseLessonsAction,
} from './lessons';
import {
  addCourseModuleAction,
  deleteCourseModuleAction,
  renameCourseModuleAction,
  reorderCourseModulesAction,
} from './modules';
import { courseDraftKey } from './use-course-draft';

// Backend rejects whitespace-only KaTeX source (Pydantic strips, then the
// minLength=1 invariant fails). `\,` is a no-op LaTeX spacing command — it's
// a valid 2-char string the server accepts and renders as nothing visible,
// so the UI keeps showing the "click to add formula" empty state via
// `InlineLatexEditor`'s blank check.
const KATEX_BLANK_SOURCE = '\\,';

// Default language for a freshly created code block. Plain stays neutral
// — the author picks a real language from the editor's toolbar.
const CODE_BLANK_LANGUAGE: CodeBlockLanguage = 'plain';

// A fresh code block starts with a single tab (label hidden). Multi-tab
// is opt-in via the editor's "Add tab" button.
const CODE_BLANK_TABS: CodeTab[] = [
  { label: '', source: '', language: CODE_BLANK_LANGUAGE },
];

type MutationContext = {
  previous?: CourseDraft;
};

function snapshot(qc: QueryClient, courseId: string): MutationContext {
  return {
    previous: qc.getQueryData<CourseDraft>(courseDraftKey(courseId)),
  };
}

function restore(
  qc: QueryClient,
  courseId: string,
  ctx: MutationContext | undefined,
) {
  if (ctx?.previous) {
    qc.setQueryData(courseDraftKey(courseId), ctx.previous);
  }
}

function setDraft(
  qc: QueryClient,
  courseId: string,
  fn: (draft: CourseDraft) => CourseDraft,
): CourseDraft | undefined {
  let next: CourseDraft | undefined;
  qc.setQueryData<CourseDraft>(courseDraftKey(courseId), (current) => {
    if (!current) return current;
    next = fn(current);
    return next;
  });
  return next;
}

function reposition<T extends { position: number }>(items: T[]): T[] {
  return items.map((item, index) => ({ ...item, position: index }));
}

function mapModule(
  draft: CourseDraft,
  moduleId: string,
  fn: (m: DraftModule) => DraftModule,
): CourseDraft {
  return {
    ...draft,
    modules: draft.modules.map((m) => (m.id === moduleId ? fn(m) : m)),
  };
}

function mapLesson(
  draft: CourseDraft,
  lessonId: string,
  fn: (l: DraftLesson, parent: DraftModule) => DraftLesson,
): CourseDraft {
  return {
    ...draft,
    modules: draft.modules.map((m) => ({
      ...m,
      lessons: m.lessons.map((l) => (l.id === lessonId ? fn(l, m) : l)),
    })),
  };
}

function findLesson(
  draft: CourseDraft,
  lessonId: string,
): { module: DraftModule; lesson: DraftLesson } | null {
  for (const m of draft.modules) {
    const lesson = m.lessons.find((l) => l.id === lessonId);
    if (lesson) return { module: m, lesson };
  }
  return null;
}

function findBlock(
  draft: CourseDraft,
  blockId: string,
): { lesson: DraftLesson; block: LessonBlock } | null {
  for (const m of draft.modules) {
    for (const l of m.lessons) {
      const block = l.blocks.find((b) => b.id === blockId);
      if (block) return { lesson: l, block };
    }
  }
  return null;
}

function tempId(prefix: string): string {
  return `${prefix}-tmp-${Math.random().toString(36).slice(2, 10)}`;
}

function useFailureToast() {
  const t = useTranslations('teach-products.editor.toast');
  const notify = useNotify();
  return (key: string) => notify.error(t(key));
}

/* ---------- modules ---------- */

export function useAddModuleMutation(courseId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<
    { id: string; tempId: string },
    Error,
    { title: string },
    MutationContext & { tempId: string }
  >({
    mutationFn: async ({ title }) => {
      const result = await addCourseModuleAction({ courseId, title });
      if (!result.ok) throw new Error(result.reason);
      return { id: result.id, tempId: '' };
    },
    onMutate: async ({ title }) => {
      await qc.cancelQueries({ queryKey: courseDraftKey(courseId) });
      const ctx = snapshot(qc, courseId);
      const newId = tempId('module');
      setDraft(qc, courseId, (draft) => ({
        ...draft,
        modules: [
          ...draft.modules,
          {
            id: newId,
            title,
            description: null,
            position: draft.modules.length,
            lessons: [],
          },
        ],
      }));
      return { ...ctx, tempId: newId };
    },
    onSuccess: ({ id }, _vars, ctx) => {
      if (!ctx) return;
      setDraft(qc, courseId, (draft) => ({
        ...draft,
        modules: draft.modules.map((m) =>
          m.id === ctx.tempId ? { ...m, id } : m,
        ),
      }));
    },
    onError: (_err, _vars, ctx) => {
      restore(qc, courseId, ctx);
      fail('addModuleFailed');
    },
  });
}

export function useRenameModuleMutation(courseId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<
    void,
    Error,
    { moduleId: string; title: string },
    MutationContext
  >({
    mutationFn: async ({ moduleId, title }) => {
      const result = await renameCourseModuleAction({
        courseId,
        moduleId,
        title,
      });
      if (!result.ok) throw new Error(result.reason);
    },
    onMutate: async ({ moduleId, title }) => {
      await qc.cancelQueries({ queryKey: courseDraftKey(courseId) });
      const ctx = snapshot(qc, courseId);
      setDraft(qc, courseId, (draft) =>
        mapModule(draft, moduleId, (m) => ({ ...m, title })),
      );
      return ctx;
    },
    onError: (_err, _vars, ctx) => {
      restore(qc, courseId, ctx);
      fail('renameModuleFailed');
    },
  });
}

export function useDeleteModuleMutation(courseId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<void, Error, { moduleId: string }, MutationContext>({
    mutationFn: async ({ moduleId }) => {
      const result = await deleteCourseModuleAction({ courseId, moduleId });
      if (!result.ok) throw new Error(result.reason);
    },
    onMutate: async ({ moduleId }) => {
      await qc.cancelQueries({ queryKey: courseDraftKey(courseId) });
      const ctx = snapshot(qc, courseId);
      setDraft(qc, courseId, (draft) => ({
        ...draft,
        modules: reposition(draft.modules.filter((m) => m.id !== moduleId)),
      }));
      return ctx;
    },
    onError: (_err, _vars, ctx) => {
      restore(qc, courseId, ctx);
      fail('deleteModuleFailed');
    },
  });
}

export function useReorderModulesMutation(courseId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<
    void,
    Error,
    { orderedIds: string[] },
    MutationContext
  >({
    mutationFn: async ({ orderedIds }) => {
      const result = await reorderCourseModulesAction({ courseId, orderedIds });
      if (!result.ok) throw new Error(result.reason);
    },
    onMutate: async ({ orderedIds }) => {
      await qc.cancelQueries({ queryKey: courseDraftKey(courseId) });
      const ctx = snapshot(qc, courseId);
      setDraft(qc, courseId, (draft) => {
        const byId = new Map(draft.modules.map((m) => [m.id, m]));
        const ordered = orderedIds
          .map((id) => byId.get(id))
          .filter((m): m is DraftModule => Boolean(m));
        return { ...draft, modules: reposition(ordered) };
      });
      return ctx;
    },
    onError: (_err, _vars, ctx) => {
      restore(qc, courseId, ctx);
      fail('reorderModulesFailed');
    },
  });
}

/* ---------- lessons ---------- */

export function useAddLessonMutation(courseId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<
    { id: string; tempId: string },
    Error,
    { moduleId: string; title: string },
    MutationContext & { tempId: string }
  >({
    mutationFn: async ({ moduleId, title }) => {
      const result = await addCourseLessonAction({
        courseId,
        moduleId,
        title,
      });
      if (!result.ok) throw new Error(result.reason);
      return { id: result.id, tempId: '' };
    },
    onMutate: async ({ moduleId, title }) => {
      await qc.cancelQueries({ queryKey: courseDraftKey(courseId) });
      const ctx = snapshot(qc, courseId);
      const newId = tempId('lesson');
      setDraft(qc, courseId, (draft) =>
        mapModule(draft, moduleId, (m) => ({
          ...m,
          lessons: [
            ...m.lessons,
            {
              id: newId,
              title,
              position: m.lessons.length,
              blocks: [],
            },
          ],
        })),
      );
      return { ...ctx, tempId: newId };
    },
    onSuccess: ({ id }, _vars, ctx) => {
      if (!ctx) return;
      setDraft(qc, courseId, (draft) =>
        mapLesson(draft, ctx.tempId, (l) => ({ ...l, id })),
      );
    },
    onError: (_err, _vars, ctx) => {
      restore(qc, courseId, ctx);
      fail('addLessonFailed');
    },
  });
}

export function useRenameLessonMutation(courseId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<
    void,
    Error,
    { lessonId: string; title: string },
    MutationContext
  >({
    mutationFn: async ({ lessonId, title }) => {
      const result = await renameCourseLessonAction({
        courseId,
        lessonId,
        title,
      });
      if (!result.ok) throw new Error(result.reason);
    },
    onMutate: async ({ lessonId, title }) => {
      await qc.cancelQueries({ queryKey: courseDraftKey(courseId) });
      const ctx = snapshot(qc, courseId);
      setDraft(qc, courseId, (draft) =>
        mapLesson(draft, lessonId, (l) => ({ ...l, title })),
      );
      return ctx;
    },
    onError: (_err, _vars, ctx) => {
      restore(qc, courseId, ctx);
      fail('renameLessonFailed');
    },
  });
}

export function useDeleteLessonMutation(courseId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<void, Error, { lessonId: string }, MutationContext>({
    mutationFn: async ({ lessonId }) => {
      const result = await deleteCourseLessonAction({ courseId, lessonId });
      if (!result.ok) throw new Error(result.reason);
    },
    onMutate: async ({ lessonId }) => {
      await qc.cancelQueries({ queryKey: courseDraftKey(courseId) });
      const ctx = snapshot(qc, courseId);
      setDraft(qc, courseId, (draft) => ({
        ...draft,
        modules: draft.modules.map((m) => ({
          ...m,
          lessons: reposition(m.lessons.filter((l) => l.id !== lessonId)),
        })),
      }));
      return ctx;
    },
    onError: (_err, _vars, ctx) => {
      restore(qc, courseId, ctx);
      fail('deleteLessonFailed');
    },
  });
}

export function useReorderLessonsMutation(courseId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<
    void,
    Error,
    { moduleId: string; orderedIds: string[] },
    MutationContext
  >({
    mutationFn: async ({ moduleId, orderedIds }) => {
      const result = await reorderCourseLessonsAction({
        courseId,
        moduleId,
        orderedIds,
      });
      if (!result.ok) throw new Error(result.reason);
    },
    onMutate: async ({ moduleId, orderedIds }) => {
      await qc.cancelQueries({ queryKey: courseDraftKey(courseId) });
      const ctx = snapshot(qc, courseId);
      setDraft(qc, courseId, (draft) =>
        mapModule(draft, moduleId, (m) => {
          const byId = new Map(m.lessons.map((l) => [l.id, l]));
          const ordered = orderedIds
            .map((id) => byId.get(id))
            .filter((l): l is DraftLesson => Boolean(l));
          return { ...m, lessons: reposition(ordered) };
        }),
      );
      return ctx;
    },
    onError: (_err, _vars, ctx) => {
      restore(qc, courseId, ctx);
      fail('reorderLessonsFailed');
    },
  });
}

export function useMoveLessonMutation(courseId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<
    void,
    Error,
    { lessonId: string; targetModuleId: string },
    MutationContext
  >({
    mutationFn: async ({ lessonId, targetModuleId }) => {
      const result = await moveCourseLessonAction({
        courseId,
        lessonId,
        targetModuleId,
      });
      if (!result.ok) throw new Error(result.reason);
    },
    onMutate: async ({ lessonId, targetModuleId }) => {
      await qc.cancelQueries({ queryKey: courseDraftKey(courseId) });
      const ctx = snapshot(qc, courseId);
      setDraft(qc, courseId, (draft) => {
        const found = findLesson(draft, lessonId);
        if (!found) return draft;
        const targetExists = draft.modules.some((m) => m.id === targetModuleId);
        if (!targetExists || found.module.id === targetModuleId) return draft;
        return {
          ...draft,
          modules: draft.modules.map((m) => {
            if (m.id === found.module.id) {
              return {
                ...m,
                lessons: reposition(
                  m.lessons.filter((l) => l.id !== lessonId),
                ),
              };
            }
            if (m.id === targetModuleId) {
              return {
                ...m,
                lessons: reposition([
                  ...m.lessons,
                  { ...found.lesson, position: m.lessons.length },
                ]),
              };
            }
            return m;
          }),
        };
      });
      return ctx;
    },
    onError: (_err, _vars, ctx) => {
      restore(qc, courseId, ctx);
      fail('moveLessonFailed');
    },
  });
}

/* ---------- blocks ---------- */

export function useAddBlockMutation(courseId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<
    { id: string; tempId: string },
    Error,
    { lessonId: string; type: 'html' | 'katex' | 'code' },
    MutationContext & { tempId: string }
  >({
    mutationFn: async ({ lessonId, type }) => {
      if (type === 'html') {
        const result = await addHtmlBlockAction({
          courseId,
          lessonId,
          html: '<p></p>',
        });
        if (!result.ok) throw new Error(result.reason);
        return { id: result.id, tempId: '' };
      }
      if (type === 'code') {
        const result = await addCodeBlockAction({
          courseId,
          lessonId,
          tabs: CODE_BLANK_TABS,
        });
        if (!result.ok) throw new Error(result.reason);
        return { id: result.id, tempId: '' };
      }
      const result = await addKatexBlockAction({
        courseId,
        lessonId,
        source: KATEX_BLANK_SOURCE,
      });
      if (!result.ok) throw new Error(result.reason);
      return { id: result.id, tempId: '' };
    },
    onMutate: async ({ lessonId, type }) => {
      await qc.cancelQueries({ queryKey: courseDraftKey(courseId) });
      const ctx = snapshot(qc, courseId);
      const newId = tempId('block');
      setDraft(qc, courseId, (draft) =>
        mapLesson(draft, lessonId, (l) => {
          const block: LessonBlock =
            type === 'html'
              ? {
                  type: 'html',
                  id: newId,
                  position: l.blocks.length,
                  html: '<p></p>',
                }
              : type === 'code'
                ? {
                    type: 'code',
                    id: newId,
                    position: l.blocks.length,
                    tabs: CODE_BLANK_TABS,
                  }
                : {
                    type: 'katex',
                    id: newId,
                    position: l.blocks.length,
                    source: KATEX_BLANK_SOURCE,
                  };
          return { ...l, blocks: [...l.blocks, block] };
        }),
      );
      return { ...ctx, tempId: newId };
    },
    onSuccess: ({ id }, _vars, ctx) => {
      if (!ctx) return;
      setDraft(qc, courseId, (draft) => ({
        ...draft,
        modules: draft.modules.map((m) => ({
          ...m,
          lessons: m.lessons.map((l) => ({
            ...l,
            blocks: l.blocks.map((b) =>
              b.id === ctx.tempId ? ({ ...b, id } as LessonBlock) : b,
            ),
          })),
        })),
      }));
    },
    onError: (_err, _vars, ctx) => {
      restore(qc, courseId, ctx);
      fail('addBlockFailed');
    },
  });
}

export function useUpdateHtmlBlockMutation(courseId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<
    void,
    Error,
    { blockId: string; html: string },
    MutationContext
  >({
    mutationFn: async ({ blockId, html }) => {
      const result = await updateHtmlBlockAction({ courseId, blockId, html });
      if (!result.ok) throw new Error(result.reason);
    },
    onMutate: async ({ blockId, html }) => {
      await qc.cancelQueries({ queryKey: courseDraftKey(courseId) });
      const ctx = snapshot(qc, courseId);
      setDraft(qc, courseId, (draft) => ({
        ...draft,
        modules: draft.modules.map((m) => ({
          ...m,
          lessons: m.lessons.map((l) => ({
            ...l,
            blocks: l.blocks.map((b) =>
              b.id === blockId && b.type === 'html'
                ? ({ ...b, html } satisfies HtmlBlock)
                : b,
            ),
          })),
        })),
      }));
      return ctx;
    },
    onError: (_err, _vars, ctx) => {
      restore(qc, courseId, ctx);
      fail('updateBlockFailed');
    },
  });
}

export function useUpdateKatexBlockMutation(courseId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<
    void,
    Error,
    { blockId: string; source: string },
    MutationContext
  >({
    mutationFn: async ({ blockId, source }) => {
      const result = await updateKatexBlockAction({
        courseId,
        blockId,
        source,
      });
      if (!result.ok) throw new Error(result.reason);
    },
    onMutate: async ({ blockId, source }) => {
      await qc.cancelQueries({ queryKey: courseDraftKey(courseId) });
      const ctx = snapshot(qc, courseId);
      setDraft(qc, courseId, (draft) => ({
        ...draft,
        modules: draft.modules.map((m) => ({
          ...m,
          lessons: m.lessons.map((l) => ({
            ...l,
            blocks: l.blocks.map((b) =>
              b.id === blockId && b.type === 'katex'
                ? ({ ...b, source } satisfies KatexBlock)
                : b,
            ),
          })),
        })),
      }));
      return ctx;
    },
    onError: (_err, _vars, ctx) => {
      restore(qc, courseId, ctx);
      fail('updateBlockFailed');
    },
  });
}

export function useUpdateCodeBlockMutation(courseId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<
    void,
    Error,
    { blockId: string; tabs: CodeTab[] },
    MutationContext
  >({
    mutationFn: async ({ blockId, tabs }) => {
      const result = await updateCodeBlockAction({
        courseId,
        blockId,
        tabs,
      });
      if (!result.ok) throw new Error(result.reason);
    },
    onMutate: async ({ blockId, tabs }) => {
      await qc.cancelQueries({ queryKey: courseDraftKey(courseId) });
      const ctx = snapshot(qc, courseId);
      setDraft(qc, courseId, (draft) => ({
        ...draft,
        modules: draft.modules.map((m) => ({
          ...m,
          lessons: m.lessons.map((l) => ({
            ...l,
            blocks: l.blocks.map((b) =>
              b.id === blockId && b.type === 'code'
                ? ({ ...b, tabs } satisfies CodeBlock)
                : b,
            ),
          })),
        })),
      }));
      return ctx;
    },
    onError: (_err, _vars, ctx) => {
      restore(qc, courseId, ctx);
      fail('updateBlockFailed');
    },
  });
}

export function useDeleteBlockMutation(courseId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<void, Error, { blockId: string }, MutationContext>({
    mutationFn: async ({ blockId }) => {
      const result = await deleteLessonBlockAction({ courseId, blockId });
      if (!result.ok) throw new Error(result.reason);
    },
    onMutate: async ({ blockId }) => {
      await qc.cancelQueries({ queryKey: courseDraftKey(courseId) });
      const ctx = snapshot(qc, courseId);
      setDraft(qc, courseId, (draft) => ({
        ...draft,
        modules: draft.modules.map((m) => ({
          ...m,
          lessons: m.lessons.map((l) => ({
            ...l,
            blocks: reposition(l.blocks.filter((b) => b.id !== blockId)),
          })),
        })),
      }));
      return ctx;
    },
    onError: (_err, _vars, ctx) => {
      restore(qc, courseId, ctx);
      fail('deleteBlockFailed');
    },
  });
}

export function useReorderBlocksMutation(courseId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<
    void,
    Error,
    { lessonId: string; orderedIds: string[] },
    MutationContext
  >({
    mutationFn: async ({ lessonId, orderedIds }) => {
      const result = await reorderLessonBlocksAction({
        courseId,
        lessonId,
        orderedIds,
      });
      if (!result.ok) throw new Error(result.reason);
    },
    onMutate: async ({ lessonId, orderedIds }) => {
      await qc.cancelQueries({ queryKey: courseDraftKey(courseId) });
      const ctx = snapshot(qc, courseId);
      setDraft(qc, courseId, (draft) =>
        mapLesson(draft, lessonId, (l) => {
          const byId = new Map(l.blocks.map((b) => [b.id, b]));
          const ordered = orderedIds
            .map((id) => byId.get(id))
            .filter((b): b is LessonBlock => Boolean(b));
          return {
            ...l,
            blocks: reposition(ordered).map((b, index) => ({
              ...b,
              position: index,
            })),
          };
        }),
      );
      return ctx;
    },
    onError: (_err, _vars, ctx) => {
      restore(qc, courseId, ctx);
      fail('reorderBlocksFailed');
    },
  });
}

/* ---------- helpers re-exported for callers that need to inspect draft ---------- */

export { findLesson, findBlock };
