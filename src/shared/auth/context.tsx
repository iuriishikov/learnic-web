'use client';

import { createContext, useContext } from 'react';

import type { User } from '@/shared/types/user';

/**
 * Public shape of the auth context.
 *
 * Lives in `shared/auth` because the auth context is consumed by
 * multiple features (presence, products, web-push, user-contacts,
 * user-experiences) plus widgets (app-header, page-header). The
 * concrete `<AuthProvider>` that fills this context with real
 * `getMeAction` / `logoutAction` server actions still lives in
 * `features/auth` — features may depend on `shared/`, but
 * `shared/` cannot depend back on `features/`.
 */
export type AuthContextValue = {
  user: User | null;
  setUser: (user: User | null) => void;
  refresh: () => Promise<User | null>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }
  return ctx;
}
