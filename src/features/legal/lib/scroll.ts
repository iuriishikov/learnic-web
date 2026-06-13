/**
 * Smooth-scroll to a legal document section by anchor id, honouring the
 * reader's reduced-motion preference. The headings carry `scroll-mt-*`, so
 * the section lands clear of the sticky site header. Client-only.
 */
export function scrollToLegalSection(id: string) {
  const target = document.getElementById(id);
  if (!target) return;

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;
  target.scrollIntoView({
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
    block: 'start',
  });
}
