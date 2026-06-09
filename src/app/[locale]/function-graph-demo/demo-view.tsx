'use client';

import { RotateCwIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';

import { Button } from '@/shared/ui/button';
import { FunctionGraph, type FunctionGraphLabels, type GraphSpec } from '@/shared/ui/function-graph';

/* -------------------------------------------------------------------------- */
/* Specs                                                                      */
/* -------------------------------------------------------------------------- */

const SLIDERS_SPEC: GraphSpec = {
  viewport: { xMin: -6.5, xMax: 6.5, yMin: -3.5, yMax: 3.5 },
  axes: { showX: true, showY: true, showGrid: true, xLabel: 'x', yLabel: 'y' },
  parameters: [
    { name: 'a', min: -3, max: 3, step: 0.1, value: 1.5 },
    { name: 'b', min: 0.2, max: 4, step: 0.1, value: 1 },
  ],
  objects: [{ kind: 'function', expr: 'a*sin(b*x)', label: 'a·sin(b·x)', style: { color: 'brand', width: 2.5 } }],
};

const MULTI_SPEC: GraphSpec = {
  viewport: { xMin: -3.5, xMax: 3.5, yMin: -4, yMax: 8 },
  axes: { showX: true, showY: true, showGrid: true },
  objects: [
    { kind: 'function', expr: 'x^2', label: 'x²' },
    { kind: 'function', expr: 'sin(x)+2', label: 'sin(x)+2' },
    { kind: 'function', expr: 'cos(x)-2', label: 'cos(x)−2' },
    { kind: 'function', expr: 'x', label: 'x', style: { dash: 'dashed' } },
  ],
};

const CURVES_SPEC: GraphSpec = {
  viewport: { xMin: -3, xMax: 3, yMin: -3, yMax: 3 },
  axes: { showX: true, showY: true, showGrid: true },
  parameters: [{ name: 'k', min: 1, max: 6, step: 1, value: 3 }],
  objects: [
    {
      kind: 'parametric',
      xExpr: '2*cos(t)',
      yExpr: '2*sin(t)',
      tMin: 0,
      tMax: 6.2832,
      label: 'circle',
      style: { color: 'brand' },
    },
    { kind: 'implicit', expr: 'x^2 - y^2 - 1', style: { color: 'warning', dash: 'dashed' } },
    {
      kind: 'parametric',
      xExpr: '2.5*sin(k*t)',
      yExpr: '2.5*sin((k+1)*t)',
      tMin: 0,
      tMax: 6.2832,
      label: 'Lissajous',
      style: { color: 'online' },
    },
  ],
};

const GEOMETRY_SPEC: GraphSpec = {
  viewport: { xMin: -1, xMax: 6, yMin: -1, yMax: 6 },
  axes: { showX: true, showY: true, showGrid: true },
  parameters: [{ name: 'a', min: 0, max: 5, step: 0.5, value: 2 }],
  objects: [
    { kind: 'function', expr: '0.5*x+1', label: 'y = 0.5x + 1', style: { color: 'brand' } },
    { kind: 'point', x: 'a', y: '0.5*a+1', label: 'A', style: { color: 'destructive', width: 3 } },
    { kind: 'segment', x1: 0, y1: 0, x2: 'a', y2: '0.5*a+1', style: { color: 'foreground', dash: 'dotted' } },
    { kind: 'verticalLine', x: 'a', style: { color: 'muted-foreground', dash: 'dashed' } },
  ],
};

const STATIC_SPEC: GraphSpec = {
  viewport: { xMin: -0.5, xMax: 7, yMin: -0.5, yMax: 5 },
  axes: { showX: true, showY: true, showGrid: false, xLabel: 't', yLabel: 'v' },
  objects: [{ kind: 'function', expr: '4*(1-exp(-x))', style: { color: 'brand', width: 3 } }],
};

const STATES_SPEC: GraphSpec = {
  viewport: { xMin: -5, xMax: 5, yMin: -3, yMax: 3 },
  axes: { showX: true, showY: true, showGrid: true },
  objects: [
    { kind: 'function', expr: 'sin(x)', label: 'sin(x)', style: { color: 'brand' } },
    { kind: 'function', expr: '@@ not math @@', label: 'broken', style: { color: 'destructive' } },
  ],
};

/* -------------------------------------------------------------------------- */
/* Demo wrapper                                                               */
/* -------------------------------------------------------------------------- */

function DemoCard({
  title,
  description,
  action,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6"
    >
      <header className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className="flex flex-col gap-4">{children}</div>
    </motion.section>
  );
}

/* -------------------------------------------------------------------------- */
/* View                                                                       */
/* -------------------------------------------------------------------------- */

export function FunctionGraphDemoView() {
  const t = useTranslations('function-graph-demo');

  const labels: FunctionGraphLabels = {
    invalidExpression: t('labels.invalidExpression'),
    unavailable: t('labels.unavailable'),
    resetView: t('labels.resetView'),
    zoomIn: t('labels.zoomIn'),
    zoomOut: t('labels.zoomOut'),
  };

  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((n) => n + 1), []);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 md:px-6 md:py-12">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold text-foreground md:text-3xl">{t('title')}</h1>
        <p className="text-sm text-muted-foreground md:text-base">{t('description')}</p>
      </header>

      <DemoCard title={t('sections.sliders.title')} description={t('sections.sliders.description')}>
        <FunctionGraph
          spec={SLIDERS_SPEC}
          interactive
          caption={t('sections.sliders.caption')}
          labels={labels}
        />
      </DemoCard>

      <DemoCard title={t('sections.multi.title')} description={t('sections.multi.description')}>
        <FunctionGraph spec={MULTI_SPEC} labels={labels} />
      </DemoCard>

      <DemoCard title={t('sections.curves.title')} description={t('sections.curves.description')}>
        <FunctionGraph spec={CURVES_SPEC} interactive labels={labels} />
      </DemoCard>

      <DemoCard title={t('sections.geometry.title')} description={t('sections.geometry.description')}>
        <FunctionGraph spec={GEOMETRY_SPEC} interactive labels={labels} />
      </DemoCard>

      <DemoCard title={t('sections.static.title')} description={t('sections.static.description')}>
        <FunctionGraph spec={STATIC_SPEC} labels={labels} />
      </DemoCard>

      <DemoCard
        title={t('sections.states.title')}
        description={t('sections.states.description')}
        action={
          <Button type="button" size="sm" variant="outline" onClick={reload} className="gap-1.5">
            <RotateCwIcon className="size-3.5" />
            {t('sections.states.reload')}
          </Button>
        }
      >
        <FunctionGraph key={`states-${reloadKey}`} spec={STATES_SPEC} labels={labels} />
      </DemoCard>
    </main>
  );
}
