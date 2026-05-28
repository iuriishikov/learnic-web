'use client';

import {
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useRouter } from '@/shared/config/i18n/navigation';
import { AuthContext, type AuthContextValue } from '@/shared/auth';
import type { User } from '@/shared/types/user';

import { getMeAction } from '../api/me';
import { logoutAction } from '../api/session';

type AuthProviderProps = {
  initialUser: User | null;
  /**
   * Admin flag resolved server-side in the root layout. Stays stable
   * for the session (admin grants happen out-of-band via CLI), so it
   * rides straight into the context value without local state.
   */
  initialIsAdmin?: boolean;
  children: ReactNode;
};

// The concrete provider lives in `features/auth` because it depends on
// auth-specific server actions (`getMeAction`, `logoutAction`); the
// context shape and the `useAuth` hook live in `shared/auth` so any
// feature can consume them without crossing a feature boundary.
export function AuthProvider({
  initialUser,
  initialIsAdmin = false,
  children,
}: AuthProviderProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(initialUser);
  const [prevInitialOid, setPrevInitialOid] = useState<string | null>(
    initialUser?.oid ?? null,
  );

  const initialOid = initialUser?.oid ?? null;
  if (initialOid !== prevInitialOid) {
    setPrevInitialOid(initialOid);
    setUser(initialUser);
  }

  const refresh = useCallback(async () => {
    const result = await getMeAction();
    const next = result.ok ? result.user : null;
    setUser(next);
    return next;
  }, []);

  const logout = useCallback(async () => {
    await logoutAction();
    setUser(null);
    router.refresh();
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, setUser, refresh, logout, isAdmin: initialIsAdmin }),
    [user, refresh, logout, initialIsAdmin],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
