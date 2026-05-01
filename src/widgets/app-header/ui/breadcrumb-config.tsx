'use client';

import { useEffect } from 'react';

import {
  useSetBreadcrumbContribution,
  type BreadcrumbSegment,
} from './breadcrumb-config-provider';

export type BreadcrumbConfigProps = {
  /** Stable identifier for this layer's contribution. Same slot = update, different = additional. */
  slot: string;
  /** Position in the trail; smaller renders earlier. Use route depth (1 = section root, 2 = sub-section, …). */
  order: number;
  /** Segments this layer contributes. The deepest segment usually omits `href` to render as the current page. */
  segments: BreadcrumbSegment[];
};

export function BreadcrumbConfig({
  slot,
  order,
  segments,
}: BreadcrumbConfigProps) {
  const setContribution = useSetBreadcrumbContribution();
  useEffect(() => {
    setContribution(slot, { order, segments });
    return () => setContribution(slot, null);
  }, [slot, order, segments, setContribution]);
  return null;
}
