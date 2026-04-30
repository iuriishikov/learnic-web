'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { AppSubHeaderTab } from './app-sub-header';

export type SubHeaderConfigValue = {
  sectionKey: string;
  ariaLabel: string;
  tabs: AppSubHeaderTab[];
  activeKey?: string;
};

const EMPTY_CONFIG: SubHeaderConfigValue = {
  sectionKey: '__empty__',
  ariaLabel: '',
  tabs: [],
};

type SubHeaderConfigContext = {
  config: SubHeaderConfigValue;
  setConfig: (next: SubHeaderConfigValue | null) => void;
};

const Context = createContext<SubHeaderConfigContext | null>(null);

export function SubHeaderConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<SubHeaderConfigValue>(EMPTY_CONFIG);
  const setConfig = useCallback((next: SubHeaderConfigValue | null) => {
    const resolved = next ?? EMPTY_CONFIG;
    setConfigState((prev) => (subHeaderConfigEqual(prev, resolved) ? prev : resolved));
  }, []);
  const value = useMemo(() => ({ config, setConfig }), [config, setConfig]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSubHeaderConfig(): SubHeaderConfigValue {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error(
      'useSubHeaderConfig must be used within SubHeaderConfigProvider',
    );
  }
  return ctx.config;
}

export function useSetSubHeaderConfig() {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error(
      'useSetSubHeaderConfig must be used within SubHeaderConfigProvider',
    );
  }
  return ctx.setConfig;
}

function subHeaderConfigEqual(
  a: SubHeaderConfigValue,
  b: SubHeaderConfigValue,
): boolean {
  if (a === b) return true;
  if (a.sectionKey !== b.sectionKey) return false;
  if (a.ariaLabel !== b.ariaLabel) return false;
  if (a.activeKey !== b.activeKey) return false;
  if (!tabsEqual(a.tabs, b.tabs)) return false;
  return true;
}

function tabsEqual(a: AppSubHeaderTab[], b: AppSubHeaderTab[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];
    if (
      x.key !== y.key ||
      x.href !== y.href ||
      x.label !== y.label ||
      x.badge !== y.badge
    ) {
      return false;
    }
  }
  return true;
}
