"use client"

import { CheckIcon, CopyIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useTranslations } from "next-intl"
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react"

import { cn } from "@/shared/lib/utils"
import {
  type CodeLanguage,
  type CodeToken,
  type CodeTokenType,
  tokenizeCode,
} from "@/shared/ui/code-block-tokenize"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs"

const TOKEN_CLASS: Record<CodeTokenType, string> = {
  keyword: "text-code-keyword",
  string: "text-code-string",
  number: "text-code-number",
  comment: "text-code-comment italic",
  property: "text-code-property",
  type: "text-code-type",
  punctuation: "text-code-foreground/70",
  plain: "",
}

const DEFAULT_COLLAPSED_LINES = 12
const COLLAPSED_LINE_HEIGHT_REM = 1.5

type CodeTab = {
  /** Human-readable tab label (e.g. "npm", "yarn", "bun"). */
  label: string
  /** Stable identifier for the tab. Falls back to `label` when omitted. */
  value?: string
  code: string
  language?: CodeLanguage
}

type CodeBlockBaseProps = {
  language?: CodeLanguage
  showLineNumbers?: boolean
  /** Force the block to render fully expanded — disables the collapse overlay. */
  expanded?: boolean
  /** Collapsed line budget before the "Show more" overlay shows up. */
  collapsedLineCount?: number
  className?: string
  /** Optional accessible label override (defaults to a localized fallback). */
  ariaLabel?: string
}

export type CodeBlockProps = CodeBlockBaseProps & {
  code?: string
  tabs?: CodeTab[]
  defaultTab?: string
}

export function CodeBlock({
  code,
  tabs,
  defaultTab,
  ...base
}: CodeBlockProps) {
  if (tabs && tabs.length > 0) {
    return <TabbedCodeBlock tabs={tabs} defaultTab={defaultTab} {...base} />
  }
  return <SingleCodeBlock code={code ?? ""} {...base} />
}

type SingleCodeBlockProps = CodeBlockBaseProps & { code: string }

function SingleCodeBlock({
  code,
  language = "plain",
  showLineNumbers,
  expanded,
  collapsedLineCount,
  className,
  ariaLabel,
}: SingleCodeBlockProps) {
  const t = useTranslations("code-block")
  const surfaceId = useId()

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-code-bg",
        className
      )}
    >
      <CodeSurface
        id={surfaceId}
        code={code}
        language={language}
        showLineNumbers={showLineNumbers}
        expanded={expanded}
        collapsedLineCount={collapsedLineCount}
        copyLabel={t("copy")}
        copiedLabel={t("copied")}
        expandLabel={t("expand")}
        collapseLabel={t("collapse")}
        ariaLabel={ariaLabel ?? t("ariaLabel")}
      />
    </div>
  )
}

type TabbedCodeBlockProps = CodeBlockBaseProps & {
  tabs: CodeTab[]
  defaultTab?: string
}

function TabbedCodeBlock({
  tabs,
  defaultTab,
  language,
  showLineNumbers,
  expanded,
  collapsedLineCount,
  className,
  ariaLabel,
}: TabbedCodeBlockProps) {
  const t = useTranslations("code-block")
  const surfaceId = useId()
  const initial = defaultTab ?? tabs[0]?.value ?? tabs[0]?.label
  const [active, setActive] = useState<string>(initial)

  return (
    <Tabs
      value={active}
      onValueChange={(value) => setActive(value as string)}
      className={cn("gap-0", className)}
    >
      <div className="flex items-center justify-between gap-2 rounded-t-lg border border-b-0 border-border bg-muted/40 px-2 py-1.5">
        <TabsList variant="line" className="h-7">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value ?? tab.label}
              value={tab.value ?? tab.label}
              className="h-7 px-2 text-[13px]"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <CopyButton
          getCode={() =>
            tabs.find((tab) => (tab.value ?? tab.label) === active)?.code ?? ""
          }
          label={t("copy")}
          copiedLabel={t("copied")}
        />
      </div>
      {tabs.map((tab) => (
        <TabsContent
          key={tab.value ?? tab.label}
          value={tab.value ?? tab.label}
          className="rounded-b-lg border border-border bg-code-bg"
          keepMounted
        >
          <CodeSurface
            id={`${surfaceId}-${tab.value ?? tab.label}`}
            code={tab.code}
            language={tab.language ?? language ?? "plain"}
            showLineNumbers={showLineNumbers}
            expanded={expanded}
            collapsedLineCount={collapsedLineCount}
            expandLabel={t("expand")}
            collapseLabel={t("collapse")}
            ariaLabel={ariaLabel ?? t("ariaLabel")}
            hideTopCopy
          />
        </TabsContent>
      ))}
    </Tabs>
  )
}

type CodeSurfaceProps = {
  id: string
  code: string
  language: CodeLanguage
  showLineNumbers?: boolean
  expanded?: boolean
  collapsedLineCount?: number
  copyLabel?: string
  copiedLabel?: string
  expandLabel: string
  collapseLabel: string
  ariaLabel: string
  hideTopCopy?: boolean
}

function CodeSurface({
  id,
  code,
  language,
  showLineNumbers,
  expanded: forcedExpanded,
  collapsedLineCount = DEFAULT_COLLAPSED_LINES,
  copyLabel,
  copiedLabel,
  expandLabel,
  collapseLabel,
  ariaLabel,
  hideTopCopy,
}: CodeSurfaceProps) {
  const trimmed = useMemo(() => code.replace(/\n+$/, ""), [code])
  const lines = useMemo(() => trimmed.split("\n"), [trimmed])
  const tokens = useMemo(
    () => tokenizeCode(trimmed, language),
    [trimmed, language]
  )

  const canCollapse = forcedExpanded !== true && lines.length > collapsedLineCount
  const [open, setOpen] = useState(!canCollapse)
  const showOverlay = canCollapse && !open
  const hiddenLines = Math.max(lines.length - collapsedLineCount, 0)

  return (
    <div className="group/code relative">
      {!hideTopCopy && copyLabel && copiedLabel ? (
        <div className="absolute top-2 right-2 z-20">
          <CopyButton
            getCode={() => trimmed}
            label={copyLabel}
            copiedLabel={copiedLabel}
          />
        </div>
      ) : null}

      <div
        id={id}
        role="region"
        aria-label={ariaLabel}
        className={cn(
          "relative overflow-hidden font-mono text-[13px] leading-6",
          showOverlay
            ? "max-h-[calc(2rem+var(--code-collapsed-lines)*var(--code-line-height))]"
            : "max-h-none"
        )}
        style={
          {
            "--code-line-height": `${COLLAPSED_LINE_HEIGHT_REM}rem`,
            "--code-collapsed-lines": collapsedLineCount,
          } as React.CSSProperties
        }
      >
        <pre className="m-0 overflow-x-auto p-4 text-code-foreground">
          {showLineNumbers ? (
            <CodeWithLineNumbers tokens={tokens} totalLines={lines.length} />
          ) : (
            <code className="block whitespace-pre">
              {renderTokens(tokens)}
            </code>
          )}
        </pre>

        <AnimatePresence>
          {showOverlay ? (
            <motion.div
              key="fade"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-code-bg via-code-bg/85 to-transparent"
            />
          ) : null}
        </AnimatePresence>

        {showOverlay ? (
          <CollapseToggle
            controls={id}
            open={false}
            onToggle={() => setOpen(true)}
            expandLabel={expandLabel}
            collapseLabel={collapseLabel}
            hiddenLines={hiddenLines}
            className="absolute inset-x-0 bottom-3 z-10"
          />
        ) : null}
      </div>

      {canCollapse && open ? (
        <div className="flex justify-center border-t border-border/50 bg-code-bg px-3 py-2">
          <CollapseToggle
            controls={id}
            open
            onToggle={() => setOpen(false)}
            expandLabel={expandLabel}
            collapseLabel={collapseLabel}
          />
        </div>
      ) : null}
    </div>
  )
}

type CollapseToggleProps = {
  controls: string
  open: boolean
  onToggle: () => void
  expandLabel: string
  collapseLabel: string
  hiddenLines?: number
  className?: string
}

function CollapseToggle({
  controls,
  open,
  onToggle,
  expandLabel,
  collapseLabel,
  hiddenLines,
  className,
}: CollapseToggleProps) {
  const label = open ? collapseLabel : expandLabel
  const showBadge = !open && hiddenLines !== undefined && hiddenLines > 0

  return (
    <div className={cn("flex justify-center", className)}>
      <motion.button
        type="button"
        aria-controls={controls}
        aria-expanded={open}
        onClick={onToggle}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97, y: 0 }}
        transition={{ type: "spring", stiffness: 360, damping: 26 }}
        className={cn(
          "group/toggle inline-flex h-8 items-center gap-2 rounded-full border px-3.5 text-xs font-medium transition-colors duration-150",
          "border-border bg-background/95 text-foreground shadow-[0_1px_0_rgba(0,0,0,0.04),0_6px_20px_-8px_rgba(0,0,0,0.18)] backdrop-blur",
          "hover:border-brand/60 hover:bg-brand/8 hover:text-brand dark:hover:border-brand/50 dark:hover:bg-brand/15 dark:hover:text-brand-200",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        )}
      >
        <ChevronIcon open={open} />
        <span>{label}</span>
        {showBadge ? (
          <span
            aria-hidden
            className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 font-mono text-[10px] leading-none tracking-tight text-muted-foreground transition-colors group-hover/toggle:bg-brand/15 group-hover/toggle:text-brand dark:group-hover/toggle:text-brand-200"
          >
            +{hiddenLines}
          </span>
        ) : null}
      </motion.button>
    </div>
  )
}

function CodeWithLineNumbers({
  tokens,
  totalLines,
}: {
  tokens: CodeToken[]
  totalLines: number
}) {
  const lineGroups = useMemo(() => splitTokensByLine(tokens, totalLines), [
    tokens,
    totalLines,
  ])
  const gutterWidth = `${String(totalLines).length}ch`

  return (
    <code className="block whitespace-pre">
      {lineGroups.map((lineTokens, idx) => (
        <span key={idx} className="flex">
          <span
            aria-hidden
            className="mr-4 flex-none text-right text-code-line-number select-none"
            style={{ width: gutterWidth }}
          >
            {idx + 1}
          </span>
          <span className="flex-1">
            {lineTokens.length === 0 ? "​" : renderTokens(lineTokens)}
          </span>
        </span>
      ))}
    </code>
  )
}

function splitTokensByLine(tokens: CodeToken[], totalLines: number): CodeToken[][] {
  const lines: CodeToken[][] = Array.from({ length: totalLines }, () => [])
  let line = 0
  for (const token of tokens) {
    const parts = token.value.split("\n")
    parts.forEach((part, idx) => {
      if (part) lines[line].push({ type: token.type, value: part })
      if (idx < parts.length - 1) line += 1
    })
  }
  return lines
}

function renderTokens(tokens: CodeToken[]) {
  return tokens.map((token, idx) => {
    const klass = TOKEN_CLASS[token.type]
    if (!klass) return <span key={idx}>{token.value}</span>
    return (
      <span key={idx} className={klass}>
        {token.value}
      </span>
    )
  })
}

type CopyButtonProps = {
  getCode: () => string
  label: string
  copiedLabel: string
  className?: string
}

function CopyButton({ getCode, label, copiedLabel, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const handle = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getCode())
      setCopied(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }, [getCode])

  return (
    <button
      type="button"
      onClick={handle}
      aria-label={copied ? copiedLabel : label}
      title={copied ? copiedLabel : label}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-md border border-transparent bg-background/70 text-muted-foreground backdrop-blur transition-colors hover:border-border hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="check"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.12 }}
            className="text-brand"
          >
            <CheckIcon className="size-3.5" />
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.12 }}
          >
            <CopyIcon className="size-3.5" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <motion.svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      animate={{ rotate: open ? 180 : 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </motion.svg>
  )
}
