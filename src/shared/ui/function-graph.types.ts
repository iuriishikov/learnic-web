/**
 * Generic, business-free description of an interactive 2D math graph rendered by
 * `FunctionGraph` (a thin React wrapper over the JSXGraph engine). The shape is
 * serialisable and engine-agnostic so the feature layer can map a stored block
 * config onto it without importing the engine — and so the renderer can be
 * swapped later without touching consumers.
 */

export type GraphDash = 'solid' | 'dashed' | 'dotted';

export type GraphObjectStyle = {
  /** Hex (`#rrggbb`), `rgb(...)`, or a design-token name (`brand`, `foreground`, …). */
  color?: string;
  /** Stroke width in px. */
  width?: number;
  dash?: GraphDash;
};

type GraphObjectBase = {
  /** Optional plain-text label rendered near the object. */
  label?: string | null;
  /** Author can hide an object without deleting it. */
  visible?: boolean;
  style?: GraphObjectStyle;
};

/** A coordinate that is either a constant or an expression over the parameters. */
export type GraphScalar = number | string;

/** `y = f(x)`, e.g. `a * sin(x + b)`. */
export type GraphFunctionObject = GraphObjectBase & {
  kind: 'function';
  expr: string;
  domainMin?: number | null;
  domainMax?: number | null;
};

/** A parametric curve `(x(t), y(t))` over `t ∈ [tMin, tMax]`. */
export type GraphParametricObject = GraphObjectBase & {
  kind: 'parametric';
  xExpr: string;
  yExpr: string;
  tMin: number;
  tMax: number;
};

/** An implicit curve `f(x, y) = 0`, e.g. `x^2 + y^2 - 4`. */
export type GraphImplicitObject = GraphObjectBase & {
  kind: 'implicit';
  expr: string;
};

export type GraphPointObject = GraphObjectBase & {
  kind: 'point';
  x: GraphScalar;
  y: GraphScalar;
};

export type GraphSegmentObject = GraphObjectBase & {
  kind: 'segment';
  x1: GraphScalar;
  y1: GraphScalar;
  x2: GraphScalar;
  y2: GraphScalar;
};

export type GraphVerticalLineObject = GraphObjectBase & {
  kind: 'verticalLine';
  x: GraphScalar;
};

export type GraphObject =
  | GraphFunctionObject
  | GraphParametricObject
  | GraphImplicitObject
  | GraphPointObject
  | GraphSegmentObject
  | GraphVerticalLineObject;

export type GraphObjectKind = GraphObject['kind'];

/** A slider parameter that expressions can reference by `name`. */
export type GraphParameter = {
  /** Identifier referenced inside expressions, e.g. `a`. */
  name: string;
  min: number;
  max: number;
  step: number;
  /** Default / current value. */
  value: number;
};

export type GraphViewport = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};

export type GraphAxes = {
  showX?: boolean;
  showY?: boolean;
  showGrid?: boolean;
  xLabel?: string | null;
  yLabel?: string | null;
};

export type GraphSpec = {
  viewport: GraphViewport;
  axes?: GraphAxes;
  parameters?: GraphParameter[];
  objects: GraphObject[];
};

/** i18n strings the engine surfaces — passed in so `shared/ui` stays namespace-free. */
export type FunctionGraphLabels = {
  /** Inline notice when one or more expressions fail to render. */
  invalidExpression?: string;
  /** Error-boundary fallback when the whole engine fails. */
  unavailable?: string;
  /** aria-label / tooltip for the reset-view control. */
  resetView?: string;
  /** aria-label for the zoom-in control. */
  zoomIn?: string;
  /** aria-label for the zoom-out control. */
  zoomOut?: string;
};
