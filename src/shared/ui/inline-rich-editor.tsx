'use client';

import { type Editor } from '@tiptap/react';
import { useTranslations } from 'next-intl';
import {
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useRef,
  useState,
} from 'react';

import {
  InlineEditorEmpty,
  InlineEditorShell,
} from '@/shared/ui/inline-editor';
import { RichEditor } from '@/shared/ui/rich-editor';

export type InlineRichEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
};

const STRIP_TAGS = /<[^>]*>/g;
const NBSP = /( |&nbsp;)/g;

function isEmptyHtml(html: string | undefined): boolean {
  if (!html) return true;
  return html.replace(STRIP_TAGS, '').replace(NBSP, '').trim().length === 0;
}

type CaretPosition = {
  /** Document-position function from the experimental Firefox API. */
  offsetNode: Node;
  offset: number;
};

type DocumentWithCaretApis = Document & {
  caretPositionFromPoint?: (x: number, y: number) => CaretPosition | null;
  caretRangeFromPoint?: (x: number, y: number) => Range | null;
};

/**
 * Resolves a click point to a caret position inside `container`. Tries the
 * standard `caretPositionFromPoint` (Firefox) first, then `caretRangeFromPoint`
 * (Chromium / WebKit). Returns null if the click did not land on a caret-able
 * position inside the container.
 */
function caretFromPoint(
  container: HTMLElement,
  x: number,
  y: number,
): { node: Node; offset: number } | null {
  const doc = document as DocumentWithCaretApis;

  if (typeof doc.caretPositionFromPoint === 'function') {
    const pos = doc.caretPositionFromPoint(x, y);
    if (pos && container.contains(pos.offsetNode)) {
      return { node: pos.offsetNode, offset: pos.offset };
    }
  }

  if (typeof doc.caretRangeFromPoint === 'function') {
    const range = doc.caretRangeFromPoint(x, y);
    if (range && container.contains(range.startContainer)) {
      return { node: range.startContainer, offset: range.startOffset };
    }
  }

  return null;
}

/**
 * Counts the number of plain-text characters between `container`'s start and
 * the given DOM caret position. Layout-independent — the offset corresponds to
 * the same character whether the content is shown in read mode or inside the
 * tiptap editor (which renders the same HTML).
 */
function getCharOffset(
  container: HTMLElement,
  node: Node,
  offset: number,
): number {
  const range = document.createRange();
  range.setStart(container, 0);
  try {
    range.setEnd(node, offset);
  } catch {
    range.setEnd(container, container.childNodes.length);
  }
  return range.toString().length;
}

/**
 * Walks `container`'s text nodes, accumulating character lengths, and returns
 * the text node + in-node offset that corresponds to `charOffset` characters
 * from the start. If the offset is past the end, returns the last text node's
 * end. Returns null only if the container has no text at all.
 */
function findDomPositionAtCharOffset(
  container: HTMLElement,
  charOffset: number,
): { node: Text; offset: number } | null {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let acc = 0;
  let lastTextNode: Text | null = null;
  let nextNode = walker.nextNode();
  while (nextNode) {
    const textNode = nextNode as Text;
    const len = textNode.data.length;
    if (acc + len >= charOffset) {
      return { node: textNode, offset: Math.max(0, charOffset - acc) };
    }
    acc += len;
    lastTextNode = textNode;
    nextNode = walker.nextNode();
  }
  if (lastTextNode) {
    return { node: lastTextNode, offset: lastTextNode.data.length };
  }
  return null;
}

export function InlineRichEditor({
  value,
  onChange,
  placeholder,
  emptyText,
  className,
}: InlineRichEditorProps) {
  const t = useTranslations('rich-editor.inline');
  const [isEditing, setIsEditing] = useState(false);
  // Plain-text character offset (within the rendered content) where the user
  // clicked. Layout-independent, so it survives the read→edit DOM swap and
  // any padding / margin / toolbar shifts between the two modes.
  const pendingCharOffsetRef = useRef<number | null>(null);

  const exitEdit = useCallback(() => setIsEditing(false), []);

  const onEnterEdit = useCallback(
    (event?: ReactMouseEvent<HTMLDivElement>) => {
      if (event) {
        // Prevent rendered <a> tags from navigating in read mode.
        const target = event.target as HTMLElement;
        if (target.closest('a')) event.preventDefault();

        const readContent = event.currentTarget.querySelector(
          '.rich-editor-content',
        ) as HTMLElement | null;
        if (readContent) {
          const caret = caretFromPoint(
            readContent,
            event.clientX,
            event.clientY,
          );
          pendingCharOffsetRef.current = caret
            ? getCharOffset(readContent, caret.node, caret.offset)
            : null;
        } else {
          pendingCharOffsetRef.current = null;
        }
      } else {
        // Keyboard activation — no caret hint, fall back to focus('end').
        pendingCharOffsetRef.current = null;
      }
      setIsEditing(true);
    },
    [],
  );

  const onEditorReady = useCallback((editor: Editor) => {
    const charOffset = pendingCharOffsetRef.current;
    pendingCharOffsetRef.current = null;

    // `scrollIntoView: false` prevents the page from jumping when focusing the
    // editor — the editor's content already sits at the click point.
    const focusOpts = { scrollIntoView: false };

    if (charOffset == null) {
      editor.commands.focus('end', focusOpts);
      return;
    }

    requestAnimationFrame(() => {
      const domPos = findDomPositionAtCharOffset(editor.view.dom, charOffset);
      if (!domPos) {
        editor.commands.focus('end', focusOpts);
        return;
      }
      try {
        const pmPos = editor.view.posAtDOM(domPos.node, domPos.offset);
        if (typeof pmPos !== 'number' || pmPos < 0) {
          editor.commands.focus('end', focusOpts);
          return;
        }
        editor
          .chain()
          .setTextSelection(pmPos)
          .focus(undefined, focusOpts)
          .run();
      } catch {
        editor.commands.focus('end', focusOpts);
      }
    });
  }, []);

  const empty = isEmptyHtml(value);

  return (
    <InlineEditorShell
      isEditing={isEditing}
      onEnterEdit={onEnterEdit}
      onExitEdit={exitEdit}
      isEmpty={empty}
      emptyContent={
        <InlineEditorEmpty text={emptyText ?? t('emptyState')} />
      }
      readContent={
        <div
          className="rich-editor-content text-sm leading-relaxed text-foreground"
          dangerouslySetInnerHTML={{ __html: value }}
        />
      }
      editContent={
        <RichEditor
          defaultValue={value}
          onChange={onChange}
          placeholder={placeholder ?? t('placeholder')}
          onReady={onEditorReady}
          immediatelyRender
          editorClassName="min-h-[220px]"
        />
      }
      editAriaLabel={t('editAria')}
      editChipLabel={t('editLabel')}
      doneLabel={t('done')}
      hintExitLabel={t('hintExit')}
      cursor="text"
      readClassName="[&_a]:pointer-events-none"
      className={className}
    />
  );
}
