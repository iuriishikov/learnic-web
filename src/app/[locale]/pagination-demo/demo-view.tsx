'use client';

import * as React from 'react';
import { motion } from 'motion/react';

import {
  Pagination,
  PaginationContent,
  PaginationDivider,
  PaginationEllipsis,
  PaginationFirst,
  PaginationItem,
  PaginationLast,
  PaginationLink,
  PaginationNext,
  PaginationNextStep,
  PaginationPageInput,
  PaginationPrevStep,
  PaginationPrevious,
  PaginationRowsPerPage,
  PaginationStatus,
  paginationRange,
  type PaginationSize,
} from '@/shared/ui/pagination';

// ────────────────────────────────────────────────────────────────────────────
// Reusable: numbered cluster with ellipsis

type NumberClusterProps = {
  current: number;
  total: number;
  onChange: (page: number) => void;
  size?: PaginationSize;
  edge?: number;
  className?: string;
};

function NumberCluster({
  current,
  total,
  onChange,
  size,
  edge = 3,
  className,
}: NumberClusterProps) {
  const range = paginationRange(current, total, edge);
  return (
    <PaginationContent className={className}>
      {range.map((item, idx) =>
        item === 'ellipsis' ? (
          <PaginationItem key={`e-${idx}`}>
            <PaginationEllipsis />
          </PaginationItem>
        ) : (
          <PaginationItem key={item}>
            <PaginationLink
              size={size}
              isActive={item === current}
              onClick={() => onChange(item)}
            >
              {item}
            </PaginationLink>
          </PaginationItem>
        ),
      )}
    </PaginationContent>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Demo wrapper card

function DemoCard({
  title,
  description,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6"
    >
      <header className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </header>
      <div className="flex flex-col gap-6">{children}</div>
    </motion.section>
  );
}

function VariantRow({
  label,
  children,
}: {
  label?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </span>
      )}
      <div className="rounded-xl border border-border/60 bg-background p-3 md:p-4">
        {children}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Variant A — Spread, "link" Previous/Next (no border)

function SpreadLink({ size }: { size: PaginationSize }) {
  const [page, setPage] = React.useState(1);
  const total = 10;
  return (
    <Pagination size={size} align="between">
      <PaginationPrevious
        variant="link"
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        disabled={page === 1}
      />
      <NumberCluster current={page} total={total} onChange={setPage} />
      <PaginationNext
        variant="link"
        onClick={() => setPage((p) => Math.min(total, p + 1))}
        disabled={page === total}
      />
    </Pagination>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Variant B — Spread, "outline" Previous/Next

function SpreadOutline({ size }: { size: PaginationSize }) {
  const [page, setPage] = React.useState(1);
  const total = 10;
  return (
    <Pagination size={size} align="between">
      <PaginationPrevious
        variant="outline"
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        disabled={page === 1}
      />
      <NumberCluster current={page} total={total} onChange={setPage} />
      <PaginationNext
        variant="outline"
        onClick={() => setPage((p) => Math.min(total, p + 1))}
        disabled={page === total}
      />
    </Pagination>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Variant C — Centered with Previous/Next

function Centered({
  size,
  variant,
}: {
  size: PaginationSize;
  variant: 'link' | 'outline';
}) {
  const [page, setPage] = React.useState(1);
  const total = 10;
  return (
    <Pagination size={size} align="center">
      <PaginationPrevious
        variant={variant}
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        disabled={page === 1}
      />
      <NumberCluster current={page} total={total} onChange={setPage} />
      <PaginationNext
        variant={variant}
        onClick={() => setPage((p) => Math.min(total, p + 1))}
        disabled={page === total}
      />
    </Pagination>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Variant D — Compact "Page X of Y" with single chevron arrows

function CompactPageOf({ size }: { size: PaginationSize }) {
  const [page, setPage] = React.useState(1);
  const total = 10;
  return (
    <Pagination size={size} align="between">
      <PaginationPrevStep
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        disabled={page === 1}
      />
      <PaginationStatus current={page} total={total} />
      <PaginationNextStep
        onClick={() => setPage((p) => Math.min(total, p + 1))}
        disabled={page === total}
      />
    </Pagination>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Variant E — Compact with First/Last + Step arrows

function CompactPageOfWithEdges({ size }: { size: PaginationSize }) {
  const [page, setPage] = React.useState(1);
  const total = 10;
  return (
    <Pagination size={size} align="between">
      <div className="flex items-center gap-1.5">
        <PaginationFirst
          onClick={() => setPage(1)}
          disabled={page === 1}
        />
        <PaginationPrevStep
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        />
      </div>
      <PaginationStatus current={page} total={total} />
      <div className="flex items-center gap-1.5">
        <PaginationNextStep
          onClick={() => setPage((p) => Math.min(total, p + 1))}
          disabled={page === total}
        />
        <PaginationLast
          onClick={() => setPage(total)}
          disabled={page === total}
        />
      </div>
    </Pagination>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Variant F — Status + rows-per-page on left, [Prev][Next] on right

function StatusWithControlsRight() {
  const [page, setPage] = React.useState(1);
  const [rows, setRows] = React.useState(10);
  const total = 10;
  return (
    <Pagination align="between">
      <span className="flex items-center gap-3">
        <PaginationStatus current={page} total={total} />
        <PaginationRowsPerPage value={rows} onValueChange={setRows} />
      </span>
      <span className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="inline-flex h-8 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(total, p + 1))}
          disabled={page === total}
          className="inline-flex h-8 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-50"
        >
          Next
        </button>
      </span>
    </Pagination>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Variant G — [Prev][Next] left, rows + status right

function ControlsLeftStatusRight() {
  const [page, setPage] = React.useState(1);
  const [rows, setRows] = React.useState(10);
  const total = 10;
  return (
    <Pagination align="between">
      <span className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="inline-flex h-8 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(total, p + 1))}
          disabled={page === total}
          className="inline-flex h-8 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-50"
        >
          Next
        </button>
      </span>
      <span className="flex items-center gap-3">
        <PaginationRowsPerPage value={rows} onValueChange={setRows} />
        <PaginationStatus current={page} total={total} />
      </span>
    </Pagination>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Variant H — [Prev] | Status + rows | [Next]

function PrevCenterNext() {
  const [page, setPage] = React.useState(1);
  const [rows, setRows] = React.useState(10);
  const total = 10;
  return (
    <Pagination align="between">
      <button
        type="button"
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        disabled={page === 1}
        className="inline-flex h-8 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-50"
      >
        Previous
      </button>
      <span className="flex items-center gap-3">
        <PaginationStatus current={page} total={total} />
        <PaginationRowsPerPage value={rows} onValueChange={setRows} />
      </span>
      <button
        type="button"
        onClick={() => setPage((p) => Math.min(total, p + 1))}
        disabled={page === total}
        className="inline-flex h-8 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-50"
      >
        Next
      </button>
    </Pagination>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Variant I — Compact centered numbers with edges

function CompactNumbersCentered({ size }: { size: PaginationSize }) {
  const [page, setPage] = React.useState(1);
  const total = 10;
  return (
    <Pagination size={size} align="center">
      <PaginationPrevious
        variant="outline"
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        disabled={page === 1}
      />
      <NumberCluster current={page} total={total} onChange={setPage} />
      <PaginationNext
        variant="outline"
        onClick={() => setPage((p) => Math.min(total, p + 1))}
        disabled={page === total}
      />
    </Pagination>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Variant J — Just numbers + edge arrows (rightmost compact in design)

function JustNumbersWithArrows({ size }: { size: PaginationSize }) {
  const [page, setPage] = React.useState(1);
  const total = 10;
  return (
    <Pagination size={size} align="center" className="w-fit">
      <PaginationPrevStep
        onClick={() => setPage((p) => Math.max(1, p - 1))}
        disabled={page === 1}
      />
      <NumberCluster current={page} total={total} onChange={setPage} edge={2} />
      <PaginationNextStep
        onClick={() => setPage((p) => Math.min(total, p + 1))}
        disabled={page === total}
      />
    </Pagination>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Variant K — Page input + rows + numbers + first/last

function PageInputWithControls() {
  const [page, setPage] = React.useState(1);
  const [rows, setRows] = React.useState(10);
  const total = 10;
  return (
    <Pagination align="between" className="flex-wrap gap-y-3">
      <span className="flex items-center gap-4">
        <PaginationPageInput
          value={page}
          total={total}
          onValueChange={setPage}
        />
        <PaginationDivider />
        <PaginationRowsPerPage
          value={rows}
          onValueChange={setRows}
          label="Rows per page"
        />
      </span>
      <span className="flex items-center gap-1.5">
        <PaginationFirst
          onClick={() => setPage(1)}
          disabled={page === 1}
        />
        <PaginationPrevStep
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        />
        <NumberCluster
          current={page}
          total={total}
          onChange={setPage}
          className="mx-1"
        />
        <PaginationNextStep
          onClick={() => setPage((p) => Math.min(total, p + 1))}
          disabled={page === total}
        />
        <PaginationLast
          onClick={() => setPage(total)}
          disabled={page === total}
        />
      </span>
    </Pagination>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Variant L — "Showing page" input | numbers/edges | rows-per-page right

function ShowingPageBar() {
  const [page, setPage] = React.useState(1);
  const [rows, setRows] = React.useState(10);
  const total = 10;
  return (
    <Pagination align="between" className="flex-wrap gap-y-3">
      <PaginationPageInput
        value={page}
        total={total}
        onValueChange={setPage}
        label="Showing page"
      />
      <span className="flex items-center gap-1.5">
        <PaginationFirst
          onClick={() => setPage(1)}
          disabled={page === 1}
        />
        <PaginationPrevStep
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        />
        <NumberCluster
          current={page}
          total={total}
          onChange={setPage}
          className="mx-1"
        />
        <PaginationNextStep
          onClick={() => setPage((p) => Math.min(total, p + 1))}
          disabled={page === total}
        />
        <PaginationLast
          onClick={() => setPage(total)}
          disabled={page === total}
        />
      </span>
      <PaginationRowsPerPage
        value={rows}
        onValueChange={setRows}
        label="Rows per page"
      />
    </Pagination>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// View

export function PaginationDemoView() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-8 md:px-6 md:py-12 lg:px-8 lg:py-16">
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-3"
      >
        <span className="w-fit rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.12em] text-brand">
          Pagination · v1
        </span>
        <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
          Pagination
        </h1>
        <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
          All variants from the design: text-link &amp; outlined Previous/Next,
          three sizes (sm/md/lg), spread &amp; centered layouts, compact
          “Page X of Y” with single/double chevrons, “Rows per page” select,
          and a page-number jump input.
        </p>
      </motion.header>

      {/* ────────────────────── Wide spread variants ────────────────────── */}
      <DemoCard
        title="Spread — text-link Previous / Next"
        description="Previous &amp; Next render as plain text links (no border). Numbered cluster lives in the middle. Three sizes."
      >
        <VariantRow label="sm">
          <SpreadLink size="sm" />
        </VariantRow>
        <VariantRow label="md (default)">
          <SpreadLink size="md" />
        </VariantRow>
        <VariantRow label="lg">
          <SpreadLink size="lg" />
        </VariantRow>
      </DemoCard>

      <DemoCard
        title="Spread — outlined Previous / Next"
        description="Same spread layout but Previous &amp; Next render as outlined buttons."
      >
        <VariantRow label="sm">
          <SpreadOutline size="sm" />
        </VariantRow>
        <VariantRow label="md (default)">
          <SpreadOutline size="md" />
        </VariantRow>
        <VariantRow label="lg">
          <SpreadOutline size="lg" />
        </VariantRow>
      </DemoCard>

      {/* ────────────────────── Compact controls ────────────────────── */}
      <DemoCard
        title="Compact — status + rows-per-page + Prev/Next"
        description="The three split-layout variants from the design — status / rows-per-page paired with text Previous &amp; Next buttons."
      >
        <VariantRow label="Status + rows-per-page on left, Prev/Next on right">
          <StatusWithControlsRight />
        </VariantRow>
        <VariantRow label="Prev/Next on left, rows-per-page + status on right">
          <ControlsLeftStatusRight />
        </VariantRow>
        <VariantRow label="Prev on left, status + rows in the middle, Next on right">
          <PrevCenterNext />
        </VariantRow>
      </DemoCard>

      {/* ────────────────────── Centered ────────────────────── */}
      <DemoCard
        title="Centered — Previous / numbers / Next"
        description="Same content, horizontally centered for narrow surfaces and mobile layouts."
      >
        <VariantRow label="link variant">
          <Centered size="md" variant="link" />
        </VariantRow>
        <VariantRow label="outline variant">
          <CompactNumbersCentered size="md" />
        </VariantRow>
      </DemoCard>

      {/* ────────────────────── Page input + bottom bar ────────────────────── */}
      <DemoCard
        title="Page jump input + first/last edges"
        description="Two heavy data-table bar layouts: page-input on left with numbered cluster on right, and the “Showing page … / Rows per page” layout."
      >
        <VariantRow label="Page [input] of N · Rows per page  +  [«] [‹] 1 2 … 9 10 [›] [»]">
          <PageInputWithControls />
        </VariantRow>
        <VariantRow label="Showing page [input] of N  +  [«] [‹] … [›] [»]  +  Rows per page">
          <ShowingPageBar />
        </VariantRow>
      </DemoCard>

      {/* ────────────────────── Right column compact (Page X of Y) ────────────────────── */}
      <DemoCard
        title="Compact “Page X of Y” with chevron arrows"
        description="The rightmost column of the design — a compact stepper for mobile or sidebar UIs. Optional first/last edges."
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <VariantRow label="sm">
            <CompactPageOf size="sm" />
          </VariantRow>
          <VariantRow label="md">
            <CompactPageOf size="md" />
          </VariantRow>
          <VariantRow label="lg">
            <CompactPageOf size="lg" />
          </VariantRow>
          <VariantRow label="with [«] [»] edges">
            <CompactPageOfWithEdges size="md" />
          </VariantRow>
        </div>
      </DemoCard>

      {/* ────────────────────── Just numbers + arrows ────────────────────── */}
      <DemoCard
        title="Numbered with edge arrows — compact"
        description="Numbered cluster sandwiched between single-chevron arrows. Good for centered mobile pagination."
      >
        <VariantRow label="md">
          <div className="flex justify-center">
            <JustNumbersWithArrows size="md" />
          </div>
        </VariantRow>
        <VariantRow label="sm">
          <div className="flex justify-center">
            <JustNumbersWithArrows size="sm" />
          </div>
        </VariantRow>
      </DemoCard>

      {/* ────────────────────── Mobile preview ────────────────────── */}
      <DemoCard
        title="Mobile preview"
        description="The compact stepper at typical phone widths."
      >
        <div className="flex flex-col items-center gap-6">
          <div className="w-full max-w-[360px] rounded-2xl border border-border bg-background p-4">
            <CompactPageOf size="md" />
          </div>
          <div className="w-full max-w-[360px] rounded-2xl border border-border bg-background p-4">
            <CompactPageOfWithEdges size="md" />
          </div>
          <div className="w-full max-w-[360px] rounded-2xl border border-border bg-background p-4">
            <Centered size="sm" variant="outline" />
          </div>
        </div>
      </DemoCard>
    </main>
  );
}
