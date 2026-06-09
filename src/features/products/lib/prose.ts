/**
 * Tailwind class string for rendering trusted authored HTML (note/product
 * descriptions and lesson `html` blocks) with a sensible prose reset.
 *
 * The HTML is sanitized server-side, so it's safe to inject via
 * `dangerouslySetInnerHTML` — this class only handles spacing, typography
 * and the few element styles the rich-text editor can produce. Kept here as
 * the single source of truth so both the product landing's `ProductDescription`
 * and the learner reader's `LessonBlockViewer` render trusted HTML identically.
 */
export const PROSE_HTML_CLASS =
  'text-base leading-[1.75] text-foreground md:text-[1.0625rem] [&_a]:break-words [&_a]:text-brand [&_a]:underline [&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.85em] [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-base [&_h3]:font-semibold [&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-lg [&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_strong]:font-semibold [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_em]:italic [&_*:first-child]:mt-0 [&_*:last-child]:mb-0';
