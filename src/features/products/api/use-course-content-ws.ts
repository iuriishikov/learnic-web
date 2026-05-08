'use client';

import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import {
  EventsChannel,
  type EventEnvelope,
} from '../lib/events-channel';
import type { CourseDraft, DraftLesson, DraftModule } from '../model/draft';

import { courseReleasesKey } from './use-course-releases';
import { courseDraftKey } from './use-course-draft';
import { productKey } from './use-product';

/**
 * Course-content delta channel — `WS /courses/{course_id}/events`.
 *
 * The set of `kind` values is fixed by the spec's `ContentEventKind` enum.
 * Trivial events (rename, description) carry the new value in `payload`
 * and we patch the cache directly. For events that don't fully describe
 * the new state (`block_updated` only carries id+type), or where the
 * server's cascade is non-trivial (reorder, move, draft_reset), we
 * invalidate the draft query so the next render refetches.
 */
type ContentEventKind =
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

export function useCourseContentWs(courseId: string, enabled: boolean) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const channel = new EventsChannel<ContentEventKind>({
      url: `/api/courses/${encodeURIComponent(courseId)}/events`,
      onEvent: (event) => applyContentEvent(qc, courseId, event),
      onReconnected: () => {
        // No event replay — refetch initial state on every reconnect.
        qc.invalidateQueries({ queryKey: courseDraftKey(courseId) });
        qc.invalidateQueries({ queryKey: courseReleasesKey(courseId) });
        qc.invalidateQueries({ queryKey: productKey(courseId) });
      },
      onTerminalClose: (code) => {
        console.warn(
          `[course-content-ws] terminal close ${code}; channel will not retry`,
        );
      },
    });
    channel.start();
    return () => channel.stop();
  }, [courseId, enabled, qc]);
}

function applyContentEvent(
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

    // Server-side cascade or content too heavy to re-derive locally —
    // refetch the affected resource(s).
    case 'module_added':
    case 'lesson_added':
    case 'lesson_moved':
    case 'lessons_reordered':
    case 'modules_reordered':
    case 'block_added':
    case 'block_updated':
    case 'blocks_reordered':
    case 'draft_reset':
      qc.invalidateQueries({ queryKey: courseDraftKey(courseId) });
      return;

    case 'release_created':
      qc.invalidateQueries({ queryKey: courseReleasesKey(courseId) });
      // The first release flips the product status to "published".
      qc.invalidateQueries({ queryKey: productKey(courseId) });
      return;

    default:
      // Forward-compat: an unknown future kind shouldn't break the editor.
      qc.invalidateQueries({ queryKey: courseDraftKey(courseId) });
      return;
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
