'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import { useAuth } from '@/features/auth';

import { PresenceConnection } from '../lib/connection';
import type { PresenceState } from '../model/types';

const PresenceContext = createContext<PresenceConnection | null>(null);

type PresenceProviderProps = {
  children: ReactNode;
};

export function PresenceProvider({ children }: PresenceProviderProps) {
  const { user } = useAuth();
  const userId = user?.oid ?? null;

  const [connection] = useState<PresenceConnection | null>(() =>
    typeof window === 'undefined' ? null : new PresenceConnection(),
  );

  // Cleanup on unmount uses `stop()` (not `dispose()`) so the same connection
  // instance survives React StrictMode's simulated unmount/remount and can be
  // restarted from the second effect run.
  useEffect(() => {
    if (!connection || !userId) return;
    connection.start();
    return () => connection.stop();
  }, [connection, userId]);

  return <PresenceContext value={connection}>{children}</PresenceContext>;
}

export function usePresence(userId: string | null | undefined): PresenceState {
  const connection = useContext(PresenceContext);

  const subscribe = useCallback(
    (notify: () => void) => {
      if (!connection || !userId) return () => {};
      return connection.subscribe(userId, () => notify());
    },
    [connection, userId],
  );

  const getSnapshot = useCallback((): PresenceState => {
    if (!connection || !userId) return 'unknown';
    return connection.getCached(userId) ?? 'unknown';
  }, [connection, userId]);

  const getServerSnapshot = useCallback((): PresenceState => 'unknown', []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
