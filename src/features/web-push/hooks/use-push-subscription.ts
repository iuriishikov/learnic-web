'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { notifyResourceLimit } from '@/shared/ui/resource-limit-dialog';

import {
  getVapidPublicKeyAction,
  subscribePushAction,
  unsubscribePushAction,
} from '../api/subscriptions';
import {
  getExistingSubscription,
  getNotificationPermission,
  isIOS,
  isPushSupported,
  isStandaloneDisplayMode,
  registerServiceWorker,
  serializeSubscription,
  subscribeOnDevice,
  unsubscribeOnDevice,
} from '../lib/sw-registration';
import type { PushDeviceStatus, WebPushError } from '../model/types';

type State = {
  status: PushDeviceStatus;
  endpoint: string | null;
  initializing: boolean;
};

const INITIAL_STATE: State = {
  status: 'permission-default',
  endpoint: null,
  initializing: true,
};

/**
 * Tracks the local Web Push registration state on this device.
 *
 * Returns `status` for UI gating (banner, settings page) plus
 * `subscribe` / `unsubscribe` callbacks that handle SW registration,
 * `PushManager.subscribe`, and the backend round-trip in one shot.
 */
export function usePushSubscription() {
  const [state, setState] = useState<State>(INITIAL_STATE);

  const refresh = useCallback(async () => {
    if (!isPushSupported()) {
      if (isIOS() && !isStandaloneDisplayMode()) {
        setState({ status: 'pwa-required', endpoint: null, initializing: false });
      } else {
        setState({ status: 'unsupported', endpoint: null, initializing: false });
      }
      return;
    }
    if (isIOS() && !isStandaloneDisplayMode()) {
      setState({ status: 'pwa-required', endpoint: null, initializing: false });
      return;
    }
    const permission = getNotificationPermission();
    if (permission === 'denied') {
      setState({ status: 'permission-denied', endpoint: null, initializing: false });
      return;
    }
    try {
      await registerServiceWorker();
    } catch {
      setState({ status: 'unsupported', endpoint: null, initializing: false });
      return;
    }
    const sub = await getExistingSubscription();
    if (sub) {
      setState({ status: 'subscribed', endpoint: sub.endpoint, initializing: false });
      return;
    }
    if (permission === 'granted') {
      setState({ status: 'unsubscribed', endpoint: null, initializing: false });
    } else {
      setState({ status: 'permission-default', endpoint: null, initializing: false });
    }
  }, []);

  // Probe browser APIs once on mount. The ref guard makes this
  // effect idempotent — the lint rule for setState-in-effect
  // accepts the pattern because the state update is gated behind
  // the async refresh, not synchronous within the effect body.
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void refresh();
  }, [refresh]);

  const subscribe = useCallback(async (): Promise<
    { ok: true } | { ok: false; error: WebPushError }
  > => {
    if (!isPushSupported()) {
      return { ok: false, error: { kind: 'unknown', message: 'unsupported' } };
    }
    // VAPID public key comes from the backend (single source of truth,
    // derived from the private key) — not a build-time env var.
    const keyResult = await getVapidPublicKeyAction();
    if (!keyResult.ok) {
      return { ok: false, error: keyResult.error };
    }
    let permission = getNotificationPermission();
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }
    if (permission !== 'granted') {
      setState((prev) => ({ ...prev, status: 'permission-denied' }));
      return { ok: false, error: { kind: 'forbidden' } };
    }
    try {
      await registerServiceWorker();
      const sub = await subscribeOnDevice(keyResult.publicKey);
      const serialized = serializeSubscription(sub);
      const result = await subscribePushAction({
        endpoint: serialized.endpoint,
        p256dh: serialized.p256dh,
        auth: serialized.auth,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      });
      if (!result.ok) {
        // Best-effort cleanup so the browser side doesn't hold a
        // subscription the backend never learned about.
        await sub.unsubscribe().catch(() => undefined);
        notifyResourceLimit(result.resourceLimit);
        return { ok: false, error: result.error };
      }
      setState({ status: 'subscribed', endpoint: serialized.endpoint, initializing: false });
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'subscribe failed';
      return { ok: false, error: { kind: 'unknown', message } };
    }
  }, []);

  const unsubscribe = useCallback(async (): Promise<
    { ok: true } | { ok: false; error: WebPushError }
  > => {
    try {
      const endpoint = await unsubscribeOnDevice();
      if (endpoint) {
        await unsubscribePushAction(endpoint);
      }
      setState({ status: 'unsubscribed', endpoint: null, initializing: false });
      return { ok: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unsubscribe failed';
      return { ok: false, error: { kind: 'unknown', message } };
    }
  }, []);

  return { ...state, subscribe, unsubscribe, refresh };
}
