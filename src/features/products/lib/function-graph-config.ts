/**
 * Wire (snake_case) <-> domain (camelCase) mapping for the
 * function-graph block's `config` payload. The backend stores and
 * serves the spec in snake_case (`x_min`, `x_expr`, `vertical_line`,
 * …); the domain config mirrors the `FunctionGraph` primitive's
 * camelCase `GraphSpec` so components never see snake_case keys.
 */

import type {
  GraphObject,
  GraphObjectStyle,
} from '@/shared/ui/function-graph.types';

import type { FunctionGraphConfig } from '../model/draft';

const SCHEMA_VERSION = 1;

type GraphStyleWire = GraphObjectStyle;

type GraphViewportWire = {
  x_min: number;
  x_max: number;
  y_min: number;
  y_max: number;
};

type GraphAxesWire = {
  show_x?: boolean;
  show_y?: boolean;
  show_grid?: boolean;
  x_label?: string | null;
  y_label?: string | null;
};

type GraphParameterWire = {
  name: string;
  min: number;
  max: number;
  step: number;
  value: number;
};

type GraphObjectBaseWire = {
  label?: string | null;
  visible?: boolean;
  style?: GraphStyleWire;
};

type GraphObjectWire =
  | (GraphObjectBaseWire & {
      kind: 'function';
      expr: string;
      domain_min?: number | null;
      domain_max?: number | null;
    })
  | (GraphObjectBaseWire & {
      kind: 'parametric';
      x_expr: string;
      y_expr: string;
      t_min: number;
      t_max: number;
    })
  | (GraphObjectBaseWire & { kind: 'implicit'; expr: string })
  | (GraphObjectBaseWire & { kind: 'point'; x: number | string; y: number | string })
  | (GraphObjectBaseWire & {
      kind: 'segment';
      x1: number | string;
      y1: number | string;
      x2: number | string;
      y2: number | string;
    })
  | (GraphObjectBaseWire & { kind: 'vertical_line'; x: number | string });

export type FunctionGraphConfigWire = {
  schema_version: number;
  interactive: boolean;
  viewport: GraphViewportWire;
  axes?: GraphAxesWire;
  parameters?: GraphParameterWire[];
  objects: GraphObjectWire[];
};

function baseFromWire(o: GraphObjectBaseWire) {
  return {
    label: o.label ?? null,
    visible: o.visible ?? true,
    style: o.style,
  };
}

function objectFromWire(o: GraphObjectWire): GraphObject {
  const base = baseFromWire(o);
  switch (o.kind) {
    case 'function':
      return {
        kind: 'function',
        expr: o.expr,
        domainMin: o.domain_min ?? null,
        domainMax: o.domain_max ?? null,
        ...base,
      };
    case 'parametric':
      return {
        kind: 'parametric',
        xExpr: o.x_expr,
        yExpr: o.y_expr,
        tMin: o.t_min,
        tMax: o.t_max,
        ...base,
      };
    case 'implicit':
      return { kind: 'implicit', expr: o.expr, ...base };
    case 'point':
      return { kind: 'point', x: o.x, y: o.y, ...base };
    case 'segment':
      return { kind: 'segment', x1: o.x1, y1: o.y1, x2: o.x2, y2: o.y2, ...base };
    case 'vertical_line':
      return { kind: 'verticalLine', x: o.x, ...base };
  }
}

export function fromConfigWire(raw: FunctionGraphConfigWire): FunctionGraphConfig {
  return {
    interactive: raw.interactive,
    viewport: {
      xMin: raw.viewport.x_min,
      xMax: raw.viewport.x_max,
      yMin: raw.viewport.y_min,
      yMax: raw.viewport.y_max,
    },
    axes: raw.axes
      ? {
          showX: raw.axes.show_x,
          showY: raw.axes.show_y,
          showGrid: raw.axes.show_grid,
          xLabel: raw.axes.x_label ?? null,
          yLabel: raw.axes.y_label ?? null,
        }
      : undefined,
    parameters: raw.parameters?.map((p) => ({
      name: p.name,
      min: p.min,
      max: p.max,
      step: p.step,
      value: p.value,
    })),
    objects: raw.objects.map(objectFromWire),
  };
}

function baseToWire(o: GraphObject): GraphObjectBaseWire {
  return {
    label: o.label ?? null,
    visible: o.visible ?? true,
    style: o.style,
  };
}

function objectToWire(o: GraphObject): GraphObjectWire {
  const base = baseToWire(o);
  switch (o.kind) {
    case 'function':
      return {
        kind: 'function',
        expr: o.expr,
        domain_min: o.domainMin ?? null,
        domain_max: o.domainMax ?? null,
        ...base,
      };
    case 'parametric':
      return {
        kind: 'parametric',
        x_expr: o.xExpr,
        y_expr: o.yExpr,
        t_min: o.tMin,
        t_max: o.tMax,
        ...base,
      };
    case 'implicit':
      return { kind: 'implicit', expr: o.expr, ...base };
    case 'point':
      return { kind: 'point', x: o.x, y: o.y, ...base };
    case 'segment':
      return { kind: 'segment', x1: o.x1, y1: o.y1, x2: o.x2, y2: o.y2, ...base };
    case 'verticalLine':
      return { kind: 'vertical_line', x: o.x, ...base };
  }
}

export function toConfigWire(
  config: FunctionGraphConfig,
): FunctionGraphConfigWire {
  return {
    schema_version: SCHEMA_VERSION,
    interactive: config.interactive,
    viewport: {
      x_min: config.viewport.xMin,
      x_max: config.viewport.xMax,
      y_min: config.viewport.yMin,
      y_max: config.viewport.yMax,
    },
    axes: config.axes
      ? {
          show_x: config.axes.showX,
          show_y: config.axes.showY,
          show_grid: config.axes.showGrid,
          x_label: config.axes.xLabel ?? null,
          y_label: config.axes.yLabel ?? null,
        }
      : undefined,
    parameters: config.parameters?.map((p) => ({
      name: p.name,
      min: p.min,
      max: p.max,
      step: p.step,
      value: p.value,
    })),
    objects: config.objects.map(objectToWire),
  };
}
