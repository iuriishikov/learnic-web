'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { SiteHeaderVariant } from '@/widgets/site-header';

export type PageHeaderConfigValue = {
  /** Appearance of the anonymous `SiteHeader` branch. */
  siteHeaderVariant: SiteHeaderVariant;
};

const DEFAULT_CONFIG: PageHeaderConfigValue = {
  siteHeaderVariant: 'solid',
};

type PageHeaderConfigContext = {
  config: PageHeaderConfigValue;
  setConfig: (config: PageHeaderConfigValue) => void;
};

const Context = createContext<PageHeaderConfigContext | null>(null);

export function PageHeaderConfigProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [config, setConfigState] =
    useState<PageHeaderConfigValue>(DEFAULT_CONFIG);
  const setConfig = useCallback((next: PageHeaderConfigValue) => {
    setConfigState((prev) =>
      prev.siteHeaderVariant === next.siteHeaderVariant ? prev : next,
    );
  }, []);
  const value = useMemo(() => ({ config, setConfig }), [config, setConfig]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function usePageHeaderConfig(): PageHeaderConfigValue {
  const ctx = useContext(Context);
  return ctx?.config ?? DEFAULT_CONFIG;
}

function useSetPageHeaderConfig() {
  const ctx = useContext(Context);
  if (!ctx) {
    throw new Error(
      'PageHeaderConfig must be used within PageHeaderConfigProvider',
    );
  }
  return ctx.setConfig;
}

/**
 * Page-mounted contributor (same pattern as `HeaderConfig`): a page that
 * wants a non-default `PageHeader` appearance renders this and the config
 * resets back to the default when the page unmounts.
 */
export function PageHeaderConfig({
  siteHeaderVariant = 'solid',
}: Partial<PageHeaderConfigValue>) {
  const setConfig = useSetPageHeaderConfig();
  useEffect(() => {
    setConfig({ siteHeaderVariant });
    return () => setConfig(DEFAULT_CONFIG);
  }, [siteHeaderVariant, setConfig]);
  return null;
}
