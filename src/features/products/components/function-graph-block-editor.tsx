'use client';

import {
  ChevronDownIcon,
  EyeIcon,
  EyeOffIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type ReactNode, useState } from 'react';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { FunctionGraph, type FunctionGraphLabels } from '@/shared/ui/function-graph';
import type {
  GraphObject,
  GraphObjectKind,
  GraphParameter,
} from '@/shared/ui/function-graph.types';
import { Input } from '@/shared/ui/input';
import {
  Menu,
  MenuContent,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from '@/shared/ui/menu';
import { Switch } from '@/shared/ui/switch';

import {
  FUNCTION_GRAPH_MAX_OBJECTS,
  FUNCTION_GRAPH_MAX_PARAMS,
  GRAPH_EXPR_MAX_LEN,
  GRAPH_PARAM_NAME_MAX_LEN,
  type FunctionGraphConfig,
} from '../model/draft';

const OBJECT_KINDS: readonly GraphObjectKind[] = [
  'function',
  'parametric',
  'implicit',
  'point',
  'segment',
  'verticalLine',
];

const COLOR_TOKENS = [
  'brand',
  'online',
  'warning',
  'destructive',
  'foreground',
  'muted-foreground',
] as const;

type MenuSelectOption = { value: string; label: string; color?: string };

function ColorSwatch({ color }: { color?: string }) {
  if (!color) {
    return (
      <span className="size-3 shrink-0 rounded-full border border-border bg-gradient-to-br from-muted-foreground/40 to-muted-foreground/5" />
    );
  }
  return (
    <span
      className="size-3 shrink-0 rounded-full border border-border/40"
      style={{ backgroundColor: `var(--${color})` }}
    />
  );
}

/** Brand-styled value picker over the shared `Menu` (no native select). */
function MenuSelect({
  value,
  options,
  onValueChange,
  ariaLabel,
  withSwatch = false,
  className,
}: {
  value: string;
  options: MenuSelectOption[];
  onValueChange: (value: string) => void;
  ariaLabel: string;
  withSwatch?: boolean;
  className?: string;
}) {
  const current = options.find((o) => o.value === value);
  return (
    <Menu>
      <MenuTrigger
        aria-label={ariaLabel}
        className={cn(
          'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-input bg-transparent px-2.5 text-sm font-medium text-foreground outline-none transition-colors hover:bg-muted/40 focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/20 data-popup-open:border-brand data-popup-open:bg-muted/40 dark:bg-input/30',
          className,
        )}
      >
        {withSwatch ? <ColorSwatch color={current?.color} /> : null}
        <span className="truncate">{current?.label ?? value}</span>
        <ChevronDownIcon className="ml-auto size-3.5 shrink-0 text-muted-foreground" />
      </MenuTrigger>
      <MenuContent size="sm" align="start">
        <MenuRadioGroup value={value} onValueChange={onValueChange}>
          {options.map((option) => (
            <MenuRadioItem
              key={option.value}
              value={option.value}
              leading={withSwatch ? <ColorSwatch color={option.color} /> : undefined}
            >
              {option.label}
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </MenuContent>
    </Menu>
  );
}

function defaultObject(kind: GraphObjectKind): GraphObject {
  const base = { visible: true as const };
  switch (kind) {
    case 'function':
      return { kind: 'function', expr: '', ...base };
    case 'parametric':
      return {
        kind: 'parametric',
        xExpr: 'cos(t)',
        yExpr: 'sin(t)',
        tMin: 0,
        tMax: 6.2832,
        ...base,
      };
    case 'implicit':
      return { kind: 'implicit', expr: 'x^2 + y^2 - 4', ...base };
    case 'point':
      return { kind: 'point', x: 0, y: 0, ...base };
    case 'segment':
      return { kind: 'segment', x1: 0, y1: 0, x2: 1, y2: 1, ...base };
    case 'verticalLine':
      return { kind: 'verticalLine', x: 0, ...base };
  }
}

function toNumber(value: string, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

const PARAM_NAME_RE = /^[a-zA-Z][a-zA-Z0-9_]*$/;
const isFiniteNumber = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v);

/**
 * Whether a config passes the backend's essential invariants — used to gate
 * the network save so transient states while typing (e.g. `min > value`, an
 * inverted viewport) update the live preview but never hit the API and trip a
 * "save failed" toast.
 */
function isConfigSaveable(config: FunctionGraphConfig): boolean {
  const v = config.viewport;
  if (![v.xMin, v.xMax, v.yMin, v.yMax].every(isFiniteNumber)) return false;
  if (v.xMin >= v.xMax || v.yMin >= v.yMax) return false;
  const seen = new Set<string>();
  for (const p of config.parameters ?? []) {
    if (!PARAM_NAME_RE.test(p.name) || seen.has(p.name)) return false;
    seen.add(p.name);
    if (![p.min, p.max, p.value].every(isFiniteNumber)) return false;
    if (!(p.min <= p.value && p.value <= p.max)) return false;
    if (!(isFiniteNumber(p.step) && p.step > 0)) return false;
  }
  return true;
}

export type FunctionGraphBlockEditorProps = {
  blockId: string;
  config: FunctionGraphConfig;
  onChange: (config: FunctionGraphConfig) => void;
  canEdit: boolean;
};

export function FunctionGraphBlockEditor({
  blockId,
  config,
  onChange,
  canEdit,
}: FunctionGraphBlockEditorProps) {
  const t = useTranslations('teach-products.editor.functionGraph');
  // Uncontrolled w.r.t. server pushes — seeded once; the parent remounts
  // (key=block.id) for a fresh seed. Local state drives the instant
  // preview; `onChange` is the parent's debounced commit.
  const [draft, setDraft] = useState<FunctionGraphConfig>(config);

  function commit(next: FunctionGraphConfig) {
    setDraft(next);
    // Preview always updates; only valid configs are sent to the server.
    if (isConfigSaveable(next)) onChange(next);
  }

  const labels: FunctionGraphLabels = {
    invalidExpression: t('invalidExpression'),
    unavailable: t('unavailable'),
    resetView: t('resetView'),
    zoomIn: t('zoomIn'),
    zoomOut: t('zoomOut'),
  };

  const objects = draft.objects;
  const parameters = draft.parameters ?? [];
  const viewport = draft.viewport;

  function patchObject(index: number, next: GraphObject) {
    commit({
      ...draft,
      objects: objects.map((o, i) => (i === index ? next : o)),
    });
  }

  function removeObject(index: number) {
    commit({ ...draft, objects: objects.filter((_, i) => i !== index) });
  }

  function addObject() {
    commit({ ...draft, objects: [...objects, defaultObject('function')] });
  }

  function changeKind(index: number, kind: GraphObjectKind) {
    const current = objects[index];
    patchObject(index, {
      ...defaultObject(kind),
      label: current.label,
      visible: current.visible,
      style: current.style,
    });
  }

  function patchParameter(index: number, next: GraphParameter) {
    commit({
      ...draft,
      parameters: parameters.map((p, i) => (i === index ? next : p)),
    });
  }

  function addParameter() {
    const name = nextParamName(parameters);
    commit({
      ...draft,
      parameters: [...parameters, { name, min: -5, max: 5, step: 0.1, value: 1 }],
    });
  }

  function removeParameter(index: number) {
    commit({
      ...draft,
      parameters: parameters.filter((_, i) => i !== index),
    });
  }

  const disabled = !canEdit;

  return (
    <div
      data-cursor-target={`block.${blockId}.config`}
      className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
    >
      <FunctionGraph
        bare
        spec={draft}
        interactive={draft.interactive}
        labels={labels}
        className="p-3"
      />

      <fieldset
        disabled={disabled}
        className="flex flex-col gap-5 border-t border-border p-4 disabled:opacity-60"
      >
        <label className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/20 px-3.5 py-3">
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">
              {t('interactive')}
            </span>
            <span className="text-xs text-muted-foreground">
              {t('interactiveHint')}
            </span>
          </span>
          <Switch
            checked={draft.interactive}
            onCheckedChange={(checked) =>
              commit({ ...draft, interactive: checked })
            }
          />
        </label>

        <Section title={t('viewport')}>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {(
              [
                ['xMin', viewport.xMin],
                ['xMax', viewport.xMax],
                ['yMin', viewport.yMin],
                ['yMax', viewport.yMax],
              ] as const
            ).map(([key, value]) => (
              <LabeledNumber
                key={key}
                label={t(`bounds.${key}`)}
                value={value}
                ariaLabel={t(`bounds.${key}`)}
                onChange={(v) =>
                  commit({ ...draft, viewport: { ...viewport, [key]: v } })
                }
              />
            ))}
          </div>
        </Section>

        <Section title={t('objects')} count={objects.length}>
          {objects.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {objects.map((object, index) => (
                <ObjectRow
                  key={index}
                  object={object}
                  onKindChange={(kind) => changeKind(index, kind)}
                  onChange={(next) => patchObject(index, next)}
                  onRemove={() => removeObject(index)}
                  t={t}
                />
              ))}
            </div>
          ) : null}
          <AddButton
            onClick={addObject}
            disabled={objects.length >= FUNCTION_GRAPH_MAX_OBJECTS}
            label={t('addObject')}
          />
        </Section>

        <Section title={t('parameters')} count={parameters.length}>
          {parameters.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {parameters.map((parameter, index) => (
                <ParamRow
                  key={index}
                  parameter={parameter}
                  t={t}
                  onChange={(next) => patchParameter(index, next)}
                  onRemove={() => removeParameter(index)}
                />
              ))}
            </div>
          ) : null}
          <AddButton
            onClick={addParameter}
            disabled={parameters.length >= FUNCTION_GRAPH_MAX_PARAMS}
            label={t('addParameter')}
          />
        </Section>
      </fieldset>
    </div>
  );
}

function nextParamName(parameters: GraphParameter[]): string {
  const used = new Set(parameters.map((p) => p.name));
  for (const letter of 'abcdefghijklmnopqrstuvwxyz') {
    if (!used.has(letter)) return letter;
  }
  return `p${parameters.length}`;
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <span className="text-[0.7rem] font-semibold tracking-wider text-muted-foreground uppercase">
          {title}
        </span>
        {count ? (
          <span className="rounded-full bg-muted px-1.5 text-[0.65rem] font-medium text-muted-foreground tabular-nums">
            {count}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function LabeledNumber({
  label,
  value,
  onChange,
  ariaLabel,
  width = 'w-full',
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
  width?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="px-0.5 text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <Input
        type="number"
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onChange(toNumber(e.target.value, value))}
        className={cn('h-8 font-mono', width)}
      />
    </label>
  );
}

function AddButton({
  onClick,
  disabled,
  label,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="h-8 gap-1.5 self-start border-dashed text-muted-foreground hover:text-foreground"
    >
      <PlusIcon className="size-3.5" />
      {label}
    </Button>
  );
}

function objectStripe(color: string | undefined): string | undefined {
  if (!color) return undefined;
  if (color.startsWith('#') || color.startsWith('rgb')) return color;
  return `var(--${color})`;
}

function ParamRow({
  parameter,
  t,
  onChange,
  onRemove,
}: {
  parameter: GraphParameter;
  t: ReturnType<typeof useTranslations>;
  onChange: (parameter: GraphParameter) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-x-3 gap-y-2 rounded-lg border border-border bg-background/50 p-3">
      <label className="flex flex-col gap-1">
        <span className="px-0.5 text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
          {t('param.name')}
        </span>
        <Input
          value={parameter.name}
          maxLength={GRAPH_PARAM_NAME_MAX_LEN}
          onChange={(e) => onChange({ ...parameter, name: e.target.value })}
          aria-label={t('paramName')}
          className="h-8 w-16 font-mono font-medium"
        />
      </label>
      {(['min', 'max', 'step', 'value'] as const).map((field) => (
        <LabeledNumber
          key={field}
          label={t(`param.${field}`)}
          value={parameter[field]}
          ariaLabel={`${parameter.name} ${field}`}
          width="w-16"
          onChange={(v) => onChange({ ...parameter, [field]: v })}
        />
      ))}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        aria-label={t('removeParameter')}
        className="ml-auto size-8 self-end text-muted-foreground hover:text-destructive"
      >
        <Trash2Icon className="size-4" />
      </Button>
    </div>
  );
}

type ObjectRowProps = {
  object: GraphObject;
  onKindChange: (kind: GraphObjectKind) => void;
  onChange: (object: GraphObject) => void;
  onRemove: () => void;
  t: ReturnType<typeof useTranslations>;
};

function ObjectRow({ object, onKindChange, onChange, onRemove, t }: ObjectRowProps) {
  const stripe = objectStripe(object.style?.color);
  return (
    <div
      className="flex flex-col gap-2.5 rounded-lg border border-border bg-background/50 p-2.5"
      style={stripe ? { borderLeftWidth: 3, borderLeftColor: stripe } : undefined}
    >
      <div className="flex items-center gap-2">
        <MenuSelect
          value={object.kind}
          options={OBJECT_KINDS.map((kind) => ({
            value: kind,
            label: t(`kind.${kind}`),
          }))}
          onValueChange={(value) => onKindChange(value as GraphObjectKind)}
          ariaLabel={t('objectKind')}
          className="w-44"
        />

        <MenuSelect
          value={object.style?.color ?? ''}
          withSwatch
          options={[
            { value: '', label: t('colorAuto') },
            ...COLOR_TOKENS.map((token) => ({
              value: token,
              label: token,
              color: token,
            })),
          ]}
          onValueChange={(value) =>
            onChange({
              ...object,
              style: value ? { ...object.style, color: value } : undefined,
            })
          }
          ariaLabel={t('color')}
          className="w-32"
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() =>
            onChange({ ...object, visible: object.visible === false })
          }
          aria-label={object.visible === false ? t('showObject') : t('hideObject')}
          className="size-8 text-muted-foreground"
        >
          {object.visible === false ? (
            <EyeOffIcon className="size-4" />
          ) : (
            <EyeIcon className="size-4" />
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          aria-label={t('removeObject')}
          className="ml-auto size-8 text-muted-foreground hover:text-destructive"
        >
          <Trash2Icon className="size-4" />
        </Button>
      </div>

      <div className={object.visible === false ? 'opacity-50' : undefined}>
        <ObjectFields object={object} onChange={onChange} t={t} />
      </div>
    </div>
  );
}

const FIELD_WRAP_CLASS =
  'flex items-center gap-2 rounded-lg border border-input bg-background/50 px-2.5 transition-colors focus-within:border-brand focus-within:ring-3 focus-within:ring-brand/20 dark:bg-input/30';
const FIELD_INPUT_CLASS =
  'h-8 border-0 bg-transparent px-0 font-mono shadow-none focus-visible:ring-0 dark:bg-transparent';

function ExprInput({
  value,
  placeholder,
  onChange,
  ariaLabel,
  prefix,
}: {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  prefix?: string;
}) {
  return (
    <div className={cn(FIELD_WRAP_CLASS, 'flex-1')}>
      {prefix ? (
        <span className="shrink-0 font-mono text-sm text-muted-foreground">
          {prefix}
        </span>
      ) : null}
      <Input
        value={value}
        maxLength={GRAPH_EXPR_MAX_LEN}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className={cn(FIELD_INPUT_CLASS, 'flex-1')}
      />
    </div>
  );
}

function ScalarInput({
  value,
  onChange,
  ariaLabel,
  label,
}: {
  value: number | string;
  onChange: (value: string) => void;
  ariaLabel: string;
  label?: string;
}) {
  return (
    <div className={FIELD_WRAP_CLASS}>
      {label ? (
        <span className="font-mono text-xs text-muted-foreground">{label}</span>
      ) : null}
      <Input
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className={cn(FIELD_INPUT_CLASS, 'w-16')}
      />
    </div>
  );
}

function ObjectFields({
  object,
  onChange,
  t,
}: {
  object: GraphObject;
  onChange: (object: GraphObject) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  switch (object.kind) {
    case 'function':
      return (
        <ExprInput
          value={object.expr}
          prefix="y ="
          placeholder="a*sin(b*x)"
          ariaLabel={t('expression')}
          onChange={(expr) => onChange({ ...object, expr })}
        />
      );
    case 'implicit':
      return (
        <ExprInput
          value={object.expr}
          prefix="0 ="
          placeholder="x^2 + y^2 - 4"
          ariaLabel={t('expression')}
          onChange={(expr) => onChange({ ...object, expr })}
        />
      );
    case 'parametric':
      return (
        <div className="flex flex-wrap items-center gap-2">
          <ExprInput
            value={object.xExpr}
            prefix="x(t) ="
            placeholder="cos(t)"
            ariaLabel={t('xExpr')}
            onChange={(xExpr) => onChange({ ...object, xExpr })}
          />
          <ExprInput
            value={object.yExpr}
            prefix="y(t) ="
            placeholder="sin(t)"
            ariaLabel={t('yExpr')}
            onChange={(yExpr) => onChange({ ...object, yExpr })}
          />
        </div>
      );
    case 'point':
      return (
        <div className="flex flex-wrap items-center gap-2">
          <ScalarInput
            value={object.x}
            label="x"
            ariaLabel="x"
            onChange={(x) => onChange({ ...object, x })}
          />
          <ScalarInput
            value={object.y}
            label="y"
            ariaLabel="y"
            onChange={(y) => onChange({ ...object, y })}
          />
        </div>
      );
    case 'segment':
      return (
        <div className="flex flex-wrap items-center gap-2">
          <ScalarInput value={object.x1} label="x₁" ariaLabel="x1" onChange={(x1) => onChange({ ...object, x1 })} />
          <ScalarInput value={object.y1} label="y₁" ariaLabel="y1" onChange={(y1) => onChange({ ...object, y1 })} />
          <ScalarInput value={object.x2} label="x₂" ariaLabel="x2" onChange={(x2) => onChange({ ...object, x2 })} />
          <ScalarInput value={object.y2} label="y₂" ariaLabel="y2" onChange={(y2) => onChange({ ...object, y2 })} />
        </div>
      );
    case 'verticalLine':
      return (
        <ScalarInput
          value={object.x}
          label="x ="
          ariaLabel="x"
          onChange={(x) => onChange({ ...object, x })}
        />
      );
  }
}
