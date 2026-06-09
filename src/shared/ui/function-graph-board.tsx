'use client';

import { Maximize2Icon, ZoomInIcon, ZoomOutIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import type {
  FunctionGraphLabels,
  GraphObject,
  GraphScalar,
  GraphSpec,
} from '@/shared/ui/function-graph.types';

/* -------------------------------------------------------------------------- */
/* Engine typings                                                             */
/* -------------------------------------------------------------------------- */
// JSXGraph ships a heavy, partial (1.4-era) d.ts. We touch a tiny imperative
// surface, so we model it with a minimal local interface and cast the dynamic
// import once — this keeps us out of the 200KB overload soup without `any`.

type JxgElement = { setAttribute(attr: Record<string, unknown>): void };

type JxgJessieCode = {
  snippet(code: string, funwrap: boolean, varname: string, geonext: boolean): (...args: number[]) => number;
};

type JxgBoard = {
  create(type: string, parents: unknown, attributes?: Record<string, unknown>): JxgElement;
  setBoundingBox(bbox: [number, number, number, number], keepaspectratio?: boolean): JxgBoard;
  fullUpdate(): JxgBoard;
  update(): JxgBoard;
  zoomIn(): JxgBoard;
  zoomOut(): JxgBoard;
  jc?: JxgJessieCode;
};

type JxgStatic = {
  initBoard(el: HTMLElement | string, attributes?: Record<string, unknown>): JxgBoard;
  freeBoard(board: JxgBoard | string): void;
};

type ParamValues = Record<string, number>;
type GetParams = () => ParamValues;

/* -------------------------------------------------------------------------- */
/* Colour resolution (design tokens → concrete engine colours)                */
/* -------------------------------------------------------------------------- */

const TOKEN_BY_NAME: Record<string, string> = {
  brand: '--brand',
  foreground: '--foreground',
  'muted-foreground': '--muted-foreground',
  destructive: '--destructive',
  warning: '--warning',
  online: '--online',
};

/** Brand-led palette (all design-token shades) cycled across objects. */
const PALETTE_TOKENS = [
  '--brand-600',
  '--brand-400',
  '--brand-800',
  '--brand-300',
  '--brand-700',
  '--brand-500',
];

/**
 * Resolves any CSS colour expression (token `var()`, hex, rgb, oklch) to a
 * concrete rgb/hex string the engine's colour parser understands — through a
 * probe element (to resolve `var()`/oklch) and a canvas (to normalise to
 * rgb/hex). Returns the fallback during SSR / when the value is unparseable.
 */
function resolveCssColor(value: string, fallback = '#6c5ce7'): string {
  if (typeof document === 'undefined') return fallback;
  const probe = document.createElement('span');
  probe.style.color = value;
  probe.style.display = 'none';
  document.body.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  probe.remove();
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return computed || fallback;
  ctx.fillStyle = fallback;
  ctx.fillStyle = computed; // ignored if unparseable → keeps the fallback
  return ctx.fillStyle;
}

const tokenColor = (token: string) => resolveCssColor(`var(${token})`);

/** Maps an object's authored colour to a concrete engine colour. */
function objectColor(color: string | undefined, index: number): string {
  if (color && (color.startsWith('#') || color.startsWith('rgb'))) return color;
  if (color && TOKEN_BY_NAME[color]) return tokenColor(TOKEN_BY_NAME[color]);
  return tokenColor(PALETTE_TOKENS[index % PALETTE_TOKENS.length]);
}

const DASH_BY_NAME: Record<string, number> = { solid: 0, dashed: 2, dotted: 1 };

/* -------------------------------------------------------------------------- */
/* Expression compilation (parameters resolve to live React state)            */
/* -------------------------------------------------------------------------- */
// Terms are compiled to plain JS closures that read the current parameter
// values from React on every evaluation. This means dragging a slider only
// calls board.update() (cheap) — no board rebuild, no engine-side sliders.

function compileTerm(
  board: JxgBoard,
  expr: string,
  primaryVar: string,
  paramNames: string[],
  getParams: GetParams,
): ((value: number) => number) | string {
  if (!board.jc) return expr;
  const fn = board.jc.snippet(expr, true, [primaryVar, ...paramNames].join(','), false);
  if (paramNames.length === 0) return (value: number) => Number(fn(value));
  return (value: number) => {
    const params = getParams();
    return Number(fn(value, ...paramNames.map((name) => params[name] ?? 0)));
  };
}

function compileImplicit(
  board: JxgBoard,
  expr: string,
  paramNames: string[],
  getParams: GetParams,
): ((x: number, y: number) => number) | string {
  if (!board.jc) return expr;
  const fn = board.jc.snippet(expr, true, ['x', 'y', ...paramNames].join(','), false);
  if (paramNames.length === 0) return (x: number, y: number) => Number(fn(x, y));
  return (x: number, y: number) => {
    const params = getParams();
    return Number(fn(x, y, ...paramNames.map((name) => params[name] ?? 0)));
  };
}

function compileScalar(
  board: JxgBoard,
  value: GraphScalar,
  paramNames: string[],
  getParams: GetParams,
): number | (() => number) {
  if (typeof value === 'number') return value;
  const trimmed = value.trim();
  const numeric = Number(trimmed);
  if (trimmed !== '' && Number.isFinite(numeric)) return numeric;
  if (!board.jc) return Number.NaN;
  const fn = board.jc.snippet(value, true, paramNames.join(','), false);
  if (paramNames.length === 0) return () => Number(fn());
  return () => {
    const params = getParams();
    return Number(fn(...paramNames.map((name) => params[name] ?? 0)));
  };
}

/* -------------------------------------------------------------------------- */
/* Object construction                                                        */
/* -------------------------------------------------------------------------- */

function createObject(
  board: JxgBoard,
  object: GraphObject,
  index: number,
  viewportX: [number, number],
  paramNames: string[],
  getParams: GetParams,
  interactive: boolean,
): void {
  const stroke = objectColor(object.style?.color, index);
  const width = object.style?.width ?? 2.5;
  const dash = DASH_BY_NAME[object.style?.dash ?? 'solid'] ?? 0;
  const visible = object.visible !== false;
  const label = object.label ?? '';
  const shared: Record<string, unknown> = {
    strokeColor: stroke,
    strokeWidth: width,
    dash,
    visible,
    fixed: true,
    highlight: interactive,
    highlightStrokeColor: stroke,
    highlightStrokeWidth: width + 1.5,
    name: label,
    withLabel: label.length > 0,
    label: { color: stroke, fontSize: 13, cssClass: 'fg-label', highlight: false },
  };

  switch (object.kind) {
    case 'function': {
      const domainMin = object.domainMin ?? viewportX[0];
      const domainMax = object.domainMax ?? viewportX[1];
      board.create(
        'functiongraph',
        [compileTerm(board, object.expr, 'x', paramNames, getParams), domainMin, domainMax],
        shared,
      );
      return;
    }
    case 'parametric': {
      board.create(
        'curve',
        [
          compileTerm(board, object.xExpr, 't', paramNames, getParams),
          compileTerm(board, object.yExpr, 't', paramNames, getParams),
          object.tMin,
          object.tMax,
        ],
        shared,
      );
      return;
    }
    case 'implicit': {
      board.create('implicitcurve', [compileImplicit(board, object.expr, paramNames, getParams)], shared);
      return;
    }
    case 'point': {
      board.create(
        'point',
        [
          compileScalar(board, object.x, paramNames, getParams),
          compileScalar(board, object.y, paramNames, getParams),
        ],
        {
          ...shared,
          fillColor: stroke,
          strokeColor: 'var(--card)',
          strokeWidth: 2,
          size: Math.max(3, width + 1.5),
          face: 'o',
          highlightFillColor: stroke,
          highlightStrokeColor: 'var(--card)',
        },
      );
      return;
    }
    case 'segment': {
      board.create(
        'segment',
        [
          [compileScalar(board, object.x1, paramNames, getParams), compileScalar(board, object.y1, paramNames, getParams)],
          [compileScalar(board, object.x2, paramNames, getParams), compileScalar(board, object.y2, paramNames, getParams)],
        ],
        { ...shared, point1: { visible: false }, point2: { visible: false } },
      );
      return;
    }
    case 'verticalLine': {
      const x = compileScalar(board, object.x, paramNames, getParams);
      board.create(
        'line',
        [
          [x, 0],
          [x, 1],
        ],
        {
          ...shared,
          straightFirst: true,
          straightLast: true,
          point1: { visible: false },
          point2: { visible: false },
        },
      );
      return;
    }
  }
}

type BuildResult = {
  board: JxgBoard;
  bbox: [number, number, number, number];
  failedCount: number;
};

function buildBoard(
  JXG: JxgStatic,
  el: HTMLElement,
  spec: GraphSpec,
  interactive: boolean,
  getParams: GetParams,
): BuildResult {
  const { xMin, xMax, yMin, yMax } = spec.viewport;
  const bbox: [number, number, number, number] = [xMin, yMax, xMax, yMin];
  const axes = spec.axes ?? {};
  const paramNames = (spec.parameters ?? []).map((parameter) => parameter.name);

  const axisColor = tokenColor('--muted-foreground');
  const gridColor = tokenColor('--muted-foreground');
  const labelColor = tokenColor('--muted-foreground');

  const board = JXG.initBoard(el, {
    boundingbox: bbox,
    axis: false,
    grid: false,
    keepAspectRatio: false,
    showCopyright: false,
    showNavigation: false,
    showInfobox: false,
    pan: { enabled: interactive, needShift: false, needTwoFingers: true },
    zoom: interactive
      ? { enabled: true, wheel: true, needShift: false, pinchHorizontal: true, pinchVertical: true, min: 0.05, max: 200 }
      : { enabled: false, wheel: false, pinchHorizontal: false, pinchVertical: false },
    resize: { enabled: true, throttle: 200 },
    registerEvents: interactive,
  });

  if (axes.showGrid !== false) {
    board.create('grid', [], { strokeColor: gridColor, strokeOpacity: 0.12, strokeWidth: 1 });
  }

  const axisAttr = (label: string | null | undefined, horizontal: boolean): Record<string, unknown> => ({
    strokeColor: axisColor,
    strokeOpacity: 0.55,
    strokeWidth: 1.5,
    highlight: false,
    fixed: true,
    lastArrow: { type: 2, size: 6 },
    name: label ?? '',
    withLabel: !!label,
    label: { color: labelColor, fontSize: 13, cssClass: 'fg-label', position: horizontal ? 'rt' : 'urt' },
    ticks: {
      strokeColor: axisColor,
      strokeOpacity: 0.35,
      majorHeight: 6,
      minorTicks: 0,
      drawZero: false,
      label: { color: labelColor, fontSize: 11, cssClass: 'fg-tick-label' },
    },
  });

  if (axes.showX !== false) {
    board.create('axis', [[0, 0], [1, 0]], axisAttr(axes.xLabel, true));
  }
  if (axes.showY !== false) {
    board.create('axis', [[0, 0], [0, 1]], axisAttr(axes.yLabel, false));
  }
  // Subtle origin dot for orientation.
  if (axes.showX !== false && axes.showY !== false) {
    board.create('point', [0, 0], {
      fixed: true,
      highlight: false,
      withLabel: false,
      size: 1.5,
      strokeColor: axisColor,
      fillColor: axisColor,
      strokeOpacity: 0.5,
      fillOpacity: 0.5,
    });
  }

  let failedCount = 0;
  spec.objects.forEach((object, i) => {
    try {
      createObject(board, object, i, [xMin, xMax], paramNames, getParams, interactive);
    } catch {
      failedCount += 1;
    }
  });

  return { board, bbox, failedCount };
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export type FunctionGraphBoardProps = {
  spec: GraphSpec;
  interactive?: boolean;
  /** Live parameter values driven by the wrapper's slider panel. */
  paramValues?: ParamValues;
  labels?: FunctionGraphLabels;
  className?: string;
};

export function FunctionGraphBoard({
  spec,
  interactive = false,
  paramValues,
  labels,
  className,
}: FunctionGraphBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<JxgStatic | null>(null);
  const boardRef = useRef<JxgBoard | null>(null);
  const bboxRef = useRef<[number, number, number, number] | null>(null);
  const paramsRef = useRef<ParamValues>(paramValues ?? {});
  const [ready, setReady] = useState(false);
  const [themeVersion, setThemeVersion] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const getParams = useCallback<GetParams>(() => paramsRef.current, []);

  // Load the engine once (client-only). The wrapper already loads this file via
  // next/dynamic({ ssr: false }); this dynamic import keeps the engine in its
  // own chunk and gives us the typed handle.
  useEffect(() => {
    let cancelled = false;
    void import('jsxgraph').then((mod) => {
      if (cancelled) return;
      // Loose lib types — cast the named ESM export to our minimal surface.
      engineRef.current = (mod as unknown as { JSXGraph: JxgStatic }).JSXGraph;
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Re-resolve colours and rebuild when the theme flips. The engine caches
  // colours at element-creation time, so a full rebuild is the simplest correct
  // recolour — theme toggles are rare, so the lost pan/zoom is acceptable.
  useEffect(() => {
    const observer = new MutationObserver(() => setThemeVersion((v) => v + 1));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // (Re)build the board on spec / mode / theme change — NOT on parameter
  // changes (those flow through the lightweight update effect below).
  const specKey = JSON.stringify(spec);
  useEffect(() => {
    const JXG = engineRef.current;
    const el = containerRef.current;
    if (!ready || !JXG || !el) return;

    let result: BuildResult | null = null;
    try {
      result = buildBoard(JXG, el, spec, interactive, getParams);
      boardRef.current = result.board;
      bboxRef.current = result.bbox;
      setFailedCount(result.failedCount);
    } catch {
      setFailedCount(spec.objects.length);
    }

    return () => {
      if (result) {
        try {
          JXG.freeBoard(result.board);
        } catch {
          /* board already torn down */
        }
      }
      boardRef.current = null;
    };
    // specKey captures deep spec changes; spec/interactive are derived from it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, specKey, interactive, themeVersion, getParams]);

  // Live parameter updates: refresh the shared values and repaint — no rebuild.
  const paramsKey = JSON.stringify(paramValues ?? {});
  useEffect(() => {
    paramsRef.current = paramValues ?? {};
    boardRef.current?.update();
    // paramsKey captures the value changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey]);

  const zoomIn = () => boardRef.current?.zoomIn();
  const zoomOut = () => boardRef.current?.zoomOut();
  const resetView = () => {
    if (boardRef.current && bboxRef.current) {
      boardRef.current.setBoundingBox(bboxRef.current, false).fullUpdate();
    }
  };

  return (
    <div className={cn('relative h-full w-full', className)}>
      {/* Inline styles, not Tailwind utilities: jsxgraph.css is imported
          unlayered and its `.jxgbox { position: relative }` rule out-cascades
          layered Tailwind utilities. Inline styles win regardless of layer. */}
      <div
        ref={containerRef}
        className="jxgbox touch-pan-y"
        style={{ position: 'absolute', inset: 0, backgroundColor: 'transparent', border: 'none' }}
      />

      {interactive ? (
        <div className="absolute top-2.5 right-2.5 z-10 flex flex-col overflow-hidden rounded-lg border border-border bg-card/85 shadow-sm backdrop-blur">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={zoomIn}
            aria-label={labels?.zoomIn ?? 'Zoom in'}
            className="size-8 rounded-none"
          >
            <ZoomInIcon className="size-4" />
          </Button>
          <div className="h-px bg-border" />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={zoomOut}
            aria-label={labels?.zoomOut ?? 'Zoom out'}
            className="size-8 rounded-none"
          >
            <ZoomOutIcon className="size-4" />
          </Button>
          <div className="h-px bg-border" />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={resetView}
            aria-label={labels?.resetView ?? 'Reset view'}
            className="size-8 rounded-none"
          >
            <Maximize2Icon className="size-4" />
          </Button>
        </div>
      ) : null}

      {failedCount > 0 ? (
        <p
          role="status"
          className="absolute right-2 bottom-2 left-2 z-10 rounded-md bg-card/85 px-2 py-1 text-center text-xs text-destructive backdrop-blur-sm"
        >
          {labels?.invalidExpression ?? 'Some expressions could not be rendered'}
        </p>
      ) : null}
    </div>
  );
}
