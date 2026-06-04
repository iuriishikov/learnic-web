'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { productTagsKey } from '@/features/product-tags';
import { useAuth } from '@/shared/auth';

import {
  type ContentEventKind,
  applyContentEvent,
  isContentEventKind,
} from '../lib/apply-content-event';
import {
  type ProductEventKind,
  applyProductEvent,
} from '../lib/apply-product-event';
import {
  EventsChannel,
  type EventEnvelope,
} from '../lib/events-channel';

import { noteDraftKey } from './use-note-draft';
import { noteReleasesKey } from './use-note-releases';
import { productKey } from './use-product';
import { productQAKey } from './use-product-qa';
import {
  productCollaborationsKey,
  productMyPermissionsKey,
  productRolesKey,
} from './use-team';

/**
 * Unified product delta channel — `WS /products/{product_id}/events`.
 *
 * Two `kind` families fan in over one socket on the server:
 *
 * - **Product** events (`ProductEventKind` in `lib/apply-product-event`) —
 *   metadata, cover, status, Q&A, collaboration lifecycle, role catalogue.
 * - **Content** events (`ContentEventKind` in `lib/apply-content-event`) —
 *   modules, lessons, blocks, releases, draft reset.
 *
 * This hook owns the WS lifecycle (open / reconnect / terminal close)
 * and routes each envelope to the right pure reducer. The reducers
 * are the single source of truth for "how an event mutates the
 * cache" — keeping them out of the hook keeps each module under the
 * project's file-size threshold and makes them testable without a
 * React rendering harness.
 */
type WsEventKind = ProductEventKind | ContentEventKind;

export function useProductEventsWs(productId: string, enabled: boolean) {
  const qc = useQueryClient();
  // Threaded into `applyProductEvent` so collaboration events
  // targeting the current user can also invalidate
  // `productMyPermissionsKey` — the cache that gates every
  // permission-aware UI control on the editor.
  const currentUserId = useAuth().user?.oid ?? null;

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const channel = new EventsChannel<WsEventKind>({
      url: `/api/products/${encodeURIComponent(productId)}/events`,
      onEvent: (event) => {
        if (isContentEventKind(event.kind)) {
          applyContentEvent(
            qc,
            productId,
            event as EventEnvelope<ContentEventKind>,
          );
          return;
        }
        applyProductEvent(
          qc,
          productId,
          currentUserId,
          event as EventEnvelope<ProductEventKind>,
        );
      },
      onReconnected: () => {
        // No replay — refetch every cache the channel might have
        // mutated while disconnected.
        qc.invalidateQueries({ queryKey: productKey(productId) });
        qc.invalidateQueries({ queryKey: productQAKey(productId) });
        qc.invalidateQueries({
          queryKey: productCollaborationsKey(productId),
        });
        qc.invalidateQueries({ queryKey: productRolesKey(productId) });
        qc.invalidateQueries({
          queryKey: productMyPermissionsKey(productId),
        });
        qc.invalidateQueries({ queryKey: productTagsKey(productId) });
        qc.invalidateQueries({ queryKey: noteDraftKey(productId) });
        qc.invalidateQueries({ queryKey: noteReleasesKey(productId) });
      },
      onTerminalClose: (code) => {
        console.warn(
          `[product-events-ws] terminal close ${code}; channel will not retry`,
        );
      },
    });
    channel.start();
    return () => channel.stop();
  }, [productId, enabled, qc, currentUserId]);
}
