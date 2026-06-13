'use client';

import { motion, useReducedMotion } from 'motion/react';
import dynamic from 'next/dynamic';
import { Component, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/shared/lib/utils';
import type {
  FunctionGraphLabels,
  GraphObject,
  GraphParameter,
  GraphSpec,
} from '@/shared/ui/function-graph.types';
import { Skeleton } from '@/shared/ui/skeleton';
import { Slider } from '@/shared/ui/slider';

export type {
  FunctionGraphLabels,
  GraphAxes,
  GraphObject,
  GraphParameter,
  GraphSpec,
  GraphViewport,
} from '@/shared/ui/function-graph.types';

const DEFAULT_ASPECT = 'aspect-[16/10] md:aspect-[2/1]';

/* -------------------------------------------------------------------------- */
/* Skeleton                                                                   */
/* -------------------------------------------------------------------------- */

/** Loading placeholder shaped like the plot (axes cross + a faint curve hint). */
export function FunctionGraphSkeleton() {
  return (
    <div className="relative h-full w-full overflow-hidden p-4" aria-hidden>
      <Skeleton className="absolute inset-0 rounded-none opacity-40" />
      <div className="absolute top-1/2 right-4 left-4 h-px -translate-y-1/2 bg-muted-foreground/15" />
      <div className="absolute top-4 bottom-4 left-1/2 w-px -translate-x-1/2 bg-muted-foreground/15" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Lazy, client-only engine                                                   */
/* -------------------------------------------------------------------------- */

// The engine touches `window`/SVG and cannot SSR — load it client-only with a
// layout-matching Skeleton so there is no flash or layout shift.
const FunctionGraphBoard = dynamic(
  () => import('@/shared/ui/function-graph-board').then((m) => m.FunctionGraphBoard),
  { ssr: false, loading: () => <FunctionGraphSkeleton /> },
);

/* -------------------------------------------------------------------------- */
/* Error boundary                                                             */
/* -------------------------------------------------------------------------- */

class BoardErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/* -------------------------------------------------------------------------- */
/* Accessibility summary                                                      */
/* -------------------------------------------------------------------------- */

function describeObject(object: GraphObject): string | null {
  switch (object.kind) {
    case 'function':
      return `y = ${object.expr}`;
    case 'parametric':
      return `(${object.xExpr}, ${object.yExpr})`;
    case 'implicit':
      return `${object.expr} = 0`;
    case 'point':
      return `(${object.x}, ${object.y})`;
    case 'segment':
      return `[(${object.x1}, ${object.y1}); (${object.x2}, ${object.y2})]`;
    case 'verticalLine':
      return `x = ${object.x}`;
  }
}

function buildSummary(spec: GraphSpec): string {
  return spec.objects
    .map(describeObject)
    .filter((entry): entry is string => Boolean(entry))
    .join('; ');
}

function formatParam(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

/* -------------------------------------------------------------------------- */
/* Parameter control                                                          */
/* -------------------------------------------------------------------------- */

// Restyle the shadcn slider parts in place (no edit to the generated file):
// thicker track, larger brand thumb with a background ring so it reads as a
// deliberate handle in both themes.
const PARAM_SLIDER_CLASS = cn(
  'py-1',
  '[&_[data-slot=slider-track]]:h-1.5',
  '[&_[data-slot=slider-thumb]]:size-4 [&_[data-slot=slider-thumb]]:border-2',
  '[&_[data-slot=slider-thumb]]:border-background [&_[data-slot=slider-thumb]]:bg-brand',
  '[&_[data-slot=slider-thumb]]:shadow-sm [&_[data-slot=slider-thumb]]:ring-brand/40',
  '[&_[data-slot=slider-thumb]]:transition-transform [&_[data-slot=slider-thumb]]:active:scale-110',
);

function ParameterControl({
  parameter,
  value,
  onChange,
}: {
  parameter: GraphParameter;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-sm font-medium text-foreground">{parameter.name}</span>
        <span className="min-w-10 rounded-md bg-brand/10 px-1.5 py-0.5 text-center font-mono text-xs font-semibold text-brand tabular-nums">
          {formatParam(value)}
        </span>
      </div>
      <Slider
        value={[value]}
        min={parameter.min}
        max={parameter.max}
        step={parameter.step}
        aria-label={parameter.name}
        onValueChange={(next) => onChange(Array.isArray(next) ? next[0] : next)}
        className={PARAM_SLIDER_CLASS}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Wrapper                                                                    */
/* -------------------------------------------------------------------------- */

export type FunctionGraphProps = {
  spec: GraphSpec;
  /** Allow learners to pan/zoom and drag parameter sliders. Default: static. */
  interactive?: boolean;
  /** Optional title rendered above the plot. */
  title?: string | null;
  /** Optional caption rendered below the plot. */
  caption?: string | null;
  /** Accessible summary; falls back to a generated description of the objects. */
  summary?: string;
  /** i18n strings forwarded to the engine (reset / errors). */
  labels?: FunctionGraphLabels;
  className?: string;
  /** Tailwind aspect-ratio classes for the plot box. */
  aspectClassName?: string;
  /** Drop the plot's own card chrome (border/bg/shadow) so it can sit flush
   *  inside a host container — used by the editor to merge graph + controls. */
  bare?: boolean;
};

export function FunctionGraph({
  spec,
  interactive = false,
  title,
  caption,
  summary,
  labels,
  className,
  aspectClassName = DEFAULT_ASPECT,
  bare = false,
}: FunctionGraphProps) {
  const reduceMotion = useReducedMotion();
  const plotRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  const parameters = useMemo(() => spec.parameters ?? [], [spec]);
  const paramSignature = useMemo(
    () => parameters.map((p) => `${p.name}:${p.value}:${p.min}:${p.max}:${p.step}`).join('|'),
    [parameters],
  );

  const [paramValues, setParamValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(parameters.map((p) => [p.name, p.value])),
  );
  // Reset values during render (not in an effect) when the parameter set or its
  // defaults change — the React-recommended "adjust state on prop change".
  const [prevSignature, setPrevSignature] = useState(paramSignature);
  if (paramSignature !== prevSignature) {
    setPrevSignature(paramSignature);
    setParamValues(Object.fromEntries(parameters.map((p) => [p.name, p.value])));
  }

  // Lazy-mount: only instantiate the engine once the plot scrolls near the
  // viewport, so a lesson full of graphs doesn't build every engine on first
  // paint. Once mounted it stays mounted (no churn on scroll-away).
  useEffect(() => {
    const node = plotRef.current;
    if (!node || inView) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [inView]);

  const ariaLabel = summary ?? buildSummary(spec);
  const showSliders = interactive && parameters.length > 0;

  return (
    <figure className={cn('flex flex-col gap-2', className)}>
      {title ? <p className="text-sm font-medium text-foreground">{title}</p> : null}

      <motion.div
        ref={plotRef}
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        role="img"
        aria-label={ariaLabel || undefined}
        className={cn(
          'relative w-full overflow-hidden rounded-xl',
          bare ? 'bg-muted/20' : 'border border-border bg-card shadow-sm',
          aspectClassName,
        )}
      >
        {inView ? (
          <BoardErrorBoundary
            fallback={
              <div className="absolute inset-0 grid place-items-center p-4 text-center text-sm text-muted-foreground">
                {labels?.unavailable ?? 'Graph unavailable'}
              </div>
            }
          >
            <FunctionGraphBoard
              spec={spec}
              interactive={interactive}
              paramValues={paramValues}
              labels={labels}
            />
          </BoardErrorBoundary>
        ) : (
          <FunctionGraphSkeleton />
        )}
      </motion.div>

      {showSliders ? (
        <div
          className={cn(
            'grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2',
            bare
              ? 'px-1 py-1'
              : 'rounded-xl border border-border bg-card px-4 py-4 shadow-sm',
          )}
        >
          {parameters.map((parameter) => (
            <ParameterControl
              key={parameter.name}
              parameter={parameter}
              value={paramValues[parameter.name] ?? parameter.value}
              onChange={(next) => setParamValues((prev) => ({ ...prev, [parameter.name]: next }))}
            />
          ))}
        </div>
      ) : null}

      {caption ? <figcaption className="text-sm text-muted-foreground">{caption}</figcaption> : null}
    </figure>
  );
}
