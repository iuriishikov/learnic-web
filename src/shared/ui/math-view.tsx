'use client';

import katex from 'katex';
import { useMemo } from 'react';

import { cn } from '@/shared/lib/utils';

export type MathViewProps = {
  /** LaTeX source. */
  tex: string;
  /** Display (block) mode renders centered, larger output; inline renders in-flow. */
  displayMode?: boolean;
  className?: string;
  /** Extra options forwarded to KaTeX. */
  trust?: boolean;
  /** Color for KaTeX-detected errors. Defaults to the destructive token. */
  errorColor?: string;
};

/**
 * Renders a LaTeX expression as KaTeX HTML. KaTeX returns HTML synchronously
 * via `renderToString`, so this is safe to memoize and inject. The output
 * relies on `katex/dist/katex.min.css` being imported in the global stylesheet.
 *
 * Errors during parsing are not thrown — KaTeX renders the offending source as
 * red text inline, so the editor stays usable while the user types invalid
 * LaTeX. Empty / whitespace input returns null so the host can show its own
 * placeholder.
 */
export function MathView({
  tex,
  displayMode = true,
  className,
  trust = false,
  errorColor = 'var(--destructive)',
}: MathViewProps) {
  const html = useMemo(() => {
    if (!tex || !tex.trim()) return '';
    return katex.renderToString(tex, {
      displayMode,
      throwOnError: false,
      errorColor,
      strict: 'ignore',
      trust,
      output: 'html',
    });
  }, [tex, displayMode, trust, errorColor]);

  if (!html) return null;

  return (
    <div
      role="math"
      aria-label={tex}
      className={cn(
        'katex-host text-foreground',
        displayMode ? 'block' : 'inline-block',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
