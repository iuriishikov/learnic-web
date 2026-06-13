/**
 * Minimal Markdown → HTML converter for the static legal documents
 * (`content/*.md`). Deliberately tiny: the codebase ships no Markdown
 * dependency, and these documents use only a small, regular subset —
 * headings (`#`/`##`/`###`), paragraphs, single-level `-` bullet lists,
 * `**bold**`, inline `` `code` `` and `[text](href)` links.
 *
 * The output is rendered via `dangerouslySetInnerHTML` (same pattern as
 * the blog `html` blocks), so every run of visible text is HTML-escaped
 * before any tag is emitted and only a fixed, safe set of tags is
 * produced. The source is our own trusted content, not user input.
 */

import type { LegalTocEntry } from '../model/types';

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>]/g, (char) => HTML_ESCAPES[char]);
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/"/g, '&quot;');
}

// Sentinel wrapping an extracted inline-code index. Uses a token that
// cannot occur in the legal Markdown, so restoring it never collides with
// real digits in the text (article numbers, "30 дней", clause refs).
const CODE_OPEN = '@@LEGALCODE:';
const CODE_CLOSE = '@@';

/**
 * Apply inline formatting to a run of text that has ALREADY been
 * HTML-escaped. Inline code is extracted first so its contents are not
 * re-interpreted as bold/link markup.
 */
function renderInline(escaped: string): string {
  const codeSpans: string[] = [];
  let out = escaped.replace(/`([^`]+)`/g, (_match, code: string) => {
    codeSpans.push(code);
    return `${CODE_OPEN}${codeSpans.length - 1}${CODE_CLOSE}`;
  });

  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  out = out.replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    (_match, text: string, href: string) => {
      // Only allow safe schemes / in-app paths; anything else is inert.
      const safeHref = /^(https?:\/\/|mailto:|\/)/i.test(href) ? href : '#';
      return `<a href="${escapeAttribute(safeHref)}">${text}</a>`;
    },
  );

  out = out.replace(
    /@@LEGALCODE:(\d+)@@/g,
    (_match, index: string) => `<code>${codeSpans[Number(index)]}</code>`,
  );

  return out;
}

export type LegalMarkdownResult = {
  html: string;
  toc: LegalTocEntry[];
};

export function legalMarkdownToHtml(markdown: string): LegalMarkdownResult {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];
  const toc: LegalTocEntry[] = [];
  let sectionIndex = 0;
  let paragraph: string[] = [];
  let listItems: string[] = [];

  function flushParagraph() {
    if (paragraph.length === 0) return;
    const text = renderInline(escapeHtml(paragraph.join(' ').trim()));
    if (text) html.push(`<p>${text}</p>`);
    paragraph = [];
  }

  function flushList() {
    if (listItems.length === 0) return;
    const items = listItems
      .map((item) => `<li>${renderInline(escapeHtml(item.trim()))}</li>`)
      .join('');
    html.push(`<ul>${items}</ul>`);
    listItems = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.trim() === '') {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = /^(#{1,3})\s+(.*)$/.exec(line.trim());
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      const text = heading[2].trim();
      const inner = renderInline(escapeHtml(text));
      // Top-level sections become anchored TOC entries; deeper headings
      // render plainly so the sidebar stays a flat list of sections.
      if (level === 2) {
        sectionIndex += 1;
        const id = `section-${sectionIndex}`;
        toc.push({ id, text });
        html.push(`<h2 id="${id}">${inner}</h2>`);
      } else {
        html.push(`<h${level}>${inner}</h${level}>`);
      }
      continue;
    }

    const bullet = /^[-*]\s+(.*)$/.exec(line.trim());
    if (bullet) {
      flushParagraph();
      listItems.push(bullet[1]);
      continue;
    }

    flushList();
    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();

  return { html: html.join('\n'), toc };
}

export type ParsedLegalDocument = {
  title: string;
  subtitle: string | null;
  edition: string | null;
  html: string;
  toc: LegalTocEntry[];
};

/**
 * Split a legal Markdown document into its display parts: the first
 * heading is the document title; an immediately-following wholly-bold
 * line is treated as a subtitle (e.g. the offer label on the Terms);
 * a `Редакция от …` line becomes the edition note. Everything else is
 * the body, converted to HTML.
 */
export function parseLegalDocument(raw: string): ParsedLegalDocument {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  let title = '';
  let subtitle: string | null = null;
  let edition: string | null = null;
  let titleTaken = false;
  let sectionSeen = false;
  const bodyLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (!titleTaken) {
      const heading = /^#{1,3}\s+(.*)$/.exec(trimmed);
      if (heading) {
        title = heading[1].trim();
        titleTaken = true;
        continue;
      }
    }

    // Once real sections begin, a bold line in the body is not a subtitle.
    if (/^#{1,3}\s+/.test(trimmed)) sectionSeen = true;

    if (edition === null && /^Редакция от\s+.+$/.test(trimmed)) {
      edition = trimmed;
      continue;
    }

    const boldOnly = /^\*\*(.+)\*\*$/.exec(trimmed);
    if (subtitle === null && !sectionSeen && titleTaken && boldOnly) {
      subtitle = boldOnly[1].trim();
      continue;
    }

    bodyLines.push(line);
  }

  const { html, toc } = legalMarkdownToHtml(bodyLines.join('\n'));
  return { title, subtitle, edition, html, toc };
}
