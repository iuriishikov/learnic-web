'use client';

import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import {
  EventsChannel,
  type EventEnvelope,
} from '../lib/events-channel';
import type { Product } from '../model/types';
import type { ProductQA } from './qa';

import { productKey } from './use-product';
import { productQAKey } from './use-product-qa';

/**
 * Product-level delta channel — `WS /products/{product_id}/events`.
 *
 * `kind` values come from the spec's `ProductEventKind` enum: metadata
 * (`name_changed`, `description_changed`, `duration_changed`), cover
 * (`cover_changed`, `cover_removed`), status (`published`, `archived`,
 * `unarchived`, `deleted`) and Q&A (`qa_*`).
 */
type ProductEventKind =
  | 'name_changed'
  | 'description_changed'
  | 'duration_changed'
  | 'cover_changed'
  | 'cover_removed'
  | 'published'
  | 'archived'
  | 'unarchived'
  | 'deleted'
  | 'qa_added'
  | 'qa_question_changed'
  | 'qa_answer_changed'
  | 'qa_reordered'
  | 'qa_deleted';

export function useProductEventsWs(productId: string, enabled: boolean) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const channel = new EventsChannel<ProductEventKind>({
      url: `/api/products/${encodeURIComponent(productId)}/events`,
      onEvent: (event) => applyProductEvent(qc, productId, event),
      onReconnected: () => {
        // No replay — refetch product + Q&A state from REST.
        qc.invalidateQueries({ queryKey: productKey(productId) });
        qc.invalidateQueries({ queryKey: productQAKey(productId) });
      },
      onTerminalClose: (code) => {
        console.warn(
          `[product-events-ws] terminal close ${code}; channel will not retry`,
        );
      },
    });
    channel.start();
    return () => channel.stop();
  }, [productId, enabled, qc]);
}

function applyProductEvent(
  qc: QueryClient,
  productId: string,
  event: EventEnvelope<ProductEventKind>,
): void {
  const { kind, payload } = event;

  switch (kind) {
    /* ---------- product metadata: trivial patch ---------- */
    case 'name_changed': {
      const name = strField(payload, 'name');
      if (name !== undefined) {
        patchProduct(qc, productId, (p) => ({ ...p, title: name }));
      }
      return;
    }
    case 'description_changed': {
      const description = strField(payload, 'description');
      if (description !== undefined) {
        patchProduct(qc, productId, (p) => ({ ...p, description }));
      }
      return;
    }
    case 'duration_changed': {
      const hours =
        numField(payload, 'duration_in_hours') ??
        numField(payload, 'duration_hours');
      if (hours !== undefined) {
        patchProduct(qc, productId, (p) => ({ ...p, durationHours: hours }));
      }
      return;
    }

    /* ---------- cover: refetch (file id changes, payload too thin) ---------- */
    case 'cover_changed':
    case 'cover_removed':
      qc.invalidateQueries({ queryKey: productKey(productId) });
      return;

    /* ---------- status flips: refetch (status + published_at) ---------- */
    case 'published':
    case 'archived':
    case 'unarchived':
    case 'deleted':
      qc.invalidateQueries({ queryKey: productKey(productId) });
      return;

    /* ---------- Q&A ---------- */
    case 'qa_added':
    case 'qa_reordered':
      // `qa_added` carries id-level info but not the full new ordering;
      // `qa_reordered` may cascade other entries' positions on the server.
      // Refetch the list to stay in sync.
      qc.invalidateQueries({ queryKey: productQAKey(productId) });
      return;

    case 'qa_question_changed': {
      const qaId = strField(payload, 'qa_id');
      const question = strField(payload, 'question');
      if (qaId && question !== undefined) {
        patchQAList(qc, productId, (list) =>
          list.map((e) => (e.id === qaId ? { ...e, question } : e)),
        );
      }
      return;
    }
    case 'qa_answer_changed': {
      const qaId = strField(payload, 'qa_id');
      const answer = strField(payload, 'answer');
      if (qaId && answer !== undefined) {
        patchQAList(qc, productId, (list) =>
          list.map((e) => (e.id === qaId ? { ...e, answer } : e)),
        );
      }
      return;
    }
    case 'qa_deleted': {
      const qaId = strField(payload, 'qa_id');
      if (qaId) {
        patchQAList(qc, productId, (list) =>
          list
            .filter((e) => e.id !== qaId)
            .map((e, index) => ({ ...e, position: index })),
        );
      }
      return;
    }

    default:
      // Forward-compat fallback.
      qc.invalidateQueries({ queryKey: productKey(productId) });
      qc.invalidateQueries({ queryKey: productQAKey(productId) });
      return;
  }
}

function patchProduct(
  qc: QueryClient,
  productId: string,
  fn: (product: Product) => Product,
): void {
  qc.setQueryData<Product>(productKey(productId), (current) => {
    if (!current) return current;
    return fn(current);
  });
}

function patchQAList(
  qc: QueryClient,
  productId: string,
  fn: (entries: ProductQA[]) => ProductQA[],
): void {
  qc.setQueryData<ProductQA[]>(productQAKey(productId), (current) => {
    if (!current) return current;
    return fn(current);
  });
}

function strField(
  payload: Record<string, unknown>,
  key: string,
): string | undefined {
  const v = payload[key];
  return typeof v === 'string' ? v : undefined;
}

function numField(
  payload: Record<string, unknown>,
  key: string,
): number | undefined {
  const v = payload[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}
