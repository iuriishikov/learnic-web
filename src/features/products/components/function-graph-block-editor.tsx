'use client';

import { EyeIcon, EyeOffIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/shared/ui/button';
import { FunctionGraph, type FunctionGraphLabels } from '@/shared/ui/function-graph';
import type {
  GraphObject,
  GraphObjectKind,
  GraphParameter,
} from '@/shared/ui/function-graph.types';
import { Input } from '@/shared/ui/input';
import { NativeSelect, NativeSelectOption } from '@/shared/ui/native-select';
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

export type FunctionGraphBlockEditorProps = {
  blockId: string;
  config: FunctionGraphConfig;
  onChange: (config: FunctionGraphConfig) => void;
  canEdit: boolean;
};

export function FunctionGraphBlockEditor({
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
    onChange(next);
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
    <div className="flex flex-col gap-4">
      <FunctionGraph
        spec={draft}
        interactive={draft.interactive}
        labels={labels}
      />

      <fieldset
        disabled={disabled}
        className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 disabled:opacity-60"
      >
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-foreground">
            {t('interactive')}
          </span>
          <Switch
            checked={draft.interactive}
            onCheckedChange={(checked) =>
              commit({ ...draft, interactive: checked })
            }
          />
        </label>

        {/* Viewport */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {t('viewport')}
          </span>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
            {(
              [
                ['xMin', viewport.xMin],
                ['xMax', viewport.xMax],
                ['yMin', viewport.yMin],
                ['yMax', viewport.yMax],
              ] as const
            ).map(([key, value]) => (
              <label key={key} className="flex items-center gap-2">
                <span className="w-10 font-mono text-xs text-muted-foreground">
                  {t(`bounds.${key}`)}
                </span>
                <Input
                  type="number"
                  value={value}
                  onChange={(e) =>
                    commit({
                      ...draft,
                      viewport: {
                        ...viewport,
                        [key]: toNumber(e.target.value, value),
                      },
                    })
                  }
                  className="h-8"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Objects */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {t('objects')}
          </span>
          <div className="flex flex-col gap-2">
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
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addObject}
            disabled={objects.length >= FUNCTION_GRAPH_MAX_OBJECTS}
            className="self-start gap-1.5"
          >
            <PlusIcon className="size-3.5" />
            {t('addObject')}
          </Button>
        </div>

        {/* Parameters */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {t('parameters')}
          </span>
          <div className="flex flex-col gap-2">
            {parameters.map((parameter, index) => (
              <div
                key={index}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/20 p-2"
              >
                <Input
                  value={parameter.name}
                  maxLength={GRAPH_PARAM_NAME_MAX_LEN}
                  onChange={(e) =>
                    patchParameter(index, { ...parameter, name: e.target.value })
                  }
                  aria-label={t('paramName')}
                  className="h-8 w-20 font-mono"
                />
                {(['min', 'max', 'step', 'value'] as const).map((field) => (
                  <label key={field} className="flex items-center gap-1">
                    <span className="font-mono text-xs text-muted-foreground">
                      {t(`param.${field}`)}
                    </span>
                    <Input
                      type="number"
                      value={parameter[field]}
                      onChange={(e) =>
                        patchParameter(index, {
                          ...parameter,
                          [field]: toNumber(e.target.value, parameter[field]),
                        })
                      }
                      className="h-8 w-16"
                    />
                  </label>
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeParameter(index)}
                  aria-label={t('removeParameter')}
                  className="ml-auto size-8 text-muted-foreground"
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addParameter}
            disabled={parameters.length >= FUNCTION_GRAPH_MAX_PARAMS}
            className="self-start gap-1.5"
          >
            <PlusIcon className="size-3.5" />
            {t('addParameter')}
          </Button>
        </div>
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

type ObjectRowProps = {
  object: GraphObject;
  onKindChange: (kind: GraphObjectKind) => void;
  onChange: (object: GraphObject) => void;
  onRemove: () => void;
  t: ReturnType<typeof useTranslations>;
};

function ObjectRow({ object, onKindChange, onChange, onRemove, t }: ObjectRowProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 p-2">
      <div className="flex items-center gap-2">
        <NativeSelect
          size="sm"
          value={object.kind}
          onChange={(e) => onKindChange(e.target.value as GraphObjectKind)}
          aria-label={t('objectKind')}
        >
          {OBJECT_KINDS.map((kind) => (
            <NativeSelectOption key={kind} value={kind}>
              {t(`kind.${kind}`)}
            </NativeSelectOption>
          ))}
        </NativeSelect>

        <NativeSelect
          size="sm"
          value={object.style?.color ?? ''}
          onChange={(e) =>
            onChange({
              ...object,
              style: e.target.value
                ? { ...object.style, color: e.target.value }
                : undefined,
            })
          }
          aria-label={t('color')}
        >
          <NativeSelectOption value="">{t('colorAuto')}</NativeSelectOption>
          {COLOR_TOKENS.map((token) => (
            <NativeSelectOption key={token} value={token}>
              {token}
            </NativeSelectOption>
          ))}
        </NativeSelect>

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
          className="ml-auto size-8 text-muted-foreground"
        >
          <Trash2Icon className="size-4" />
        </Button>
      </div>

      <ObjectFields object={object} onChange={onChange} t={t} />
    </div>
  );
}

function ExprInput({
  value,
  placeholder,
  onChange,
  ariaLabel,
}: {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  return (
    <Input
      value={value}
      maxLength={GRAPH_EXPR_MAX_LEN}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      className="h-8 flex-1 font-mono"
    />
  );
}

function ScalarInput({
  value,
  onChange,
  ariaLabel,
}: {
  value: number | string;
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  return (
    <Input
      value={String(value)}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      className="h-8 w-20 font-mono"
    />
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
          placeholder="a*sin(b*x)"
          ariaLabel={t('expression')}
          onChange={(expr) => onChange({ ...object, expr })}
        />
      );
    case 'implicit':
      return (
        <ExprInput
          value={object.expr}
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
            placeholder="cos(t)"
            ariaLabel={t('xExpr')}
            onChange={(xExpr) => onChange({ ...object, xExpr })}
          />
          <ExprInput
            value={object.yExpr}
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
            ariaLabel="x"
            onChange={(x) => onChange({ ...object, x })}
          />
          <ScalarInput
            value={object.y}
            ariaLabel="y"
            onChange={(y) => onChange({ ...object, y })}
          />
        </div>
      );
    case 'segment':
      return (
        <div className="flex flex-wrap items-center gap-2">
          <ScalarInput value={object.x1} ariaLabel="x1" onChange={(x1) => onChange({ ...object, x1 })} />
          <ScalarInput value={object.y1} ariaLabel="y1" onChange={(y1) => onChange({ ...object, y1 })} />
          <ScalarInput value={object.x2} ariaLabel="x2" onChange={(x2) => onChange({ ...object, x2 })} />
          <ScalarInput value={object.y2} ariaLabel="y2" onChange={(y2) => onChange({ ...object, y2 })} />
        </div>
      );
    case 'verticalLine':
      return (
        <ScalarInput
          value={object.x}
          ariaLabel="x"
          onChange={(x) => onChange({ ...object, x })}
        />
      );
  }
}
