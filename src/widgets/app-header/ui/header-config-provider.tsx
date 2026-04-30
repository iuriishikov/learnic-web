'use client';

import {
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

import type { AppHeaderNavItem } from './app-header';

export type HeaderConfigValue = {
  navItems: AppHeaderNavItem[];
  brandHref: string;
  brandSuffix: ReactNode;
};

const DEFAULT_CONFIG: HeaderConfigValue = {
  navItems: [],
  brandHref: '/',
  brandSuffix: null,
};

type HeaderConfigContext = {
  config: HeaderConfigValue;
  setConfig: (config: HeaderConfigValue) => void;
};

const Context = createContext<HeaderConfigContext | null>(null);

export function HeaderConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<HeaderConfigValue>(DEFAULT_CONFIG);
  const setConfig = useCallback((next: HeaderConfigValue) => {
    setConfigState((prev) => (configEqual(prev, next) ? prev : next));
  }, []);
  const value = useMemo(() => ({ config, setConfig }), [config, setConfig]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useHeaderConfig(): HeaderConfigValue {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error('useHeaderConfig must be used within HeaderConfigProvider');
  }
  return ctx.config;
}

export function useSetHeaderConfig() {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error(
      'useSetHeaderConfig must be used within HeaderConfigProvider',
    );
  }
  return ctx.setConfig;
}

function configEqual(a: HeaderConfigValue, b: HeaderConfigValue): boolean {
  if (a === b) return true;
  if (a.brandHref !== b.brandHref) return false;
  if (!navItemsEqual(a.navItems, b.navItems)) return false;
  if (!brandSuffixEqual(a.brandSuffix, b.brandSuffix)) return false;
  return true;
}

function navItemsEqual(a: AppHeaderNavItem[], b: AppHeaderNavItem[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (x.key !== y.key || x.href !== y.href || x.label !== y.label) {
      return false;
    }
  }
  return true;
}

function brandSuffixEqual(a: ReactNode, b: ReactNode): boolean {
  if (a === b) return true;
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  if (typeof a === 'string' && typeof b === 'string') return a === b;
  if (typeof a === 'number' && typeof b === 'number') return a === b;
  if (isValidElement(a) && isValidElement(b)) return reactElementEqual(a, b);
  return false;
}

function reactElementEqual(a: ReactElement, b: ReactElement): boolean {
  if (a.type !== b.type) return false;
  const aProps = (a.props ?? {}) as Record<string, unknown>;
  const bProps = (b.props ?? {}) as Record<string, unknown>;
  const aKeys = Object.keys(aProps);
  const bKeys = Object.keys(bProps);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (key === 'children') {
      if (!brandSuffixEqual(aProps.children as ReactNode, bProps.children as ReactNode)) {
        return false;
      }
      continue;
    }
    if (aProps[key] !== bProps[key]) return false;
  }
  return true;
}
