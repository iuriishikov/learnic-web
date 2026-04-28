'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useRouter } from '@/shared/config/i18n/navigation';

import { getMeAction } from '../api/me';
import { logoutAction } from '../api/session';
import type { User } from '../model/user';

type AuthContextValue = {
  user: User | null;
  setUser: (user: User | null) => void;
  refresh: () => Promise<User | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  initialUser: User | null;
  children: ReactNode;
};

export function AuthProvider({ initialUser, children }: AuthProviderProps) {
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
    () => ({ user, setUser, refresh, logout }),
    [user, refresh, logout],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }
  return ctx;
}
