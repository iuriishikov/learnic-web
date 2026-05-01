'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type BreadcrumbSegment = {
  label: string;
  href?: string;
};

export type BreadcrumbContribution = {
  order: number;
  segments: BreadcrumbSegment[];
};

type BreadcrumbConfigContext = {
  contributions: ReadonlyMap<string, BreadcrumbContribution>;
  setContribution: (
    slot: string,
    contribution: BreadcrumbContribution | null,
  ) => void;
};

const Context = createContext<BreadcrumbConfigContext | null>(null);

export function BreadcrumbConfigProvider({ children }: { children: ReactNode }) {
  const [contributions, setContributions] = useState<
    ReadonlyMap<string, BreadcrumbContribution>
  >(() => new Map());

  const setContribution = useCallback(
    (slot: string, contribution: BreadcrumbContribution | null) => {
      setContributions((prev) => {
        if (contribution === null) {
          if (!prev.has(slot)) return prev;
          const next = new Map(prev);
          next.delete(slot);
          return next;
        }
        const existing = prev.get(slot);
        if (existing && contributionEqual(existing, contribution)) return prev;
        const next = new Map(prev);
        next.set(slot, contribution);
        return next;
      });
    },
    [],
  );

  const value = useMemo(
    () => ({ contributions, setContribution }),
    [contributions, setContribution],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useBreadcrumbContributions(): ReadonlyMap<
  string,
  BreadcrumbContribution
> {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error(
      'useBreadcrumbContributions must be used within BreadcrumbConfigProvider',
    );
  }
  return ctx.contributions;
}

export function useSetBreadcrumbContribution() {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error(
      'useSetBreadcrumbContribution must be used within BreadcrumbConfigProvider',
    );
  }
  return ctx.setContribution;
}

function contributionEqual(
  a: BreadcrumbContribution,
  b: BreadcrumbContribution,
): boolean {
  if (a === b) return true;
  if (a.order !== b.order) return false;
  if (a.segments.length !== b.segments.length) return false;
  for (let i = 0; i < a.segments.length; i++) {
    const x = a.segments[i];
    const y = b.segments[i];
    if (x.label !== y.label || x.href !== y.href) return false;
  }
  return true;
}
