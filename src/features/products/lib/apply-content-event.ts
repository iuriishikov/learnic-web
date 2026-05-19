import type { QueryClient } from '@tanstack/react-query';

import { courseDraftKey } from '../api/use-course-draft';
import { courseReleasesKey } from '../api/use-course-releases';
import { productKey } from '../api/use-product';
import type { CourseDraft, DraftLesson, DraftModule } from '../model/draft';

import {
  type DraftLessonResponse,
  type DraftModuleResponse,
  type LessonBlockResponse,
  fromBlockResponse,
  fromLessonResponse,
  fromModuleResponse,
} from './draft-wire';
import type { EventEnvelope } from './events-channel';

/**
 * Course-content `kind` values fanned in over the unified product
 * channel (`WS /products/{product_id}/events`). The set is fixed
 * by the spec's `ContentEventKind` enum.
 *
 * Each event carries enough state in `payload` to apply the change
 * in place via `setQueryData`. Container events (`module_added`,
 * `lesson_added`, `block_added`, `block_updated`) carry a full
 * snapshot of the affected entity in the same shape
 * `GET /content/draft` returns, deserialized through the shared
 * mappers in `lib/draft-wire`. The only refetches that remain are
 * `release_created` (releases list + product status) and
 * `draft_reset` (full tree replaced server-side).
 */
export type ContentEventKind =
  | 'module_added'
  | 'module_renamed'
  | 'module_description_updated'
  | 'modules_reordered'
  | 'module_deleted'
  | 'lesson_added'
  | 'lesson_renamed'
  | 'lesson_moved'
  | 'lessons_reordered'
  | 'lesson_deleted'
  | 'block_added'
  | 'block_updated'
  | 'block_deleted'
  | 'blocks_reordered'
  | 'release_created'
  | 'draft_reset';

const CONTENT_EVENT_KINDS: ReadonlySet<string> = new Set<ContentEventKind>([
  'module_added',
  'module_renamed',
  'module_description_updated',
  'modules_reordered',
  'module_deleted',
  'lesson_added',
  'lesson_renamed',
  'lesson_moved',
  'lessons_reordered',
  'lesson_deleted',
  'block_added',
  'block_updated',
  'block_deleted',
  'blocks_reordered',
  'release_created',
  'draft_reset',
]);

export function isContentEventKind(kind: string): kind is ContentEventKind {
  return CONTENT_EVENT_KINDS.has(kind);
}

export function applyContentEvent(
  qc: QueryClient,
  courseId: string,
  event: EventEnvelope<ContentEventKind>,
): void {
  const { kind, payload } = event;

  switch (kind) {
    case 'module_renamed': {
      const moduleId = strField(payload, 'module_id');
      const title = strField(payload, 'title');
      if (moduleId && title !== undefined) {
        patchDraft(qc, courseId, (draft) =>
          mapModule(draft, moduleId, (m) => ({ ...m, title })),
        );
      }
      return;
    }
    case 'module_description_updated': {
      const moduleId = strField(payload, 'module_id');
      if (moduleId) {
        const description = nullableStrField(payload, 'description');
        patchDraft(qc, courseId, (draft) =>
          mapModule(draft, moduleId, (m) => ({ ...m, description })),
        );
      }
      return;
    }
    case 'lesson_renamed': {
      const lessonId = strField(payload, 'lesson_id');
      const title = strField(payload, 'title');
      if (lessonId && title !== undefined) {
        patchDraft(qc, courseId, (draft) =>
          mapLesson(draft, lessonId, (l) => ({ ...l, title })),
        );
      }
      return;
    }
    case 'module_deleted': {
      const moduleId = strField(payload, 'module_id');
      if (moduleId) {
        patchDraft(qc, courseId, (draft) => ({
          ...draft,
          modules: reposition(
            draft.modules.filter((m) => m.id !== moduleId),
          ),
        }));
      }
      return;
    }
    case 'lesson_deleted': {
      const lessonId = strField(payload, 'lesson_id');
      if (lessonId) {
        patchDraft(qc, courseId, (draft) => ({
          ...draft,
          modules: draft.modules.map((m) => ({
            ...m,
            lessons: reposition(m.lessons.filter((l) => l.id !== lessonId)),
          })),
        }));
      }
      return;
    }
    case 'block_deleted': {
      const blockId = strField(payload, 'block_id');
      if (blockId) {
        patchDraft(qc, courseId, (draft) => ({
          ...draft,
          modules: draft.modules.map((m) => ({
            ...m,
            lessons: m.lessons.map((l) => ({
              ...l,
              blocks: reposition(l.blocks.filter((b) => b.id !== blockId)),
            })),
          })),
        }));
      }
      return;
    }
    case 'module_added': {
      const raw = moduleField(payload, 'module');
      if (raw) {
        const nextModule = fromModuleResponse(raw);
        patchDraft(qc, courseId, (draft) => ({
          ...draft,
          // The WS event can land before `onSuccess` of
          // `useAddModuleMutation` swaps the temp id for the real one.
          // Replace-by-id when the real entry is already present; reuse
          // the first pending `*-tmp-*` entry when it isn't (so the
          // optimistic placeholder doesn't briefly coexist with the real
          // entry); otherwise append for events from other clients.
          modules: upsertById(draft.modules, nextModule),
        }));
      }
      return;
    }
    case 'lesson_added': {
      const moduleId = strField(payload, 'module_id');
      const raw = lessonField(payload, 'lesson');
      if (moduleId && raw) {
        const lesson = fromLessonResponse(raw);
        patchDraft(qc, courseId, (draft) =>
          mapModule(draft, moduleId, (m) => ({
            ...m,
            lessons: upsertById(m.lessons, lesson),
          })),
        );
      }
      return;
    }
    case 'lesson_moved': {
      const lessonId = strField(payload, 'lesson_id');
      const fromModuleId = strField(payload, 'from_module_id');
      const toModuleId = strField(payload, 'to_module_id');
      const position = numField(payload, 'position');
      if (lessonId && fromModuleId && toModuleId && position !== undefined) {
        patchDraft(qc, courseId, (draft) => {
          const sourceModule = draft.modules.find((m) => m.id === fromModuleId);
          const lesson = sourceModule?.lessons.find((l) => l.id === lessonId);
          if (lesson === undefined) return draft;
          const moved: DraftLesson = { ...lesson, position };
          return {
            ...draft,
            modules: draft.modules.map((m) => {
              if (m.id === fromModuleId && m.id !== toModuleId) {
                return {
                  ...m,
                  lessons: reposition(m.lessons.filter((l) => l.id !== lessonId)),
                };
              }
              if (m.id === toModuleId) {
                const without =
                  m.id === fromModuleId
                    ? m.lessons.filter((l) => l.id !== lessonId)
                    : m.lessons;
                return { ...m, lessons: [...without, moved] };
              }
              return m;
            }),
          };
        });
      }
      return;
    }
    case 'block_added': {
      const lessonId = strField(payload, 'lesson_id');
      const raw = blockField(payload, 'block');
      if (!lessonId || !raw) return;
      // File-bearing block snapshots travel through the WS without a
      // resolved presigned URL (the backend snapshotter is sync;
      // pre-signing in the event publisher is invasive). Fall back
      // to a draft refetch for those types so `block.file?.url` is
      // populated correctly — other types apply in place.
      if (_blockTypeNeedsRefetch(raw.type)) {
        qc.invalidateQueries({ queryKey: courseDraftKey(courseId) });
        return;
      }
      const block = fromBlockResponse(raw);
      patchDraft(qc, courseId, (draft) =>
        mapLesson(draft, lessonId, (l) => ({
          ...l,
          blocks: upsertById(l.blocks, block),
        })),
      );
      return;
    }
    case 'block_updated': {
      const raw = blockField(payload, 'block');
      if (!raw) return;
      if (_blockTypeNeedsRefetch(raw.type)) {
        qc.invalidateQueries({ queryKey: courseDraftKey(courseId) });
        return;
      }
      const updated = fromBlockResponse(raw);
      patchDraft(qc, courseId, (draft) => ({
        ...draft,
        modules: draft.modules.map((m) => ({
          ...m,
          lessons: m.lessons.map((l) => ({
            ...l,
            blocks: l.blocks.map((b) => (b.id === updated.id ? updated : b)),
          })),
        })),
      }));
      return;
    }
    case 'modules_reordered': {
      const orderedIds = stringArrayField(payload, 'ordered_ids');
      if (orderedIds) {
        patchDraft(qc, courseId, (draft) =>
          reorderModulesByIds(draft, orderedIds),
        );
      }
      return;
    }
    case 'lessons_reordered': {
      const moduleId = strField(payload, 'module_id');
      const orderedIds = stringArrayField(payload, 'ordered_ids');
      if (moduleId && orderedIds) {
        patchDraft(qc, courseId, (draft) =>
          mapModule(draft, moduleId, (m) => ({
            ...m,
            lessons: orderByIds(m.lessons, orderedIds),
          })),
        );
      }
      return;
    }
    case 'blocks_reordered': {
      const lessonId = strField(payload, 'lesson_id');
      const orderedIds = stringArrayField(payload, 'ordered_ids');
      if (lessonId && orderedIds) {
        patchDraft(qc, courseId, (draft) =>
          mapLesson(draft, lessonId, (l) => ({
            ...l,
            blocks: orderByIds(l.blocks, orderedIds),
          })),
        );
      }
      return;
    }

    case 'draft_reset':
      // The whole tree is replaced server-side from a release snapshot —
      // refetching is the cheapest path to a consistent client cache.
      qc.invalidateQueries({ queryKey: courseDraftKey(courseId) });
      return;

    case 'release_created':
      qc.invalidateQueries({ queryKey: courseReleasesKey(courseId) });
      // The first release flips the product status to "published".
      qc.invalidateQueries({ queryKey: productKey(courseId) });
      return;

    default: {
      // Exhaustiveness guard — every variant of `ContentEventKind` must
      // map to a case above. If a new kind lands without a matching
      // case, `kind` retains its concrete string type here and the
      // assignment fails at compile time.
      const _exhaustive: never = kind;
      void _exhaustive;
      qc.invalidateQueries({ queryKey: courseDraftKey(courseId) });
      return;
    }
  }
}

/* ---------- helpers ---------- */

function patchDraft(
  qc: QueryClient,
  courseId: string,
  fn: (draft: CourseDraft) => CourseDraft,
): void {
  qc.setQueryData<CourseDraft>(courseDraftKey(courseId), (current) => {
    if (!current) return current;
    return fn(current);
  });
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
  fn: (l: DraftLesson) => DraftLesson,
): CourseDraft {
  return {
    ...draft,
    modules: draft.modules.map((m) => ({
      ...m,
      lessons: m.lessons.map((l) => (l.id === lessonId ? fn(l) : l)),
    })),
  };
}

function reposition<T extends { position: number }>(items: T[]): T[] {
  return items.map((item, index) => ({ ...item, position: index }));
}

function strField(
  payload: Record<string, unknown>,
  key: string,
): string | undefined {
  const v = payload[key];
  return typeof v === 'string' ? v : undefined;
}

function nullableStrField(
  payload: Record<string, unknown>,
  key: string,
): string | null {
  const v = payload[key];
  if (v === null) return null;
  return typeof v === 'string' ? v : null;
}

function numField(
  payload: Record<string, unknown>,
  key: string,
): number | undefined {
  const v = payload[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

function stringArrayField(
  payload: Record<string, unknown>,
  key: string,
): string[] | undefined {
  const v = payload[key];
  if (!Array.isArray(v)) return undefined;
  return v.every((item) => typeof item === 'string') ? (v as string[]) : undefined;
}

// The wire-shape accessors below trust the envelope: we validate that
// the field is an object (everything else gets dropped by the
// surrounding `if (raw)` check) and let the mapper fail loudly on
// shape mismatch — same trust level we use for the REST loader.
function moduleField(
  payload: Record<string, unknown>,
  key: string,
): DraftModuleResponse | undefined {
  const v = payload[key];
  if (v === null || typeof v !== 'object') return undefined;
  return v as DraftModuleResponse;
}

function lessonField(
  payload: Record<string, unknown>,
  key: string,
): DraftLessonResponse | undefined {
  const v = payload[key];
  if (v === null || typeof v !== 'object') return undefined;
  return v as DraftLessonResponse;
}

function blockField(
  payload: Record<string, unknown>,
  key: string,
): LessonBlockResponse | undefined {
  const v = payload[key];
  if (v === null || typeof v !== 'object') return undefined;
  return v as LessonBlockResponse;
}

function upsertById<T extends { id: string }>(items: T[], next: T): T[] {
  // Replace the entry by id if it already exists (the optimistic
  // mutation already swapped its temp id for the real one). Otherwise
  // reuse the first pending `*-tmp-*` placeholder — that's the
  // initiating client whose `onSuccess` hasn't run yet, so swapping
  // the placeholder in place avoids a transient visible duplicate.
  // Append only when neither matches (event from another client).
  const index = items.findIndex((item) => item.id === next.id);
  if (index !== -1) {
    const copy = items.slice();
    copy[index] = next;
    return copy;
  }
  const tmpIndex = items.findIndex((item) => item.id.includes('-tmp-'));
  if (tmpIndex !== -1) {
    const copy = items.slice();
    copy[tmpIndex] = next;
    return copy;
  }
  return [...items, next];
}

function orderByIds<T extends { id: string }>(items: T[], orderedIds: string[]): T[] {
  // Reorder in the order the server dictated, then re-stamp positions
  // so existing `position`-based UI keeps working. Items not present
  // in `orderedIds` are dropped — the server is the source of truth
  // for the post-mutation list.
  const byId = new Map(items.map((item) => [item.id, item]));
  return orderedIds.flatMap((id, index) => {
    const item = byId.get(id);
    if (item === undefined) return [];
    return [{ ...item, position: index }];
  });
}

function reorderModulesByIds(
  draft: CourseDraft,
  orderedIds: string[],
): CourseDraft {
  return { ...draft, modules: orderByIds(draft.modules, orderedIds) };
}

/**
 * WS event payloads for file-bearing blocks (`file`, `video_file`,
 * `photo_collage`) currently travel without a resolved presigned URL
 * — the backend snapshotter is sync and pre-signing inside the event
 * publisher is invasive. The client refetches the draft to pick up
 * the fresh FileSchema instead of applying the partial snapshot.
 */
function _blockTypeNeedsRefetch(type: unknown): boolean {
  return type === 'file' || type === 'video_file' || type === 'photo_collage';
}
