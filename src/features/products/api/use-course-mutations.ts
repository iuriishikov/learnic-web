'use client';

import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import { useNotify } from '@/shared/lib/notify';

import type {
  ChoiceOption,
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
  type ChoiceOptionDraftInput,
  addCodeBlockAction,
  addCollageItemAction,
  addFileBlockAction,
  addHtmlBlockAction,
  addKatexBlockAction,
  addMultiChoiceBlockAction,
  addPhotoCollageBlockAction,
  addSingleChoiceBlockAction,
  addTextInputBlockAction,
  addVideoFileBlockAction,
  deleteLessonBlockAction,
  removeCollageItemAction,
  reorderCollageItemsAction,
  reorderLessonBlocksAction,
  updateCodeBlockAction,
  updateCollageItemCaptionAction,
  updateCollageTitleAction,
  updateFileBlockAction,
  updateHtmlBlockAction,
  updateKatexBlockAction,
  updateMultiChoiceBlockAction,
  updateSingleChoiceBlockAction,
  updateTextInputBlockAction,
  updateVideoFileBlockAction,
} from './blocks';
import type { BlockMutationResult } from './_shared';
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

// Fresh blocks start empty — the author fills them in inside the editor.
const KATEX_BLANK_SOURCE = '';

// Default language for a freshly created code block. Plain stays neutral
// — the author picks a real language from the editor's toolbar.
const CODE_BLANK_LANGUAGE: CodeBlockLanguage = 'plain';

const CODE_BLANK_TABS: CodeTab[] = [
  { label: '', source: '', language: CODE_BLANK_LANGUAGE },
];

const CHOICE_BLANK_OPTIONS: ChoiceOptionDraftInput[] = [
  { label: '', isCorrect: true },
  { label: '', isCorrect: false },
];

const TEXT_INPUT_BLANK_ACCEPTED: string[] = [''];

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
      setDraft(qc, courseId, (draft) => {
        if (draft.modules.some((m) => m.id === id)) {
          return {
            ...draft,
            modules: draft.modules.filter((m) => m.id !== ctx.tempId),
          };
        }
        return {
          ...draft,
          modules: draft.modules.map((m) =>
            m.id === ctx.tempId ? { ...m, id } : m,
          ),
        };
      });
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
      setDraft(qc, courseId, (draft) => {
        if (findLesson(draft, id)) {
          return {
            ...draft,
            modules: draft.modules.map((m) => ({
              ...m,
              lessons: m.lessons.filter((l) => l.id !== ctx.tempId),
            })),
          };
        }
        return mapLesson(draft, ctx.tempId, (l) => ({ ...l, id }));
      });
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

export type AddableBlockType =
  | 'html'
  | 'katex'
  | 'code'
  | 'single_choice'
  | 'multi_choice'
  | 'text_input';

function _buildOptimisticBlock(
  type: AddableBlockType,
  newId: string,
  position: number,
): LessonBlock {
  if (type === 'html') {
    return { type: 'html', id: newId, position, html: '' };
  }
  if (type === 'code') {
    return { type: 'code', id: newId, position, tabs: CODE_BLANK_TABS };
  }
  if (type === 'katex') {
    return {
      type: 'katex',
      id: newId,
      position,
      source: KATEX_BLANK_SOURCE,
    };
  }
  if (type === 'single_choice' || type === 'multi_choice') {
    const opts: ChoiceOption[] = CHOICE_BLANK_OPTIONS.map((o, i) => ({
      oid: `${newId}-opt-${i}`,
      label: o.label,
    }));
    if (type === 'single_choice') {
      return {
        type: 'single_choice',
        id: newId,
        position,
        options: opts,
        correctOptionId: opts[0].oid,
      };
    }
    return {
      type: 'multi_choice',
      id: newId,
      position,
      options: opts,
      correctOptionIds: [opts[0].oid],
    };
  }
  return {
    type: 'text_input',
    id: newId,
    position,
    acceptedAnswers: TEXT_INPUT_BLANK_ACCEPTED,
    caseSensitive: false,
    trimWhitespace: true,
  };
}

export function useAddBlockMutation(courseId: string) {
  const qc = useQueryClient();
  const fail = useFailureToast();
  return useMutation<
    { id: string; tempId: string },
    Error,
    { lessonId: string; type: AddableBlockType },
    MutationContext & { tempId: string }
  >({
    mutationFn: async ({ lessonId, type }) => {
      if (type === 'html') {
        const result = await addHtmlBlockAction({
          courseId,
          lessonId,
          html: '',
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
      if (type === 'katex') {
        const result = await addKatexBlockAction({
          courseId,
          lessonId,
          source: KATEX_BLANK_SOURCE,
        });
        if (!result.ok) throw new Error(result.reason);
        return { id: result.id, tempId: '' };
      }
      if (type === 'single_choice') {
        const result = await addSingleChoiceBlockAction({
          courseId,
          lessonId,
          options: CHOICE_BLANK_OPTIONS,
        });
        if (!result.ok) throw new Error(result.reason);
        return { id: result.id, tempId: '' };
      }
      if (type === 'multi_choice') {
        const result = await addMultiChoiceBlockAction({
          courseId,
          lessonId,
          options: CHOICE_BLANK_OPTIONS,
        });
        if (!result.ok) throw new Error(result.reason);
        return { id: result.id, tempId: '' };
      }
      const result = await addTextInputBlockAction({
        courseId,
        lessonId,
        acceptedAnswers: TEXT_INPUT_BLANK_ACCEPTED,
        caseSensitive: false,
        trimWhitespace: true,
      });
      if (!result.ok) throw new Error(result.reason);
      return { id: result.id, tempId: '' };
    },
    onMutate: async ({ lessonId, type }) => {
      await qc.cancelQueries({ queryKey: courseDraftKey(courseId) });
      const ctx = snapshot(qc, courseId);
      const newId = tempId('block');
      setDraft(qc, courseId, (draft) =>
        mapLesson(draft, lessonId, (l) => ({
          ...l,
          blocks: [
            ...l.blocks,
            _buildOptimisticBlock(type, newId, l.blocks.length),
          ],
        })),
      );
      return { ...ctx, tempId: newId };
    },
    onSuccess: ({ id }, _vars, ctx) => {
      if (!ctx) return;
      setDraft(qc, courseId, (draft) => {
        if (findBlock(draft, id)) {
          return {
            ...draft,
            modules: draft.modules.map((m) => ({
              ...m,
              lessons: m.lessons.map((l) => ({
                ...l,
                blocks: l.blocks.filter((b) => b.id !== ctx.tempId),
              })),
            })),
          };
        }
        return {
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
        };
      });
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

// The answer-block update mutations skip the on-mutate optimistic
// dance: the editor already shows the in-progress local state
// (the editor component owns it via ``useState``). The server call
// only persists; the WS `block_updated` event keeps the cache in
// sync via `applyContentEvent`.

export function useUpdateSingleChoiceBlockMutation(courseId: string) {
  const fail = useFailureToast();
  return useMutation<
    void,
    Error,
    { blockId: string; options: ChoiceOptionDraftInput[] }
  >({
    mutationFn: async ({ blockId, options }) => {
      const result = await updateSingleChoiceBlockAction({
        courseId,
        blockId,
        options,
      });
      if (!result.ok) throw new Error(result.reason);
    },
    onError: () => fail('updateBlockFailed'),
  });
}

export function useUpdateMultiChoiceBlockMutation(courseId: string) {
  const fail = useFailureToast();
  return useMutation<
    void,
    Error,
    { blockId: string; options: ChoiceOptionDraftInput[] }
  >({
    mutationFn: async ({ blockId, options }) => {
      const result = await updateMultiChoiceBlockAction({
        courseId,
        blockId,
        options,
      });
      if (!result.ok) throw new Error(result.reason);
    },
    onError: () => fail('updateBlockFailed'),
  });
}

export function useUpdateTextInputBlockMutation(courseId: string) {
  const fail = useFailureToast();
  return useMutation<
    void,
    Error,
    {
      blockId: string;
      acceptedAnswers: string[];
      caseSensitive: boolean;
      trimWhitespace: boolean;
    }
  >({
    mutationFn: async (args) => {
      const result = await updateTextInputBlockAction({
        courseId,
        blockId: args.blockId,
        acceptedAnswers: args.acceptedAnswers,
        caseSensitive: args.caseSensitive,
        trimWhitespace: args.trimWhitespace,
      });
      if (!result.ok) throw new Error(result.reason);
    },
    onError: () => fail('updateBlockFailed'),
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

/* ---------- file / video-file / photo-collage (multipart, no optimistic) ---------- */

// File-backed mutations skip the optimistic dance: the block can't
// exist client-side before the server has minted both a `File` row
// and a `LessonBlock` row from the multipart body. The mutation
// returns the discriminated `BlockMutationResult` verbatim so the
// calling editor can surface quota / wrong-content-type errors with
// the precise metadata the backend carried back. On success we splice
// the server-built block straight into the draft cache (`setDraft`),
// skipping the follow-up GET that `invalidateQueries` would trigger.

// Replace an existing block by id. Used by the update mutations
// (file/video-file/photo-collage) — the response carries the new
// block exactly the way the next GET would render it, so we drop in
// the entity verbatim and re-sort siblings by `position` to be safe.
function replaceBlock(
  draft: CourseDraft,
  blockId: string,
  newBlock: LessonBlock,
): CourseDraft {
  return {
    ...draft,
    modules: draft.modules.map((m) => ({
      ...m,
      lessons: m.lessons.map((l) => {
        if (!l.blocks.some((b) => b.id === blockId)) return l;
        return {
          ...l,
          blocks: l.blocks.map((b) => (b.id === blockId ? newBlock : b)),
        };
      }),
    })),
  };
}

// Append a server-built block to the target lesson. We trust the
// `position` the backend assigned and don't re-position siblings —
// the backend appends, so the new block sits at the end already.
function appendBlock(
  draft: CourseDraft,
  lessonId: string,
  newBlock: LessonBlock,
): CourseDraft {
  return mapLesson(draft, lessonId, (l) => ({
    ...l,
    blocks: [...l.blocks, newBlock],
  }));
}

// File / video-file / photo-collage mutations parse the full block out
// of the 2xx response so we can splice it into the draft cache without
// a follow-up GET. When the response body is missing or unparseable
// (legacy 204 endpoint, transient body issue) we fall back to a draft
// invalidation so the editor still converges on the server state.
function mergeBlockOrInvalidate(
  qc: QueryClient,
  courseId: string,
  block: LessonBlock | undefined,
  mutate: (draft: CourseDraft, block: LessonBlock) => CourseDraft,
): void {
  if (block) {
    setDraft(qc, courseId, (draft) => mutate(draft, block));
    return;
  }
  void qc.invalidateQueries({ queryKey: courseDraftKey(courseId) });
}

export type AddFileBlockVars = {
  lessonId: string;
  file: File;
  title?: string | null;
};

export function useAddFileBlockMutation(courseId: string) {
  const qc = useQueryClient();
  return useMutation<BlockMutationResult, never, AddFileBlockVars>({
    mutationFn: async ({ lessonId, file, title }) => {
      const fd = new FormData();
      fd.append('file', file);
      if (title) fd.append('title', title);
      return addFileBlockAction(courseId, lessonId, fd);
    },
    onSuccess: (result, vars) => {
      if (result.ok) {
        mergeBlockOrInvalidate(qc, courseId, result.block, (draft, block) =>
          appendBlock(draft, vars.lessonId, block),
        );
      }
    },
  });
}

export type UpdateFileBlockVars = {
  blockId: string;
  file?: File | null;
  title?: string | null;
};

export function useUpdateFileBlockMutation(courseId: string) {
  const qc = useQueryClient();
  return useMutation<BlockMutationResult, never, UpdateFileBlockVars>({
    mutationFn: async ({ blockId, file, title }) => {
      const fd = new FormData();
      if (file) fd.append('file', file);
      if (title) fd.append('title', title);
      return updateFileBlockAction(courseId, blockId, fd);
    },
    onSuccess: (result, vars) => {
      if (result.ok) {
        mergeBlockOrInvalidate(qc, courseId, result.block, (draft, block) =>
          replaceBlock(draft, vars.blockId, block),
        );
      }
    },
  });
}

export type AddVideoFileBlockVars = AddFileBlockVars;

export function useAddVideoFileBlockMutation(courseId: string) {
  const qc = useQueryClient();
  return useMutation<BlockMutationResult, never, AddVideoFileBlockVars>({
    mutationFn: async ({ lessonId, file, title }) => {
      const fd = new FormData();
      fd.append('file', file);
      if (title) fd.append('title', title);
      return addVideoFileBlockAction(courseId, lessonId, fd);
    },
    onSuccess: (result, vars) => {
      if (result.ok) {
        mergeBlockOrInvalidate(qc, courseId, result.block, (draft, block) =>
          appendBlock(draft, vars.lessonId, block),
        );
      }
    },
  });
}

export type UpdateVideoFileBlockVars = UpdateFileBlockVars;

export function useUpdateVideoFileBlockMutation(courseId: string) {
  const qc = useQueryClient();
  return useMutation<BlockMutationResult, never, UpdateVideoFileBlockVars>({
    mutationFn: async ({ blockId, file, title }) => {
      const fd = new FormData();
      if (file) fd.append('file', file);
      if (title) fd.append('title', title);
      return updateVideoFileBlockAction(courseId, blockId, fd);
    },
    onSuccess: (result, vars) => {
      if (result.ok) {
        mergeBlockOrInvalidate(qc, courseId, result.block, (draft, block) =>
          replaceBlock(draft, vars.blockId, block),
        );
      }
    },
  });
}

export type CollageItemDraft = {
  file: File;
  caption?: string | null;
};

export type AddPhotoCollageBlockVars = {
  lessonId: string;
  items: CollageItemDraft[];
  title?: string | null;
};

function _appendCollageItems(fd: FormData, items: CollageItemDraft[]) {
  for (const item of items) {
    fd.append('files', item.file);
  }
  // Captions go as a parallel list — empty string at a position is
  // "no caption for this photo" (clients can't omit individual
  // entries in a multipart list).
  for (const item of items) {
    fd.append('captions', item.caption ?? '');
  }
}

export function useAddPhotoCollageBlockMutation(courseId: string) {
  const qc = useQueryClient();
  return useMutation<BlockMutationResult, never, AddPhotoCollageBlockVars>({
    mutationFn: async ({ lessonId, items, title }) => {
      const fd = new FormData();
      _appendCollageItems(fd, items);
      if (title) fd.append('title', title);
      return addPhotoCollageBlockAction(courseId, lessonId, fd);
    },
    onSuccess: (result, vars) => {
      if (result.ok) {
        mergeBlockOrInvalidate(qc, courseId, result.block, (draft, block) =>
          appendBlock(draft, vars.lessonId, block),
        );
      }
    },
  });
}

// Granular per-item collage mutations. Each one targets a single
// endpoint on the backend and returns the full updated block in the
// response body so the SPA can splice the new state into the cache
// without a follow-up GET. Optimistic UI is handled inside the
// editor's local state (the mutations themselves are not optimistic);
// on success the cache is reconciled from the server response, on
// failure the editor's `useEffect(setItems(...), [block])` brings
// local state back in sync with the unchanged cache.

export type AddCollageItemVars = {
  blockId: string;
  file: File;
  caption: string | null;
};

export function useAddCollageItemMutation(courseId: string) {
  const qc = useQueryClient();
  return useMutation<BlockMutationResult, never, AddCollageItemVars>({
    mutationFn: async ({ blockId, file, caption }) => {
      const fd = new FormData();
      fd.append('file', file);
      if (caption !== null && caption !== '') fd.append('caption', caption);
      return addCollageItemAction(courseId, blockId, fd);
    },
    onSuccess: (result, vars) => {
      if (result.ok) {
        mergeBlockOrInvalidate(qc, courseId, result.block, (draft, block) =>
          replaceBlock(draft, vars.blockId, block),
        );
      }
    },
  });
}

export type RemoveCollageItemVars = {
  blockId: string;
  itemId: string;
};

export function useRemoveCollageItemMutation(courseId: string) {
  const qc = useQueryClient();
  return useMutation<BlockMutationResult, never, RemoveCollageItemVars>({
    mutationFn: async ({ blockId, itemId }) =>
      removeCollageItemAction(courseId, blockId, itemId),
    onSuccess: (result, vars) => {
      if (result.ok) {
        mergeBlockOrInvalidate(qc, courseId, result.block, (draft, block) =>
          replaceBlock(draft, vars.blockId, block),
        );
      }
    },
  });
}

export type ReorderCollageItemsVars = {
  blockId: string;
  orderedIds: string[];
};

export function useReorderCollageItemsMutation(courseId: string) {
  const qc = useQueryClient();
  return useMutation<BlockMutationResult, never, ReorderCollageItemsVars>({
    mutationFn: async ({ blockId, orderedIds }) =>
      reorderCollageItemsAction(courseId, blockId, orderedIds),
    onSuccess: (result, vars) => {
      if (result.ok) {
        mergeBlockOrInvalidate(qc, courseId, result.block, (draft, block) =>
          replaceBlock(draft, vars.blockId, block),
        );
      }
    },
  });
}

export type UpdateCollageItemCaptionVars = {
  blockId: string;
  itemId: string;
  caption: string | null;
};

export function useUpdateCollageItemCaptionMutation(courseId: string) {
  const qc = useQueryClient();
  return useMutation<BlockMutationResult, never, UpdateCollageItemCaptionVars>({
    mutationFn: async ({ blockId, itemId, caption }) =>
      updateCollageItemCaptionAction(courseId, blockId, itemId, caption),
    onSuccess: (result, vars) => {
      if (result.ok) {
        mergeBlockOrInvalidate(qc, courseId, result.block, (draft, block) =>
          replaceBlock(draft, vars.blockId, block),
        );
      }
    },
  });
}

export type UpdateCollageTitleVars = {
  blockId: string;
  title: string | null;
};

export function useUpdateCollageTitleMutation(courseId: string) {
  const qc = useQueryClient();
  return useMutation<BlockMutationResult, never, UpdateCollageTitleVars>({
    mutationFn: async ({ blockId, title }) =>
      updateCollageTitleAction(courseId, blockId, title),
    onSuccess: (result, vars) => {
      if (result.ok) {
        mergeBlockOrInvalidate(qc, courseId, result.block, (draft, block) =>
          replaceBlock(draft, vars.blockId, block),
        );
      }
    },
  });
}

/* ---------- helpers re-exported for callers that need to inspect draft ---------- */

export { findLesson, findBlock };
